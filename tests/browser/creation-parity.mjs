import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const referenceUrl = process.env.QA_REFERENCE_URL ?? "http://127.0.0.1:18220",
  origin = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000",
  out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-creation-parity";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const report = [];
const css = readFileSync(
  new URL("../../src/components/landing/landing.css", import.meta.url),
  "utf8",
)
  .split("@theme inline")[0]
  .replaceAll("AzarFaith Landing", "Google Sans Flex");
async function prepare(ctx) {
  await ctx.route("https://fonts.googleapis.com/**", (r) =>
    r.fulfill({ contentType: "text/css", body: css }),
  );
  await ctx.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#c3c9b9"/></svg>',
    }),
  );
  await ctx.route("https://accounts.google.com/**", (r) => r.abort());
}
async function measure(page, kind) {
  return page.evaluate((kind) => {
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect(),
        s = getComputedStyle(el);
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
    const main = document.querySelector("main");
    let result = { overflow: document.documentElement.scrollWidth };
    if (kind === "organization") {
      result.card = box(main.firstElementChild);
      result.title = box(main.querySelector("h1"));
      result.input = box(main.querySelector("input"));
      result.preview = box(document.querySelector("aside .w-full.max-w-\\[380px\\]"));
    }
    if (kind === "campaign") {
      result.main = box(main);
      result.template = box(document.getElementById("template"));
      result.templateFirst = box(document.querySelector("#template button"));
      result.titleInput = box(document.querySelector("#basics input"));
      result.previewAside = box([...document.querySelectorAll("aside")].at(-1));
    }
    if (kind === "profile") {
      result.header = box(main.querySelector("div.border-b"));
      result.title = box(main.querySelector("h1"));
      result.firstField = box(main.querySelector("#profile input"));
      result.firstGrid = box(main.querySelector("#profile .grid"));
      result.nav = box(main.querySelector('nav[aria-label="Settings"]'));
      result.panel = box(main.querySelector("section#profile"));
    }
    return result;
  }, kind);
}
try {
  for (const width of [390, 820, 1024, 1440]) {
    const rc = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      }),
      lc = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    await prepare(rc);
    await prepare(lc);
    await rc.addCookies([{ name: "af_session", value: "1", url: referenceUrl }]);
    const ref = await rc.newPage(),
      live = await lc.newPage(),
      errors = [];
    for (const p of [ref, live]) p.on("pageerror", (e) => errors.push(e.message));
    await ref.goto(referenceUrl + "/profile");
    await ref.locator("main h1").waitFor();
    const fixture = await ref.evaluate(async () => {
      const { me } = await import("/src/lib/mock.ts"),
        { useApp } = await import("/src/lib/store.ts");
      return { me, orgs: useApp.getState().orgs };
    });
    const user = {
        id: "qa",
        fullName: fixture.me.name,
        avatarUrl: fixture.me.avatar,
        email: "tunde@azarfaith.com",
        phone: "+234 803 000 0000",
        role: "donor",
        status: "active",
        isVerified: true,
      },
      profile = {
        ...user,
        city: fixture.me.location,
        createdAt: "2024-01-01",
        totalGiven: fixture.me.totalGiven,
        activeRecurringGiftCount: 0,
        ownedOrganizations: fixture.orgs.map((o) => ({
          id: o.id,
          name: o.name,
          verificationStatus: o.verificationStatus,
        })),
        ownedCampaigns: [],
        donationHistory: [],
        verifications: fixture.me.verifications,
      };
    await lc.route(api + "/**", (r) => {
      const path = new URL(r.request().url()).pathname,
        headers = {
          "access-control-allow-origin": origin,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
          "access-control-allow-headers": "content-type",
        };
      if (r.request().method() === "OPTIONS") return r.fulfill({ status: 204, headers });
      let data = {};
      if (path === "/auth/session") data = { user };
      else if (path === "/me/profile") data = profile;
      else if (path === "/media/cloudinary/status") data = { enabled: true };
      else if (path === "/me/notifications") data = { items: [], total: 0, unreadCount: 0 };
      else if (path === "/me/notification-preferences")
        data = {
          donationsReceived: true,
          campaignUpdates: true,
          comments: true,
          systemMessages: true,
        };
      else if (path === "/me/payment-methods") data = [];
      else if (path === "/me/payout-banks") data = [];
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
      return r.fulfill({ headers, contentType: "application/json", body: JSON.stringify(data) });
    });
    for (const [kind, path] of [
      ["organization", "/register-org"],
      ["campaign", "/create"],
      ["profile", "/profile"],
    ]) {
      await ref.goto(referenceUrl + path);
      await live.goto(origin + path);
      await ref.locator("main").waitFor();
      await live.locator("main").waitFor();
      if (kind === "organization") {
        await ref.locator("main h1").waitFor();
        await live.locator("main h1").waitFor();
      }
      if (kind === "campaign") {
        await ref.locator("#template").waitFor();
        await live.locator("#template").waitFor();
      }
      if (kind === "profile") {
        await ref.locator("#profile input").first().waitFor();
        await live.locator("#profile input").first().waitFor();
      }
      for (const p of [ref, live]) {
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(300);
      }
      const a = await measure(ref, kind),
        b = await measure(live, kind),
        differences = [];
      for (const key of Object.keys(a)) {
        if (key === "overflow" || !a[key] || !b[key]) continue;
        const props = ["x", "y", "width", "height"].filter(
          (p) =>
            !(
              ((kind === "organization" && key === "card") ||
                (kind === "campaign" && ["main", "previewAside"].includes(key)) ||
                (kind === "profile" && ["panel", "nav"].includes(key))) &&
              p === "height"
            ),
        );
        for (const p of props)
          if (Math.abs(a[key][p] - b[key][p]) > 1)
            differences.push(`${key}.${p}: ${a[key][p]} vs ${b[key][p]}`);
        for (const p of ["fontSize", "lineHeight", "fontWeight", "color", "radius"])
          if (a[key][p] !== b[key][p])
            differences.push(`${key}.${p}: ${a[key][p]} vs ${b[key][p]}`);
      }
      assert(b.overflow <= width + 1);
      report.push({ kind, width, reference: a, restored: b, differences });
      assert.deepEqual(differences, [], kind + " " + width + " core geometry/style mismatch");
      await ref.screenshot({ path: out + `/reference-${kind}-${width}.png`, fullPage: true });
      await live.screenshot({ path: out + `/restored-${kind}-${width}.png`, fullPage: true });
      console.log(
        kind +
          " " +
          width +
          "px: " +
          (differences.length ? differences.join("; ") : "core geometry/styles match"),
      );
    }
    assert.deepEqual(errors, []);
    await rc.close();
    await lc.close();
  }
} finally {
  writeFileSync(out + "/geometry.json", JSON.stringify(report, null, 2));
  await browser.close();
}
