import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
function classes(p) {
  const ast = ts.createSourceFile(p, read(p), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    result = new Set();
  function visit(n) {
    if (ts.isJsxAttribute(n) && n.name.text === "className" && n.initializer)
      result.add(n.initializer.getText(ast).replace(/\s+/g, ""));
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return [...result];
}
test("creation and settings preserve pinned source styles with documented live-function exceptions", () => {
  const manifest = JSON.parse(read("tests/fixtures/creation-design.json"));
  assert.equal(manifest.commit, "6c27cda68d4c738b62e9867d7ca7b196ec828d7d");
  for (const screen of manifest.screens) {
    const actual = new Set(screen.files.flatMap(classes));
    assert(screen.retained.length / (screen.retained.length + screen.exceptions.length) > 0.7);
    for (const c of screen.retained) assert(actual.has(c), screen.source + ": missing " + c);
  }
});
test("creation uses authenticated drafts, real uploads and publication endpoints rather than prototype stores", () => {
  for (const p of ["src/routes/register-org.tsx", "src/routes/create.tsx"]) {
    const s = read(p);
    assert.match(s, /useCreationSession/);
    assert.match(s, /savingLock/);
    assert.doesNotMatch(s, /lib\/mock|lib\/store|simulateNetwork|Math.random|setTimeout/);
  }
  const org = read("src/routes/register-org.tsx"),
    campaign = read("src/routes/create.tsx"),
    media = read("src/components/creation/DesignMedia.tsx");
  for (const token of [
    "saveOrganizationDraft",
    "updateOrganizationDraft",
    "submitOrganizationDraft",
    "registrationDocumentUrls",
    "normalizePublicLink",
  ])
    assert(org.includes(token), token);
  for (const token of [
    "saveCampaignDraft",
    "updateCampaignDraft",
    "submitCampaignDraft",
    "getPersonalPayoutAccount",
    "getOrganizationPayoutAccount",
    "hasTemplateInstructions",
    "Unsaved changes",
  ])
    assert(campaign.includes(token), token);
  assert.match(campaign, /reviewAction !== "rejected"/);
  assert.match(campaign, /Replace the bracketed template instructions/);
  for (const folder of [
    "organization-photo",
    "organization-document",
    "campaign-cover",
    "campaign-gallery",
  ])
    assert((media + org + campaign).includes(folder), folder);
  assert.match(media, /uploadMedia/);
  assert.match(media, /getCloudinaryStatus/);
});
test("settings preserve real mutations and never fabricate unsupported account closure or cards", () => {
  const profile = read("src/routes/profile.tsx");
  for (const token of [
    "updateProfile",
    "updateNotificationPreferences",
    "changePassword",
    "/auth/signout-other-devices",
    "EmailChange",
    "DesignSettingsSection",
    "DesignSaveFooter",
  ])
    assert(profile.includes(token), token);
  assert.doesNotMatch(profile, /lib\/mock|lib\/store|setTimeout|ending 4242|Account closed/);
  assert.match(profile, /Newsletter subscriptions are not available/);
  assert.match(profile, /disabled/);
});
