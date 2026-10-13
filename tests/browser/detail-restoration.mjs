import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221";
const api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-details-qa";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const user = {
  id: "viewer",
  fullName: "QA Giver",
  email: "giver@example.invalid",
  isVerified: true,
  role: "donor",
  status: "active",
};
const org = {
  id: "org",
  ownerId: "owner",
  name: "Riverlight Gospel Mission",
  category: "other",
  otherCategoryLabel: "Community ministry",
  location: "Ibadan, Oyo",
  denomination: "",
  founded: "2019",
  tagline: "Hope for our community",
  bio: "Organization fixture",
  photos: [
    "https://fixture.invalid/one.svg",
    "https://fixture.invalid/two.svg",
    "https://fixture.invalid/three.svg",
  ],
  links: ["https://riverlight.example.invalid", "javascript:alert(1)"],
  registrationDocuments: ["https://private.example.invalid/registration.pdf"],
  campaignIds: ["cause"],
  verificationStatus: "verified",
  isPublic: true,
  isDraft: false,
  totalReceived: 10000,
  supporters: 1,
  campaignCount: 1,
};
const campaign = {
  id: "cause",
  ownerId: "owner",
  orgId: "org",
  title: "Support Riverlight Gospel Mission",
  story: "Our community work reaches families through practical support.",
  mode: "ongoing",
  type: "money",
  faithCategory: "Missions & Outreach",
  currency: "NGN",
  location: "Ibadan, Oyo",
  raiser: {
    name: "Riverlight Organizer",
    location: "Ibadan",
    avatar: "https://fixture.invalid/avatar.svg",
  },
  cover: org.photos[0],
  gallery: org.photos,
  goal: 100000,
  raised: 10000,
  donors: 1,
  frequencies: ["monthly", "weekly"],
  urgency: "low",
  verificationStatus: "verified",
  isPublic: true,
  isDraft: false,
  createdAt: "2026-10-01",
  viewerDonationTotal: 5000,
  needs: ["School supplies"],
  updates: [
    {
      id: "update-1",
      title: "Community progress",
      body: "Our first distribution is complete.",
      date: "2026-10-02",
    },
  ],
  comments: [
    {
      id: "comment-1",
      author: "Anonymous Donor",
      avatar: "",
      body: "Praying for the work",
      date: "2026-10-02",
    },
  ],
  donations: [
    {
      id: "gift",
      donor: "Anonymous Donor",
      amount: 10000,
      date: "2026-10-02",
      note: "Thank you for your work",
    },
  ],
};
const checkout = {
  currency: "NGN",
  platformFeePercent: 4,
  minDonation: 500,
  maxDonation: 100000,
  frequencies: ["MONTHLY", "WEEKLY"],
  recurringGift: null,
};
let passes = 0;
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
    viewport: { width: options.width ?? 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage(),
    errors = [],
    requests = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /TypeError:|ReferenceError:/.test(message.text()))
      errors.push(message.text());
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          if (window.failClipboard) throw Error("Denied");
          window.copied = text;
        },
      },
      configurable: true,
    });
  });
  await context.route("https://fixture.invalid/**", (route) =>
    options.brokenPhotos
      ? route.fulfill({ status: 404, body: "Not found" })
      : route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#a7b9a1"/></svg>',
        }),
  );
  await context.route("https://accounts.google.com/**", (route) => route.abort());
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  let cause = { ...campaign, ...options.campaign },
    organization = { ...org, ...options.org },
    liked = false,
    count = 0,
    failed = Boolean(options.failure);
  await context.route(api + "/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method();
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    requests.push({ path, method, body: request.postData() ? request.postDataJSON() : null });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      status = options.authenticated ? 200 : 401;
      data = options.authenticated
        ? { user: { ...user, ...options.user } }
        : { message: "Unauthorized" };
    } else if (path === "/me/notifications") data = { items: [], unreadCount: 0, total: 0 };
    else if (path === "/campaigns/cause/comments/reactions")
      data = [{ id: "comment-1", count, liked }];
    else if (path.endsWith("/comment-1/reaction")) {
      liked = request.postDataJSON().liked;
      count = liked ? 1 : 0;
      data = { liked, count };
    } else if (path === "/campaigns/cause/comments" && method === "POST") {
      const c = {
        id: "new-comment",
        author: user.fullName,
        avatar: "",
        body: request.postDataJSON().body,
        date: "2026-10-12",
      };
      cause = { ...cause, comments: [...cause.comments, c] };
      data = c;
    } else if (path === "/campaigns/cause/checkout") {
      status = options.checkoutStatus ?? 200;
      data =
        status === 200 ? { ...checkout, ...options.checkout } : { message: "Giving unavailable" };
    } else if (path === "/campaigns/cause") {
      status = failed ? 503 : (options.status ?? 200);
      data = status === 200 ? cause : { message: "Unavailable" };
    } else if (path === "/organizations/org") {
      status = options.orgStatus ?? 200;
      data = status === 200 ? { ...organization, campaigns: [cause] } : { message: "Unavailable" };
    } else if (path === "/media/cloudinary/status") data = { enabled: true };
    else if (path.endsWith("/payout-account")) data = null;
    else if (path.endsWith("/payout-summary"))
      data = {
        totalCollected: 0,
        totalPlatformFees: 0,
        totalNetCollected: 0,
        totalReleased: 0,
        availableBalance: 0,
        recentTransfers: [],
      };
    else if (path === "/me/payout-banks") data = [];
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
      requests,
      recover: () => {
        failed = false;
      },
    });
    assert.deepEqual(errors, [], errors.join("; "));
    passes++;
    console.log("PASS " + name);
  } catch (error) {
    console.error({ name, errors, body: (await page.locator("body").innerText()).slice(0, 1200) });
    throw error;
  } finally {
    await context.close();
  }
}
try {
  for (const width of [320, 390, 820, 1440]) {
    await run(
      `Campaign source layout ${width}px: gallery, encouragement, giving`,
      async ({ page }) => {
        await page.goto(origin + "/campaign/cause");
        await page.getByRole("heading", { name: campaign.title, exact: true }).waitFor();
        await page.getByRole("heading", { name: "Words of encouragement", exact: true }).waitFor();
        const panel = page.locator("main aside");
        assert.equal(await panel.isVisible(), width >= 1024);
        await page.getByRole("button", { name: "Next photo", exact: true }).click();
        await page.getByText("2 / 3", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Enlarge photo", exact: true }).click();
        await page.getByRole("dialog").waitFor();
        await page.getByRole("button", { name: "Next enlarged photo" }).click();
        await page.getByRole("dialog").getByText("3 / 3", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Close", exact: true }).click();
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.screenshot({ path: out + `/campaign-${width}.png`, fullPage: true });
      },
      { width },
    );
    await run(
      `Organization source layout ${width}px: mosaic, campaigns, giving`,
      async ({ page }) => {
        await page.goto(origin + "/org/org");
        await page.getByRole("heading", { name: new RegExp(org.name), level: 1 }).waitFor();
        await page.getByText("Community ministry", { exact: true }).waitFor();
        assert.equal(await page.getByText(/registration.pdf/).count(), 0);
        assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
        await page.getByRole("button", { name: "Enlarge organization photo 2" }).click();
        await page.getByRole("dialog").getByText("2 / 3", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Close", exact: true }).click();
        const joins = page.getByRole("link", { name: "Join", exact: true });
        await joins.first().waitFor();
        assert.equal(await joins.count(), 3);
        const dest = new URL(await joins.first().getAttribute("href"), origin);
        assert.equal(dest.pathname, "/donate/cause");
        assert.equal(dest.searchParams.get("freq"), "monthly");
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.screenshot({ path: out + `/organization-${width}.png`, fullPage: true });
      },
      { width },
    );
  }
  await run(
    "Campaign giving uses selection, configured limits and guest recurring return path",
    async ({ page }) => {
      await page.goto(origin + "/campaign/cause");
      const box = page.locator("main aside");
      await box.getByRole("radio", { name: "Monthly", exact: true }).click();
      await box.getByRole("radio", { name: /₦25,000/ }).click();
      await box.getByRole("button", { name: /^Give ₦25,000/ }).click();
      await page.waitForURL(/\/login\?/);
      const target = new URL(new URL(page.url()).searchParams.get("returnTo"), origin);
      assert.equal(target.pathname, "/donate/cause");
      assert.equal(target.searchParams.get("amount"), "25000");
      assert.equal(target.searchParams.get("freq"), "monthly");
      await page.goto(origin + "/campaign/cause");
      await box.getByRole("radio", { name: "One time", exact: true }).click();
      await box
        .getByRole("textbox", { name: "Another amount" })
        .count()
        .then((count) => assert.equal(count, 0));
      await box.getByRole("spinbutton", { name: "Another amount" }).fill("100.50");
      assert.equal(
        await box.getByRole("button", { name: "Enter a valid gift amount" }).isDisabled(),
        true,
      );
      await box.getByRole("spinbutton", { name: "Another amount" }).fill("12000");
      await box.getByRole("button", { name: /^Give ₦12,000/ }).click();
      await page.waitForURL(/\/donate\/cause\?/);
    },
  );
  await run(
    "Real comment and like writes, donor impact and canonical sharing",
    async ({ page, requests }) => {
      await page.goto(origin + "/campaign/cause?amount=999&reference=private");
      await page.getByText(/You've given ₦5,000/).waitFor();
      await page.getByRole("button", { name: "Like comment", exact: true }).click();
      await page.getByRole("button", { name: "Unlike comment", exact: true }).waitFor();
      assert.deepEqual(requests.find((r) => r.path.endsWith("/reaction")).body, { liked: true });
      await page
        .getByLabel("Add a comment", { exact: true })
        .fill("Thank you for serving the community.");
      await page.getByRole("button", { name: "Post comment", exact: true }).click();
      await page.getByText("Thank you for serving the community.", { exact: true }).waitFor();
      assert.equal(
        requests.filter((r) => r.path === "/campaigns/cause/comments" && r.method === "POST")
          .length,
        1,
      );
      await page
        .getByRole("button", { name: "Share this campaign", exact: true })
        .filter({ visible: true })
        .click();
      assert.equal(await page.evaluate(() => window.copied), origin + "/campaign/cause");
      await page.evaluate(() => {
        window.failClipboard = true;
      });
      await page
        .getByRole("button", { name: "Share this campaign", exact: true })
        .filter({ visible: true })
        .click();
      await page.getByText(/Could not share this link/).waitFor();
    },
    { authenticated: true },
  );
  await run(
    "Pending owner preview blocks giving but retains owner editing",
    async ({ page, requests }) => {
      await page.goto(origin + "/campaign/cause");
      await page.getByText(/Campaign preview. This campaign is not available/).waitFor();
      assert.equal(await page.getByRole("button", { name: "Give now", exact: true }).count(), 0);
      assert.equal(requests.filter((r) => r.path.endsWith("/checkout")).length, 0);
      await page.getByRole("button", { name: "Manage campaign", exact: true }).click();
      await page.getByRole("button", { name: "Back to campaign preview" }).waitFor();
      await page.getByRole("button", { name: "Back to campaign preview" }).click();
      await page.getByRole("heading", { name: campaign.title, exact: true }).waitFor();
    },
    {
      authenticated: true,
      user: { id: "owner" },
      campaign: { isPublic: false, verificationStatus: "pending" },
    },
  );
  await run(
    "Pending organization, unsupported monthly support and private documents are not donor actions",
    async ({ page }) => {
      await page.goto(origin + "/org/org");
      await page.getByText(/Organization preview. This organization is not public/).waitFor();
      assert.equal(await page.getByRole("link", { name: "Join", exact: true }).count(), 0);
      assert.equal(await page.getByText("Give to " + org.name, { exact: true }).count(), 0);
      await page.getByRole("button", { name: "Manage organization", exact: true }).click();
      await page.getByRole("button", { name: "Back to organization preview" }).waitFor();
    },
    {
      authenticated: true,
      user: { id: "owner" },
      org: { isPublic: false, verificationStatus: "pending" },
    },
  );
  await run(
    "Weekly-only campaign never advertises a monthly tier",
    async ({ page }) => {
      await page.goto(origin + "/org/org");
      await page.getByRole("heading", { name: new RegExp(org.name), level: 1 }).waitFor();
      assert.equal(await page.getByRole("link", { name: "Join", exact: true }).count(), 0);
    },
    { campaign: { frequencies: ["weekly"] }, checkout: { frequencies: ["WEEKLY"] } },
  );
  await run(
    "API failures recover, and broken images use fallback without crashing",
    async ({ page, recover }) => {
      await page.goto(origin + "/campaign/cause");
      await page.getByRole("heading", { name: "We couldn't load this right now" }).waitFor();
      recover();
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByRole("heading", { name: campaign.title, exact: true }).waitFor();
      await page.waitForFunction(
        () => document.querySelector('img[data-fallback="true"]')?.naturalWidth > 0,
      );
    },
    { failure: true, brokenPhotos: true },
  );
  await run(
    "Unavailable giving settings disable checkout, never use prototype defaults",
    async ({ page }) => {
      await page.goto(origin + "/campaign/cause");
      const box = page.locator("main aside");
      await box.getByText(/Giving options could not load/).waitFor();
      assert.equal(await box.getByRole("button", { name: /^Give ₦/ }).isDisabled(), true);
    },
    { checkoutStatus: 503 },
  );
  console.log(`Detail restoration: ${passes} browser cases passed; isolated fixtures only.`);
} finally {
  await browser.close();
}
