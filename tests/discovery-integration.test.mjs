import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => {
      if (id in imports) return imports[id];
      throw new Error(`Unexpected runtime import: ${id}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const helpers = load("../src/lib/discovery.ts", {
  "@/lib/catalog": load("../src/lib/catalog.ts"),
});
const requests = [];
const api = load("../src/features/catalog/api.ts", {
  "@/lib/api": {
    apiFetch: (path, options) => {
      requests.push({ path, options });
      return Promise.resolve({ items: [], total: 0 });
    },
    adminApiFetch: () => {
      throw new Error("Public discovery must not call admin endpoints");
    },
  },
});

test("designer cause labels and enum links map to the real backend category without invented values", () => {
  assert.equal(helpers.discoveryCategory("Missions & Outreach"), "MISSIONS_OUTREACH");
  assert.equal(helpers.discoveryCategory("EDUCATION"), "EDUCATION");
  assert.equal(helpers.discoveryCategory("Education"), "EDUCATION");
  assert.equal(helpers.discoveryCategory(undefined), undefined);
  assert.equal(helpers.discoveryCategory("unknown"), undefined);
});

test("publication requires server approval, not just an optimistic verified badge", () => {
  assert.equal(helpers.isPublished({ verificationStatus: "verified", isDraft: false }), false);
  assert.equal(
    helpers.isPublished({ verificationStatus: "verified", isDraft: false, isPublic: true }),
    true,
  );
  assert.equal(
    helpers.isPublished({ verificationStatus: "verified", isDraft: true, isPublic: true }),
    false,
  );
  assert.equal(
    helpers.isPublished({ verificationStatus: "pending", isDraft: false, isPublic: true }),
    false,
  );
});
test("giving frequency respects only the campaign's supported schedule", () => {
  assert.deepEqual(
    helpers.givingFrequencies({
      mode: "ongoing",
      frequencies: ["quarterly", "weekly", "quarterly"],
    }),
    ["once", "quarterly", "weekly"],
  );
  assert.deepEqual(helpers.givingFrequencies({ mode: "one-time", frequencies: ["monthly"] }), [
    "once",
  ]);
});
test("progress handles optional goals and clamps overfunded or invalid totals", () => {
  assert.equal(helpers.progressPercent(150, 100), 100);
  assert.equal(helpers.progressPercent(-5, 100), 0);
  assert.equal(helpers.progressPercent(500, 0), null);
  assert.equal(helpers.progressPercent(500), null);
});
test("activity dates prefer real timestamps and tolerate legacy relative dates", () => {
  assert.equal(helpers.activityDate({ date: "6d" }), "6d");
  assert.equal(
    helpers.activityDate({ date: "6d", createdAt: "2026-10-01T10:00:00Z" }),
    new Date("2026-10-01T10:00:00Z").toLocaleDateString(),
  );
});
test("campaign discovery encodes search and requests server pagination and filters", async () => {
  requests.length = 0;
  await api.discoverCampaigns({
    view: "nearly",
    sort: "givers",
    search: "Riverlight & Mission",
    page: 2,
    faithCategory: "MISSIONS_OUTREACH",
  });
  const url = new URL(requests[0].path, "https://test.example");
  assert.equal(url.pathname, "/campaigns/discover");
  assert.equal(url.searchParams.get("search"), "Riverlight & Mission");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("pageSize"), "12");
  assert.equal(url.searchParams.get("sort"), "givers");
  assert.equal(url.searchParams.get("faithCategory"), "MISSIONS_OUTREACH");
});
test("organization discovery and legacy endpoints stay separate", async () => {
  requests.length = 0;
  await api.discoverOrganizations({ category: "MISSION", pageSize: 3 });
  await api.listOrganizations();
  await api.listCampaigns();
  assert.ok(requests[0].path.startsWith("/organizations/discover?"));
  assert.equal(new URL(requests[0].path, "https://test.example").searchParams.get("pageSize"), "3");
  assert.equal(requests[1].path, "/organizations");
  assert.equal(requests[2].path, "/campaigns");
});
