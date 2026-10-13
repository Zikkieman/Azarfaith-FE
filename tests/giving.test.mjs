import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function load(path, imports = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => {
      if (name in imports) return imports[name];
      throw new Error(`Unexpected import ${name}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const giving = load("../src/lib/giving.ts");
const payment = {
  id: "paid",
  campaignId: "cause",
  campaignTitle: "Riverlight Mission",
  organizationName: null,
  amount: 10000,
  platformFee: 400,
  tipAmount: 5000,
  totalCharged: 15400,
  status: "succeeded",
  reference: "reference",
  frequency: "monthly",
  recurringGiftStatus: "on_track",
  createdAt: "2026-09-30T22:00:00Z",
  paidAt: "2026-10-01T00:00:00Z",
};
const filters = { search: "", kind: "", status: "", from: "", to: "" };
test("paused subscriptions remain manageable even though the backend disables their active charging flag", () => {
  const gifts = [
    { id: "active", active: true, status: "on_track" },
    { id: "paused", active: false, status: "paused" },
    { id: "cancelled", active: false, status: "cancelled" },
    { id: "completed", active: false, status: "completed" },
  ];
  assert.deepEqual(
    giving.currentGifts(gifts).map((gift) => gift.id),
    ["active", "paused"],
  );
});
test("source-style yearly metrics and next gift use real successful payments and actionable schedules", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  const gifts = [
    { id: "next", active: true, status: "on_track", nextDate: "2026-11-01T12:00:00Z" },
    { id: "paused", active: false, status: "paused", nextDate: "2026-10-13T12:00:00Z" },
    {
      id: "pending",
      active: true,
      status: "on_track",
      hasPendingPayment: true,
      nextDate: "2026-10-13T12:00:00Z",
    },
    { id: "missed", active: true, status: "missed", nextDate: "2026-10-14T12:00:00Z" },
    { id: "past", active: true, status: "on_track", nextDate: "2026-10-01T12:00:00Z" },
  ];
  const result = giving.givingOverview(
    [
      payment,
      { ...payment, id: "last-year", paidAt: "2025-10-01T00:00:00Z" },
      { ...payment, id: "failed", status: "failed" },
    ],
    gifts,
    now,
  );
  assert.equal(result.year, 2026);
  assert.equal(result.yearGiven, 10000);
  assert.equal(result.yearReceipts, 1);
  assert.equal(result.lifetime, 20000);
  assert.equal(result.pausedCount, 1);
  assert.equal(result.upcoming.id, "past");
  assert.equal(result.dueNow, true);
  assert.equal(
    giving.givingOverview(
      [payment],
      gifts.filter((gift) => gift.id !== "past"),
      now,
    ).upcoming.id,
    "next",
  );
});
test("combined receipt download retains real details, escapes markup and rejects unconfirmed payments", () => {
  const detail = { ...payment, receipt: { donorName: "<script>bad</script>" } };
  const html = giving.receiptsHtml([
    detail,
    { ...detail, id: "second", campaignTitle: "Second cause" },
  ]);
  assert.equal((html.match(/<html /g) ?? []).length, 1);
  assert.equal((html.match(/break-after:page/g) ?? []).length, 2);
  assert.ok(html.includes("Second cause"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("Content-Security-Policy"));
  assert.throws(() => giving.receiptsHtml([]));
  assert.throws(() => giving.receiptsHtml([{ ...detail, status: "pending" }]));
});
test("summaries include successful active recurring payments, exclude fees/tips/failures and use paid month", () => {
  const rows = [
    payment,
    { ...payment, id: "failed", status: "failed" },
    { ...payment, id: "pending", status: "pending" },
  ];
  assert.deepEqual(giving.givingSummary(rows, new Date("2026-10-10")), {
    lifetime: 10000,
    month: 10000,
    campaigns: 1,
    receipts: 1,
  });
});
test("history filters cover all payment states, recurring/one-time, references and inclusive paid dates", () => {
  const rows = [payment, { ...payment, id: "once", frequency: null, status: "failed" }];
  assert.equal(giving.filterGiving(rows, filters).length, 2);
  assert.deepEqual(
    giving
      .filterGiving(rows, {
        ...filters,
        status: "failed",
        kind: "once",
        search: "reference",
        from: "2026-10-01",
        to: "2026-10-01",
      })
      .map((row) => row.id),
    ["once"],
  );
  assert.equal(giving.filterGiving(rows, { ...filters, from: "2026-10-02" }).length, 0);
});
test("CSV exports real breakdowns, quotes commas and prevents formula injection", () => {
  const csv = giving.givingCsv([
    { ...payment, campaignTitle: '  =HYPERLINK("evil")', organizationName: "Org, Name" },
  ]);
  assert.ok(csv.includes('"\'  =HYPERLINK(""evil"")"'));
  assert.ok(csv.includes('"Org, Name"'));
  assert.ok(csv.includes('"10000","400","5000","15400"'));
  assert.ok(csv.includes('"2026-10-01T00:00:00Z"'));
});
test("HTML receipt escapes donor and campaign markup and disallows unsuccessful receipts", () => {
  const detail = {
    ...payment,
    campaignTitle: '<img src=x onerror="alert(1)">',
    receipt: { donorName: "<script>alert(1)</script>" },
  };
  const html = giving.receiptHtml(detail);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img "));
  assert.ok(html.includes("Content-Security-Policy"));
  assert.throws(() => giving.receiptHtml({ ...detail, status: "pending" }));
});
test("editing validates configured amount limits, calendar frequency and explicit AUTO consent", () => {
  const gift = {
    amount: 10000,
    frequency: "monthly",
    mode: "auto",
    minDonation: 500,
    maxDonation: 100000,
    platformFeePercent: 4,
    frequencies: ["monthly", "weekly"],
  };
  assert.equal(giving.validateGiftChange(gift, 20000, "weekly", true), null);
  for (const amount of [100, 100001, 1000.5, NaN, Infinity])
    assert.ok(giving.validateGiftChange(gift, amount, "monthly", true));
  assert.ok(giving.validateGiftChange(gift, 20000, "quarterly", true));
  assert.ok(giving.validateGiftChange(gift, 20000, "monthly", false));
  assert.equal(
    giving.validateGiftChange({ ...gift, mode: "pledge" }, 20000, "monthly", false),
    null,
  );
});
test("new controls call the authenticated endpoints and pass a server-issued version", async () => {
  const requests = [];
  const api = load("../src/features/catalog/api.ts", {
    "@/lib/api": {
      apiFetch: (path, options) => {
        requests.push({ path, options });
        return Promise.resolve({});
      },
      adminApiFetch: () => assert.fail(),
    },
  });
  await api.updateRecurringGift("gift", {
    amount: 20000,
    frequency: "MONTHLY",
    consentToAutoCharge: true,
    expectedUpdatedAt: "server-version",
  });
  await api.skipRecurringGift("gift", "server-version");
  assert.equal(requests[0].path, "/me/recurring-gifts/gift");
  assert.equal(requests[1].path, "/me/recurring-gifts/gift/skip");
  assert.equal(requests[1].options.method, "PATCH");
  assert.deepEqual(JSON.parse(requests[1].options.body), { expectedUpdatedAt: "server-version" });
});
