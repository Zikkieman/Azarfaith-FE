import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000",
  refOrigin = process.env.QA_REFERENCE_URL ?? "http://127.0.0.1:18220",
  out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-admin-parity";
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
    failed = false;
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
    } else if (options.failure && path === options.failure && !failed) {
      failed = true;
      status = 503;
      data = { message: "Unavailable" };
    } else if (path === "/admin/review/dashboard")
      data = {
        totalUsers: 10,
        totalOrganizations: 5,
        verifiedOrganizations: 3,
        pendingOrganizations: options.empty ? 0 : (options.orgs?.length ?? 7),
        activeCampaigns: 4,
        pendingCampaigns: options.empty ? 0 : (options.campaigns?.length ?? 6),
        totalRaised: 0,
        donationChart: [],
        campaignStatusChart: [],
        recentActivity: [],
      };
    else if (path.startsWith("/admin/review/directory/")) {
      const kind = path.split("/").at(-1),
        items =
          kind === "organization"
            ? (options.orgs ?? orgs)
            : kind === "campaign"
              ? (options.campaigns ?? campaigns)
              : [];
      data = {
        items: options.empty ? [] : items,
        total: options.empty
          ? 0
          : kind === "organization"
            ? items.length
            : kind === "campaign"
              ? items.length
              : (options.suspended ?? 3),
        page: 1,
        pageSize: Number(u.searchParams.get("pageSize") ?? 4),
        hasMore: kind !== "user",
      };
    } else if (path === "/admin/review/analytics")
      data = options.analytics ?? analytics(u.searchParams.get("range") ?? "7d");
    else if (path === "/admin/review/activity")
      data = {
        items:
          options.empty || options.activityEmpty
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

const report = [];
async function measure(p) {
  return p.evaluate(() => {
    const box = (e) => {
      const b = e.getBoundingClientRect(),
        s = getComputedStyle(e);
      return {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        fontWeight: s.fontWeight,
        color: s.color,
        radius: s.borderRadius,
      };
    };
    const main = document.querySelector("main"),
      sections = [...main.querySelectorAll(":scope > section")],
      queues = [...main.querySelectorAll(":scope > div.grid > section")];
    return {
      main: box(main),
      title: box(main.querySelector("h1")),
      orgQueue: box(queues[0]),
      campaignQueue: box(queues[1]),
      giving: box(sections[0]),
      strip: box(main.querySelector("dl")),
      chart: box(main.querySelector("figure")),
      activity: box(sections[1]),
      header: box(document.querySelector("header")),
      overflow: document.documentElement.scrollWidth,
    };
  });
}
try {
  for (const width of [390, 820, 1024, 1440])
    for (const empty of [false, true]) {
      const rc = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        }),
        lc = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        });
      await assets(rc);
      const r = await rc.newPage(),
        l = await lc.newPage(),
        errors = [];
      for (const p of [r, l]) p.on("pageerror", (e) => errors.push(e.message));
      await r.goto(refOrigin + "/login?redirect=%2Fadmin");
      // The reference prototype has no hydration-ready indicator. Wait for its real click handler.
      await r.waitForFunction(() => {
        const b = [...document.querySelectorAll("button")].find((b) =>
          b.textContent?.includes("Continue with Google"),
        );
        return (
          b &&
          Object.keys(b).some(
            (k) => k.startsWith("__reactProps") && typeof b[k]?.onClick === "function",
          )
        );
      });
      await r.getByRole("button", { name: "Continue with Google" }).click();
      await r.waitForURL((u) => u.pathname.replace(/\/$/, "") === "/admin");
      await r.locator("main figure").first().waitFor();
      await r.locator("main h1").waitFor();
      const seed = await r.evaluate(async (empty) => {
        const { useApp } = await import("/src/lib/store.ts"),
          { me } = await import("/src/lib/mock.ts"),
          { orgFiles } = await import("/src/lib/admin.ts");
        const state = useApp.getState(),
          checks = Object.fromEntries(
            Object.entries(state.checks).map(([k, v]) => [
              k,
              Object.fromEntries(
                Object.entries(v).map(([k, state]) => [k, state === "failed" ? "waiting" : state]),
              ),
            ]),
          );
        const orgs = state.orgs.map((o) => ({
            ...o,
            verificationStatus:
              empty && o.verificationStatus === "pending" ? "verified" : o.verificationStatus,
          })),
          campaigns = state.campaigns.map((c) => ({
            ...c,
            verificationStatus:
              empty && c.verificationStatus === "pending" ? "verified" : c.verificationStatus,
          }));
        useApp.setState({
          orgs,
          campaigns,
          checks,
          auditLog: [],
          adminNotifications: [],
          givingPaused: false,
        });
        return {
          me,
          orgFiles,
          checks,
          orgs: orgs.filter((o) => o.verificationStatus === "pending"),
          campaigns: campaigns.filter((c) => c.verificationStatus === "pending"),
          suspended: state.users.filter((u) => u.status === "suspended").length,
        };
      }, empty);
      const rows = seed.orgs.map((o) => ({
          id: o.id,
          name: o.name,
          image: o.photos[0],
          checks: Object.values(seed.checks[o.id] ?? {}).filter((s) => s === "passed").length,
          submittedAt: seed.orgFiles[o.id]?.submittedAt,
          createdAt: o.createdAt,
        })),
        causes = seed.campaigns.map((c) => ({
          id: c.id,
          name: c.title,
          image: c.cover,
          detail: c.raiser.name,
          submittedAt: c.createdAt,
          createdAt: c.createdAt,
        }));
      const amounts = [245000, 180000, 320000, 195000, 410000, 280000, 150000],
        a = analytics();
      a.series = amounts.map((given, i) => ({
        ...a.series[i],
        date: new Date(Date.UTC(2026, 9, 5 + i)).toISOString().slice(0, 10),
        given,
      }));
      a.current = { given: 1780000, gifts: 214, users: 3, organizations: 1, campaigns: 0 };
      a.change = { given: 12, gifts: 8, users: null, organizations: null, campaigns: null };
      await fixture(lc, {
        orgs: rows,
        campaigns: causes,
        user: { fullName: seed.me.name, avatarUrl: seed.me.avatar },
        analytics: a,
        suspended: seed.suspended,
        empty,
        activityEmpty: true,
      });
      await l.goto(origin + "/admin");
      await l.locator("main h1").waitFor();
      await l.locator("main figure").first().waitFor();
      for (const p of [r, l]) {
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(250);
      }
      const original = await measure(r),
        restored = await measure(l),
        differences = [];
      for (const key of Object.keys(original)) {
        if (key === "overflow") continue;
        const props = ["x", "y", "width", "height"];
        for (const p of props)
          if (Math.abs(original[key][p] - restored[key][p]) > 1)
            differences.push(key + "." + p + ": " + original[key][p] + " vs " + restored[key][p]);
        for (const p of ["fontSize", "lineHeight", "fontWeight", "color", "radius"])
          if (original[key][p] !== restored[key][p])
            differences.push(key + "." + p + ": " + original[key][p] + " vs " + restored[key][p]);
      }
      report.push({ width, empty, original, restored, differences });
      await r.screenshot({
        path: out + "/reference-" + width + "-" + empty + ".png",
        fullPage: true,
      });
      await l.screenshot({
        path: out + "/restored-" + width + "-" + empty + ".png",
        fullPage: true,
      });
      console.log(
        width +
          "px " +
          (empty ? "empty" : "pending") +
          ": " +
          (differences.length ? differences.join("; ") : "core geometry/styles match"),
      );
      assert.deepEqual(differences, [], width + "px core source/restored mismatch");
      assert.deepEqual(errors, []);
      assert(restored.overflow <= width + 1);
      await rc.close();
      await lc.close();
    }
} finally {
  writeFileSync(out + "/geometry.json", JSON.stringify(report, null, 2));
  await browser.close();
}
