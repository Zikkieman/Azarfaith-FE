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
      throw new Error(`Unexpected runtime import: ${name}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const helpers = load("../src/lib/checkout.ts");
const config = {
  minDonation: 500,
  maxDonation: 100000,
  platformFeePercent: 4,
  frequencies: ["MONTHLY"],
  recurringGift: null,
};
const input = {
  amount: 10000,
  tip: 5000,
  name: "Guest Giver",
  email: "guest@example.com",
  note: "",
  frequency: "once",
  mode: "AUTO",
  authenticated: false,
  consent: false,
};
test("checkout uses configured fees and custom tips are not capped at 2500", () => {
  assert.deepEqual(helpers.checkoutTotals(10000, 5000, 4), { platformFee: 400, total: 15400 });
  assert.deepEqual(helpers.validateCheckout(input, config), {});
});
test("prefill amounts reject negative, fractional and malformed values rather than stripping them into a different gift", () => {
  for (const value of ["-5000", "100.25", "NaN", "Infinity", "amount=1000"])
    assert.equal(helpers.initialGiftAmount(value), 0);
  assert.equal(helpers.initialGiftAmount("10000"), 10000);
  assert.equal(helpers.initialGiftAmount(""), 5000);
});
test("whole NGN and database-safe totals are required", () => {
  for (const amount of [100, 100001, NaN, Infinity, 1.2])
    assert.ok(helpers.validateCheckout({ ...input, amount }, config).amount);
  for (const tip of [-1, 1.5, Infinity, 2147483647])
    assert.ok(helpers.validateCheckout({ ...input, tip }, config).tip);
});
test("money input formatting preserves invalid fractions/signs for validation instead of changing the requested amount", () => {
  assert.equal(helpers.formatCheckoutInput("10000"), "10,000");
  assert.equal(helpers.parseCheckoutInput("10,000"), 10000);
  for (const value of ["100.50", "-500", "1e3", "1abc2"]) {
    assert.equal(helpers.formatCheckoutInput(value), value);
    assert.ok(Number.isNaN(helpers.parseCheckoutInput(value)));
  }
});
test("anonymous gifts still need a real name and valid receipt email", () => {
  assert.ok(helpers.validateCheckout({ ...input, name: " " }, config).name);
  assert.ok(helpers.validateCheckout({ ...input, email: "not-an-email" }, config).email);
  assert.ok(helpers.validateCheckout({ ...input, note: "x".repeat(501) }, config).note);
});
test("recurring requires supported frequency, a signed-in donor and explicit AUTO consent", () => {
  assert.ok(helpers.validateCheckout({ ...input, frequency: "monthly" }, config).frequency);
  assert.ok(
    helpers.validateCheckout(
      { ...input, frequency: "weekly", authenticated: true, consent: true },
      config,
    ).frequency,
  );
  assert.ok(
    helpers.validateCheckout({ ...input, frequency: "monthly", authenticated: true }, config)
      .consent,
  );
  assert.deepEqual(
    helpers.validateCheckout(
      { ...input, frequency: "monthly", authenticated: true, consent: true },
      config,
    ),
    {},
  );
  assert.deepEqual(
    helpers.validateCheckout(
      { ...input, frequency: "monthly", authenticated: true, mode: "PLEDGE" },
      config,
    ),
    {},
  );
});
test("only HTTPS hosted Paystack checkout URLs can be followed", () => {
  assert.equal(
    helpers.paystackCheckoutUrl("https://checkout.paystack.com/reference"),
    "https://checkout.paystack.com/reference",
  );
  for (const value of [
    "javascript:alert(1)",
    "http://checkout.paystack.com/x",
    "https://checkout.paystack.com.attacker.test/x",
    "https://evil@checkout.paystack.com/x",
  ])
    assert.throws(() => helpers.paystackCheckoutUrl(value));
});
test("checkout reads its own public context and verification sends only the opaque reference", async () => {
  const requests = [];
  const api = load("../src/features/catalog/api.ts", {
    "@/lib/api": {
      apiFetch: (path, options) => {
        requests.push({ path, options });
        return Promise.resolve({});
      },
      adminApiFetch: () => assert.fail("No admin settings request in guest checkout"),
    },
  });
  await api.getCheckoutContext("cause", "pledge&other=bad");
  assert.equal(
    new URL(requests[0].path, "https://test.example").searchParams.get("recurringGiftId"),
    "pledge&other=bad",
  );
  await api.verifyDonation("cause", "azarfaith_reference");
  assert.equal(requests[1].path, "/campaigns/cause/donations/verify");
  assert.deepEqual(JSON.parse(requests[1].options.body), { reference: "azarfaith_reference" });
});
