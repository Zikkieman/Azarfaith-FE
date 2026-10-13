import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221";
const api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const artifacts = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-app-qa";
mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const user = {
  id: "qa-owner",
  fullName: "QA Organizer",
  email: "owner@example.invalid",
  phone: null,
  isVerified: true,
  role: "donor",
  status: "active",
};
const org = {
  id: "org-1",
  name: "Riverlight Gospel Mission",
  location: "Ibadan, Oyo",
  cover: null,
  photos: [],
  category: "mission",
  tagline: "Hope for our community",
  denomination: "",
  founded: "2019",
  bio: "Fixture",
  verificationStatus: "verified",
  isPublic: true,
  isDraft: false,
  reviewAction: null,
  reviewReason: null,
  submittedAt: "2026-10-01",
  hasRegistrationDocuments: true,
  ownerId: user.id,
  links: [],
  registrationDocuments: [],
  campaignIds: [],
  totalReceived: 30000,
  supporters: 2,
  campaignCount: 2,
};
const campaign = {
  id: "campaign-1",
  ownerId: user.id,
  orgId: org.id,
  title: "Riverlight school support",
  story: "Real API fixture for isolated QA",
  cover: "",
  gallery: [],
  goal: 100000,
  mode: "one-time",
  type: "money",
  raised: 30000,
  donors: 2,
  faithCategory: "Education",
  urgency: "high",
  verificationStatus: "verified",
  isPublic: true,
  isDraft: false,
  reviewAction: null,
  reviewReason: null,
  createdAt: "2026-10-01",
  giftCount: 3,
  givers: 2,
  galleryCount: 1,
  lastUpdateAt: "2026-08-01",
  raiser: { name: org.name, avatar: "", location: org.location },
  frequencies: [],
  location: org.location,
  updates: [],
  donations: [],
  comments: [],
};
const second = {
  ...campaign,
  id: "campaign-2",
  title: "Ongoing mission support",
  mode: "ongoing",
  goal: 80000,
  frequencies: ["monthly"],
  galleryCount: 3,
};
const base = {
  fullName: user.fullName,
  period: { start: "2026-10-01", end: "2026-11-01", timezone: "UTC" },
  organizations: [
    org,
    {
      ...org,
      id: "org-draft",
      name: "Saved ministry",
      isDraft: true,
      verificationStatus: "unverified",
    },
  ],
  selectedOrganization: org,
  reviewProgress: { documentsChecked: false, leadershipChecked: false },
  giving: { lifetime: 50000, thisMonth: 10000, campaignsSupported: 2, activeRecurring: 1 },
  overview: {
    totalReceived: 30000,
    thisMonthReceived: 15000,
    giftsReceived: 3,
    givers: 2,
    recurringSupporters: 1,
    liveCampaigns: 2,
    pendingCampaigns: 0,
  },
  campaigns: [campaign, second],
  recentGifts: [
    {
      id: "gift-1",
      donorName: "QA Giver",
      amount: 30000,
      date: "2026-10-10",
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      note: "Keep going",
      canThank: true,
    },
    {
      id: "gift-2",
      donorName: "Anonymous Donor",
      amount: 500,
      date: "2026-10-09",
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      canThank: false,
    },
  ],
  payout: {
    availableBalance: 29250,
    totalPlatformFees: 750,
    totalReleased: 0,
    account: { status: "verified", bankName: "QA Bank", accountNumberLast4: "1234" },
  },
};
const empty = {
  ...base,
  organizations: [],
  selectedOrganization: null,
  reviewProgress: null,
  overview: {
    totalReceived: 0,
    thisMonthReceived: 0,
    giftsReceived: 0,
    givers: 0,
    recurringSupporters: 0,
    liveCampaigns: 0,
    pendingCampaigns: 0,
  },
  campaigns: [],
  recentGifts: [],
  payout: { availableBalance: 0, totalPlatformFees: 0, totalReleased: 0, account: null },
};
const failures = [];
let passed = 0;
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
      viewport: { width: options.width ?? 1440, height: 1000 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage(),
    errors = [],
    calls = [];
  let currentUser = options.guest ? null : user,
    failDashboard = options.failDashboard,
    failDiscover = options.failDiscover,
    failThanks = options.failThanks,
    payoutRequested = false,
    failPayout = options.failPayout;
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await context.route("https://fonts.gstatic.com/**", (r) => r.abort());
  await context.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#ddd"/></svg>',
    }),
  );
  await context.route(api + "/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    const body = req.postData() ? req.postDataJSON() : null;
    calls.push({ path, method, query: Object.fromEntries(url.searchParams), body });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      status = currentUser ? 200 : 401;
      data = currentUser ? { user: currentUser } : { message: "Unauthorized" };
    } else if (path === "/auth/logout") {
      if (options.failLogout) {
        status = 503;
        data = { message: "Sign-out unavailable" };
      } else {
        currentUser = null;
        data = { message: "Logged out" };
      }
    } else if (path === "/me/dashboard") {
      if (failDashboard) {
        status = 503;
        data = { message: "Dashboard temporarily unavailable" };
      } else if (options.empty) data = empty;
      else if (url.searchParams.get("organizationId") === "personal")
        data = { ...base, selectedOrganization: null, reviewProgress: null, campaigns: [second] };
      else if (url.searchParams.get("organizationId") === "org-draft")
        data = { ...base, selectedOrganization: base.organizations[1], campaigns: [] };
      else if (options.rejected)
        data = {
          ...base,
          selectedOrganization: {
            ...org,
            verificationStatus: "unverified",
            reviewAction: "rejected",
            reviewReason: "Please provide evidence",
          },
          overview: { ...base.overview, liveCampaigns: 0 },
        };
      else data = base;
    } else if (path === "/me/notifications")
      data = { items: [], unreadCount: 0, page: 1, pageSize: 8, total: 0 };
    else if (path === "/me/payout-requests" && method === "POST") {
      if (failPayout) {
        status = 503;
        data = { message: "Payout request temporarily unavailable" };
      } else {
        payoutRequested = true;
        data = { id: "request-1", status: "OPEN" };
      }
    } else if (path === "/me/payout-requests")
      data = payoutRequested
        ? [
            {
              id: "request-1",
              ownerType: "ORGANIZATION",
              ownerId: org.id,
              amount: 10000,
              status: "OPEN",
              createdAt: "2026-10-12",
            },
          ]
        : [];
    else if (path === "/me/received-donations/gift-1/thank-you") {
      if (failThanks) {
        status = 503;
        data = { message: "Email queue unavailable" };
      } else data = { message: "Thank-you queued for delivery" };
    } else if (path === "/campaigns/discover") {
      if (failDiscover) {
        status = 503;
        data = { message: "Discovery unavailable" };
      } else {
        const view = url.searchParams.get("view"),
          search = url.searchParams.get("search"),
          p = Number(url.searchParams.get("page") ?? 1);
        let items = view === "regular" ? [second] : [campaign, second];
        if (search?.includes("nothing")) items = [];
        if (p > 1) items = [{ ...campaign, id: "page-2", title: "Second page campaign" }];
        data = {
          items: [
            ...items,
            {
              ...campaign,
              id: "private",
              title: "Hidden pending campaign",
              isPublic: false,
              verificationStatus: "pending",
            },
          ],
          page: p,
          pageSize: 12,
          total: options.pagination ? 25 : items.length,
          hasMore: options.pagination && p < 3,
        };
      }
    } else if (path === "/organizations/discover")
      data = {
        items: [
          org,
          {
            ...org,
            id: "private-org",
            name: "Hidden pending org",
            isPublic: false,
            verificationStatus: "pending",
          },
        ],
        page: 1,
        pageSize: 12,
        total: 1,
        hasMore: false,
      };
    else if (path === "/public/giving") data = { total: 0, byState: [], recent: [] };
    else {
      status = 404;
      data = { message: "Unexpected QA endpoint " + path };
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
      context,
      recover: () => {
        failDashboard = false;
        failDiscover = false;
        failThanks = false;
        failPayout = false;
      },
    });
    assert.deepEqual(errors, []);
    passed++;
    console.log("PASS " + name);
  } catch (e) {
    failures.push(name + ": " + e.message);
    await page.screenshot({
      path: artifacts + "/" + name.replace(/[^a-z0-9]+/gi, "-") + "-failure.png",
      fullPage: true,
    });
    console.error("FAIL " + name + ": " + e.message);
  } finally {
    await context.close();
  }
}
for (const width of [320, 390, 820, 1024, 1280, 1440])
  await run(
    "Responsive " + width,
    async ({ page }) => {
      await page.goto(origin + "/dashboard");
      await page.getByText("Available to pay out", { exact: true }).waitFor();
      assert.equal(await page.locator("footer").count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: artifacts + "/dashboard-" + width + ".png", fullPage: true });
      await page.goto(origin + "/discover");
      await page.getByRole("region", { name: "Featured campaigns" }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.equal(await page.getByText("Hidden pending campaign", { exact: true }).count(), 0);
      await page.screenshot({ path: artifacts + "/discover-" + width + ".png", fullPage: true });
    },
    { width },
  );
