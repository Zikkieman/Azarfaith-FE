import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("additional Manage routes use the source app frame and dashboard panel recipe", () => {
  for (const path of ["src/routes/manage.tsx", "src/routes/manage.org.$id.tsx"]) {
    const source = read(path);
    for (const piece of [
      "AppShell",
      "PageHeader",
      "Container",
      "ManagementPanel",
      'btn("',
      "Tag",
      "useCreationSession",
      '"noindex, nofollow"',
    ])
      assert.ok(source.includes(piece), `${path}: ${piece}`);
    assert.doesNotMatch(
      source,
      /DashboardShell|giving-small-button|workspace-nav|lib\/mock|lib\/store|simulateNetwork|#[0-9a-fA-F]{6}/,
    );
  }
  const parts = read("src/components/app/ManagementParts.tsx");
  for (const recipe of [
    "overflow-hidden rounded-card border border-line-soft",
    "flex items-center justify-between border-b border-line-soft px-5 py-3.5",
    "text-[15px] font-semibold text-ink",
    "px-5 py-10 text-center text-sm text-muted-ink",
  ])
    assert.ok(parts.includes(recipe));
  const nav = read("src/components/app/AppNav.tsx");
  assert.match(nav, /label: "Manage", to: "\/dashboard"/);
  assert.match(nav, /to="\/manage"/);
});

test("workspace retains private APIs, child isolation, draft IDs and publication-gated sharing", () => {
  const source = read("src/routes/manage.tsx");
  for (const value of [
    "getProfile",
    "listOrganizationDrafts",
    "listCampaignDrafts",
    "enabled: ready",
    'queryKey: ["profile", userId]',
    "<Outlet />",
    'to="/manage/org/$id"',
    'to="/campaign/$id"',
    "draftId: draft.id",
    "campaign.isPublic === true",
    'verificationStatus === "verified"',
    "published &&",
    "clipboard.writeText(url)",
    "https://wa.me/?text=",
    "profile.refetch()",
    "orgDrafts.refetch()",
    "campaignDrafts.refetch()",
  ])
    assert.ok(source.includes(value), value);
  assert.match(source, /if \(!ready\) return <PageSpinner/);
  assert.match(read("src/features/catalog/api.ts"), /"\/organizations\/mine\/drafts"/);
  assert.match(read("src/features/catalog/api.ts"), /"\/campaigns\/mine\/drafts"/);
});

test("organization management preserves real metrics and scoped payout writes with opt-in source styling", () => {
  const source = read("src/routes/manage.org.$id.tsx"),
    payout = read("src/components/profile/PayoutSettings.tsx");
  for (const value of [
    "getOrganizationDashboard(id)",
    "overview.totalRaised",
    "overview.totalSupporters",
    "overview.projectedMonthlyIncome",
    "data.campaigns",
    "data.recentDonations",
    "data.notifications",
    "throw notFound()",
    "organizationId={id}",
    'appearance="app"',
  ])
    assert.ok(source.includes(value), value);
  assert.match(payout, /appearance\?: "app"/);
  assert.match(payout, /app \? AppPayoutSection : SettingsSection/);
  for (const value of [
    "getOrganizationPayoutAccount(organizationId)",
    "getOrganizationPayoutSummary(organizationId)",
    "upsertOrganizationPayoutAccount(organizationId, payload)",
    "resolvePayoutAccount({ bankCode, accountNumber })",
    "Only a confirmed account is marked verified",
    "availableBalance",
    "Pending verification",
  ])
    assert.ok(payout.includes(value), value);
});
