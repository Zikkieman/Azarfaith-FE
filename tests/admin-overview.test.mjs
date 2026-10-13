import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
function classes(p) {
  const ast = ts.createSourceFile(p, read(p), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    out = new Set();
  function visit(n) {
    if (ts.isJsxAttribute(n) && n.name.text === "className" && n.initializer)
      out.add(n.initializer.getText(ast).replace(/\s+/g, ""));
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return [...out];
}
function load(p, imports = {}) {
  const module = { exports: {} },
    { outputText } = ts.transpileModule(read(p), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
  new Function("require", "module", "exports", outputText)(
    (name) => {
      if (name in imports) return imports[name];
      throw Error(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const overview = load("src/lib/admin-overview.ts", {
  "./catalog": { formatMoney: (n) => "₦" + n.toLocaleString("en-US") },
});
const data = (range) => ({
  range,
  series: Array.from({ length: range === "30d" ? 30 : 7 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, i + 1)).toISOString().slice(0, 10),
    given: i + 1,
    gifts: 2,
    users: 1,
    organizations: 0,
    campaigns: 0,
  })),
  current: { given: 1000, gifts: 7, users: 3, organizations: 2, campaigns: 1 },
  change: { given: null, gifts: -4, users: null, organizations: null, campaigns: null },
});
test("admin overview, frame and navigation retain pinned original design recipes", () => {
  const m = JSON.parse(read("tests/fixtures/admin-overview-design.json"));
  assert.equal(m.commit, "6c27cda68d4c738b62e9867d7ca7b196ec828d7d");
  for (const screen of m.screens) {
    const actual = new Set(screen.files.flatMap(classes));
    assert(
      screen.retained.length / (screen.retained.length + screen.exceptions.length) > 0.85,
      screen.source,
    );
    for (const c of screen.retained)
      assert(actual.has(c), screen.source + ": missing source style " + c);
  }
});
test("weekly summaries preserve every day, partial weeks, totals and real metric selection", () => {
  const series = overview.overviewSeries(data("30d"));
  assert.equal(series.length, 5);
  assert.equal(
    series.reduce((n, p) => n + p.value, 0),
    465,
  );
  assert.equal(series[4].value, 59);
  assert.equal(overview.overviewSeries(data("7d")).length, 7);
  assert.equal(
    overview.overviewSeries(data("30d"), "users").reduce((n, p) => n + p.value, 0),
    30,
  );
});
test("metrics do not invent percentage baselines or call registered users donors", () => {
  const strip = overview.overviewStrip(data("7d"));
  assert.equal(strip[0].delta, undefined);
  assert.equal(strip[1].delta, "4%");
  assert.equal(strip[1].up, false);
  assert.equal(strip[2].label, "New users");
  assert.equal(strip[0].value, "₦1,000");
});
test("relative dates are robust to future or invalid data and audit labels come from server actions", () => {
  assert.equal(overview.relativeAdminTime("invalid"), "Date unavailable");
  assert.equal(overview.relativeAdminTime("2026-10-14", Date.parse("2026-10-13")), "just now");
  assert.equal(overview.auditPhrase("ORGANIZATION_APPROVED"), "verified");
  assert.equal(overview.auditPhrase("PAYOUT_FINALIZED"), "payout finalized");
});
test("overview and navigation never use prototype records or fake writes", () => {
  for (const p of [
    "src/routes/admin/index.tsx",
    "src/components/admin/AdminLayout.tsx",
    "src/components/admin/AdminHeader.tsx",
    "src/components/admin/AdminSidebar.tsx",
    "src/components/admin/AdminCommandPalette.tsx",
  ]) {
    const s = read(p);
    assert.doesNotMatch(s, /lib\/mock|lib\/store|simulateNetwork|Math.random|setTimeout/);
  }
  const s = read("src/routes/admin/index.tsx");
  for (const token of [
    "status=PENDING",
    "pageSize=4",
    "sort=priority",
    "getAdminActivity",
    "/admin/review/analytics?range=",
    "analytics.isError",
    "orgs.isError",
    "campaigns.isError",
    "downloadAdminCsv",
  ])
    assert(s.includes(token), token);
  assert.match(read("src/components/admin/AdminSidebar.tsx"), /to="\/admin\/profile"/);
});
test("review deep links bind pending status while directories and protected sessions remain real", () => {
  for (const p of ["src/routes/admin/orgs.tsx", "src/routes/admin/campaigns.tsx"]) {
    const s = read(p);
    assert.match(s, /validateSearch/);
    assert.match(s, /initialStatus=/);
    assert.match(s, /key=\{view\}/);
  }
  assert.match(read("src/components/admin/AdminDirectory.tsx"), /status: initialStatus/);
  const frame = read("src/components/admin/AdminLayout.tsx");
  assert.match(frame, /user.role !== "platform_admin"/);
  assert.match(frame, /dispatch\(fetchSession\(\)\)/);
  assert.match(frame, /client.removeQueries/);
  assert.match(frame, /pathname === "\/admin\/login"/);
});
