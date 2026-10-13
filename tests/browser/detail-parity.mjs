import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const referenceUrl = process.env.QA_REFERENCE_URL ?? "http://127.0.0.1:18220",
  liveUrl = process.env.QA_FE_URL ?? "http://127.0.0.1:18221",
  api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-detail-parity";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const report = [];
async function prepare(context) {
  await context.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#a7b9a1"/></svg>',
    }),
  );
  const css = readFileSync(
    new URL("../../src/components/landing/landing.css", import.meta.url),
    "utf8",
  )
    .split("@theme inline")[0]
    .replaceAll("AzarFaith Landing", "Google Sans Flex");
  await context.route("https://fonts.googleapis.com/**", (r) =>
    r.fulfill({ contentType: "text/css", body: css }),
  );
  await context.route("https://accounts.google.com/**", (r) => r.abort());
}
async function measure(page, kind) {
  return page.evaluate((kind) => {
    const main = document.querySelector("main"),
      aside = document.querySelector("aside");
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
    const data = {
      heading: box(main?.querySelector("h1")),
      overflow: document.documentElement.scrollWidth,
    };
    if (kind === "campaign") {
      data.gallery = box(main.querySelector('div[class*="aspect-[4/3]"]'));
      data.givePanel = box(aside?.firstElementChild?.firstElementChild);
    }
    if (kind === "organization") {
      data.mosaic = box(main?.firstElementChild);
      data.about = box(main.querySelector("section"));
      data.identity = box(main.querySelector('div[class*="border-b"][class*="pt-4"]'));
    }
    if (kind === "checkout") {
      data.firstStep = box(main.querySelector("section"));
      data.firstAmount = box(
        [...main.querySelectorAll('button[role="radio"]')].find((b) =>
          b.textContent.includes("₦5,000"),
        ),
      );
      data.aside = box(aside);
    }
    return data;
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
    await ref.goto(referenceUrl + "/campaign/gfc1");
    await ref.locator("main h1").waitFor();
    const fixtures = await ref.evaluate(async () => {
      const { useApp } = await import("/src/lib/store.ts");
      return { campaigns: useApp.getState().campaigns, orgs: useApp.getState().orgs };
    });
    const c = fixtures.campaigns.find((c) => c.id === "gfc1"),
      org = fixtures.orgs.find((o) => o.id === c.orgId);
    const campaigns = fixtures.campaigns.map((c) => ({
      ...c,
      ownerId: "owner",
      isPublic: true,
      isDraft: false,
      currency: "NGN",
    }));
    const orgs = fixtures.orgs.map((o) => ({
      ...o,
      ownerId: "owner",
      isPublic: true,
      isDraft: false,
      registrationDocuments: [],
      links: [],
      campaigns: campaigns.filter((c) => c.orgId === o.id || o.campaignIds.includes(c.id)),
    }));
    await lc.route(api + "/**", (r) => {
      const path = new URL(r.request().url()).pathname,
        headers = {
          "access-control-allow-origin": liveUrl,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type",
        };
      if (r.request().method() === "OPTIONS") return r.fulfill({ status: 204, headers });
      let data = {};
      if (path === "/auth/session")
        data = {
          user: {
            id: "qa",
            fullName: "Tunde Adebayo",
            email: "qa@example.invalid",
            role: "donor",
            status: "active",
            isVerified: true,
          },
        };
      else if (path === "/me/notifications") data = { items: [], total: 0, unreadCount: 0 };
      else if (path.endsWith("/checkout"))
        data = {
          currency: "NGN",
          platformFeePercent: 2.5,
          minDonation: 100,
          maxDonation: 5000000,
          frequencies: c.frequencies.map((f) => f.toUpperCase()),
          recurringGift: null,
        };
      else if (path.endsWith("/comments/reactions"))
        data = c.comments.map((c) => ({ id: c.id, count: 0, liked: false }));
      else if (path.startsWith("/campaigns/"))
        data = campaigns.find((c) => path === "/campaigns/" + c.id);
      else if (path.startsWith("/organizations/"))
        data = orgs.find((o) => path === "/organizations/" + o.id);
      else if (path === "/me/payment-methods") data = [];
      return r.fulfill({ headers, contentType: "application/json", body: JSON.stringify(data) });
    });
    for (const [kind, path] of [
      ["campaign", "/campaign/gfc1"],
      ["organization", "/org/" + org.id],
      ["checkout", "/donate/gfc1?freq=once&amount=10000"],
    ]) {
      await ref.goto(referenceUrl + path);
      await live.goto(liveUrl + path);
      await ref.locator("main h1").waitFor();
      await live.locator("main h1").waitFor();
      if (kind !== "checkout")
        await live
          .getByRole("radio", { name: "Monthly", exact: true })
          .filter({ visible: true })
          .first()
          .waitFor();
      for (const page of [ref, live]) {
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
      }
      const a = await measure(ref, kind),
        b = await measure(live, kind);
      const differences = [];
      for (const key of Object.keys(a)) {
        if (key === "overflow" || !a[key] || !b[key]) continue;
        for (const prop of kind === "checkout" && key === "aside"
          ? ["x", "y", "width"]
          : ["x", "y", "width", "height"])
          if (Math.abs(a[key][prop] - b[key][prop]) > 1)
            differences.push(`${key}.${prop}: ${a[key][prop]} vs ${b[key][prop]}`);
        for (const prop of ["fontSize", "lineHeight", "fontWeight", "color", "radius"])
          if (a[key][prop] !== b[key][prop])
            differences.push(`${key}.${prop}: ${a[key][prop]} vs ${b[key][prop]}`);
      }
      assert(b.overflow <= width + 1);
      report.push({ width, kind, reference: a, restored: b, differences });
      assert.deepEqual(
        differences,
        [],
        kind + " " + width + "px source geometry/style differences",
      );
      await ref.screenshot({ path: out + `/reference-${kind}-${width}.png`, fullPage: true });
      await live.screenshot({ path: out + `/restored-${kind}-${width}.png`, fullPage: true });
      console.log(
        `${kind} ${width}px: ${differences.length ? differences.join("; ") : "core geometry/styles match"}`,
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
