import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8").replaceAll(
    "import.meta.env",
    JSON.stringify({ VITE_API_BASE_URL: "https://fixture.example" }),
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => imports[id] ?? require(id),
    module,
    module.exports,
  );
  return module.exports;
}
const creation = load("../src/lib/creation.ts");
const transport = load("../src/lib/api.ts");
const api = load("../src/features/catalog/api.ts", { "@/lib/api": transport });
const words = (count) => Array(count).fill("mission").join(" ");
const org = {
  ...creation.orgForm(),
  name: "Riverlight Gospel Mission",
  category: "OTHER",
  otherCategoryLabel: "Community outreach ministry",
  denomination: "Interdenominational",
  location: "Ibadan, Oyo",
  tagline: "Serving families through faith",
  bio: words(100),
  photoUrls: [
    "https://fixture.example/a.png",
    "https://fixture.example/b.png",
    "https://fixture.example/c.png",
  ],
  registrationDocumentUrls: ["https://fixture.example/proof.pdf"],
};
const campaign = {
  ...creation.campaignForm(),
  mode: "ONE_TIME",
  type: "MONEY",
  title: "Riverlight Outreach Project",
  faithCategory: "MISSIONS_OUTREACH",
  location: "Ibadan, Oyo",
  story: words(100),
  goalAmount: "150,000",
  coverImageUrl: "https://fixture.example/cover.png",
  galleryImageUrls: ["https://fixture.example/gallery.png"],
};

test("campaigns reuse verified saved accounts and distinguish missing, pending, inactive and unavailable destinations", () => {
  const ready = { active: true, status: "verified" };
  assert.equal(
    creation.campaignPayoutError({ account: ready, loading: false, failed: false }),
    undefined,
  );
  assert.match(
    creation.campaignPayoutError({ account: null, loading: false, failed: false }),
    /Add.*once/,
  );
  assert.match(
    creation.campaignPayoutError({
      account: { ...ready, status: "pending" },
      loading: false,
      failed: false,
    }),
    /already saved.*verification/,
  );
  assert.match(
    creation.campaignPayoutError({
      account: { ...ready, active: false },
      loading: false,
      failed: false,
    }),
    /inactive/,
  );
  assert.match(
    creation.campaignPayoutError({ account: ready, loading: true, failed: false }),
    /wait/,
  );
  assert.match(
    creation.campaignPayoutError({ account: ready, loading: false, failed: true }),
    /Retry/,
  );
});

test("saved payout destination reads use authenticated existing endpoints, not account registration", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, ...init });
    return new Response(JSON.stringify({ id: "saved-bank", active: true, status: "verified" }), {
      headers: { "Content-Type": "application/json" },
    });
  };
  await api.getPersonalPayoutAccount();
  await api.getOrganizationPayoutAccount("org");
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "https://fixture.example/me/payout-account",
      "https://fixture.example/organizations/org/payout-account",
    ],
  );
  assert.ok(
    calls.every(
      (call) =>
        call.credentials === "include" && (!call.method || call.method === "GET") && !call.body,
    ),
  );
});

