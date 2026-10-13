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
const { dashboardStatus, dashboardMonthsSince, dashboardGiftAge, dashboardCompactMoney } =
  load("../src/lib/dashboard.ts");

test("dashboard amounts retain the designer's compact-money thresholds and rounding", () => {
  assert.equal(dashboardCompactMoney(1500), "₦1,500");
  assert.equal(dashboardCompactMoney(9999), "₦9,999");
  assert.equal(dashboardCompactMoney(12400), "₦12K");
  assert.equal(dashboardCompactMoney(12400000), "₦12.4M");
});

test("recent gifts use the source's compact relative dates from real timestamps", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  assert.equal(dashboardGiftAge("2026-10-12T10:00:00Z", now), "2h ago");
  assert.equal(dashboardGiftAge("2026-10-11T12:00:00Z", now), "1d ago");
  assert.equal(dashboardGiftAge("2026-10-05T12:00:00Z", now), "1w ago");
  assert.equal(dashboardGiftAge("2026-10-12T13:00:00Z", now), "just now");
  assert.equal(dashboardGiftAge("not a date", now), "Date unavailable");
});

test("dashboard update reminders use calendar months and handle invalid/future timestamps", () => {
  const now = new Date("2026-10-12T10:00:00Z");
  assert.equal(dashboardMonthsSince("2026-08-31T23:00:00Z", now), 2);
  assert.equal(dashboardMonthsSince("2026-10-01", now), 0);
  assert.equal(dashboardMonthsSince("2027-01-01", now), 0);
  assert.equal(dashboardMonthsSince("bad date", now), 0);
});

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
