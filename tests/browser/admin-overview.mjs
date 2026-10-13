import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000",
  refOrigin = process.env.QA_REFERENCE_URL ?? "http://127.0.0.1:18220",
  out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-admin-overview";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
let passed = 0;
const user = {
  id: "admin-qa",
  fullName: "Riverlight Admin",
  email: "admin@example.com",
  role: "platform_admin",
  status: "active",
  isVerified: true,
};
const date = "2026-10-13T10:00:00Z";
const orgs = Array.from({ length: 4 }, (_, i) => ({
  id: "org-" + i,
  name: "Riverlight " + i,
  detail: "Ibadan, Oyo",
  image: "https://images.unsplash.com/qa.png",
  status: "pending",
  category: "mission",
  mode: null,
  type: null,
  urgency: null,
  amount: 0,
  count: 0,
  createdAt: date,
  submittedAt: date,
  updatedAt: date,
  checks: i,
  emailVerified: null,
}));
const campaigns = orgs.map((o, i) => ({
  ...o,
  id: "campaign-" + i,
  name: "Outreach campaign " + i,
  detail: "Riverlight Owner",
  category: null,
  mode: "one-time",
  type: i === 0 ? "emergency" : "money",
  urgency: i === 0 ? "critical" : "medium",
}));
function analytics(range = "7d") {
  const series = Array.from({ length: range === "30d" ? 30 : 7 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 14 + i)).toISOString().slice(0, 10),
    given: (i + 1) * 1000,
    gifts: 1,
    users: i === 0 ? 3 : 0,
    organizations: i === 0 ? 2 : 0,
    campaigns: i === 0 ? 1 : 0,
  }));
  const current = {
    given: series.reduce((n, p) => n + p.given, 0),
    gifts: series.length,
    users: 3,
    organizations: 2,
    campaigns: 1,
  };
  return {
    range,
    timezone: "UTC",
    from: series[0].date + "T00:00:00Z",
    through: date,
    current,
    previous: current,
    change: { given: 12, gifts: -4, users: null, organizations: null, campaigns: null },
    series,
  };
}
async function assets(c) {
  await c.route("https://fonts.googleapis.com/**", (r) =>
    r.fulfill({
      contentType: "text/css",
      body: readFileSync(
        new URL("../../src/components/landing/landing.css", import.meta.url),
        "utf8",
      )
        .split("@theme inline")[0]
        .replaceAll("AzarFaith Landing", "Google Sans Flex"),
    }),
  );
  await c.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#d4d7c8"/></svg>',
    }),
  );
  await c.route("https://accounts.google.com/**", (r) => r.abort());
}
async function fixture(c, options = {}) {
  const calls = [];
  let session = { ...user, ...options.user },
    noticeRead = false,
    failed = 0;
  await assets(c);
  await c.route(api + "/**", async (r) => {
    const req = r.request(),
      u = new URL(req.url()),
      path = u.pathname,
      method = req.method(),
      headers = {
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-allow-headers": "content-type",
      };
    if (method === "OPTIONS") return r.fulfill({ status: 204, headers });
    const body = req.postData() ? req.postDataJSON() : null;
    calls.push({ path, query: u.search, method, body });
    let data,
      status = 200;
    if (path === "/auth/session") data = { user: options.guest ? null : session };
    else if (path === "/auth/logout") {
      session = null;
      data = { message: "Signed out" };
    } else if (options.expired && path === "/admin/review/analytics") {
      status = 401;
      data = { message: "Session expired" };
      session = null;
    } else if (options.failure && path === options.failure && !options.recovered) {
      failed++;
      status = 503;
      data = { message: "Unavailable" };
    } else if (path === "/admin/review/dashboard")
      data = {
        totalUsers: 10,
        totalOrganizations: 5,
        verifiedOrganizations: 3,
        pendingOrganizations: options.empty ? 0 : 7,
        activeCampaigns: 4,
        pendingCampaigns: options.empty ? 0 : 6,
        totalRaised: 0,
        donationChart: [],
        campaignStatusChart: [],
        recentActivity: [],
      };
    else if (path.startsWith("/admin/review/directory/")) {
      const kind = path.split("/").at(-1),
        items = kind === "organization" ? orgs : kind === "campaign" ? campaigns : [];
      data = {
        items: options.empty ? [] : items,
        total: options.empty ? 0 : kind === "organization" ? 7 : kind === "campaign" ? 6 : 3,
        page: 1,
        pageSize: Number(u.searchParams.get("pageSize") ?? 4),
        hasMore: kind !== "user",
      };
    } else if (path === "/admin/review/analytics")
      data = options.analytics ?? analytics(u.searchParams.get("range") ?? "7d");
    else if (path === "/admin/review/activity")
      data = {
        items: options.empty
          ? []
          : [
              {
                id: "audit",
                action: "ORGANIZATION_APPROVED",
                entityType: "organization",
                entityId: "org-0",
                entityLabel: "Riverlight Mission",
                reason: "Evidence checked",
                createdAt: date,
                actor: { id: "admin", fullName: "Reviewer Ada", email: "ada@example.com" },
              },
            ],
        total: options.empty ? 0 : 1,
        page: 1,
        pageSize: 6,
        hasMore: false,
      };
    else if (path === "/admin/review/giving-control")
      data = {
        givingPaused: options.paused ?? false,
        givingVersion: 1,
        givingPausedAt: date,
        givingPauseReason: "Maintenance",
      };
    else if (path === "/admin/review/notifications/inbox") {
      const page = Number(u.searchParams.get("page") ?? 1),
        items = options.notices
          ? Array.from({ length: 9 }, (_, i) => ({
              id: "note-" + i,
              title: "New organization " + i,
              message: "Review this submission",
              link: "/admin/orgs/org-0",
              createdAt: date,
              read: noticeRead,
            }))
          : [];
      data = {
        items: items.slice((page - 1) * 8, page * 8),
        total: items.length,
        page,
        pageSize: 8,
        unreadCount: noticeRead ? 0 : items.length,
        asOf: date,
      };
    } else if (path.endsWith("/read-all") || path.endsWith("/read")) {
      noticeRead = true;
      data = { message: "Marked read" };
    } else if (path.startsWith("/admin/review/organizations/"))
      data = {
        id: "org-0",
        ownerId: "owner",
        name: "Riverlight Mission",
        totalReceived: 0,
        supporters: 0,
        founded: "2024",
        denomination: "Interdenominational",
        tagline: "Serving families",
        category: "mission",
        verificationStatus: "pending",
        owner: { id: "owner", fullName: "Owner", email: "owner@example.com" },
        location: "Ibadan",
        bio: "Mission",
        photos: [],
        links: [],
        registrationDocuments: [],
        campaigns: [],
        createdAt: date,
        submittedAt: date,
      };
    else if (path.includes("/records/"))
      data = { notes: [], page: 1, pageSize: 8, total: 0, hasMore: false, checklist: [] };
    else {
      status = 404;
      data = { message: "Missing fixture " + path };
    }
    return r.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return calls;
}
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const c = await browser.newContext({
      viewport: { width: options.width ?? 1440, height: 1000 },
      reducedMotion: "reduce",
    }),
    calls = await fixture(c, options),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  try {
    await fn(p, calls, options);
    assert.deepEqual(errors, []);
    passed++;
    console.log("PASS " + name);
  } catch (e) {
    console.error(
      name,
      await p.evaluate(() => ({
        w: innerWidth,
        doc: document.documentElement.scrollWidth,
        over: [...document.querySelectorAll("main *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            text: e.textContent?.slice(0, 80),
            rect: e.getBoundingClientRect().toJSON(),
          }))
          .slice(0, 15),
      })),
    );
    await p.screenshot({ path: out + "/failure.png", fullPage: true }).catch(() => {});
    throw e;
  } finally {
    await c.close();
  }
}
try {
  for (const width of [320, 390, 820, 1440])
    await run(
      "Source admin overview " + width + "px",
      async (p) => {
        await p.goto(origin + "/admin");
        await p.getByRole("heading", { name: /Riverlight/ }).waitFor();
        await p.getByRole("heading", { name: "Organizations to verify" }).waitFor();
        await p.getByRole("table").first().waitFor();
        assert(await p.getByText("13 things are waiting").count());
        assert.equal(await p.locator("main section").first().locator("li").count(), 4);
        assert(
          await p
            .locator("main")
            .innerText()
            .then((t) => t.includes("₦28,000")),
        );
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (width < 1024) {
          await p.getByRole("button", { name: "Open navigation" }).click();
          await p
            .getByRole("dialog")
            .getByRole("link", { name: "Overview", exact: true })
            .waitFor();
          await p.keyboard.press("Escape");
        }
        await p.screenshot({ path: out + "/overview-" + width + ".png", fullPage: true });
      },
      { width },
    );
  await run(
    "Pending queues link to actual PENDING filters and directory links clear them",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.getByRole("link", { name: /^Verify organizations/ }).click();
      await p.waitForURL(/\/admin\/orgs\?view=pending/);
      await p.getByRole("combobox", { name: "Status" }).waitFor();
      assert.equal(await p.getByRole("combobox", { name: "Status" }).inputValue(), "PENDING");
      assert(
        calls.some(
          (c) =>
            c.path.endsWith("/directory/organization") &&
            c.query.includes("status=PENDING") &&
            c.query.includes("pageSize=10"),
        ),
      );
      assert.equal(
        await p.getByRole("link", { name: /^Verify organizations/ }).getAttribute("aria-current"),
        "page",
      );
      await p.getByRole("link", { name: "Organizations", exact: true }).click();
      await p.waitForURL(/view=all/);
      assert.equal(await p.getByRole("combobox", { name: "Status" }).inputValue(), "");
      assert.equal(
        await p
          .getByRole("link", { name: "Organizations", exact: true })
          .getAttribute("aria-current"),
        "page",
      );
    },
  );
  await run(
    "Queue totals and checks come from server rather than visible four rows",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.getByText("3 of 4", { exact: true }).waitFor();
      assert.equal(await p.locator("main section").first().locator("li").count(), 4);
      assert(
        calls.some(
          (c) => c.path.endsWith("/directory/campaign") && c.query.includes("sort=priority"),
        ),
      );
      await p
        .locator("main section")
        .first()
        .getByRole("link", { name: /Review/ })
        .first()
        .click();
      await p.waitForURL(origin + "/admin/orgs/org-0");
      await p.getByRole("heading", { name: "Riverlight Mission", exact: true, level: 1 }).waitFor();
    },
  );
  await run("Range changes use real totals, all 30 days, metrics and CSV", async (p, calls) => {
    await p.goto(origin + "/admin");
    await p.getByRole("tab", { name: "Last 30 days" }).click();
    await p.getByText("₦465,000", { exact: true }).first().waitFor();
    assert.equal(await p.getByRole("table").first().locator("tbody tr").count(), 5);
    await p.getByRole("button", { name: "Open giving report and export" }).click();
    await p.getByLabel("Report metric").selectOption("users");
    assert(
      await p
        .getByRole("table", { name: "Selected reporting metric (UTC)" })
        .innerText()
        .then((t) => t.includes("3")),
    );
    const download = p.waitForEvent("download");
    await p.getByRole("button", { name: "Export report" }).click();
    const d = await download;
    assert.match(d.suggestedFilename(), /30d/);
    const content = readFileSync(await d.path(), "utf8");
    assert.equal(content.trim().split("\r\n").length, 31);
    assert(calls.some((c) => c.query === "?range=30d"));
  });
  await run(
    "Empty queues and activity are genuine empty states",
    async (p) => {
      await p.goto(origin + "/admin");
      await p.getByText("Nothing is waiting for you.").waitFor();
      await p.getByText("No activity yet.").waitFor();
      await p.getByText("No applications waiting. New organizations show up here.").waitFor();
    },
    { empty: true },
  );
  await run(
    "Queue outage is not presented as an empty or zero queue",
    async (p, _calls, options) => {
      await p.goto(origin + "/admin");
      await p.getByText("Could not load this review queue.").waitFor();
      assert.equal(
        await p.getByText("No applications waiting. New organizations show up here.").count(),
        0,
      );
      options.recovered = true;
      await p.getByRole("button", { name: "Retry", exact: true }).click();
      await p.getByText("Riverlight 0", { exact: true }).waitFor();
    },
    { failure: "/admin/review/directory/organization" },
  );
  await run(
    "Analytics outage retries without invented money",
    async (p, _calls, options) => {
      await p.goto(origin + "/admin");
      await p.getByText("Could not load giving analytics.").waitFor();
      assert.equal(await p.getByText("₦0", { exact: true }).count(), 0);
      options.recovered = true;
      await p.getByRole("button", { name: "Retry", exact: true }).click();
      await p.getByText("₦28,000", { exact: true }).first().waitFor();
    },
    { failure: "/admin/review/analytics" },
  );
  await run(
    "Paused-giving notice comes from actual platform state",
    async (p) => {
      await p.goto(origin + "/admin");
      await p.getByText(/New gifts and recurring charges are blocked/).waitFor();
    },
    { paused: true },
  );
  await run(
    "Search palette queries real directories and navigates to matching record",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.getByRole("button", { name: "Search", exact: true }).click();
      await p.getByLabel("Search organizations campaigns or users").fill("Riverlight");
      await p
        .getByRole("dialog")
        .getByRole("button", { name: /Riverlight 0/ })
        .click();
      await p.waitForURL(origin + "/admin/orgs/org-0");
      assert(calls.some((c) => c.query.includes("search=Riverlight")));
    },
  );
  await run(
    "Admin account menu stays on admin profile and logout calls backend",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.getByRole("button", { name: /Riverlight Admin Platform admin/ }).click();
      assert.equal(
        await p.getByRole("menuitem", { name: "Your profile" }).getAttribute("href"),
        "/admin/profile",
      );
      await p.getByRole("menuitem", { name: "Log out" }).click();
      await p.waitForURL(origin + "/admin/login");
      assert(calls.some((c) => c.path === "/auth/logout" && c.method === "POST"));
    },
  );
  await run(
    "Real admin inbox count, paging and read-all snapshot",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.getByRole("button", { name: "Admin notifications, 9 unread" }).click();
      await p.getByRole("button", { name: "Load more" }).click();
      await p.getByRole("link", { name: /^New organization 8/ }).waitFor();
      const dim = await p
        .getByRole("dialog")
        .evaluate((e) => ({ h: e.getBoundingClientRect().height, max: innerHeight / 2 }));
      assert(dim.h <= dim.max + 1);
      await p.getByRole("button", { name: "Mark all read", exact: true }).click();
      await p.getByRole("button", { name: "Close notifications" }).click();
      await p.getByRole("button", { name: "Admin notifications", exact: true }).waitFor();
      assert.equal(calls.find((c) => c.path.endsWith("/read-all")).body.through, date);
    },
    { notices: true },
  );
  await run(
    "Donors cannot enter admin or request protected overview data",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.waitForURL(origin + "/");
      assert.equal(calls.filter((c) => c.path.startsWith("/admin/")).length, 0);
    },
    { user: { role: "donor" } },
  );
  await run(
    "Guests go to admin login without protected requests",
    async (p, calls) => {
      await p.goto(origin + "/admin");
      await p.waitForURL(origin + "/admin/login");
      assert.equal(calls.filter((c) => c.path.startsWith("/admin/")).length, 0);
    },
    { guest: true },
  );
  await run(
    "Expired session is rechecked and protected overview disappears",
    async (p) => {
      await p.goto(origin + "/admin");
      await p.waitForURL(origin + "/admin/login");
      assert.equal(await p.getByRole("heading", { name: "Organizations to verify" }).count(), 0);
    },
    { expired: true },
  );
  console.log("ADMIN OVERVIEW QA: " + passed + " checks passed");
} finally {
  await browser.close();
}
