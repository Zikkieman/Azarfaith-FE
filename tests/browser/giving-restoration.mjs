import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000",
  out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-giving-qa";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const user = {
  id: "giver",
  fullName: "QA Giver",
  email: "giver@example.invalid",
  isVerified: true,
  role: "donor",
  status: "active",
};
const gift = {
  id: "regular-1",
  donorId: user.id,
  targetId: "cause",
  targetName: "Riverlight Mission Support",
  targetCover: "",
  amount: 10000,
  frequency: "monthly",
  mode: "auto",
  status: "on_track",
  nextDate: "2030-11-01T12:00:00Z",
  createdAt: "2026-09-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
  frequencies: ["weekly", "monthly"],
  minDonation: 500,
  maxDonation: 100000,
  platformFeePercent: 4,
  hasPendingPayment: false,
  missedCount: 0,
  retryCount: 0,
  authorizationId: "card-1",
  active: true,
};
const cards = [
  {
    id: "card-1",
    active: true,
    reusable: true,
    label: "Visa ending 1234",
    linkedRecurringGiftCount: 1,
  },
  {
    id: "card-2",
    active: true,
    reusable: true,
    label: "Mastercard ending 5678",
    linkedRecurringGiftCount: 0,
  },
];
const paid = {
  id: "paid-1",
  campaignId: "cause",
  campaignTitle: gift.targetName,
  organizationName: "Riverlight Gospel Mission",
  amount: 10000,
  platformFee: 400,
  tipAmount: 0,
  totalCharged: 10400,
  status: "succeeded",
  donorDisplayName: user.fullName,
  isAnonymous: false,
  frequency: "monthly",
  reference: "qa-ref-1",
  createdAt: "2026-10-01T12:00:00Z",
  paidAt: "2026-10-02T12:00:00Z",
};
let passed = 0;
const failures = [];
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
      viewport: { width: options.width ?? 1440, height: 1000 },
      reducedMotion: "reduce",
      acceptDownloads: true,
    }),
    page = await context.newPage(),
    errors = [],
    calls = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await context.route("https://fonts.gstatic.com/**", (r) => r.abort());
  let gifts = options.empty
    ? []
    : [
        { ...gift, ...options.gift },
        {
          ...gift,
          id: "paused-1",
          targetName: "Paused Education Gift",
          status: "paused",
          active: false,
        },
        {
          ...gift,
          id: "stopped-1",
          targetName: "Stopped Community Gift",
          status: "cancelled",
          active: false,
        },
      ];
  let history = options.empty
    ? []
    : [
        paid,
        {
          ...paid,
          id: "failed-1",
          campaignTitle: "Failed Payment",
          status: "failed",
          frequency: null,
          reference: "qa-failed",
        },
        {
          ...paid,
          id: "paid-2",
          campaignTitle: "School Hall",
          campaignId: "hall",
          amount: 15000,
          totalCharged: 15600,
          reference: "qa-ref-2",
        },
      ];
  let fail = options.failure,
    failRead = options.failRead,
    receiptFail = options.receiptFail;
  await context.route(api + "/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method(),
      headers = {
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
    else if (path === "/me/recurring-gifts" && method === "GET") {
      if (options.sessionDelay) await new Promise((r) => setTimeout(r, options.sessionDelay));
      if (failRead) {
        status = 503;
        data = { message: "Giving temporarily unavailable" };
      } else data = gifts;
    } else if (path.startsWith("/me/recurring-gifts/") && method === "PATCH") {
      if (fail) {
        status = options.conflict ? 409 : 503;
        data = {
          message: options.conflict
            ? "Gift changed elsewhere. Refresh and try again."
            : "Change temporarily unavailable",
        };
      } else {
        await new Promise((r) => setTimeout(r, options.actionDelay ?? 120));
        const parts = path.split("/"),
          id = parts[3],
          action = parts[4],
          g = gifts.find((g) => g.id === id);
        if (action === "pause") {
          g.status = "paused";
          g.active = false;
        } else if (action === "resume") {
          g.status = "on_track";
          g.active = true;
        } else if (action === "cancel") {
          g.status = "cancelled";
          g.active = false;
          g.cancellationReason = body.reason;
        } else if (action === "skip") g.nextDate = "2030-12-01T12:00:00Z";
        else if (action === "payment-method") g.authorizationId = body.authorizationId;
        else {
          g.amount = body.amount;
          g.frequency = body.frequency.toLowerCase();
        }
        g.updatedAt = "2026-10-12T12:00:00Z";
        data = { message: "Gift updated", nextDate: g.nextDate };
      }
    } else if (path === "/me/donations") data = history;
    else if (path.startsWith("/me/donations/")) {
      const row = history.find((h) => h.id === path.split("/").at(-1));
      if (receiptFail) {
        status = 503;
        data = { message: "Receipt temporarily unavailable" };
      } else
        data = {
          ...row,
          donorName: user.fullName,
          paymentMethod: "CARD",
          receipt: { donorName: user.fullName },
        };
    } else if (path === "/me/payment-methods") data = cards;
    else if (path === "/me/dashboard")
      data = {
        fullName: user.fullName,
        organizations: [],
        selectedOrganization: null,
        giving: { lifetime: 0, thisMonth: 0, campaignsSupported: 0, activeRecurring: 0 },
        overview: {
          totalReceived: 0,
          thisMonthReceived: 0,
          giftsReceived: 0,
          recurringSupporters: 0,
          liveCampaigns: 0,
          pendingCampaigns: 0,
        },
        campaigns: [],
        recentGifts: [],
        payout: { availableBalance: 0, account: null },
      };
    else if (path.endsWith("/discover"))
      data = { items: [], total: 0, page: 1, pageSize: 12, hasMore: false };
    else if (path === "/public/giving") data = { total: 0, byState: [], recent: [] };
    else if (path === "/campaigns/cause")
      data = {
        id: "cause",
        ownerId: "owner",
        orgId: "org",
        title: gift.targetName,
        story: "QA fixture",
        mode: "ongoing",
        type: "money",
        faithCategory: "Education",
        raiser: { name: "QA Mission", avatar: "", location: "Ibadan" },
        cover: "",
        gallery: [],
        location: "Ibadan",
        raised: 0,
        donors: 0,
        urgency: "low",
        frequencies: ["weekly", "monthly"],
        verificationStatus: "verified",
        isPublic: true,
        isDraft: false,
        createdAt: "2026-10-01",
        updates: [],
        comments: [],
        donations: [],
      };
    else if (path === "/campaigns/cause/checkout")
      data = {
        currency: "NGN",
        platformFeePercent: 4,
        minDonation: 500,
        maxDonation: 100000,
        frequencies: ["WEEKLY", "MONTHLY"],
        recurringGift: null,
      };
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
        fail = false;
        failRead = false;
        receiptFail = false;
      },
    });
    assert.deepEqual(errors, []);
    passed++;
    console.log("PASS " + name);
  } catch (e) {
    failures.push(name + ": " + e.message);
    await page.screenshot({
      path: out + "/" + name.replace(/[^a-z0-9]+/gi, "-") + "-failure.png",
      fullPage: true,
    });
    console.error("FAIL " + name + ": " + e.message);
  } finally {
    await context.close();
  }
}
const article = (page) =>
  page
    .locator("article")
    .filter({ has: page.getByRole("link", { name: gift.targetName, exact: true }) });
