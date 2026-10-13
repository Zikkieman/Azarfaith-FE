import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL("./fixtures/landing-design.json", import.meta.url), "utf8"),
);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");

function classes(path) {
  const source = read(path);
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = new Set();
  function walk(node) {
    if (ts.isJsxAttribute(node) && node.name.text === "className" && node.initializer) {
      // Additional positioning anchors for preview labels do not alter original class tokens.
      result.add(
        hash(
          node.initializer
            .getText(ast)
            .replace(/\brelative\b/g, "")
            .replace(/\s+/g, ""),
        ),
      );
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  return result;
}

test("landing preserves every original designer class expression and all seven SVG assets", () => {
  for (const [path, original] of Object.entries(manifest.classes)) {
    const current = classes(path);
    for (const value of original)
      assert.ok(current.has(value), `${path}: an original layout/style expression was removed`);
  }
  for (const [path, original] of Object.entries(manifest.assets))
    assert.equal(hash(read(path)), original, `${path}: designer asset changed`);
});

test("all original landing sections stay in the original order without importing prototype auth or payments", () => {
  const source = read("src/components/landing/LandingPage.tsx");
  let position = -1;
  for (const section of [
    "SiteNav",
    "HomeOpening",
    "OpenGivingSection",
    "HowItWorks",
    "FeaturePanel",
    "PhotoCollage",
    "Testimonial",
    "Campaigns",
    "Faq",
    "Cta",
    "Footer",
  ]) {
    const next = source.indexOf(`<${section}`);
    assert.ok(next > position, `${section} must retain its original position`);
    position = next;
  }
  const data = read("src/components/landing/data.tsx");
  assert.match(data, /state\.auth\.user/);
  assert.match(data, /discoverCampaigns/);
  assert.match(data, /discoverOrganizations/);
  assert.match(data, /\/public\/giving/);
  assert.match(data, /isPublic: false/);
  assert.doesNotMatch(data, /localStorage|zustand|lib\/store/);
});

test("live map uses actual totals, aggregates matching states and does not invent organization categories", () => {
  const source = read("src/components/landing/data.tsx");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const module = { exports: {} };
  const imports = {
    "@/app/hooks": {},
    "@/features/catalog/api": {},
    "@/lib/api": {},
    "@/lib/discovery": {},
    "./design-preview": { orgs: [], campaigns: [] },
    "@/components/map/data": { stats: {}, totals: {} },
    "@/components/map/nigeria": {
      states: [
        { id: "OY", name: "Oyo" },
        { id: "FC", name: "Federal Capital Territory" },
        { id: "LG", name: "Lagos" },
      ],
    },
  };
  new Function("require", "module", "exports", compiled)(
    (id) => imports[id] ?? require(id),
    module,
    module.exports,
  );
  const { locationState, mapLiveGiving } = module.exports;
  assert.equal(locationState("Ibadan, Oyo State"), "OY");
  assert.equal(locationState("Abuja FCT"), "FC");
  assert.equal(locationState("Oyojo"), "other");
  assert.equal(locationState("Location unspecified"), "other");
  const overview = {
    totals: { given: 60000, gifts: 4, organizations: 7 },
    locations: [
      { location: "Ibadan, Oyo", given: 10000, gifts: 1, organizations: 2 },
      { location: "Ogbomoso, Oyo", given: 20000, gifts: 2, organizations: 3 },
      { location: "Abuja", given: 30000, gifts: 1, organizations: 1 },
      { location: "Unspecified", given: 0, gifts: 0, organizations: 1 },
    ],
  };
  const result = mapLiveGiving(overview, [
    {
      id: "real-campaign",
      location: "Oyo",
      raiser: { name: "Real ministry" },
      updates: [],
      title: "Real outreach",
      cover: "https://fixture.invalid/cover.png",
    },
  ]);
  assert.deepEqual(result.totals, { givenWeek: 60000, receipts: 4, orgs: 7 });
  assert.equal(result.stats.OY.givenWeek, 30000);
  assert.equal(result.stats.OY.receipts, 3);
  assert.equal(result.stats.OY.totalOrganizations, 5);
  assert.deepEqual(result.stats.OY.orgs, { church: 0, mission: 0, orphanage: 0, school: 0 });
  assert.equal(result.stats.OY.featured.to, "/campaign/real-campaign");
  assert.equal(result.stats.LG.totalOrganizations, 0);
  assert.equal(result.stats.LG.featured, undefined);
});

test("preview campaigns never supply their prototype IDs to checkout or copying", () => {
  const card = read("src/components/landing/CampaignCard.tsx");
  assert.match(card, /c\.designPreview \? "\/discover" : "\/donate\/\$id"/);
  assert.match(card, /if \(c\.designPreview\)/);
  assert.match(card, /not available for donations|design preview/i);
  assert.match(read("src/components/landing/Footer.tsx"), /Your email has not been saved/);
});
