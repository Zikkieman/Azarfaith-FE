import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221";
const api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-manage-qa";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const user = {
  id: "owner",
  fullName: "QA Organizer",
  email: "owner@example.invalid",
  role: "donor",
  status: "active",
  isVerified: true,
};
const name = "Riverlight Gospel Mission and Community Development Outreach";
const org = {
  id: "org-1",
  name,
  ownerId: user.id,
  tagline: "Hope for our community",
  location: "Ibadan, Oyo",
  category: "mission",
  photos: [],
  cover: null,
  links: [],
  registrationDocuments: [],
  campaignIds: [],
  bio: "Fixture only",
  verificationStatus: "verified",
  isDraft: false,
  totalReceived: 10000,
  supporters: 2,
  campaignCount: 1,
  reviewAction: null,
  reviewReason: null,
};
const profile = {
  ...user,
  createdAt: "2026-09-01",
  totalGiven: 0,
  activeRecurringGiftCount: 0,
  verifications: [],
  donationHistory: [],
  ownedOrganizations: [
    org,
    { id: "pending", name: "Pending Mission", verificationStatus: "pending" },
    {
      id: "rejected",
      name: "Rejected Mission",
      verificationStatus: "unverified",
      reviewAction: "rejected",
    },
  ],
  ownedCampaigns: [
    {
      id: "campaign-1",
      title: "Build a community learning centre with support for children and their families",
      verificationStatus: "verified",
      isPublic: true,
    },
    {
      id: "hidden",
      title: "Awaiting organization approval",
      verificationStatus: "verified",
      isPublic: false,
    },
    {
      id: "changes",
      title: "Campaign requiring changes",
      verificationStatus: "pending",
      isPublic: false,
      reviewAction: "changes_requested",
    },
  ],
};
const orgDrafts = [
  { id: "org-draft", name: "Saved Organization", draftSavedAt: "2026-10-10T12:00:00Z" },
];
const campaignDrafts = [
  { id: "campaign-draft", title: "Saved Campaign", draftSavedAt: "2026-10-10T12:00:00Z" },
];
const dashboard = {
  organization: org,
  overview: {
    totalRaised: 10000,
    totalSupporters: 2,
    activeCampaigns: 1,
    pendingCampaigns: 0,
    recurringDonorCount: 1,
    projectedMonthlyIncome: 5000,
  },
  campaigns: [
    {
      ...profile.ownedCampaigns[0],
      raised: 10000,
      goalAmount: 100000,
      donorCount: 2,
      lastDonationDate: "2026-10-10",
    },
  ],
  recentDonations: [
    {
      id: "gift",
      campaignId: "campaign-1",
      campaignTitle: profile.ownedCampaigns[0].title,
      donorName: "Anonymous Donor",
      amount: 10000,
      date: "2026-10-10",
    },
  ],
  notifications: [
    {
      id: "notice",
      level: "info",
      title: "Organization approved",
      message: "Your organization was approved by the AzarFaith team.",
    },
  ],
};
const account = {
  id: "account",
  ownerType: "user",
  bankCode: "001",
  bankName: "QA Bank",
  accountName: "QA ORGANIZER",
  accountHolderName: user.fullName,
  accountNumberMasked: "******1234",
  status: "verified",
};
const balance = {
  totalCollected: 10000,
  totalPlatformFees: 250,
  totalNetCollected: 9750,
  totalReleased: 0,
  availableBalance: 9750,
  recentTransfers: [],
};
let passed = 0;
const failures = [];
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
    viewport: { width: options.width ?? 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage(),
    errors = [],
    calls = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await context.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.addInitScript(
    (fail) =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            if (fail) throw new Error("Clipboard denied");
            window.qaCopied = value;
          },
        },
      }),
    Boolean(options.clipboardFail),
  );
  let failProfile = options.failProfile,
    failDrafts = options.failDrafts,
    saved = structuredClone(account);
  await context.route(api + "/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      method = req.method();
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    const body = req.postData() ? req.postDataJSON() : null;
    calls.push({ path, method, body });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      status = options.guest ? 401 : 200;
      data = options.guest ? { message: "Unauthorized" } : { user };
    } else if (path === "/me/notifications")
      data = { items: [], page: 1, pageSize: 8, total: 0, unreadCount: 0 };
    else if (path === "/me/profile") {
      status = failProfile ? 503 : 200;
      data = failProfile
        ? { message: "Workspace temporarily unavailable" }
        : options.empty
          ? { ...profile, ownedOrganizations: [], ownedCampaigns: [] }
          : profile;
    } else if (path === "/organizations/mine/drafts") {
      status = failDrafts ? 503 : 200;
      data = failDrafts
        ? { message: "Drafts temporarily unavailable" }
        : options.empty
          ? []
          : orgDrafts;
    } else if (path === "/campaigns/mine/drafts") data = options.empty ? [] : campaignDrafts;
    else if (path === "/organizations/org-1/dashboard") {
      status = options.dashboardError ?? 200;
      data =
        status === 200
          ? dashboard
          : {
              message:
                status === 404 ? "Organization not found" : "Dashboard temporarily unavailable",
            };
    } else if (path === "/organizations/org-1/payout-account") {
      if (method === "PATCH")
        saved = { ...saved, ...body, ownerType: "organization", status: "pending" };
      data = saved;
    } else if (path === "/organizations/org-1/payout-summary") data = balance;
    else if (path === "/me/payout-banks") data = [{ code: "001", name: "QA Bank" }];
    else if (path === "/me/payout-account/resolve") {
      status = 503;
      data = { message: "Account lookup unavailable; enter the beneficiary name manually." };
    } else if (path.endsWith("/discover"))
      data = { items: [], total: 0, page: 1, pageSize: 12, hasMore: false };
    else if (path === "/public/giving") data = { total: 0, byState: [], recent: [] };
    else {
      status = 404;
      data = { message: "Unexpected QA endpoint: " + path };
    }
    return route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  try {
    await fn({
      page,
      calls,
      recover: () => {
        failProfile = false;
        failDrafts = false;
      },
    });
    assert.deepEqual(errors, []);
    passed++;
    console.log("PASS " + name);
  } catch (error) {
    failures.push(name + ": " + error.message);
    console.error("FAIL " + name + ": " + error.message);
    await page.screenshot({
      path: out + "/" + name.replace(/[^a-z0-9]+/gi, "-") + "-failure.png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}
const panel = (page, title) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
const orgRow = (page) =>
  panel(page, "Your organizations")
    .locator("li")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
for (const width of [320, 390, 820, 1440])
  await run(
    "Workspace and organization layout " + width,
    async ({ page }) => {
      await page.goto(origin + "/manage");
      await orgRow(page).waitFor();
      assert.equal(await page.locator(".dashboard-layout,.workspace-nav,footer").count(), 0);
      assert.equal(await page.locator(".designer-app").count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: out + "/workspace-" + width + ".png", fullPage: true });
      await orgRow(page).getByRole("link", { name: "Manage", exact: true }).click();
      await page.getByRole("heading", { name, exact: true }).waitFor();
      await page.getByRole("heading", { name: "Organization payouts", exact: true }).waitFor();
      await page.getByText("QA Bank · ******1234", { exact: true }).waitFor();
      assert.equal(await page.locator(".dashboard-layout,.workspace-nav,footer").count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: out + "/organization-" + width + ".png", fullPage: true });
    },
    { width },
  );
await run("Draft and creation links retain actual IDs and routes", async ({ page, calls }) => {
  await page.goto(origin + "/manage");
  await orgRow(page).waitFor();
  assert.equal(
    await panel(page, "Organization drafts")
      .getByRole("link", { name: "Continue", exact: true })
      .getAttribute("href"),
    "/register-org?draftId=org-draft",
  );
  assert.equal(
    await panel(page, "Campaign drafts")
      .getByRole("link", { name: "Continue", exact: true })
      .getAttribute("href"),
    "/create?draftId=campaign-draft",
  );
  assert.equal(
    await panel(page, "Your campaigns")
      .getByRole("link", { name: "Manage", exact: true })
      .first()
      .getAttribute("href"),
    "/campaign/campaign-1",
  );
  assert.equal(
    await page.getByRole("link", { name: "Organization", exact: true }).getAttribute("href"),
    "/register-org",
  );
  assert.equal(
    await page.getByRole("link", { name: "Campaign", exact: true }).getAttribute("href"),
    "/create",
  );
  for (const path of ["/me/profile", "/organizations/mine/drafts", "/campaigns/mine/drafts"])
    assert(calls.some((call) => call.path === path));
});
await run(
  "Sharing copies real approved links and never pending or rejected records",
  async ({ page }) => {
    await page.goto(origin + "/manage");
    await orgRow(page).waitFor();
    await orgRow(page).getByRole("button", { name: "Copy link", exact: true }).click();
    assert.equal(await page.evaluate(() => window.qaCopied), origin + "/org/org-1");
    const whatsapp = new URL(
      await orgRow(page).getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href"),
    );
    assert(whatsapp.searchParams.get("text").includes(origin + "/org/org-1"));
    for (const title of [
      "Pending Mission",
      "Rejected Mission",
      "Awaiting organization approval",
      "Campaign requiring changes",
    ]) {
      const row = page
        .locator("li")
        .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
      assert.equal(await row.getByRole("button", { name: "Copy link", exact: true }).count(), 0);
      assert.equal(await row.getByRole("link", { name: "WhatsApp", exact: true }).count(), 0);
      await row
        .getByText("Owner preview only. Public sharing becomes available after approval.")
        .waitFor();
    }
  },
);
await run(
  "Clipboard denial reports failure without claiming success",
  async ({ page }) => {
    await page.goto(origin + "/manage");
    await orgRow(page).getByRole("button", { name: "Copy link", exact: true }).click();
    await page
      .getByText("Could not copy the link. Open the preview and copy its address.", { exact: true })
      .waitFor();
    assert.equal(await page.getByText("Public donation link copied.", { exact: true }).count(), 0);
  },
  { clipboardFail: true },
);
await run(
  "Workspace errors retry independently while other sections remain usable",
  async ({ page, recover }) => {
    await page.goto(origin + "/manage");
    await panel(page, "Your organizations")
      .getByText("Workspace temporarily unavailable", { exact: true })
      .waitFor();
    await panel(page, "Organization drafts")
      .getByText("Drafts temporarily unavailable", { exact: true })
      .waitFor();
    await panel(page, "Campaign drafts")
      .getByRole("link", { name: "Continue", exact: true })
      .waitFor();
    recover();
    await panel(page, "Your organizations")
      .getByRole("button", { name: "Try again", exact: true })
      .click();
    await panel(page, "Organization drafts")
      .getByRole("button", { name: "Try again", exact: true })
      .click();
    await orgRow(page).waitFor();
    await panel(page, "Organization drafts")
      .getByRole("link", { name: "Continue", exact: true })
      .waitFor();
  },
  { failProfile: true, failDrafts: true },
);
await run(
  "Direct organization route does not depend on workspace requests",
  async ({ page, calls, recover }) => {
    await page.goto(origin + "/manage/org/org-1");
    await page.getByRole("heading", { name, exact: true }).waitFor();
    assert(
      !calls.some((call) =>
        ["/me/profile", "/organizations/mine/drafts", "/campaigns/mine/drafts"].includes(call.path),
      ),
    );
    await page
      .getByText("Your organization was approved by the AzarFaith team.", { exact: true })
      .waitFor();
    recover();
    await page.getByRole("link", { name: "Back to your causes", exact: true }).click();
    await orgRow(page).waitFor();
  },
  { failProfile: true },
);
await run(
  "Scoped payout form saves a manual account as pending with real fee-adjusted balance",
  async ({ page, calls }) => {
    await page.goto(origin + "/manage/org/org-1");
    const payout = panel(page, "Organization payouts");
    await payout.getByText("QA Bank · ******1234", { exact: true }).waitFor();
    await payout
      .getByText(
        "Using your profile payout account. Saving below creates an organization-specific destination.",
        { exact: true },
      )
      .waitFor();
    await payout.getByLabel("Account number", { exact: true }).fill("1111111111");
    await payout
      .getByText("Account lookup unavailable; enter the beneficiary name manually.", {
        exact: true,
      })
      .waitFor();
    await payout.getByLabel("Beneficiary name", { exact: true }).fill("QA MANUAL NAME");
    await payout.getByRole("button", { name: "Save payout account", exact: true }).click();
    await payout.getByText("QA MANUAL NAME · Pending verification", { exact: true }).waitFor();
    const writes = calls.filter((call) => call.method === "PATCH");
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, "/organizations/org-1/payout-account");
    assert.deepEqual(writes[0].body, {
      bankCode: "001",
      accountNumber: "1111111111",
      accountHolderName: user.fullName,
      accountName: "QA MANUAL NAME",
    });
    await payout.getByText("₦9,750", { exact: true }).first().waitFor();
  },
);
await run(
  "Empty workspace contains real empty states without sample records",
  async ({ page }) => {
    await page.goto(origin + "/manage");
    await page.getByText("No saved organization drafts yet.", { exact: true }).waitFor();
    await page.getByText("No saved campaign drafts yet.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Copy link", exact: true }).count(), 0);
    assert.equal(await page.getByRole("heading", { name, exact: true }).count(), 0);
  },
  { empty: true },
);
await run(
  "Missing organization does not render owner dashboard or payout controls",
  async ({ page, calls }) => {
    await page.goto(origin + "/manage/org/org-1");
    await page.getByRole("heading", { name: "404", exact: true }).waitFor();
    assert.equal(
      await page.getByRole("heading", { name: "Organization payouts", exact: true }).count(),
      0,
    );
    assert(!calls.some((call) => call.path.includes("payout")));
  },
  { dashboardError: 404 },
);
for (const path of ["/manage", "/manage/org/org-1"])
  await run(
    "Guest gate " + path,
    async ({ page, calls }) => {
      await page.goto(origin + path);
      await page.waitForURL(origin + "/");
      assert(
        !calls.some(
          (call) =>
            call.path === "/me/profile" ||
            (call.path.startsWith("/organizations/") && !call.path.endsWith("/discover")) ||
            call.path.startsWith("/campaigns/mine/"),
        ),
      );
    },
    { guest: true },
  );
await browser.close();
console.log("Manage: " + passed + " checks passed");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
