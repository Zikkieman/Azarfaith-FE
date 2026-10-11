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
const admin = load("../src/lib/admin.ts"),
  api = load("../src/lib/api.ts"),
  catalog = load("../src/features/catalog/api.ts", { "@/lib/api": api });
test("payout release requires a verified active account and a positive whole-naira net amount", () => {
  const owner = { payoutAccount: { active: true, status: "verified" }, availableBalance: 9750 };
  assert.equal(admin.payoutReleaseError(owner, 9750), null);
  for (const amount of [0, -1, 1.5, NaN, Infinity, 10000])
    assert.ok(admin.payoutReleaseError(owner, amount));
  for (const account of [
    null,
    { active: false, status: "verified" },
    { active: true, status: "pending" },
  ])
    assert.match(admin.payoutReleaseError({ ...owner, payoutAccount: account }, 100), /verified/);
});
test("pending and OTP outcomes do not claim completed payment", () => {
  assert.match(admin.payoutOutcome("pending"), /pending/);
  assert.match(admin.payoutOutcome("otp"), /awaiting/);
  assert.match(admin.payoutOutcome("success"), /confirmed/);
  assert.match(admin.payoutOutcome("failed"), /failed/);
});
test("audit target URLs encode IDs and remain in the admin area", () => {
  assert.equal(
    admin.auditTarget({ entityType: "user", entityId: "id/with?syntax" }),
    "/admin/users/id%2Fwith%3Fsyntax",
  );
  assert.equal(
    admin.auditTarget({ entityType: "platform_settings", entityId: "default" }),
    "/admin/settings",
  );
  assert.equal(admin.humanizeAdminAction("PAYOUT_RELEASE_REQUESTED"), "Payout release requested");
});
test("admin activity uses validated server pagination and transfers keep their request ID", async (t) => {
  const original = global.fetch,
    calls = [];
  t.after(() => {
    global.fetch = original;
  });
  global.fetch = async (url, init) => {
    calls.push({
      url,
      method: init.method,
      credentials: init.credentials,
      body: init.body ? JSON.parse(init.body) : null,
    });
    return new Response("{}", { headers: { "content-type": "application/json" } });
  };
  await catalog.getAdminActivity({
    page: 2,
    pageSize: 20,
    entityType: "organization",
    from: "2026-10-01T00:00:00Z",
  });
  const body = {
    ownerType: "USER",
    ownerId: "owner",
    amount: 5000,
    requestId: "891c0af9-bad2-444d-a3d0-9a8a15ea9f27",
  };
  await catalog.releaseAdminPayout(body);
  await catalog.finalizeAdminPayout("transfer", { otp: "123456" });
  await catalog.reconcileAdminPayout("transfer");
  assert.match(calls[0].url, /activity\?page=2&pageSize=20&entityType=organization/);
  assert.deepEqual(calls[1].body, body);
  assert.equal(calls[2].url, "https://fixture.example/admin/review/payouts/transfer/finalize");
  assert.equal(calls[3].url, "https://fixture.example/admin/review/payouts/transfer/reconcile");
  assert.equal(calls[3].method, "PATCH");
  assert.ok(calls.every((call) => call.credentials === "include"));
});
test("organization payout settings retain their scoped endpoint rather than overwrite the profile account", async (t) => {
  const original = global.fetch,
    calls = [];
  t.after(() => {
    global.fetch = original;
  });
  global.fetch = async (url, init) => {
    calls.push({ url, method: init.method });
    return new Response("{}", { headers: { "content-type": "application/json" } });
  };
  await catalog.getOrganizationPayoutAccount("org");
  await catalog.getOrganizationPayoutSummary("org");
  await catalog.upsertOrganizationPayoutAccount("org", {
    bankCode: "001",
    accountNumber: "0123456789",
    accountHolderName: "Owner",
    accountName: "Owner",
  });
  assert.deepEqual(
    calls.map((c) => c.url),
    [
      "https://fixture.example/organizations/org/payout-account",
      "https://fixture.example/organizations/org/payout-summary",
      "https://fixture.example/organizations/org/payout-account",
    ],
  );
  assert.equal(calls[2].method, "PATCH");
});
test("admin inbox pagination retains its snapshot and reads use authenticated cookie endpoints", async (t) => {
  const original = global.fetch,
    calls = [];
  t.after(() => {
    global.fetch = original;
  });
  global.fetch = async (url, init) => {
    calls.push({
      url,
      method: init.method,
      credentials: init.credentials,
      body: init.body ? JSON.parse(init.body) : null,
    });
    return new Response("{}", { headers: { "content-type": "application/json" } });
  };
  const through = "2026-10-01T00:00:00.000Z";
  await catalog.getAdminInbox({ page: 2, pageSize: 8, asOf: through });
  await catalog.markAdminNotificationRead("event/with?syntax");
  await catalog.markAdminInboxRead(through);
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, "/admin/review/notifications/inbox");
  assert.equal(url.searchParams.get("asOf"), through);
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(
    calls[1].url,
    "https://fixture.example/admin/review/notifications/event%2Fwith%3Fsyntax/read",
  );
  assert.equal(calls[2].url, "https://fixture.example/admin/review/notifications/read-all");
  assert.deepEqual(calls[2].body, { through });
  assert.ok(calls.every((call) => call.credentials === "include"));
});
test("private review notes and checklist send real scoped writes and preserve the server version", async (t) => {
  const original = global.fetch,
    calls = [];
  t.after(() => {
    global.fetch = original;
  });
  global.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return new Response("{}", { headers: { "content-type": "application/json" } });
  };
  await catalog.getAdminReviewRecords("organization", "org/one", 2);
  await catalog.addAdminReviewNote("organization", "org/one", "Evidence reviewed");
  const version = "2026-10-01T00:00:00.000Z";
  await catalog.updateAdminReviewCheck("organization", "org/one", {
    key: "location",
    checked: true,
    expectedVersion: version,
  });
  assert.match(calls[0].url, /records\/organization\/org%2Fone\/review\?page=2/);
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(calls[1].body, { body: "Evidence reviewed" });
  assert.equal(calls[2].method, "PATCH");
  assert.deepEqual(calls[2].body, { key: "location", checked: true, expectedVersion: version });
  assert.ok(calls.every((call) => !call.url.includes("/me/")));
});