test("organization bio and campaign story require 100-200 words, including both boundaries", () => {
  for (const count of [100, 200]) {
    assert.equal(creation.organizationErrors({ ...org, bio: words(count) }).bio, undefined);
    assert.equal(creation.campaignErrors({ ...campaign, story: words(count) }).story, undefined);
  }
  for (const count of [0, 99, 201]) {
    assert.match(creation.organizationErrors({ ...org, bio: words(count) }).bio, /words/);
    assert.match(creation.campaignErrors({ ...campaign, story: words(count) }).story, /words/);
  }
});
test("Other ministry, photos, documents and numeric founded year are genuinely required", () => {
  assert.deepEqual(creation.organizationErrors(org), {});
  const errors = creation.organizationErrors({
    ...org,
    otherCategoryLabel: "",
    foundedYear: "abcd",
    photoUrls: [],
    registrationDocumentUrls: [],
  });
  for (const key of ["otherCategoryLabel", "foundedYear", "photoUrls", "registrationDocumentUrls"])
    assert.ok(errors[key]);
  assert.ok(
    creation.organizationErrors({ ...org, foundedYear: String(new Date().getFullYear() + 1) })
      .foundedYear,
  );
});
test("public links allow real websites and social URLs, never script or credential URLs", () => {
  for (const url of [
    "https://riverlight.example",
    "https://instagram.com/riverlight",
    "http://riverlight.example/about",
    "www.ezekieloladele.dev",
    "ezekieloladele.dev/about",
    "instagram.com/riverlight",
  ])
    assert.equal(creation.publicLink(url), true);
  for (const url of [
    "riverlight",
    "javascript:alert(1)",
    "ftp://example.com",
    "https://user:password@example.com",
    "https:///example.com",
    "https:example.com",
    "//example.com",
    "user@example.com",
    "https://exa_mple.com",
    "https://example.com\\@evil.com",
    "https://example.123",
  ])
    assert.equal(creation.publicLink(url), false);
});
test("public links normalize domains before saving and detect equivalent duplicates", () => {
  assert.equal(
    creation.normalizePublicLink(" www.ezekieloladele.dev "),
    "https://www.ezekieloladele.dev/",
  );
  assert.equal(
    creation.normalizePublicLink("example.com/about?ref=org#team"),
    "https://example.com/about?ref=org#team",
  );
  assert.equal(
    creation.normalizePublicLink("HTTP://example.com/about"),
    "http://example.com/about",
  );
  const form = { ...org, externalLinks: ["www.ezekieloladele.dev"] };
  assert.deepEqual(creation.organizationPayload(form).externalLinks, [
    "https://www.ezekieloladele.dev/",
  ]);
  assert.equal(creation.organizationErrors(form).externalLinks, undefined);
  assert.ok(
    creation.organizationErrors({
      ...org,
      externalLinks: ["www.ezekieloladele.dev", "https://www.ezekieloladele.dev/"],
    }).externalLinks,
  );
  assert.ok(
    creation.organizationErrors({ ...org, externalLinks: ["javascript:alert(1)"] }).externalLinks,
  );
  assert.ok(
    creation.organizationErrors({
      ...org,
      externalLinks: Array.from({ length: 11 }, (_, i) => `example.com/${i}`),
    }).externalLinks,
  );
});
test("uploads enforce supported MIME types, 5 MB per file and total count before network calls", () => {
  assert.equal(creation.validateMedia([{ size: 5 * 1024 * 1024, type: "image/png" }], 7, 8), null);
  assert.match(
    creation.validateMedia([{ size: 5 * 1024 * 1024 + 1, type: "image/png" }], 0, 8),
    /5 MB/,
  );
  assert.match(creation.validateMedia([{ size: 1, type: "image/svg+xml" }], 0, 8), /JPEG/);
  assert.match(creation.validateMedia([{ size: 1, type: "image/png" }], 8, 8), /8 photos/);
  assert.equal(creation.validateMedia([{ size: 1, type: "application/pdf" }], 0, 5, true), null);
  assert.match(creation.validateMedia([{ size: 1, type: "application/pdf" }], 0, 8), /JPEG/);
});
test("ongoing needs actual frequencies; item/volunteer/professional campaigns need a needs list", () => {
  assert.deepEqual(creation.campaignErrors(campaign), {});
  assert.ok(creation.campaignErrors({ ...campaign, mode: "ONGOING", frequencies: [] }).frequencies);
  assert.equal(
    creation.campaignErrors({ ...campaign, mode: "ONGOING", frequencies: ["MONTHLY"] }).frequencies,
    undefined,
  );
  for (const type of ["ITEM", "VOLUNTEER", "PROFESSIONAL"]) {
    assert.ok(creation.campaignErrors({ ...campaign, type, needs: [] }).needs);
    assert.equal(
      creation.campaignErrors({ ...campaign, type, needs: ["Volunteer teachers"] }).needs,
      undefined,
    );
  }
});
test("switching to standalone/ongoing clears stale organization, target, and needs in the draft payload", () => {
  const payload = creation.campaignPayload({
    ...campaign,
    mode: "ONGOING",
    organizationId: "",
    coverImageUrl: "",
    frequencies: ["MONTHLY"],
    needs: ["Old item"],
  });
  assert.equal(payload.organizationId, null);
  assert.equal(payload.goalAmount, null);
  assert.equal(payload.coverImageUrl, null);
  assert.deepEqual(payload.needs, []);
  assert.deepEqual(payload.frequencies, ["MONTHLY"]);
  assert.deepEqual(creation.campaignPayload(campaign).frequencies, []);
  assert.equal(creation.campaignPayload(campaign).goalAmount, 150000);
  assert.equal(creation.organizationPayload(org).foundedYear, null);
});
test("draft API uses real authenticated persistence/submit endpoints with cookie credentials", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, ...init, body: init.body && JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: "draft" }), {
      headers: { "Content-Type": "application/json" },
    });
  };
  await api.saveOrganizationDraft(creation.organizationPayload(org));
  await api.updateOrganizationDraft("org", { foundedYear: null });
  await api.submitOrganizationDraft("org");
  await api.saveCampaignDraft(creation.campaignPayload(campaign));
  await api.updateCampaignDraft("cause", {
    organizationId: null,
    goalAmount: null,
    galleryImageUrls: [],
  });
  await api.submitCampaignDraft("cause");
  assert.deepEqual(
    calls.map((call) => call.url.replace("https://fixture.example", "")),
    [
      "/organizations/drafts",
      "/organizations/org/draft",
      "/organizations/org/submit",
      "/campaigns/drafts",
      "/campaigns/cause/draft",
      "/campaigns/cause/submit",
    ],
  );
  assert.ok(calls.every((call) => call.credentials === "include"));
  assert.deepEqual(calls[4].body, { organizationId: null, goalAmount: null, galleryImageUrls: [] });
});
