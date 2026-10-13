import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("tests/fixtures/app-design.json"));
function classes(path) {
  const source = read(path),
    ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    result = new Set();
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.text === "className" && node.initializer)
      result.add(
        node.initializer
          .getText(ast)
          .replace(/designer-app /g, "")
          .replace(/\s+/g, ""),
      );
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return result;
}

test("app kit, navigation, discovery and dashboard retain the pinned designer style expressions", () => {
  for (const [path, values] of Object.entries(manifest.classes)) {
    const current = classes(path);
    for (const value of values)
      assert.ok(current.has(value), `${path}: original source style removed`);
  }
  assert.equal(manifest.commit, "6c27cda68d4c738b62e9867d7ca7b196ec828d7d");
});

test("source navigation order and eight-step onboarding are retained without fake prototype auth", () => {
  const nav = read("src/components/app/AppNav.tsx"),
    dashboard = read("src/routes/dashboard.tsx");
  assert.match(
    nav,
    /label: "Discover", to: "\/discover"[\s\S]*label: "My giving", to: "\/my-giving"[\s\S]*label: "Manage", to: "\/dashboard"/,
  );
  assert.match(nav, /dispatch\(logout\(\)\)\.unwrap\(\)/);
  assert.match(nav, /NotificationMenu userId=\{user.id\}/);
  assert.doesNotMatch(
    nav + dashboard,
    /lib\/mock|lib\/store|simulateNetwork|setAuthed|SAMPLE_ORG|Prototype:/,
  );
  assert.equal((dashboard.match(/cta: "/g) ?? []).length, 8);
  assert.doesNotMatch(read("src/components/app/AppShell.tsx"), /<footer/);
});

test("dashboard actions use real review, money and server writes rather than prototype estimates", () => {
  const source = read("src/routes/dashboard.tsx");
  for (const value of [
    "getDashboard(organizationId)",
    "overview.thisMonthReceived",
    "overview.givers",
    "payout.availableBalance",
    "reviewProgress?.documentsChecked",
    "reviewProgress?.leadershipChecked",
    "c.galleryCount",
    "canThank",
    "PayoutRequests",
    "/thank-you",
  ])
    assert.ok(source.includes(value), value);
  assert.doesNotMatch(
    source,
    /org\.supporters\s*\*|org\.totalReceived\s*\*|Paid automatically every Friday|toast\("Payout requested/,
  );
});

test("discovery uses real server filters and publication boundaries instead of prototype seeds", () => {
  const source = read("src/routes/discover.tsx");
  for (const value of [
    "validateSearch",
    "discoverCampaigns",
    "discoverOrganizations",
    "discoveryCategory(cause)",
    "items.filter(isPublished)",
    "sort",
    "page",
    "Featured",
    "Shelf",
    "CauseTabs",
  ])
    assert.ok(source.includes(value), value);
  assert.doesNotMatch(source, /lib\/mock|lib\/store|simulateNetwork|2025-05-01/);
  assert.match(
    read("src/components/app/CampaignCard.tsx"),
    /await navigator\.clipboard\.writeText/,
  );
});
