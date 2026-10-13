import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function classes(path) {
  const ast = ts.createSourceFile(
      path,
      read(path),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    result = new Set();
  function visit(n) {
    if (ts.isJsxAttribute(n) && n.name.text === "className" && n.initializer)
      result.add(n.initializer.getText(ast).replace(/\s+/g, ""));
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return result;
}
function load(path, imports = {}, globals = {}) {
  const { outputText } = ts.transpileModule(read(path), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }),
    module = { exports: {} };
  new Function("require", "module", "exports", ...Object.keys(globals), outputText)(
    (name) => {
      if (name in imports) return imports[name];
      throw Error("Unexpected import " + name);
    },
    module,
    module.exports,
    ...Object.values(globals),
  );
  return module.exports;
}

test("detail pages, giving box and checkout retain pinned designer styles with explicit functional exceptions", () => {
  const manifest = JSON.parse(read("tests/fixtures/detail-design.json"));
  assert.equal(manifest.commit, "6c27cda68d4c738b62e9867d7ca7b196ec828d7d");
  for (const screen of manifest.screens) {
    const actual = new Set(screen.files.flatMap((path) => [...classes(path)]));
    assert(screen.retained.length / (screen.retained.length + screen.exceptions.length) > 0.85);
    for (const expression of screen.retained)
      assert(actual.has(expression), screen.source + ": removed source style " + expression);
  }
});
test("details use public server status and retain authenticated, real comment and owner actions", () => {
  const campaign = read("src/components/public/CampaignPublicView.tsx"),
    org = read("src/components/public/OrganizationPublicView.tsx");
  assert.match(campaign, /isPublished\(campaign\)/);
  assert.match(org, /org.campaigns.filter\(isPublished\)/);
  assert.match(campaign, /comments\/reactions/);
  assert.match(campaign, /user\?\.id \?\? "guest"/);
  assert.match(campaign, /authenticated && published/);
  assert.match(campaign, /viewerDonationTotal/);
  assert.match(org, /frequencies\?\.includes\("monthly"\)/);
  assert.doesNotMatch(org, /<a[^>]*registrationDocuments|org.registrationDocuments.map/);
  assert.match(read("src/routes/campaign.$id.tsx"), /createCampaignComment|createCampaignUpdate/);
  for (const code of [
    campaign,
    org,
    read("src/components/app/GiveBox.tsx"),
    read("src/components/checkout/CheckoutForm.tsx"),
  ])
    assert.doesNotMatch(code, /lib\/mock|lib\/store|simulateNetwork|Math.random/);
});
test("designer frequencies and presets never invent an ongoing schedule", () => {
  const recipes = load("src/lib/design-giving.ts");
  assert.deepEqual(recipes.presets, [5000, 10000, 25000, 50000]);
  assert.deepEqual(recipes.frequenciesFor({ mode: "one-time", frequencies: ["monthly"] }), [
    "once",
  ]);
  assert.deepEqual(
    recipes.frequenciesFor({ mode: "ongoing", frequencies: ["weekly", "quarterly"] }),
    ["weekly", "quarterly", "once"],
  );
  assert.deepEqual(recipes.frequenciesFor({ mode: "ongoing" }), ["once"]);
  assert.equal(recipes.hintFor({ faithCategory: "Unknown" }, 5000), undefined);
  assert.doesNotMatch(read("src/lib/design-giving.ts"), /PLATFORM_FEE|myGifts|skipDate/);
});
test("checkout uses configured fees, private saved cards, explicit consent and stable retry IDs", () => {
  const source = read("src/components/checkout/CheckoutForm.tsx");
  for (const token of [
    "context.platformFeePercent",
    "validateCheckout",
    "savedCardConsent",
    "consentedTotal === totals.total",
    "attempt.current ??= crypto.randomUUID()",
    "if (submitting.current",
    "payment.isError && Boolean(attempt.current)",
    "gift?.id",
    "getPaymentMethods",
    "paystackCheckoutUrl",
    "createDonation",
  ])
    assert(source.includes(token), token);
  assert.match(source, /setConsent\(false\)/);
  assert.match(source, /setSavedCardConsent\(false\)/);
  assert.doesNotMatch(source, /ending 4242|setTimeout|toast\("Receipt downloaded"\)/);
  const result = read("src/components/checkout/PaymentResult.tsx");
  assert.match(result, /result.status === "pending"/);
  assert.match(result, /formatMoney\(result.amount\)/);
  assert.match(result, /formatMoney\(result.totalCharged\)/);
  assert.match(result, /nextDonationDate/);
  assert.match(result, /window.print/);
  assert.doesNotMatch(result, /Math.random|gift \+ fee \+ tip/);
});
test("sharing awaits the real clipboard and excludes private payment search parameters", async () => {
  const calls = [],
    notices = [];
  const api = load(
    "src/lib/share-cause.ts",
    {
      sonner: {
        toast: {
          success: (message) => notices.push(["success", message]),
          error: (message) => notices.push(["error", message]),
        },
      },
    },
    {
      window: {
        location: {
          origin: "https://www.azarfaith.com",
          href: "https://www.azarfaith.com/donate/cause?reference=private",
        },
      },
      navigator: {
        clipboard: {
          writeText: async (url) => {
            calls.push(url);
          },
        },
      },
    },
  );
  await api.shareCause("campaign", "cause", "Our cause", true);
  assert.deepEqual(calls, ["https://www.azarfaith.com/campaign/cause"]);
  assert.equal(notices[0][0], "success");
});
test("failed or cancelled sharing never claims a copied link", async () => {
  const notices = [],
    toast = {
      success: (message) => notices.push(["success", message]),
      error: (message) => notices.push(["error", message]),
    },
    window = { location: { origin: "https://www.azarfaith.com" } };
  const denied = load(
    "src/lib/share-cause.ts",
    { sonner: { toast } },
    {
      window,
      navigator: {
        clipboard: {
          writeText: async () => {
            throw Error("Denied");
          },
        },
      },
    },
  );
  await denied.shareCause("org", "org", "Our organization", true);
  assert.equal(notices[0][0], "error");
  notices.length = 0;
  const cancelled = load(
    "src/lib/share-cause.ts",
    { sonner: { toast } },
    {
      window,
      navigator: {
        share: async () => {
          throw Object.assign(new Error("Cancelled"), { name: "AbortError" });
        },
      },
    },
  );
  await cancelled.shareCause("campaign", "cause", "Our cause");
  assert.deepEqual(notices, []);
});
