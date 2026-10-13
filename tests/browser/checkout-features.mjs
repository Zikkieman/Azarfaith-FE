import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");

const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const user = {
  id: "donor",
  fullName: "Riverlight Donor",
  email: "donor@example.com",
  role: "donor",
  status: "active",
  isVerified: true,
};
const campaign = {
  id: "cause",
  ownerId: "owner",
  mode: "ongoing",
  type: "money",
  title: "Support Riverlight Gospel Mission",
  story: "Our community work",
  raiser: { name: "Riverlight Gospel Mission", avatar: "", location: "Ibadan" },
  cover: "https://example.com/cover.png",
  gallery: [],
  frequencies: ["monthly", "weekly"],
  currency: "NGN",
  raised: 10000,
  donors: 1,
  isDraft: false,
  isPublic: true,
  verificationStatus: "verified",
  createdAt: "2026-10-01",
  updates: [],
  comments: [],
  donations: [],
};
const config = {
  currency: "NGN",
  platformFeePercent: 4,
  minDonation: 500,
  maxDonation: 100000,
  frequencies: ["MONTHLY", "WEEKLY"],
  recurringGift: null,
};
const success = {
  status: "success",
  donationId: "gift",
  reference: "azarfaith_fixture",
  campaignTitle: campaign.title,
  donorName: "Actual Giver",
  amount: 10000,
  platformFee: 400,
  tipAmount: 5000,
  totalCharged: 15400,
  paymentMethod: "CARD",
  paidAt: "2026-10-10T10:00:00Z",
  frequency: null,
  recurringMode: null,
  recurringGiftId: null,
  recurringSetupActive: false,
  nextDonationDate: null,
  message: "Donation confirmed successfully.",
};
let passes = 0;
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
    viewport: { width: options.width ?? 1440, height: 1000 },
  });
  const page = await context.newPage(),
    errors = [],
    requests = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await context.route("https://example.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#d8dbc8"/></svg>',
    }),
  );
  await context.route("https://checkout.paystack.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Hosted Paystack QA checkout</h1>" }),
  );
  await context.route("https://accounts.google.com/**", (route) => route.abort());
  let verifyCount = 0,
    initializeCount = 0;
  await context.route(`${api}/**`, async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    requests.push({
      path: url.pathname,
      search: url.search,
      method: request.method(),
      body: request.postData() ? request.postDataJSON() : null,
    });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    let status = 200,
      data = {};
    if (url.pathname === "/auth/session") {
      if (options.sessionDelay)
        await new Promise((resolve) => setTimeout(resolve, options.sessionDelay));
      data = options.authenticated ? { user } : { message: "Unauthorized" };
      status = options.authenticated ? 200 : 401;
    } else if (url.pathname.endsWith("/donations/verify")) {
      const response = (options.verifications ?? [{ status: 200, data: success }])[
        verifyCount++
      ] ?? { status: 200, data: success };
      status = response.status;
      data = response.data;
    } else if (url.pathname.endsWith("/donations") && request.method() === "POST") {
      initializeCount++;
      if (options.initializeFailure && initializeCount === 1) {
        status = 502;
        data = { message: "Paystack temporarily unavailable" };
      } else
        data = {
          donationId: "gift",
          reference: "azarfaith_fixture",
          authorizationUrl: "https://checkout.paystack.com/fixture",
          accessCode: "code",
        };
    } else if (url.pathname === "/me/payment-methods") data = options.cards ?? [];
    else if (url.pathname.endsWith("/donations/saved-card")) {
      initializeCount++;
      if (initializeCount === 1) {
        status = 502;
        data = { message: "Payment outcome unavailable" };
      } else data = { reference: "azarfaith_fixture" };
    } else if (url.pathname.endsWith("/checkout")) {
      status = options.contextStatus ?? 200;
      data = status === 200 ? { ...config, ...options.config } : { message: "Not available" };
    } else if (url.pathname === "/campaigns/cause") data = { ...campaign, ...options.campaign };
    else if (url.pathname === "/me/notifications") data = { items: [], unreadCount: 0, total: 0 };
    return route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  try {
    await fn({ page, requests });
    assert.deepEqual(errors, [], `Browser render errors: ${errors.join("; ")}`);
    passes++;
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}
const gifts = (requests) =>
  requests.filter((r) => r.method === "POST" && r.path.endsWith("/donations"));
async function guestDetails(page) {
  await page
    .getByRole("textbox", { name: "Name on the campaign", exact: true })
    .fill("Guest Giver");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("guest@example.com");
}
const desktopGive = (page) => page.getByRole("button", { name: /^Give ₦/ });
try {
  await run(
    "Guest selected amount and configured fee appear in a desktop sidebar",
    async ({ page }) => {
      await page.goto(`${origin}/donate/cause?amount=12000`);
      await page.getByRole("heading", { name: "Your gift to Riverlight Gospel Mission" }).waitFor();
      assert.equal(
        await page.getByRole("textbox", { name: "Another amount" }).inputValue(),
        "12,000",
      );
      await page
        .getByText("Platform fee (4%)", { exact: true })
        .filter({ visible: true })
        .waitFor();
      const summary = await page
        .getByRole("complementary", { name: "Giving summary" })
        .boundingBox();
      const title = await page.getByRole("heading", { level: 1 }).boundingBox();
      assert.ok(summary.x > title.x);
      await page.screenshot({
        path: "/private/tmp/azarfaith-qa/checkout-desktop.png",
        fullPage: true,
      });
    },
  );
  await run(
    "Guest custom tip and anonymous real-name receipt payload reach Paystack once",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?amount=10000`);
      await guestDetails(page);
      await page.getByRole("textbox", { name: "Custom tip (optional)" }).fill("5000");
      await page.getByRole("switch", { name: /Give anonymously/ }).click();
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests).length, 1);
      assert.deepEqual(gifts(requests)[0].body, {
        amount: 10000,
        tipAmount: 5000,
        paymentMethod: "CARD",
        donorName: "Guest Giver",
        donorEmail: "guest@example.com",
        isAnonymous: true,
      });
    },
  );
  await run(
    "Field-level validation prevents empty donor details and out-of-range gifts",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?amount=100`);
      await desktopGive(page).click();
      await page.getByText(/Enter an amount between/).waitFor();
      await page.getByText(/Enter your full name/).waitFor();
      await page.getByText("Enter a valid email for your receipt.").waitFor();
      assert.equal(gifts(requests).length, 0);
    },
  );
  await run(
    "Recurring guests are not silently charged one-time; One-time explicitly unblocks",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?freq=monthly`);
      await guestDetails(page);
      await desktopGive(page).click();
      await page.getByText("Log in to set up recurring giving, or choose One-time.").waitFor();
      assert.equal(gifts(requests).length, 0);
      await page.getByRole("radio", { name: /^One time/ }).click();
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests)[0].body.frequency, undefined);
    },
  );
  await run(
    "Fractional pasted amounts are rejected without turning them into a larger charge",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      await guestDetails(page);
      await page.getByRole("textbox", { name: "Another amount" }).fill("100.50");
      await desktopGive(page).click();
      await page.getByText(/Enter an amount between/).waitFor();
      assert.equal(gifts(requests).length, 0);
      assert.equal(await page.getByText(/₦NaN/).count(), 0);
    },
  );
  await run(
    "Automatic giving requires consent and forces card after switching from pledge bank",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?freq=monthly`);
      await page.getByRole("radio", { name: /Remind me each time/ }).click();
      await page.getByRole("radio", { name: /Bank transfer/ }).click();
      await page.getByRole("radio", { name: /Charge me automatically/ }).click();
      assert.equal(await page.getByRole("radio", { name: /Bank transfer/ }).isDisabled(), true);
      await desktopGive(page).click();
      await page.getByText(/Please agree to automatic card charging/).waitFor();
      assert.equal(gifts(requests).length, 0);
      await page.getByRole("checkbox", { name: /^I authorize/ }).check();
      await page.getByRole("textbox", { name: "Another amount" }).fill("10000");
      assert.equal(await page.getByRole("checkbox", { name: /^I authorize/ }).isChecked(), false);
      await page.getByRole("checkbox", { name: /^I authorize/ }).check();
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests)[0].body.paymentMethod, "CARD");
      assert.equal(gifts(requests)[0].body.recurringMode, "AUTO");
      assert.equal(gifts(requests)[0].body.autoChargeConsent, true);
    },
    { authenticated: true },
  );
  await run(
    "Reminder-based pledge allows bank checkout without automatic consent",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?freq=weekly`);
      await page.getByRole("radio", { name: /Remind me each time/ }).click();
      await page.getByRole("radio", { name: /Bank transfer/ }).click();
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests)[0].body.paymentMethod, "BANK");
      assert.equal(gifts(requests)[0].body.recurringMode, "PLEDGE");
      assert.equal(gifts(requests)[0].body.frequency, "WEEKLY");
      assert.equal(gifts(requests)[0].body.autoChargeConsent, undefined);
    },
    { authenticated: true },
  );
  await run(
    "Reminder context locks recorded amount/mode/frequency instead of trusting query tampering",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?freq=weekly&amount=99999&recurringGiftId=pledge`);
      const amount = page.getByRole("textbox", { name: "Another amount" });
      await amount.waitFor();
      assert.equal(await amount.inputValue(), "10,000");
      assert.equal(await amount.getAttribute("readonly"), "");
      assert.equal(await page.getByRole("radio", { name: /^Weekly/ }).isDisabled(), true);
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.deepEqual(
        {
          amount: gifts(requests)[0].body.amount,
          mode: gifts(requests)[0].body.recurringMode,
          id: gifts(requests)[0].body.recurringGiftId,
        },
        { amount: 10000, mode: "PLEDGE", id: "pledge" },
      );
    },
    {
      authenticated: true,
      config: {
        recurringGift: { id: "pledge", amount: 10000, frequency: "MONTHLY", mode: "PLEDGE" },
      },
    },
  );
  await run(
    "Provider initialization error remains visible and retry uses the same entered form values",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      await guestDetails(page);
      await desktopGive(page).click();
      await page
        .getByRole("alert")
        .getByText(/Paystack temporarily unavailable/)
        .waitFor();
      assert.equal(
        await page.getByRole("textbox", { name: "Name on the campaign", exact: true }).inputValue(),
        "Guest Giver",
      );
      await desktopGive(page).click();
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests).length, 2);
    },
    { initializeFailure: true },
  );
  await run(
    "Rapid duplicate submit events initialize exactly one checkout",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      await guestDetails(page);
      await page.locator("#donation-checkout").evaluate((form) => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      await page.waitForURL("https://checkout.paystack.com/fixture");
      assert.equal(gifts(requests).length, 1);
    },
  );
  await run(
    "Pending callback only rechecks the reference and does not initialize another charge",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?reference=azarfaith_fixture&amount=999999`);
      await page.getByRole("heading", { name: "Your payment is being processed" }).waitFor();
      assert.equal(await page.getByRole("button", { name: /^Give/ }).count(), 0);
      await page.getByRole("button", { name: "Check payment status", exact: true }).click();
      await page.getByRole("heading", { name: "Thank you" }).waitFor();
      await page.getByText("Your gift of ₦10,000 has been confirmed.", { exact: true }).waitFor();
      assert.equal(
        requests.filter((r) => r.path.endsWith("/verify") && r.method === "POST").length,
        2,
      );
      assert.equal(gifts(requests).length, 0);
      assert.equal(
        requests.filter((r) => r.path.endsWith("/checkout") || r.path === "/campaigns/cause")
          .length,
        0,
      );
    },
    {
      verifications: [
        {
          status: 200,
          data: {
            status: "pending",
            donationId: "gift",
            message: "Payment processing. Please check again.",
          },
        },
        { status: 200, data: success },
      ],
    },
  );
  await run(
    "Verification failure shows a safe recheck, never fabricated success",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?trxref=unknown-reference`);
      await page.getByRole("heading", { name: "We couldn't confirm your payment" }).waitFor();
      await page.getByText("Insufficient funds", { exact: true }).waitFor();
      assert.equal(await page.getByText("Thank you", { exact: true }).count(), 0);
      assert.equal(gifts(requests).length, 0);
    },
    { verifications: [{ status: 400, data: { message: "Insufficient funds" } }] },
  );
  await run(
    "Recurring callback derives actual setup and next date from the receipt, not missing freq query",
    async ({ page }) => {
      await page.goto(`${origin}/donate/cause?reference=azarfaith_fixture`);
      await page.getByRole("heading", { name: "Automatic recurring gift", exact: true }).waitFor();
      await page.getByText(/Next scheduled charge:/).waitFor();
      await page.getByRole("button", { name: "Print receipt", exact: true }).waitFor();
    },
    {
      authenticated: true,
      verifications: [
        {
          status: 200,
          data: {
            ...success,
            frequency: "MONTHLY",
            recurringMode: "AUTO",
            recurringGiftId: "gift",
            recurringSetupActive: true,
            nextDonationDate: "2026-11-10T10:00:00Z",
            message: "Recurring gift confirmed successfully.",
          },
        },
      ],
    },
  );
  await run(
    "Unavailable reusable authorization is shown honestly after a successful first gift",
    async ({ page }) => {
      await page.goto(`${origin}/donate/cause?reference=azarfaith_fixture`);
      await page
        .getByText("Your first gift succeeded but automatic charging is not active.", {
          exact: true,
        })
        .waitFor();
      assert.equal(await page.getByText(/Next scheduled charge:/).count(), 0);
    },
    {
      verifications: [
        {
          status: 200,
          data: {
            ...success,
            frequency: "MONTHLY",
            recurringMode: "AUTO",
            recurringSetupActive: false,
            message: "Your first gift succeeded but automatic charging is not active.",
          },
        },
      ],
    },
  );
  await run(
    "Unpublished preview cannot accept donations",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      await page
        .getByRole("heading", { name: "This campaign isn't accepting donations" })
        .waitFor();
      assert.equal(gifts(requests).length, 0);
    },
    { campaign: { isPublic: false, verificationStatus: "pending" } },
  );
  await run(
    "Checkout API failures show retry rather than fake settings",
    async ({ page }) => {
      await page.goto(`${origin}/donate/cause`);
      await page.getByRole("heading", { name: "We couldn't load this right now" }).waitFor();
      assert.equal(await page.getByRole("textbox", { name: "Another amount" }).count(), 0);
    },
    { contextStatus: 503 },
  );
  await run(
    "Owned reminder authentication failure provides a login path rather than a missing campaign",
    async ({ page }) => {
      await page.goto(`${origin}/donate/cause?recurringGiftId=owned-pledge`);
      await page.getByRole("heading", { name: "Sign in to continue" }).waitFor();
      const href = await page
        .getByRole("link", { name: "Log in", exact: true })
        .getAttribute("href");
      assert.equal(new URL(href, origin).pathname, "/login");
      const target = new URL(new URL(href, origin).searchParams.get("returnTo"), origin);
      assert.equal(target.pathname, "/donate/cause");
      assert.equal(target.searchParams.get("recurringGiftId"), "owned-pledge");
    },
    { contextStatus: 401 },
  );
  await run(
    "No checkout queries or interactable form before session hydration",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      assert.equal(
        await page.getByRole("textbox", { name: "Name on the campaign", exact: true }).count(),
        0,
      );
      assert.equal(requests.filter((r) => r.path.endsWith("/checkout")).length, 0);
      await page.getByRole("textbox", { name: "Name on the campaign", exact: true }).waitFor();
    },
    { authenticated: true, sessionDelay: 1500 },
  );
  for (const width of [320, 390, 820])
    await run(
      `Responsive checkout ${width}px exposes breakdown and mobile submit without overflow`,
      async ({ page }) => {
        await page.goto(`${origin}/donate/cause?amount=10000`);
        await page.locator("details > summary").click();
        await page
          .getByText("Platform fee (4%)", { exact: true })
          .filter({ visible: true })
          .waitFor();
        await page.getByRole("button", { name: "Give", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: /^Give ₦/ }).isVisible(), false);
        await page.getByRole("textbox", { name: "Custom tip (optional)" }).fill("100000000");
        const widthInfo = await page.evaluate(() => ({
          viewport: innerWidth,
          page: document.documentElement.scrollWidth,
        }));
        assert.ok(widthInfo.page <= widthInfo.viewport + 1, JSON.stringify(widthInfo));
        if (width === 390)
          await page.screenshot({
            path: "/private/tmp/azarfaith-qa/checkout-mobile.png",
            fullPage: true,
          });
      },
      { width },
    );
  await run(
    "Saved-card retry preserves same attempt, freezes charge details and confirms via real verification",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause?amount=10000`);
      await page.getByRole("radio", { name: /Card ending 1234/ }).click();
      await desktopGive(page).click();
      assert.equal(requests.filter((req) => req.path.endsWith("/saved-card")).length, 0);
      await page.getByRole("checkbox", { name: /I authorize a one-time charge/ }).check();
      await desktopGive(page).click();
      await page
        .getByRole("alert")
        .getByText(/Payment outcome unavailable/)
        .waitFor();
      assert.equal(await page.getByRole("radio", { name: /Card ending 1234/ }).isDisabled(), true);
      assert.equal(await page.getByRole("textbox", { name: "Another amount" }).isDisabled(), true);
      await desktopGive(page).click();
      await page.getByRole("heading", { name: "Thank you" }).waitFor();
      const attempts = requests.filter((req) => req.path.endsWith("/saved-card"));
      assert.equal(attempts.length, 2);
      assert.deepEqual(attempts[0].body, attempts[1].body);
      assert.equal(gifts(requests).length, 0);
    },
    {
      authenticated: true,
      campaign: { mode: "one-time" },
      cards: [{ id: "card", active: true, reusable: true, channel: "card", last4: "1234" }],
    },
  );
  await run(
    "Unsupported frequency in the URL stays a validation error, not a render failure or silent one-time charge",
    async ({ page, requests }) => {
      await page.goto(origin + "/donate/cause?freq=unsupported");
      await desktopGive(page).click();
      await page
        .getByText("Choose a frequency offered by this campaign.", { exact: true })
        .waitFor();
      assert.equal(await page.getByText(/undefined/).count(), 0);
      assert.equal(gifts(requests).length, 0);
    },
    { authenticated: true },
  );
  await run(
    "Paused giving disables checkout before any provider attempt",
    async ({ page, requests }) => {
      await page.goto(`${origin}/donate/cause`);
      await page.getByRole("heading", { name: "Your gift to Riverlight Gospel Mission" }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Giving paused", exact: true }).first().isDisabled(),
        true,
      );
      assert.equal(gifts(requests).length, 0);
    },
    { config: { givingPaused: true } },
  );
  console.log(
    `Checkout browser QA: ${passes} checks passed (API/provider fixtures; no live charges).`,
  );
} finally {
  await browser.close();
}