for (const width of [320, 390, 820, 1440])
  await run(
    "Responsive My Giving " + width,
    async ({ page }) => {
      await page.goto(origin + "/my-giving");
      await article(page).waitFor();
      assert.equal(await page.locator(".dashboard-layout,.workspace-nav").count(), 0);
      assert.equal(await page.locator("footer").count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: out + "/regular-" + width + ".png", fullPage: true });
      await page.getByRole("tab", { name: /^History/ }).click();
      await page.getByRole("button", { name: "All receipts", exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: out + "/history-" + width + ".png", fullPage: true });
    },
    { width },
  );
await run("Actual navbar transition never returns to rejected shell", async ({ page }) => {
  await page.goto(origin + "/discover");
  await page.getByRole("heading", { name: "Discover", exact: true }).waitFor();
  await page.locator("header nav a").filter({ hasText: "My giving" }).click();
  await article(page).waitFor();
  assert(new URL(page.url()).pathname === "/my-giving");
  assert.equal(await page.locator(".dashboard-layout,.workspace-nav").count(), 0);
  await page.locator("header nav a").filter({ hasText: "Manage" }).click();
  await page.getByRole("heading", { name: "Quick start guide" }).waitFor();
  await page.locator("header nav a").filter({ hasText: "My giving" }).click();
  await article(page).waitFor();
});
await run("Paused backend active false still exposes Resume", async ({ page, calls }) => {
  await page.goto(origin + "/my-giving");
  const paused = page.locator("article").filter({ hasText: "Paused Education Gift" });
  await paused.getByRole("button", { name: "Resume", exact: true }).click();
  await paused.getByRole("button", { name: "Pause", exact: true }).waitFor();
  assert(
    calls.some((c) => c.path === "/me/recurring-gifts/paused-1/resume" && c.method === "PATCH"),
  );
});
await run(
  "Pause then resume preserves gift and waits for actual server result",
  async ({ page, calls }) => {
    await page.goto(origin + "/my-giving");
    await article(page).getByRole("button", { name: "Pause", exact: true }).click();
    await article(page).getByRole("button", { name: "Resume", exact: true }).waitFor();
    await article(page).getByRole("button", { name: "Resume", exact: true }).click();
    await article(page).getByRole("button", { name: "Pause", exact: true }).waitFor();
    assert.equal(calls.filter((c) => c.path === "/me/recurring-gifts/regular-1/pause").length, 1);
    assert.equal(calls.filter((c) => c.path === "/me/recurring-gifts/regular-1/resume").length, 1);
  },
);
await run(
  "Schedule skip uses real version and failure remains visible",
  async ({ page, calls, recover }) => {
    await page.goto(origin + "/my-giving");
    await article(page).getByRole("button", { name: "Skip next", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Change temporarily unavailable" }).waitFor();
    assert.equal(calls.filter((c) => c.path.endsWith("/skip")).length, 1);
    recover();
    await article(page).getByRole("button", { name: "Skip next", exact: true }).click();
    await article(page).getByText("1 Dec 2030", { exact: true }).waitFor();
    assert.deepEqual(calls.find((c) => c.path.endsWith("/skip")).body, {
      expectedUpdatedAt: gift.updatedAt,
    });
  },
  { failure: true },
);
await run(
  "Source edit presets require fresh consent and supported frequencies",
  async ({ page, calls }) => {
    await page.goto(origin + "/my-giving");
    await article(page).getByRole("button", { name: "Change amount", exact: true }).click();
    const dialog = page.getByRole("dialog");
    assert(await dialog.getByRole("button", { name: "Quarterly", exact: true }).isDisabled());
    await dialog.getByLabel("Another amount").fill("20000");
    await dialog.getByRole("button", { name: /^Save / }).click();
    await dialog.getByRole("alert").filter({ hasText: "Confirm consent" }).waitFor();
    assert(!calls.some((c) => c.path === "/me/recurring-gifts/regular-1" && c.method === "PATCH"));
    const consent = dialog.getByRole("checkbox");
    await consent.check();
    await dialog.getByRole("button", { name: "Weekly", exact: true }).click();
    assert(!(await consent.isChecked()));
    await consent.check();
    await dialog.getByRole("button", { name: /^Save / }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.deepEqual(
      calls.find((c) => c.path === "/me/recurring-gifts/regular-1" && c.method === "PATCH").body,
      {
        amount: 20000,
        frequency: "WEEKLY",
        expectedUpdatedAt: gift.updatedAt,
        consentToAutoCharge: true,
      },
    );
  },
);
await run(
  "Rapid save submits once and retains a server failure for retry",
  async ({ page, calls, recover }) => {
    await page.goto(origin + "/my-giving");
    await article(page).getByRole("button", { name: "Change amount", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Another amount").fill("20000");
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: /^Save / }).evaluate((b) => {
      b.click();
      b.click();
    });
    await dialog.getByRole("alert").waitFor();
    assert.equal(
      calls.filter((c) => c.path === "/me/recurring-gifts/regular-1" && c.method === "PATCH")
        .length,
      1,
    );
    assert.equal(await dialog.getByLabel("Another amount").inputValue(), "20,000");
    recover();
    await dialog.getByRole("button", { name: /^Save / }).click();
    await dialog.waitFor({ state: "hidden" });
  },
  { failure: true },
);
await run(
  "Pending payment disables schedule and card changes",
  async ({ page }) => {
    await page.goto(origin + "/my-giving");
    await article(page).waitFor();
    for (const label of ["Change amount", "Skip next", "Change card"])
      assert(await article(page).getByRole("button", { name: label, exact: true }).isDisabled());
    assert(!(await article(page).getByRole("button", { name: "Pause", exact: true }).isDisabled()));
  },
  { gift: { hasPendingPayment: true } },
);
await run("Cancellation reason and Pause instead use actual endpoints", async ({ page, calls }) => {
  await page.goto(origin + "/my-giving");
  await article(page).getByRole("button", { name: "Stop giving", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Pause instead", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await article(page).getByRole("button", { name: "Resume", exact: true }).waitFor();
  assert(!calls.some((c) => c.path.endsWith("/cancel")));
  await article(page).getByRole("button", { name: "Stop giving", exact: true }).click();
  await dialog.getByLabel("Reason (optional)").fill("Budget change");
  await dialog.getByRole("button", { name: "Stop giving", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.deepEqual(calls.find((c) => c.path === "/me/recurring-gifts/regular-1/cancel").body, {
    reason: "Budget change",
  });
  await article(page).waitFor({ state: "detached" });
  await page.getByRole("heading", { name: "Stopped", exact: true }).waitFor();
});
await run("Saved-card change cannot bypass consent", async ({ page, calls }) => {
  await page.goto(origin + "/my-giving");
  await article(page).getByRole("button", { name: "Change card", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Saved card", { exact: true }).selectOption("card-2");
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await dialog.getByRole("alert").waitFor();
  assert(!calls.some((c) => c.path.endsWith("/payment-method")));
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.deepEqual(calls.find((c) => c.path.endsWith("/payment-method")).body, {
    authorizationId: "card-2",
    consentToAutoCharge: true,
  });
});
await run(
  "History source table retains filtering CSV and real receipts",
  async ({ page, calls }) => {
    await page.goto(origin + "/my-giving");
    await page.getByRole("tab", { name: /^History/ }).click();
    await page.locator("summary").filter({ hasText: "Filter history and export" }).click();
    await page.getByLabel("Payment status", { exact: true }).selectOption("failed");
    assert.equal(await page.getByRole("button", { name: "Receipt", exact: true }).count(), 0);
    assert(await page.getByRole("button", { name: "All receipts", exact: true }).isDisabled());
    await page.getByRole("button", { name: "Details", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByText("A receipt is available only after payment is confirmed successful.")
      .waitFor();
    assert.equal(await dialog.getByRole("button", { name: "Download HTML receipt" }).count(), 0);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByLabel("Payment status", { exact: true }).selectOption("succeeded");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export filtered CSV", exact: true }).click();
    const file = await download;
    const csv = readFileSync(await file.path(), "utf8");
    assert(csv.includes("qa-ref-1"));
    assert(!csv.includes("qa-failed"));
    await page.getByRole("button", { name: "Receipt", exact: true }).first().click();
    await dialog.getByRole("button", { name: "Download HTML receipt", exact: true }).waitFor();
    assert(calls.some((c) => c.path.startsWith("/me/donations/paid-")));
  },
);
await run(
  "All receipts downloads actual successful records, not prototype toast",
  async ({ page, calls }) => {
    await page.goto(origin + "/my-giving");
    await page.getByRole("tab", { name: /^History/ }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "All receipts", exact: true }).click();
    const file = await download;
    const html = readFileSync(await file.path(), "utf8");
    assert(html.includes(user.fullName));
    assert(html.includes("qa-ref-1"));
    assert(html.includes("qa-ref-2"));
    assert(!calls.some((c) => c.path === "/me/donations/failed-1"));
    assert.equal((html.match(/break-after:page/g) ?? []).length, 2);
  },
);
await run(
  "Receipt error cannot download fictitious records",
  async ({ page, recover }) => {
    await page.goto(origin + "/my-giving");
    await page.getByRole("tab", { name: /^History/ }).click();
    await page.getByRole("button", { name: "All receipts", exact: true }).click();
    await page.getByText("Receipt temporarily unavailable", { exact: true }).waitFor();
    recover();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "All receipts", exact: true }).click();
    await download;
  },
  { receiptFail: true },
);
await run(
  "New user empty states and recovery contain no mock gifts",
  async ({ page }) => {
    await page.goto(origin + "/my-giving");
    await page.getByText("No regular gifts yet", { exact: true }).waitFor();
    assert.equal(await page.locator("article").count(), 0);
    assert.equal(
      await page.getByRole("link", { name: "Find ongoing work", exact: true }).getAttribute("href"),
      "/discover?view=regular",
    );
    await page.getByRole("tab", { name: /^History/ }).click();
    await page
      .getByText("Your giving history will appear here after your first donation.")
      .waitFor();
    assert(await page.getByRole("button", { name: "All receipts", exact: true }).isDisabled());
  },
  { empty: true },
);
await run(
  "Authenticated reads recover from errors",
  async ({ page, recover }) => {
    await page.goto(origin + "/my-giving");
    await page.getByText("Giving temporarily unavailable", { exact: true }).first().waitFor();
    recover();
    await page.getByRole("button", { name: "Try again", exact: true }).first().click();
    await article(page).waitFor();
  },
  { failRead: true },
);
await run(
  "Signed-out page returns home without private giving queries",
  async ({ page, calls }) => {
    await page.goto(origin + "/my-giving");
    await page.waitForURL(origin + "/");
    assert(!calls.some((c) => c.path === "/me/donations" || c.path === "/me/recurring-gifts"));
  },
  { guest: true },
);
await browser.close();
console.log("My Giving: " + passed + " checks passed");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
