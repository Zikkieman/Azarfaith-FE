import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, module, module.exports);
  return module.exports;
}
const redirects = load("../src/lib/auth-return.ts");
const csv = load("../src/lib/admin-directory.ts");
const checkout = load("../src/lib/checkout.ts");
test("checkout return cannot become an external, arbitrary, or provider-reference redirect", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example/donate/id",
    "/admin",
    "/donate/%2f%2fevil.example",
    "/donate/id#frag",
    undefined,
  ])
    assert.equal(redirects.checkoutReturn(value), undefined);
  assert.equal(
    redirects.checkoutReturn(
      "/donate/id?amount=5000&freq=monthly&reference=secret&recurringGiftId=gift",
    ),
    "/donate/id?amount=5000&freq=monthly&recurringGiftId=gift",
  );
});
test("giving pause blocks otherwise valid checkout while preserving custom tips", () => {
  const input = {
    amount: 10000,
    tip: 5000,
    name: "Donor",
    email: "donor@example.com",
    note: "",
    frequency: "once",
    mode: "AUTO",
    consent: false,
    authenticated: false,
  };
  const context = {
    currency: "NGN",
    givingPaused: true,
    platformFeePercent: 2.5,
    minDonation: 100,
    maxDonation: 5000000,
    frequencies: ["MONTHLY"],
    recurringGift: null,
  };
  assert.match(checkout.validateCheckout(input, context).availability, /paused/);
  assert.equal(checkout.validateCheckout(input, context).tip, undefined);
  assert.deepEqual(checkout.validateCheckout(input, { ...context, givingPaused: false }), {});
});
test("admin export escapes formulas, line breaks, commas and quotes", () => {
  const value = csv.adminCsv([
    ["=SUM(A1)", "Name, with comma", 'Quote "here"', "Line\nbreak", 1000],
  ]);
  assert.match(value, /'=SUM/);
  assert.match(value, /"Name, with comma"/);
  assert.match(value, /"Quote ""here"""/);
  assert.match(value, /"Line\nbreak"/);
});
