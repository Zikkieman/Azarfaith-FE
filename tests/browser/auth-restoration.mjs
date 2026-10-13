import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const artifacts = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-auth-qa";
mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const donor = {
  id: "qa-user",
  fullName: "QA Donor",
  email: "qa@example.invalid",
  phone: "+2348012345678",
  isVerified: true,
  role: "donor",
  status: "active",
};
const dashboard = {
  fullName: donor.fullName,
  period: { start: "2026-10-01", end: "2026-10-31", timezone: "UTC" },
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
  payout: { availableBalance: 0, totalPlatformFees: 0, totalReleased: 0, account: null },
};
const googleScript = `window.qaGoogle={initializations:0,options:[]};window.google={accounts:{id:{initialize(options){window.qaGoogle.initializations++;window.qaGoogleCallback=options.callback;},renderButton(parent,options){window.qaGoogle.options.push(options);const button=document.createElement('button');button.textContent='Continue with Google';button.type='button';button.style.cssText='height:40px;border:1px solid #d0d5dd;border-radius:999px;background:white;font:500 14px Arial;';button.style.width=options.width+'px';button.onclick=()=>window.qaGoogleCallback({credential:window.qaCredential||'qa-google-token'});parent.append(button);}}}};`;
let passed = 0;
async function run(name, fn, options = {}) {
  const context = await browser.newContext({
    viewport: { width: options.width ?? 1440, height: 1000 },
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage(),
    errors = [],
    calls = [];
  let user = options.user ?? null;
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await context.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#e6e2dd"/></svg>',
    }),
  );
  await context.route("https://accounts.google.com/**", (r) =>
    options.googleFailure
      ? r.abort()
      : r.fulfill({ contentType: "application/javascript", body: googleScript }),
  );
  await context.route(`${api}/**`, async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname,
      method = request.method();
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    const body = request.postData() ? request.postDataJSON() : null;
    calls.push({ path, method, body, credentials: request.headers().authorization });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      if (options.sessionDelay)
        await new Promise((resolve) => setTimeout(resolve, options.sessionDelay));
      status = user ? 200 : 401;
      data = user ? { user } : { message: "Unauthorized" };
    } else if (path === "/auth/login" || path === "/auth/admin/login") {
      if (body.password === "wrong-password") {
        status = 401;
        data = { message: "Invalid credentials" };
      } else if (body.identifier === "unverified@example.invalid") {
        status = 403;
        data = { message: "Email is not verified" };
      } else if (path === "/auth/admin/login" && body.identifier === "donor@example.invalid") {
        status = 403;
        data = { message: "Admin access required" };
      } else {
        user = { ...donor, role: path === "/auth/admin/login" ? "platform_admin" : "donor" };
        data = { user };
      }
    } else if (path === "/auth/signup") {
      if (body.email === "taken@example.invalid") {
        status = 409;
        data = { message: "An account already uses this email" };
      } else data = { message: "Verification code sent", email: body.email };
    } else if (path === "/auth/verify-otp") {
      if (body.code !== "1234") {
        status = 400;
        data = { message: "Invalid verification code" };
      } else {
        user = { ...donor, email: body.email };
        data = { user };
      }
    } else if (path === "/auth/resend-otp") data = { email: body.email, message: "Code sent" };
    else if (path === "/auth/google") {
      if (body.idToken === "bad-token") {
        status = 401;
        data = { message: "Google credential could not be verified" };
      } else {
        user = donor;
        data = { user };
      }
    } else if (path === "/auth/forgot-password") {
      if (body.email === "fail@example.invalid") {
        status = 503;
        data = { message: "Email delivery temporarily unavailable" };
      } else data = { message: "If an account exists, a reset link has been sent" };
    } else if (path === "/auth/reset-password") {
      if (body.token === "expired") {
        status = 400;
        data = { message: "Reset link has expired" };
      } else data = { message: "Password reset" };
    } else if (path === "/me/dashboard") data = dashboard;
    else if (path === "/campaigns/real-campaign")
      data = {
        id: "real-campaign",
        ownerId: "qa-owner",
        mode: "ongoing",
        type: "money",
        title: "QA recurring campaign",
        story: "Isolated fixture",
        faithCategory: "Missions & Outreach",
        raiser: { name: "QA ministry", avatar: "", location: "Ibadan, Oyo" },
        cover: "",
        gallery: [],
        frequencies: ["monthly"],
        currency: "NGN",
        raised: 0,
        donors: 0,
        location: "Ibadan, Oyo",
        urgency: "low",
        isDraft: false,
        isPublic: true,
        verificationStatus: "verified",
        createdAt: "2026-10-01",
        updates: [],
        comments: [],
        donations: [],
      };
    else if (path === "/campaigns/real-campaign/checkout")
      data = {
        currency: "NGN",
        platformFeePercent: 2.5,
        minDonation: 100,
        maxDonation: 5000000,
        frequencies: ["MONTHLY"],
        recurringGift: null,
      };
    else if (path === "/me/payment-methods") data = [];
    else if (path === "/me/notifications")
      data = { items: [], unreadCount: 0, page: 1, pageSize: 8, total: 0, hasMore: false };
    else if (path === "/admin/review/dashboard")
      data = {
        totalUsers: 1,
        totalOrganizations: 0,
        verifiedOrganizations: 0,
        pendingOrganizations: 0,
        activeCampaigns: 0,
        pendingCampaigns: 0,
        totalRaised: 0,
        donationChart: [],
        campaignStatusChart: [],
        recentActivity: [],
      };
    else if (path === "/admin/review/notifications/inbox")
      data = { items: [], unreadCount: 0, total: 0, page: 1, pageSize: 8, asOf: "2026-10-12" };
    else {
      status = 404;
      data = { message: "Unconfigured isolated fixture" };
    }
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  const goto = async (path) => {
    await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  };
  const ready = async (label) => {
    await page.getByLabel(label, { exact: true }).waitFor();
    await page.waitForFunction((label) => {
      const labels = [...document.querySelectorAll("label")];
      const l = labels.find((e) => e.textContent === label);
      return l && document.getElementById(l.htmlFor)?.disabled === false;
    }, label);
  };
  try {
    await fn({ page, calls, goto, ready });
    assert.deepEqual(errors, [], name);
    passed++;
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error({ name, calls, text: await page.locator("body").textContent(), errors });
    await page.screenshot({ path: `${artifacts}/failure.png`, fullPage: true });
    throw e;
  } finally {
    await context.close();
  }
}
async function fillSignup(page, email = "new@example.invalid") {
  await page.getByLabel("First name", { exact: true }).fill("Riverlight");
  await page.getByLabel("Last name", { exact: true }).fill("Donor");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone number", { exact: true }).fill("+234 801 234 5678");
  await page.getByLabel("Password", { exact: true }).fill("QA-password-123");
  await page.getByRole("checkbox").check();
}
async function code(page, value) {
  await page.getByLabel("Digit 1", { exact: true }).fill("");
  for (let i = 0; i < 4; i++)
    await page.getByLabel(`Digit ${i + 1}`, { exact: true }).fill(value[i]);
}
try {
  for (const width of [320, 390, 820, 1440])
    await run(
      `Auth layouts and signup steps ${width}px`,
      async ({ page, goto, ready }) => {
        for (const path of [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password?token=fixture",
          "/admin/login",
        ]) {
          await goto(path);
          await page.locator(".designer-auth h1").waitFor();
          if (path === "/signup")
            await page.getByRole("button", { name: "Continue with email", exact: true }).waitFor();
          else
            await ready(
              path.startsWith("/reset-password")
                ? "New password"
                : path === "/forgot-password"
                  ? "Email"
                  : "Email or phone",
            );
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            path,
          );
          assert.equal(await page.locator("aside").isVisible(), width >= 1024);
          await page.screenshot({
            path: `${artifacts}/${width}-${path.split("?")[0].replaceAll("/", "_")}.png`,
            fullPage: true,
          });
        }
        await goto("/signup");
        await page.getByRole("button", { name: "Continue with email", exact: true }).click();
        await ready("First name");
        await page.screenshot({ path: `${artifacts}/${width}-signup-form.png`, fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
      },
      { width },
    );
  await run(
    "Login typing is stable; password toggle and failures keep entered values",
    async ({ page, calls, goto, ready }) => {
      await goto("/login");
      await ready("Email or phone");
      await page.getByLabel("Email or phone", { exact: true }).evaluate((el) => {
        window.qaInput = el;
      });
      for (const char of "qa@example.invalid") {
        await page.getByLabel("Email or phone", { exact: true }).pressSequentially(char);
        assert.equal(
          await page
            .getByLabel("Email or phone", { exact: true })
            .evaluate((el) => el === window.qaInput),
          true,
        );
      }
      await page.getByLabel("Password", { exact: true }).fill("wrong-password");
      await page.getByRole("button", { name: "Show password", exact: true }).click();
      assert.equal(await page.getByLabel("Password", { exact: true }).getAttribute("type"), "text");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "Invalid credentials" }).first().waitFor();
      assert.equal(
        await page.getByLabel("Email or phone", { exact: true }).inputValue(),
        "qa@example.invalid",
      );
      assert.equal(new URL(page.url()).pathname, "/login");
      assert.deepEqual(calls.find((c) => c.path === "/auth/login").body, {
        identifier: "qa@example.invalid",
        password: "wrong-password",
      });
    },
  );
  await run(
    "Late session restoration cannot wipe typed fields or repeat authentication",
    async ({ page, calls, goto, ready }) => {
      await goto("/login");
      assert.equal(await page.getByLabel("Email or phone", { exact: true }).isDisabled(), true);
      await ready("Email or phone");
      await page.getByLabel("Email or phone", { exact: true }).fill("qa@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("QA-password-123");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/dashboard");
      assert.equal(calls.filter((c) => c.path === "/auth/login").length, 1);
    },
    { sessionDelay: 900 },
  );
  await run(
    "Signup submits real combined name and required phone, then waits for server OTP",
    async ({ page, calls, goto, ready }) => {
      await goto("/signup");
      await page.getByRole("button", { name: "Continue with email", exact: true }).click();
      await ready("First name");
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByText("Enter your first name", { exact: true }).waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/signup").length, 0);
      await fillSignup(page);
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByRole("heading", { name: "Check your email", exact: true }).waitFor();
      assert.deepEqual(calls.find((c) => c.path === "/auth/signup").body, {
        fullName: "Riverlight Donor",
        email: "new@example.invalid",
        phone: "+2348012345678",
        password: "QA-password-123",
      });
      await code(page, "1111");
      await page
        .getByRole("alert")
        .filter({ hasText: "Invalid verification code" })
        .first()
        .waitFor();
      assert.equal(new URL(page.url()).pathname, "/signup");
      await page.waitForTimeout(700);
      assert.equal(calls.filter((c) => c.path === "/auth/verify-otp").length, 1);
      await page.getByLabel("Digit 1", { exact: true }).fill("");
      await page.getByLabel("Digit 2", { exact: true }).fill("");
      await page.getByLabel("Digit 3", { exact: true }).fill("");
      await page.getByLabel("Digit 4", { exact: true }).fill("");
      await code(page, "1234");
      await page.waitForURL("**/dashboard");
      assert.equal(calls.filter((c) => c.path === "/auth/verify-otp").length, 2);
    },
  );
  await run(
    "OTP resend respects cooldown and calls the real resend endpoint",
    async ({ page, calls, goto, ready }) => {
      await page.clock.install();
      await goto("/signup?mode=form");
      await ready("First name");
      await fillSignup(page);
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByRole("heading", { name: "Check your email", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: /Resend in/ }).isDisabled(), true);
      await page.clock.runFor(31000);
      await page.getByRole("button", { name: "Resend code", exact: true }).click();
      await page.getByText("A new code has been sent.", { exact: true }).waitFor();
      assert.deepEqual(calls.find((c) => c.path === "/auth/resend-otp").body, {
        email: "new@example.invalid",
      });
      assert.equal(await page.getByRole("button", { name: /Resend in/ }).isDisabled(), true);
    },
  );
  await run(
    "OTP paste distributes all four digits and uses the actual verification endpoint",
    async ({ page, calls, goto, ready }) => {
      await goto("/signup?mode=form");
      await ready("First name");
      await fillSignup(page);
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByLabel("Digit 1", { exact: true }).waitFor();
      await page.getByLabel("Digit 1", { exact: true }).evaluate((el) => {
        const data = new DataTransfer();
        data.setData("text", "1234");
        el.dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      });
      await page.waitForURL("**/dashboard");
      assert.deepEqual(calls.find((c) => c.path === "/auth/verify-otp").body, {
        email: "new@example.invalid",
        code: "1234",
      });
    },
  );
  await run(
    "OTP change-email and direct/reloaded OTP URLs never pretend verification succeeded",
    async ({ page, calls, goto, ready }) => {
      await goto("/signup?mode=otp");
      await page
        .getByText("Sign up again or sign in to request a fresh verification code.")
        .waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/verify-otp").length, 0);
      await page.getByRole("button", { name: "Continue with email", exact: true }).click();
      await ready("First name");
      await fillSignup(page);
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByRole("button", { name: "change your email", exact: true }).click();
      await page.getByRole("heading", { name: "Create your account", exact: true }).waitFor();
      assert.equal(
        await page.getByLabel("Email", { exact: true }).inputValue(),
        "new@example.invalid",
      );
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Continue with email", exact: true }).waitFor();
    },
  );
  await run(
    "Duplicate signup remains on form and unverified login opens the real OTP flow",
    async ({ page, calls, goto, ready }) => {
      await goto("/signup?mode=form");
      await ready("First name");
      await fillSignup(page, "taken@example.invalid");
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "An account already uses this email" })
        .first()
        .waitFor();
      assert.equal(
        await page.getByLabel("Email", { exact: true }).inputValue(),
        "taken@example.invalid",
      );
      await goto("/login");
      await ready("Email or phone");
      await page.getByLabel("Email or phone", { exact: true }).fill("unverified@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("QA-password-123");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByRole("heading", { name: "Check your email", exact: true }).waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/signup").length, 1);
    },
  );
  await run(
    "Google callback uses real endpoint; rejection stays signed out; no repeat initialization on typing",
    async ({ page, calls, goto, ready }) => {
      await goto("/login");
      await ready("Email or phone");
      await page.getByRole("button", { name: "Continue with Google", exact: true }).waitFor();
      await page.evaluate(() => {
        window.qaCredential = "bad-token";
      });
      await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Google credential could not be verified" })
        .first()
        .waitFor();
      assert.equal(new URL(page.url()).pathname, "/login");
      await page
        .getByLabel("Email or phone", { exact: true })
        .pressSequentially("qa@example.invalid");
      assert.equal(await page.evaluate(() => window.qaGoogle.initializations), 1);
      assert.ok(
        (await page.evaluate(() => window.qaGoogle.options)).every(
          (o) => typeof o.width === "number" && o.width <= 400 && o.shape === "pill",
        ),
      );
      const width = await page
        .getByRole("button", { name: "Continue with Google", exact: true })
        .evaluate((el) => el.getBoundingClientRect().width);
      assert.ok(Math.abs(width - 420) < 2, width);
      await page
        .locator("header")
        .getByRole("link", { name: "Create an account", exact: true })
        .click();
      await page.getByRole("button", { name: "Continue with email", exact: true }).waitFor();
      await page.evaluate(() => {
        window.qaCredential = "qa-google-token";
      });
      await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
      await page.waitForURL("**/dashboard");
      assert.equal(calls.filter((c) => c.path === "/auth/google").length, 2);
      assert.deepEqual(calls.filter((c) => c.path === "/auth/google").at(-1).body, {
        idToken: "qa-google-token",
      });
    },
  );
  await run(
    "Google script failure and Facebook unavailability cannot simulate a successful login",
    async ({ page, calls, goto, ready }) => {
      await goto("/login");
      await ready("Email or phone");
      await page.getByText("Google sign-in couldn't load. Continue with email below.").waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Continue with Facebook (unavailable)", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .locator("header")
        .getByRole("link", { name: "Create an account", exact: true })
        .click();
      await page.getByText("Google sign-in couldn't load. Continue with email below.").waitFor();
      assert.equal(
        calls.filter((c) => c.path === "/auth/google" || c.path.includes("facebook")).length,
        0,
      );
    },
    { googleFailure: true },
  );
  await run(
    "Reset email request handles validation and actual delivery failures without false success",
    async ({ page, calls, goto, ready }) => {
      await goto("/forgot-password");
      await ready("Email");
      await page.getByRole("button", { name: "Send reset link", exact: true }).click();
      await page.getByText("Enter a valid email address", { exact: true }).waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/forgot-password").length, 0);
      await page.getByLabel("Email", { exact: true }).fill("fail@example.invalid");
      await page.getByRole("button", { name: "Send reset link", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Email delivery temporarily unavailable" })
        .first()
        .waitFor();
      assert.equal(
        await page.getByRole("heading", { name: "Check your inbox", exact: true }).count(),
        0,
      );
      await page.getByLabel("Email", { exact: true }).fill(" QA@example.invalid ");
      await page.getByRole("button", { name: "Send reset link", exact: true }).click();
      await page.getByRole("heading", { name: "Check your inbox", exact: true }).waitFor();
      assert.deepEqual(calls.filter((c) => c.path === "/auth/forgot-password").at(-1).body, {
        email: "qa@example.invalid",
      });
      await page.getByRole("button", { name: "Use a different email", exact: true }).click();
      await page.getByRole("heading", { name: "Reset your password", exact: true }).waitFor();
    },
  );
  await run(
    "Password reset validates token, confirmation and expired errors, then uses the actual endpoint",
    async ({ page, calls, goto, ready }) => {
      await goto("/reset-password");
      await page
        .getByText("This reset link is missing its token. Request a new link to continue.")
        .waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/reset-password").length, 0);
      await goto("/reset-password?token=expired");
      await ready("New password");
      await page.getByLabel("New password", { exact: true }).fill("QA-new-password-123");
      await page.getByLabel("Confirm new password", { exact: true }).fill("Different-password");
      await page.getByRole("button", { name: "Reset password", exact: true }).click();
      await page.getByText("Passwords do not match.", { exact: true }).waitFor();
      assert.equal(calls.filter((c) => c.path === "/auth/reset-password").length, 0);
      await page.getByLabel("Confirm new password", { exact: true }).fill("QA-new-password-123");
      await page.getByRole("button", { name: "Reset password", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "Reset link has expired" }).first().waitFor();
      assert.equal(
        await page.getByLabel("New password", { exact: true }).inputValue(),
        "QA-new-password-123",
      );
      await goto("/reset-password?token=valid-reset");
      await ready("New password");
      await page.getByLabel("New password", { exact: true }).fill("QA-new-password-123");
      await page.getByLabel("Confirm new password", { exact: true }).fill("QA-new-password-123");
      await page.getByRole("button", { name: "Reset password", exact: true }).click();
      await page.getByRole("heading", { name: "Password updated", exact: true }).waitFor();
      assert.deepEqual(calls.filter((c) => c.path === "/auth/reset-password").at(-1).body, {
        token: "valid-reset",
        password: "QA-new-password-123",
      });
    },
  );
  await run(
    "Administrator sign-in uses restricted endpoint and denied accounts stay unauthorized",
    async ({ page, calls, goto, ready }) => {
      await goto("/admin/login");
      await ready("Email or phone");
      assert.equal(
        await page.getByRole("button", { name: "Continue with Google", exact: true }).count(),
        0,
      );
      await page.getByLabel("Email or phone", { exact: true }).fill("donor@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("QA-password-123");
      await page.getByRole("button", { name: "Enter admin console", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "Admin access required" }).first().waitFor();
      assert.equal(new URL(page.url()).pathname, "/admin/login");
      await page.getByLabel("Email or phone", { exact: true }).fill("admin@example.invalid");
      await page.getByRole("button", { name: "Enter admin console", exact: true }).click();
      await page.waitForURL("**/admin");
      assert.equal(calls.filter((c) => c.path === "/auth/admin/login").length, 2);
      assert.equal(calls.filter((c) => c.path === "/auth/login").length, 0);
    },
  );
  for (const role of ["donor", "platform_admin"])
    await run(
      `Existing ${role} session leaves public sign-in and signup screens`,
      async ({ page, goto }) => {
        await goto("/login");
        await page.waitForURL(role === "donor" ? "**/dashboard" : "**/admin");
        await goto("/signup");
        await page.waitForURL(role === "donor" ? "**/dashboard" : "**/admin");
      },
      { user: { ...donor, role } },
    );
  await run(
    "Safe checkout return survives auth navigation; external redirects are discarded",
    async ({ page, calls, goto, ready }) => {
      await goto("/login?returnTo=https://malicious.example");
      await ready("Email or phone");
      await page
        .locator("header")
        .getByRole("link", { name: "Create an account", exact: true })
        .click();
      assert.equal(new URL(page.url()).searchParams.get("returnTo"), null);
      await goto(
        "/login?returnTo=" + encodeURIComponent("/donate/real-campaign?amount=10000&freq=monthly"),
      );
      await ready("Email or phone");
      await page
        .locator("header")
        .getByRole("link", { name: "Create an account", exact: true })
        .click();
      assert.equal(
        new URL(page.url()).searchParams.get("returnTo"),
        "/donate/real-campaign?amount=10000&freq=monthly",
      );
      assert.equal(calls.filter((c) => c.method === "POST").length, 0);
    },
  );
  await run(
    "Successful login returns to the real checkout URL exactly once",
    async ({ page, calls, goto, ready }) => {
      let navigations = 0;
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame() && new URL(frame.url()).pathname === "/donate/real-campaign")
          navigations++;
      });
      await goto(
        "/login?returnTo=" + encodeURIComponent("/donate/real-campaign?amount=10000&freq=monthly"),
      );
      await ready("Email or phone");
      await page.getByLabel("Email or phone", { exact: true }).fill("qa@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("QA-password-123");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/donate/real-campaign");
      await page.getByRole("textbox", { name: "Your amount (NGN)" }).waitFor();
      assert.equal(
        await page.getByRole("textbox", { name: "Your amount (NGN)" }).inputValue(),
        "10,000",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Monthly", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.waitForTimeout(300);
      assert.equal(navigations, 1);
      assert.equal(calls.filter((c) => c.path === "/auth/login").length, 1);
    },
  );
  console.log(
    `Auth restoration: ${passed} browser checks passed with isolated API/GIS fixtures; no real emails or accounts created.`,
  );
} finally {
  await browser.close();
}
