import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("tests/fixtures/giving-design.json"));
function classes(path) {
  const source = read(path),
    ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    result = new Set();
  function visit(n) {
    if (ts.isJsxAttribute(n) && n.name.text === "className" && n.initializer)
      result.add(
        n.initializer
          .getText(ast)
          .replace(/designer-app /g, "")
          .replace(/\bfreq\b/g, "frequency")
          .replace(/\s+/g, ""),
      );
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return result;
}
test("My Giving restores the actual source page styles and private dialog primitives", () => {
  const actual = new Set(manifest.targets.flatMap((path) => [...classes(path)]));
  for (const value of manifest.classes)
    assert.ok(actual.has(value), "Original giving style removed: " + value);
  const dialogs = classes("src/components/app/DesignDialog.tsx");
  for (const value of manifest.dialog)
    assert.ok(dialogs.has(value), "Original dialog style removed");
  assert.equal(manifest.commit, "6c27cda68d4c738b62e9867d7ca7b196ec828d7d");
});
test("My Giving cannot switch back to the rejected workspace shell or import prototype giving data", () => {
  const source = read("src/routes/my-giving.tsx");
  assert.match(source, /<AppShell>/);
  assert.match(source, /<PageHeader/);
  assert.match(source, /<Tabs/);
  for (const path of manifest.targets)
    assert.doesNotMatch(
      read(path),
      /DashboardShell|dashboard-panel|dashboard-button|giving-small-button|lib\/store|lib\/mock|simulateNetwork|myGifts/,
    );
  for (const operation of [
    "getRecurringGifts",
    "getDonationHistory",
    "pauseRecurringGift",
    "resumeRecurringGift",
    "cancelRecurringGiftWithReason",
    "updateRecurringGift",
    "skipRecurringGift",
    "updateRecurringGiftPaymentMethod",
  ])
    assert.ok(source.includes(operation), operation);
  assert.match(source, /actionLock\.current/);
  assert.match(source, /expectedUpdatedAt: gift.updatedAt/);
});
test("source receipt controls fetch real private records before offering any download", () => {
  const source = read("src/components/giving/GivingHistory.tsx");
  assert.match(source, /getDonationDetail\(donation.id\)/);
  assert.match(source, /receiptsHtml\(receipts\)/);
  assert.match(source, /detail.status !== "succeeded"/);
  assert.match(source, /detail.id !== chunk\[index\].id/);
  assert.match(source, /givingCsv\(filtered\)/);
  assert.match(source, /mounted.current/);
  assert.doesNotMatch(source, /toast\([^\n]*downloaded|AF-24118|Receipts for 2026/);
});