await run(
  "New organizer quick start",
  async ({ page }) => {
    await page.goto(origin + "/dashboard");
    await page.getByRole("heading", { name: "Quick start guide" }).waitFor();
    assert.equal(await page.locator("main button[aria-expanded]").count(), 8);
    await page.getByRole("button", { name: "Add your payout account" }).click();
    const link = page.getByRole("link", { name: "Add account", exact: true });
    await link.waitFor({ state: "visible" });
    assert.equal(await link.getAttribute("href"), "/profile");
    assert.equal(await page.getByText("Prototype:", { exact: false }).count(), 0);
  },
  { empty: true },
);
await run("Scopes drafts and rejection", async ({ page, calls }) => {
  await page.goto(origin + "/dashboard");
  await page.getByText("Available to pay out", { exact: true }).waitFor();
  const selector = page.getByRole("button", { name: "View organization or personal campaigns" });
  await selector.click();
  await page.getByRole("menuitem", { name: "Personal campaigns", exact: true }).click();
  await page.getByText("Here's how your fundraising is doing.").waitFor();
  assert(calls.some((c) => c.path === "/me/dashboard" && c.query.organizationId === "personal"));
  await selector.click();
  await page.getByRole("menuitem", { name: "Saved ministry (draft)", exact: true }).click();
  await page.getByRole("link", { name: "Continue draft" }).first().waitFor();
  assert(
    (
      await page.getByRole("link", { name: "Continue draft" }).first().getAttribute("href")
    ).includes("draftId=org-draft"),
  );
});
await run(
  "Rejected organization honest progress",
  async ({ page }) => {
    await page.goto(origin + "/dashboard");
    await page.getByText("Review note: Please provide evidence").waitFor();
    assert.equal(await page.getByRole("button", { name: "Pay out now", exact: true }).count(), 0);
    await page
      .getByText("Payouts open once your organization and payout account are verified.")
      .waitFor();
    assert.equal(await page.getByText("We're reviewing your organization").count(), 0);
  },
  { rejected: true },
);
await run(
  "Thank-you failure and retry",
  async ({ page, calls, recover }) => {
    await page.goto(origin + "/dashboard");
    const button = page.getByRole("button", { name: "Thank QA Giver" });
    await button.click();
    await page.getByRole("alert").filter({ hasText: "Email queue unavailable" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Thank Anonymous Donor" }).count(), 0);
    recover();
    await button.click();
    await page.getByText("Thank-you queued", { exact: true }).waitFor();
    assert(await button.isDisabled());
    assert.equal(calls.filter((c) => c.path.endsWith("/thank-you")).length, 2);
  },
  { failThanks: true },
);
await run("Payout actual request no auto-transfer", async ({ page, calls }) => {
  await page.goto(origin + "/dashboard");
  const request = page.getByRole("button", { name: "Pay out now", exact: true });
  await request.waitFor();
  await request.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (NGN)").fill("10000");
  await dialog.getByLabel("Note (optional)").fill("School costs");
  await dialog.getByRole("button", { name: "Submit request" }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Payout requested" }).waitFor();
  const payload = calls.find((c) => c.path === "/me/payout-requests" && c.method === "POST").body;
  assert.equal(payload.amount, 10000);
  assert.equal(payload.organizationId, "org-1");
  assert(payload.requestId);
  assert(!calls.some((c) => c.path.includes("release") || c.path.includes("transfer")));
});
await run(
  "Payout history and account details stay accessible without expanding the source card",
  async ({ page, calls }) => {
    await page.goto(origin + "/dashboard");
    await page.getByRole("button", { name: "Pay out now", exact: true }).waitFor();
    assert.equal(
      await page.getByText("Requests need admin approval.", { exact: false }).count(),
      0,
    );
    await page.getByRole("button", { name: "Payout options", exact: true }).click();
    const details = page.getByRole("menuitem", { name: "View payout details", exact: true });
    assert.equal(await details.getAttribute("href"), "/manage/org/org-1#payouts");
    await page.getByRole("menuitem", { name: "View payout requests", exact: true }).click();
    await page.getByRole("dialog").getByText("No payout requests yet.", { exact: true }).waitFor();
    assert(!calls.some((call) => call.method === "POST"));
  },
);
await run(
  "Payout failure retains idempotent request ID and prevents duplicate submission",
  async ({ page, calls, recover }) => {
    await page.goto(origin + "/dashboard");
    await page.getByRole("button", { name: "Pay out now", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Amount (NGN)").fill("10000");
    await dialog.getByRole("button", { name: "Submit request", exact: true }).evaluate((button) => {
      button.click();
      button.click();
    });
    await dialog
      .getByRole("alert")
      .filter({ hasText: "Payout request temporarily unavailable" })
      .waitFor();
    const failed = calls.filter(
      (call) => call.path === "/me/payout-requests" && call.method === "POST",
    );
    assert.equal(failed.length, 1);
    recover();
    await dialog.getByRole("button", { name: "Submit request", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    const writes = calls.filter(
      (call) => call.path === "/me/payout-requests" && call.method === "POST",
    );
    assert.equal(writes.length, 2);
    assert.equal(writes[0].body.requestId, writes[1].body.requestId);
  },
  { failPayout: true },
);
await run(
  "Dashboard API error recovery",
  async ({ page, recover }) => {
    await page.goto(origin + "/dashboard");
    await page.getByRole("heading", { name: "We couldn't load your dashboard" }).waitFor();
    recover();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page.getByText("Available to pay out", { exact: true }).waitFor();
  },
  { failDashboard: true },
);
await run(
  "Mobile nav real logout",
  async ({ page, calls }) => {
    await page.goto(origin + "/dashboard");
    await page.getByText("Available to pay out", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Open menu" }).click();
    assert.equal(await page.locator("header nav:visible a").first().innerText(), "Discover");
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await page.waitForURL("**/login");
    assert.equal(calls.filter((c) => c.path === "/auth/logout" && c.method === "POST").length, 1);
  },
  { width: 390 },
);
await run(
  "Logout failure retains session",
  async ({ page }) => {
    await page.goto(origin + "/dashboard");
    await page.getByText("Available to pay out", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await page.getByText("Could not log out. Please try again.").waitFor();
    assert(new URL(page.url()).pathname === "/dashboard");
  },
  { width: 390, failLogout: true },
);
await run(
  "URL filters search category sort pagination",
  async ({ page, calls }) => {
    await page.goto(origin + "/discover?view=regular&cause=Education&q=mission");
    await page.locator("article").first().waitFor();
    assert(
      calls.some(
        (c) =>
          c.path === "/campaigns/discover" &&
          c.query.view === "regular" &&
          c.query.faithCategory === "EDUCATION" &&
          c.query.search === "mission",
      ),
    );
    await page.getByLabel("Search causes").fill("school");
    await page.waitForFunction(() => new URL(location.href).searchParams.get("q") === "school");
    await page.getByRole("combobox", { name: "Sort by" }).selectOption("givers");
    await page.waitForTimeout(150);
    assert(calls.some((c) => c.query.sort === "givers"));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText("Second page campaign", { exact: true }).waitFor();
    assert(calls.some((c) => c.query.page === "2"));
    await page.getByRole("tab", { name: "Church Building", exact: true }).click();
    await page.waitForTimeout(150);
    assert.equal(new URL(page.url()).searchParams.get("page"), null);
  },
  { pagination: true },
);
await run("Organizations verified only and link", async ({ page }) => {
  await page.goto(origin + "/discover?view=orgs");
  await page.getByRole("heading", { name: org.name }).waitFor();
  assert.equal(await page.getByText("Hidden pending org", { exact: true }).count(), 0);
  assert.equal(
    await page
      .locator("a")
      .filter({ has: page.getByRole("heading", { name: org.name }) })
      .getAttribute("href"),
    "/org/org-1",
  );
});
await run(
  "Discovery empty and API error recovery",
  async ({ page, recover }) => {
    await page.goto(origin + "/discover?view=new");
    await page.getByRole("alert").waitFor();
    recover();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.locator("article").first().waitFor();
    await page.getByLabel("Search causes").fill("nothing");
    await page.getByText("Nothing matches yet", { exact: true }).waitFor();
  },
  { failDiscover: true },
);
await run(
  "Guest browsing and signed-out dashboard gate",
  async ({ page, calls }) => {
    await page.goto(origin + "/discover?view=regular");
    await page.locator("article").first().waitFor();
    assert.equal(await page.getByText(user.fullName, { exact: true }).count(), 0);
    await page.goto(origin + "/dashboard");
    await page.waitForURL(origin + "/");
    assert(!calls.some((c) => c.path === "/me/dashboard"));
  },
  { guest: true },
);
await run("Carousel and clipboard success failure", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(origin + "/discover");
  const featured = page.getByRole("region", { name: "Featured campaigns" });
  await featured.waitFor();
  await featured.getByRole("button", { name: "Next", exact: true }).click();
  await featured.getByRole("heading", { name: second.title }).waitFor();
  assert(
    (await featured.getByRole("link", { name: "Give now" }).getAttribute("href")).startsWith(
      "/donate/campaign-2",
    ),
  );
  const copy = page.getByRole("button", { name: "Copy campaign link" }).first();
  await copy.click();
  await page.getByText("Campaign link copied", { exact: true }).waitFor();
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes("/campaign/"));
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await copy.click();
  await page.getByText("Could not copy the link. Please try again.", { exact: true }).waitFor();
});
await browser.close();
console.log("Passed " + passed + " checks");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
