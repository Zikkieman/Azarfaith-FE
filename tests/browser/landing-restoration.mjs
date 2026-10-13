import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221";
const api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const photo =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%23dedbe2"/></svg>';
const campaign = {
  id: "qa-live-campaign",
  ownerId: "qa-owner",
  isPublic: true,
  isDraft: false,
  verificationStatus: "verified",
  mode: "one-time",
  type: "money",
  title: "QA published outreach",
  story: "A fixture campaign, not a real donation destination.",
  faithCategory: "Missions & Outreach",
  raiser: { name: "QA mission", avatar: photo, location: "Ibadan, Oyo" },
  cover: photo,
  gallery: [photo],
  goal: 50000,
  raised: 12345,
  donors: 1,
  currency: "NGN",
  location: "Ibadan, Oyo",
  urgency: "low",
  createdAt: "2026-10-01T00:00:00.000Z",
  updates: [],
  comments: [],
  donations: [],
};
const org = {
  id: "qa-org",
  ownerId: "qa-owner",
  isPublic: true,
  isDraft: false,
  verificationStatus: "verified",
  name: "QA published mission",
  tagline: "Serving local families",
  category: "mission",
  location: "Ibadan, Oyo",
  denomination: "Interdenominational",
  founded: "2020",
  bio: "A fixture organization.",
  photos: [photo],
  links: [],
  registrationDocuments: [],
  campaignIds: [campaign.id],
  totalReceived: 12345,
  supporters: 1,
  campaignCount: 1,
};
const overview = {
  since: "2026-10-05T00:00:00.000Z",
  until: "2026-10-12T00:00:00.000Z",
  totals: { given: 12345, gifts: 1, organizations: 1 },
  locations: [{ location: "Ibadan, Oyo", given: 12345, gifts: 1, organizations: 1 }],
};
let passed = 0;
async function run(
  name,
  fn,
  { width = 1440, role = null, live = false, failed = false, motion = "reduce" } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: motion,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage(),
    errors = [],
    requests = [];
  let failure = failed;
  page.on("pageerror", (e) => errors.push(e.message));
  // Functional checks do not depend on third-party image availability. Visual comparisons use real images.
  await context.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#dedbe2"/></svg>',
    }),
  );
  await context.route("https://accounts.google.com/**", (route) => route.abort());
  await context.route(`${api}/**`, async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    requests.push({ path, method: request.method() });
    let status = 200,
      body = {};
    if (path === "/auth/session") {
      status = role ? 200 : 401;
      body = role
        ? {
            user: {
              id: "qa-user",
              fullName: "QA user",
              email: "qa@example.invalid",
              role,
              status: "active",
              isVerified: true,
              phone: null,
            },
          }
        : { message: "Unauthorized" };
    } else if (path === "/campaigns/discover")
      body = {
        items: live
          ? [
              campaign,
              {
                ...campaign,
                id: "qa-pending",
                title: "Do not publish this pending campaign",
                verificationStatus: "pending",
              },
            ]
          : [],
        total: live ? 2 : 0,
        page: 1,
        pageSize: 6,
        hasMore: false,
      };
    else if (path === "/organizations/discover")
      body = {
        items: live ? [org] : [],
        total: live ? 1 : 0,
        page: 1,
        pageSize: 6,
        hasMore: false,
      };
    else if (path === "/public/giving") {
      status = failure ? 503 : 200;
      body = failure ? { message: "QA temporary outage" } : overview;
    } else if (path === "/auth/logout") body = { message: "Signed out" };
    else {
      status = 404;
      body = { message: "Unconfigured isolated fixture" };
    }
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  try {
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.classList.contains("js"));
    await fn({
      page,
      requests,
      recover: () => {
        failure = false;
      },
    });
    assert.deepEqual(errors, [], `${name}: browser runtime errors`);
    passed++;
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}
try {
  for (const width of [320, 390, 820, 1440]) {
    await run(
      `Original sections, FAQ, mobile menu and live totals at ${width}px`,
      async ({ page }) => {
        for (const name of [
          /You give in faith/,
          "Watch giving land across Nigeria.",
          "How giving works",
          "In their own words",
          "Featured campaigns",
          "Frequently asked questions",
          "Ready to give with confidence?",
        ])
          assert.ok(
            await page.getByRole("heading", { name }).count(),
            `Missing original section: ${name}`,
          );
        await page.getByText(/Totals show confirmed gifts/).waitFor();
        assert.equal(await page.getByText(/More than ₦35 million/).count(), 0);
        await page
          .getByRole("button", {
            name: "Does my giving carry over every year, or does it restart each time?",
          })
          .click();
        assert.equal(
          await page
            .getByRole("button", {
              name: "Does my giving carry over every year, or does it restart each time?",
            })
            .getAttribute("aria-expanded"),
          "true",
        );
        if (width < 1024) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.locator("header").getByRole("link", { name: "AzarFaith home" }).focus();
          await page.getByRole("button", { name: "Open menu" }).click();
          await page
            .locator("header")
            .getByRole("link", { name: "Log in", exact: true })
            .last()
            .click();
          await page.waitForURL("**/login");
          await page.locator('input[type="password"]').waitFor();
          await page.goto(origin, { waitUntil: "domcontentloaded" });
          await page.waitForFunction(() => document.documentElement.classList.contains("js"));
        }
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
      },
      { width },
    );
  }
  await run(
    "Published backend cards keep real detail, checkout and share destinations",
    async ({ page, requests }) => {
      const card = page
        .locator("article")
        .filter({ has: page.getByRole("heading", { name: campaign.title }) })
        .last();
      await card.waitFor();
      assert.equal(await page.getByText("Do not publish this pending campaign").count(), 0);
      assert.equal(await card.getByText("Design preview", { exact: true }).count(), 0);
      assert.equal(
        await card.getByRole("link", { name: /Give/ }).getAttribute("href"),
        "/donate/qa-live-campaign?freq=",
      );
      assert.equal(
        await card.getByRole("link", { name: campaign.title }).getAttribute("href"),
        "/campaign/qa-live-campaign",
      );
      await page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text) => {
              window.qaCopied = text;
            },
          },
        });
      });
      await card.getByRole("button", { name: "Copy campaign link" }).click();
      assert.equal(
        await page.evaluate(() => window.qaCopied),
        `${origin}/campaign/qa-live-campaign`,
      );
      assert.ok(requests.some((r) => r.path === "/campaigns/discover"));
      assert.ok(requests.every((r) => r.method === "GET"));
    },
    { live: true },
  );
  await run(
    "Approved samples are labelled and cannot donate through prototype IDs",
    async ({ page, requests }) => {
      const cards = page.locator("article").filter({ hasText: "Design preview" });
      assert.ok((await cards.count()) >= 3);
      for (const card of await cards.all())
        assert.equal(
          await card.getByRole("link", { name: /Give/ }).getAttribute("href"),
          "/discover",
        );
      await cards.last().getByRole("button", { name: "Copy campaign link" }).click();
      await page
        .getByText("This is a design preview. Open Discover to share a published campaign.")
        .waitFor();
      assert.ok(requests.every((r) => r.method === "GET"));
    },
  );
  await run(
    "Giving API outage offers retry and sample totals are replaced on recovery",
    async ({ page, recover }) => {
      await page.getByText(/Design preview: map figures/).waitFor();
      await page.getByRole("button", { name: "Retry giving totals" }).waitFor();
      recover();
      await page.getByRole("button", { name: "Retry giving totals" }).click();
      await page.getByText(/Totals show confirmed gifts/).waitFor();
      assert.equal(await page.getByText(/More than ₦35 million/).count(), 0);
    },
    { failed: true },
  );
  await run(
    "Newsletter and social placeholders report missing integration, not fake success",
    async ({ page, requests }) => {
      await page.locator("#footer-email").fill("qa@example.invalid");
      await page.getByRole("button", { name: "Subscribe", exact: true }).click();
      await page
        .getByText("Newsletter subscriptions are not connected yet. Your email has not been saved.")
        .waitFor();
      await page.getByRole("link", { name: "LinkedIn", exact: true }).click();
      await page.getByText("The official LinkedIn URL has not been supplied yet.").waitFor();
      assert.ok(requests.every((r) => r.method === "GET"));
      await page.getByRole("link", { name: "Read donor stories", exact: true }).click();
      await page.waitForURL("**/donor-stories");
      await page.getByText(/Design preview: this page/).waitFor();
    },
  );
  await run(
    "Every footer resource link opens a real guide or an explicit preview, never a 404",
    async ({ page }) => {
      const links = await page
        .locator('footer a[href^="/"]')
        .evaluateAll((elements) => [
          ...new Set(elements.map((element) => element.getAttribute("href"))),
        ]);
      for (const href of links.filter((href) => href !== "/login" && !href.startsWith("/signup"))) {
        await page.goto(`${origin}${href}`, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { level: 1 }).first().waitFor();
        assert.equal(
          await page.getByRole("heading", { name: "Page not found", exact: true }).count(),
          0,
          href,
        );
        assert.equal(
          await page.getByRole("heading", { name: "This page didn't load", exact: true }).count(),
          0,
          href,
        );
        assert.ok(await page.getByRole("heading", { level: 1 }).count(), href);
      }
    },
  );
  for (const role of ["donor", "platform_admin"])
    await run(
      `Real ${role} session controls dashboard route and logout`,
      async ({ page, requests }) => {
        const dashboard = page.locator("header").getByRole("link", { name: /Go to dashboard/ });
        await dashboard.waitFor();
        assert.equal(
          await dashboard.getAttribute("href"),
          role === "platform_admin" ? "/admin" : "/dashboard",
        );
        await page.locator("footer").getByRole("button", { name: "Log out" }).click();
        await page.waitForURL("**/login");
        assert.ok(requests.some((r) => r.path === "/auth/logout" && r.method === "POST"));
      },
      { role },
    );
  await run(
    "Normal-motion hero, cycling word and pinned sections mount without errors",
    async ({ page }) => {
      assert.equal(await page.locator(".h-\\[280vh\\]").count(), 1);
      await page.evaluate(() => window.scrollTo(0, innerHeight * 1.8));
      await page.waitForTimeout(1000);
      await page
        .getByRole("heading", { name: "Watch giving land across Nigeria." })
        .evaluate((el) => el.scrollIntoView());
      await page.waitForTimeout(600);
      assert.ok(await page.locator("[data-shown]").count());
    },
    { motion: "no-preference", live: true },
  );
  console.log(
    `Landing: ${passed} browser checks passed using isolated fixtures; no database/payment writes.`,
  );
} finally {
  await browser.close();
}
