import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => imports[id] ?? require(id),
    module,
    module.exports,
  );
  return module.exports;
}
const { dashboardStatus } = load("../src/lib/dashboard.ts");

test("Review badges use actual backend statuses, including rejected organizations and drafts", () => {
  const record = {
    isDraft: false,
    verificationStatus: "pending",
    reviewAction: null,
    reviewReason: null,
  };
  assert.equal(dashboardStatus(record).label, "In review");
  assert.equal(dashboardStatus({ ...record, verificationStatus: "verified" }).label, "Verified");
  assert.equal(
    dashboardStatus({ ...record, verificationStatus: "unverified", reviewAction: "rejected" })
      .label,
    "Rejected",
  );
  assert.equal(
    dashboardStatus({ ...record, reviewAction: "more_info_requested" }).label,
    "More information needed",
  );
  assert.equal(
    dashboardStatus({ ...record, reviewAction: "changes_requested" }).label,
    "Changes requested",
  );
  assert.equal(
    dashboardStatus({ ...record, isDraft: true, reviewAction: "rejected" }).label,
    "Draft",
  );
});

test("Dashboard requests use the real endpoint and encode organization selection without altering results", async () => {
  const requests = [];
  const response = { giving: { lifetime: 0 }, organizations: [] };
  const { getDashboard } = load("../src/features/catalog/api.ts", {
    "@/lib/api": {
      apiFetch: async (path) => {
        requests.push(path);
        return response;
      },
    },
  });
  assert.equal(await getDashboard(), response);
  assert.equal(await getDashboard("personal"), response);
  assert.equal(await getDashboard("org?scope=other"), response);
  assert.deepEqual(requests, [
    "/me/dashboard",
    "/me/dashboard?organizationId=personal",
    "/me/dashboard?organizationId=org%3Fscope%3Dother",
  ]);
});
