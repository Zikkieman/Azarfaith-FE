import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000",
  out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-creation-qa";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const user = {
  id: "owner",
  fullName: "Riverlight Organizer",
  email: "owner@example.invalid",
  isVerified: true,
  role: "donor",
  status: "active",
};
const profile = {
  ...user,
  city: "Ibadan",
  createdAt: "2026-01-01",
  avatarUrl: null,
  totalGiven: 0,
  activeRecurringGiftCount: 0,
  ownedOrganizations: [
    { id: "org", name: "Riverlight Mission", verificationStatus: "verified" },
    {
      id: "rejected",
      name: "Rejected Ministry",
      verificationStatus: "unverified",
      reviewAction: "rejected",
    },
  ],
  ownedCampaigns: [],
  donationHistory: [],
  verifications: ["Email verified"],
};
const account = {
  id: "bank",
  ownerType: "user",
  accountName: "RIVERLIGHT ORGANIZER",
  bankName: "QA Bank",
  accountNumberMasked: "******5678",
  bankCode: "001",
  active: true,
  status: "verified",
};
const words = (n) => Array(n).fill("mission").join(" ");
const draftOrg = {
  id: "draft-org",
  ownerId: user.id,
  name: "Riverlight Mission",
  category: "mission",
  denomination: "Interdenominational",
  location: "Ibadan, Oyo",
  founded: "2019",
  tagline: "Serving families with faith and practical care",
  bio: words(100),
  photos: [
    "https://fixture.invalid/a.png",
    "https://fixture.invalid/b.png",
    "https://fixture.invalid/c.png",
  ],
  links: [],
  registrationDocuments: ["https://fixture.invalid/proof.pdf"],
  campaignIds: [],
  isDraft: true,
  isPublic: false,
  verificationStatus: "unverified",
  totalReceived: 0,
  supporters: 0,
  campaignCount: 0,
};
const draftCampaign = {
  id: "draft-cause",
  ownerId: user.id,
  title: "Riverlight school support",
  mode: "one-time",
  type: "money",
  faithCategory: "Education",
  location: "Ibadan, Oyo",
  story: words(100),
  cover: "https://fixture.invalid/cover.png",
  gallery: ["https://fixture.invalid/gallery.png"],
  goal: 150000,
  urgency: "medium",
  isDraft: true,
  isPublic: false,
  verificationStatus: "unverified",
  currency: "NGN",
  createdAt: "2026-10-01",
  raiser: { name: user.fullName, avatar: "", location: "Ibadan" },
  raised: 0,
  donors: 0,
  updates: [],
  comments: [],
  donations: [],
  frequencies: [],
  needs: [],
};
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBMUAAAAASUVORK5CYII=",
  "base64",
);
let passes = 0;
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({
      viewport: { width: options.width ?? 1440, height: 1000 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage(),
    requests = [],
    errors = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("https://fixture.invalid/**", (r) =>
    r.fulfill({ contentType: "image/png", body: png }),
  );
  await context.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({ contentType: "image/png", body: png }),
  );
  await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await context.route("https://accounts.google.com/**", (r) => r.abort());
  let org = structuredClone(draftOrg),
    campaign = structuredClone(draftCampaign),
    saveAttempts = 0,
    uploads = 0;
  await context.route(api + "/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method(),
      json = request.headers()["content-type"]?.includes("json"),
      body = json && request.postData() ? request.postDataJSON() : null,
      multipart = json ? null : request.postData();
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    requests.push({ path, method, body, multipart });
    let status = 200,
      data = {};
    if (path === "/auth/session") {
      status = options.guest ? 401 : 200;
      data = options.guest ? { message: "Unauthorized" } : { user };
    } else if (path === "/me/profile") data = profile;
    else if (path === "/me/notifications") data = { items: [], total: 0, unreadCount: 0 };
    else if (path === "/me/dashboard") {
      status = 503;
      data = { message: "Dashboard not included in this isolated flow fixture" };
    } else if (path === "/public/giving")
      data = { locations: [], totals: { given: 0, gifts: 0, organizations: 0 } };
    else if (path === "/campaigns/discover")
      data = { items: [], page: 1, pageSize: 6, total: 0, hasMore: false };
    else if (path === "/media/cloudinary/status") data = { enabled: true };
    else if (path === "/media/upload") {
      uploads++;
      if (options.uploadFailure && uploads === 2) {
        status = 503;
        data = { message: "Second photo failed" };
      } else data = { url: "https://fixture.invalid/upload-" + uploads + ".png" };
    } else if (path.endsWith("/payout-account"))
      data = options.pendingPayout ? { ...account, status: "pending" } : account;
    else if (path === "/organizations/drafts/draft-org") data = org;
    else if (path === "/campaigns/drafts/draft-cause") data = campaign;
    else if (
      (path === "/organizations/drafts" || path === "/organizations/draft-org/draft") &&
      ["POST", "PATCH"].includes(method)
    ) {
      saveAttempts++;
      if (options.saveFailure && saveAttempts === 1) {
        status = 503;
        data = { message: "Draft save unavailable" };
      } else {
        org = {
          ...org,
          name: body.name,
          category: body.category?.toLowerCase() ?? "mission",
          otherCategoryLabel: body.otherCategoryLabel ?? "",
          denomination: body.denomination,
          location: body.location,
          founded: body.foundedYear ? String(body.foundedYear) : "",
          tagline: body.tagline,
          bio: body.bio,
          photos: body.photoUrls,
          registrationDocuments: body.registrationDocumentUrls,
          links: body.externalLinks,
        };
        data = org;
      }
    } else if (
      (path === "/campaigns/drafts" || path === "/campaigns/draft-cause/draft") &&
      ["POST", "PATCH"].includes(method)
    ) {
      saveAttempts++;
      if (options.saveFailure && saveAttempts === 1) {
        status = 503;
        data = { message: "Draft save unavailable" };
      } else {
        const categories = {
          CHURCH_BUILDING: "Church Building",
          MISSIONS_OUTREACH: "Missions & Outreach",
          ORPHANAGE: "Orphanage",
          EDUCATION: "Education",
          MEDICAL_MISSION: "Medical Mission",
          EMERGENCY: "Emergency",
        };
        campaign = {
          ...campaign,
          mode: body.mode === "ONGOING" ? "ongoing" : "one-time",
          type: body.type?.toLowerCase() ?? "money",
          faithCategory: categories[body.faithCategory] ?? "Education",
          orgId: body.organizationId ?? undefined,
          title: body.title,
          story: body.story,
          location: body.location,
          goal: body.goalAmount ?? undefined,
          cover: body.coverImageUrl ?? "",
          gallery: body.galleryImageUrls,
          frequencies: body.frequencies.map((f) => f.toLowerCase()),
          needs: body.needs,
        };
        data = campaign;
      }
    } else if (path === "/organizations/draft-org/submit") {
      org = { ...org, isDraft: false, verificationStatus: "pending" };
      data = org;
    } else if (path === "/campaigns/draft-cause/submit") {
      if (options.submitFailure) {
        status = 503;
        data = { message: "Review submission unavailable" };
      } else {
        campaign = {
          ...campaign,
          isDraft: false,
          verificationStatus: options.autoApprove ? "verified" : "pending",
          isPublic: Boolean(options.autoApprove),
        };
        data = campaign;
      }
    } else if (path === "/organizations/draft-org") data = { ...org, campaigns: [] };
    else if (path === "/campaigns/draft-cause") data = campaign;
    return route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  try {
    await fn({ page, requests });
    assert.deepEqual(errors, []);
    passes++;
    console.log("PASS " + name);
  } catch (error) {
    console.error(
      name,
      (await page.locator("body").innerText()).slice(0, 1600),
      errors,
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        wide: [...document.querySelectorAll("body *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 10)
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            right: e.getBoundingClientRect().right,
            text: e.textContent.slice(0, 100),
          })),
      })),
    );
    throw error;
  } finally {
    await context.close();
  }
}
const saveCalls = (requests) =>
  requests.filter(
    (r) =>
      ["POST", "PATCH"].includes(r.method) &&
      (/\/draft$/.test(r.path) || r.path.endsWith("/drafts")),
  );
