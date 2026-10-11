import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18080",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
let passed = 0;
async function assertActionAlignment(page, primaryName, secondaryName) {
  const primary = page.getByRole("link", { name: primaryName, exact: true });
  const secondary = page.getByRole("link", { name: secondaryName, exact: true });
  const metrics = await Promise.all(
    [primary, secondary].map((link) =>
      link.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element.firstChild);
        const text = range.getBoundingClientRect();
        return { top: box.top, height: box.height, textCenter: text.top + text.height / 2 };
      }),
    ),
  );
  for (const metric of metrics) {
    assert.ok(metric.height >= 44, "Actions need at least a 44px touch target");
    assert.ok(
      Math.abs(metric.textCenter - (metric.top + metric.height / 2)) <= 3,
      "Action text must be vertically centered",
    );
  }
  if (Math.abs(metrics[0].top - metrics[1].top) < 3) {
    assert.ok(
      Math.abs(metrics[0].textCenter - metrics[1].textCenter) <= 2,
      "Side-by-side action labels must align",
    );
    assert.ok(
      Math.abs(metrics[0].height - metrics[1].height) <= 1,
      "Side-by-side actions must have matching heights",
    );
  }
}
async function run(name, fn, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let failing = false;
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await context.route("https://accounts.google.com/**", (route) => route.abort());
  await context.route(`${api}/**`, async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      headers = {
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-allow-headers": "content-type",
      };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      status = 401;
      data = { message: "Unauthorized" };
    } else if (path === "/campaigns/discover")
      data = { items: [], total: 0, page: 1, pageSize: 6, hasMore: false };
    else if (path === "/public/giving") {
      status = failing ? 503 : 200;
      data = failing
        ? { message: "Service unavailable" }
        : {
            since: "2026-10-04",
            until: "2026-10-11",
            totals: { given: 10000, gifts: 1, organizations: 2 },
            locations: [
              { location: "Ibadan, Oyo", given: 10000, gifts: 1, organizations: 1 },
              { location: "Location unspecified", given: 0, gifts: 0, organizations: 1 },
            ],
          };
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
      fail: () => {
        failing = true;
      },
      recover: () => {
        failing = false;
      },
    });
    assert.deepEqual(errors, []);
    passed++;
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}
try {
  for (const width of [320, 390, 820, 1440])
    await run(
      `Public landing navigation and real aggregates ${width}px`,
      async ({ page }) => {
        await page.goto(origin);
        await page.getByRole("heading", { name: /You give in faith/ }).waitFor();
        await page.getByText("₦10,000", { exact: true }).waitFor();
        await assertActionAlignment(page, "Start giving", "See how it works");
        await assertActionAlignment(page, "Find a cause", "Register your organization");
        await page.getByRole("button", { name: "Do I need an account to donate?" }).click();
        await page.getByText(/One-time giving is available to guests/).waitFor();
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.getByRole("link", { name: "Open giving", exact: true }).click();
        await page.waitForURL(`${origin}/map`);
        await page.getByLabel("View state").selectOption("OY");
        await page.getByText("₦10,000", { exact: true }).waitFor();
        await page.getByLabel("View state").selectOption("other");
        await page.getByText("₦0", { exact: true }).waitFor();
      },
      width,
    );
  await run(
    "Story and about guides navigate to live screens without invented case-study totals",
    async ({ page }) => {
      await page.goto(`${origin}/story`);
      await page.getByRole("heading", { name: "You give in faith. See the journey." }).waitFor();
      assert.equal(await page.getByText(/₦35 million/).count(), 0);
      await page.goto(`${origin}/about`);
      await page.getByRole("heading", { name: "About AzarFaith" }).waitFor();
      await page
        .getByRole("article")
        .getByRole("link", { name: "Discover causes", exact: true })
        .click();
      await page.waitForURL(`${origin}/discover`);
    },
  );
  await run(
    "Map outage stays visible and offers retry, not fake zero totals",
    async ({ page, fail, recover }) => {
      fail();
      await page.goto(`${origin}/map`);
      await page.getByRole("heading", { name: "We couldn't load this right now" }).waitFor();
      assert.equal(await page.getByText("₦0", { exact: true }).count(), 0);
      recover();
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByText("₦10,000", { exact: true }).waitFor();
    },
  );
  console.log(`Public features: ${passed} browser checks passed; isolated HTTP fixtures only.`);
} finally {
  await browser.close();
}