const submitCalls = (requests) =>
  requests.filter((r) => r.path.endsWith("/submit") && r.method === "POST");
try {
  for (const width of [320, 390, 820, 1440]) {
    await run(
      `Organization original wizard ${width}px`,
      async ({ page }) => {
        await page.goto(origin + "/register-org");
        await page.getByRole("heading", { name: "Tell us about your org", exact: true }).waitFor();
        assert.equal(await page.locator("aside").isVisible(), width >= 1024);
        await page.getByRole("button", { name: /Other ministry/ }).click();
        await page.getByLabel("Specify ministry type").fill("Community outreach");
        await page.getByLabel("Year founded").fill("a2b019");
        assert.equal(await page.getByLabel("Year founded").inputValue(), "2019");
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.screenshot({ path: out + `/org-${width}.png`, fullPage: true });
      },
      { width },
    );
    await run(
      `Campaign source builder ${width}px`,
      async ({ page }) => {
        await page.goto(origin + "/create");
        await page.getByRole("heading", { name: "Start from a template", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: /Children's home/ }).count(), 1);
        assert.equal(await page.getByRole("button", { name: /Medical outreach/ }).count(), 1);
        await page.getByRole("button", { name: /Monthly support/ }).click();
        await page.getByRole("heading", { name: "Regular giving", exact: true }).waitFor();
        if (width < 1024) {
          await page.getByRole("button", { name: "Preview", exact: true }).click();
          await page.getByRole("dialog").waitFor();
          await page.getByRole("button", { name: "Close", exact: true }).click();
          await page.getByRole("dialog").waitFor({ state: "hidden" });
        }
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.screenshot({ path: out + `/create-${width}.png`, fullPage: true });
      },
      { width },
    );
  }
  await run(
    "Organization save/exit waits for a real response; failures retain fields",
    async ({ page, requests }) => {
      await page.goto(origin + "/register-org");
      await page.getByLabel("Organization name", { exact: true }).fill("Riverlight New Ministry");
      await page.getByRole("button", { name: "Save and exit", exact: true }).click();
      await page.getByText(/Draft save unavailable/).waitFor();
      assert.equal(new URL(page.url()).pathname, "/register-org");
      assert.equal(
        await page.getByLabel("Organization name", { exact: true }).inputValue(),
        "Riverlight New Ministry",
      );
      await page.getByRole("button", { name: "Save and exit", exact: true }).click();
      await page.waitForURL(origin + "/dashboard");
      assert.equal(saveCalls(requests).length, 2);
      assert.equal(submitCalls(requests).length, 0);
    },
    { saveFailure: true },
  );
  await run(
    "Empty creation exits without creating a draft",
    async ({ page, requests }) => {
      await page.goto(origin + "/register-org");
      await page.getByRole("button", { name: "Save and exit", exact: true }).click();
      await page.waitForURL(origin + "/dashboard");
      assert.equal(saveCalls(requests).length, 0);

      await page.goto(origin + "/create");
      await page.getByRole("heading", { name: "Start from a template", exact: true }).waitFor();
      await page.getByLabel("Close").click();
      await page.waitForURL(origin + "/dashboard");
      assert.equal(saveCalls(requests).length, 0);
    },
  );
  await run(
    "Organization drafts resume, enforce words and submit real pending records",
    async ({ page, requests }) => {
      await page.goto(origin + "/register-org?draftId=draft-org");
      await page.getByRole("heading", { name: "Review before publishing", exact: true }).waitFor();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByLabel("About your org", { exact: true }).fill(words(99));
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByText("Write 100 to 200 words about your organization.", { exact: true })
        .waitFor();
      await page.getByLabel("About your org", { exact: true }).fill(words(200));
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByPlaceholder("www.your-website.com").fill("www.riverlight.example");
      await page.getByRole("button", { name: "Add link", exact: true }).click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Submit for review", exact: true }).click();
      await page.waitForURL(origin + "/org/draft-org");
      assert.equal(submitCalls(requests).length, 1);
      assert.deepEqual(saveCalls(requests)[0].body.externalLinks, [
        "https://www.riverlight.example/",
      ]);
    },
  );
  await run(
    "Partial image uploads preserve success and private document uploads use real folders",
    async ({ page, requests }) => {
      await page.goto(origin + "/register-org?draftId=draft-org");
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByLabel("Organization photos", { exact: true }).setInputFiles([
        { name: "one.png", mimeType: "image/png", buffer: png },
        { name: "two.png", mimeType: "image/png", buffer: png },
      ]);
      await page.getByText("Second photo failed", { exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: /Remove photo/ }).count(), 4);
      await page
        .getByLabel("Registration evidence", { exact: true })
        .setInputFiles({
          name: "letter.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\nQA document"),
        });
      await page.getByText("Document 2", { exact: true }).waitFor();
      const uploads = requests.filter((r) => r.path === "/media/upload");
      assert.equal(uploads.length, 3);
      assert(uploads[0].multipart.includes("organization-photo"));
      assert(uploads[2].multipart.includes("organization-document"));
    },
    { uploadFailure: true },
  );
  await run(
    "Six templates preserve the author story and rejected organizations are not selectable",
    async ({ page }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      const story = page.getByPlaceholder(/Who you serve, what you need/);
      assert.equal(await story.inputValue(), words(100));
      await page.getByRole("button", { name: /Medical outreach/ }).click();
      assert.equal(await story.inputValue(), words(100));
      assert.equal(
        await page
          .getByRole("combobox", { name: "Raising for", exact: true })
          .locator("option")
          .filter({ hasText: "Rejected Ministry" })
          .count(),
        0,
      );
    },
  );
  await run(
    "Campaign uses the saved profile payout destination and submits after actual backend review acknowledgement",
    async ({ page, requests }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.getByText("RIVERLIGHT ORGANIZER", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
      await page.getByRole("heading", { name: "Submitted for review", exact: true }).waitFor();
      assert.equal(submitCalls(requests).length, 1);
      assert.equal(
        requests.filter((r) => r.path.endsWith("/payout-account") && r.method === "PATCH").length,
        0,
      );
      await page.getByRole("button", { name: "View campaign", exact: true }).click();
      await page.waitForURL(origin + "/campaign/draft-cause");
    },
  );
  await run(
    "Ongoing campaign frequencies and payload remain real; target is cleared",
    async ({ page, requests }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.getByRole("radio", { name: /^Ongoing/ }).click();
      await page.getByRole("button", { name: "monthly", exact: true }).click();
      await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
      await page.getByRole("heading", { name: "Submitted for review", exact: true }).waitFor();
      const body = saveCalls(requests)[0].body;
      assert.equal(body.mode, "ONGOING");
      assert.equal(body.goalAmount, null);
      assert.deepEqual(body.frequencies, ["MONTHLY"]);
    },
  );
  await run(
    "Pending payout accounts prevent submitting and never request another registration",
    async ({ page, requests }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
      await page.getByText(/Your account is already saved but needs verification/).waitFor();
      assert.equal(submitCalls(requests).length, 0);
    },
    { pendingPayout: true },
  );
  await run(
    "Submission errors retain the draft and do not show fabricated Submitted success",
    async ({ page, requests }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
      await page.getByText(/Review submission unavailable/).waitFor();
      assert.equal(
        await page.getByRole("heading", { name: "Submitted for review", exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("textbox", { name: "Title", exact: false }).inputValue(),
        draftCampaign.title,
      );
      assert.equal(submitCalls(requests).length, 1);
    },
    { submitFailure: true },
  );
  await run("NaN/fractional goals and story overflow fail locally", async ({ page, requests }) => {
    await page.goto(origin + "/create?draftId=draft-cause");
    await page.getByLabel("Amount needed", { exact: true }).fill("100.50");
    await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
    await page.getByText(/Set a whole-naira goal/).waitFor();
    assert.equal(submitCalls(requests).length, 0);
    await page.getByPlaceholder(/Who you serve, what you need/).fill(words(201));
    await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
    await page.getByText(/Tell your campaign story in 100 to 200 words/).waitFor();
  });
  await run(
    "Auto-approved submissions show the actual approved status",
    async ({ page }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.getByRole("button", { name: "Submit for review", exact: true }).last().click();
      await page.getByRole("heading", { name: "Campaign approved", exact: true }).waitFor();
    },
    { autoApprove: true },
  );
  await run(
    "Guest creation is guarded and never loads private drafts or banks",
    async ({ page, requests }) => {
      await page.goto(origin + "/create?draftId=draft-cause");
      await page.waitForURL(origin + "/");
      assert.equal(
        requests.filter((r) => r.path.startsWith("/me/") || r.path.includes("/drafts/")).length,
        0,
      );
    },
    { guest: true },
  );
  console.log(`Creation restoration: ${passes} checks passed; isolated fixtures only.`);
} finally {
  await browser.close();
}
