import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const referenceUrl = process.env.QA_REFERENCE_URL ?? "http://127.0.0.1:18220";
const frontendUrl = process.env.QA_FE_URL ?? "http://127.0.0.1:18221";
const api = process.env.QA_API_URL ?? "http://127.0.0.1:19000";
const out = process.env.QA_ARTIFACTS ?? "/private/tmp/azarfaith-dashboard-parity";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const now = new Date("2026-10-12T12:00:00Z");
const results = [],
  failures = [];
const image =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#d0c8ba"/><circle cx="50" cy="42" r="20" fill="#87927a"/></svg>';
async function prepare(context) {
  await context.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: image }),
  );
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await context.route("https://fonts.gstatic.com/**", (route) => route.abort());
}
function giftDate(age) {
  const match = age.match(/(\d+)\s*([hdw])/);
  if (!match) throw new Error("Unknown designer fixture date: " + age);
  return new Date(
    now.getTime() - Number(match[1]) * { h: 3600000, d: 86400000, w: 604800000 }[match[2]],
  ).toISOString();
}
async function geometry(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    const find = (text) =>
      [...main.querySelectorAll("h2,p")].find((el) => el.textContent.trim() === text);
    const measure = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect(),
        css = getComputedStyle(element);
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        fontWeight: css.fontWeight,
        letterSpacing: css.letterSpacing,
        color: css.color,
        background: css.backgroundColor,
        radius: css.borderRadius,
      };
    };
    const payout = find("Available to pay out")?.parentElement;
    return {
      heading: measure(main.querySelector("h1")),
      quickStart: measure(find("Quick start guide")?.closest("section")),
      learn: measure(find("Learn the basics")?.parentElement),
      organization: measure(main.querySelector(".rounded-card.p-4")),
      metrics: measure(main.querySelector("dl")),
      campaignPanel: measure(find("Campaigns")?.closest("section")),
      recentGifts: measure(find("Recent gifts")?.closest("section")),
      payout: measure(payout),
      todo: measure(find("To do")?.parentElement),
      review: measure(
        [...main.querySelectorAll("p")].find((el) =>
          el.textContent.includes("We're reviewing your organization"),
        )?.parentElement,
      ),
      overflow: document.documentElement.scrollWidth,
    };
  });
}
try {
  for (const width of [390, 820, 1024, 1440])
    for (const state of ["onboarding", "verified", "pending"]) {
      if (process.env.QA_FILTER && !`${state} ${width}`.includes(process.env.QA_FILTER)) continue;
      const referenceContext = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const liveContext = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const reference = await referenceContext.newPage(),
        live = await liveContext.newPage(),
        errors = [];
      reference.on("pageerror", (error) => errors.push("reference: " + error.message));
      live.on("pageerror", (error) => errors.push("frontend: " + error.message));
      reference.setDefaultTimeout(15000);
      live.setDefaultTimeout(15000);
      try {
        await prepare(referenceContext);
        await prepare(liveContext);
        await live.clock.setFixedTime(now);
        await referenceContext.addCookies([{ name: "af_session", value: "1", url: referenceUrl }]);
        await reference.goto(referenceUrl + "/dashboard");
        await reference.waitForFunction(() =>
          document.documentElement.classList.contains("hydrated"),
        );
        // Freeze only after reference hydration, so its SSR clock still matches its initial client render.
        await reference.clock.setFixedTime(now);
        await reference.evaluate(async () => {
          const { useApp } = await import("/src/lib/store.ts");
          useApp.getState().setMyOrgId("o1");
        });
        await reference.getByText("ECWA Mission Board", { exact: true }).waitFor();
        const fixture = await reference.evaluate(async (state) => {
          const { useApp } = await import("/src/lib/store.ts");
          const { me } = await import("/src/lib/mock.ts");
          if (state === "onboarding") useApp.getState().setMyOrgId(null);
          if (state !== "onboarding") {
            if (state === "pending")
              useApp.setState({
                orgs: useApp
                  .getState()
                  .orgs.map((org) =>
                    org.id === "o1" ? { ...org, verificationStatus: "pending" } : org,
                  ),
                campaigns: useApp
                  .getState()
                  .campaigns.map((campaign) =>
                    campaign.orgId === "o1"
                      ? { ...campaign, verificationStatus: "pending" }
                      : campaign,
                  ),
              });
            useApp.getState().setMyOrgId("o1");
          }
          const store = useApp.getState();
          const org = state === "onboarding" ? null : store.orgs.find((org) => org.id === "o1");
          return {
            me,
            org,
            campaigns: org ? store.campaigns.filter((c) => c.orgId === org.id) : [],
          };
        }, state);
        await reference.locator("main h1").waitFor();
        // This developer-only sample-state switch is intentionally absent from the live product.
        await reference
          .locator("main p")
          .filter({ hasText: "Prototype:" })
          .evaluateAll((elements) =>
            elements.forEach((el) => {
              el.style.display = "none";
            }),
          );
        const original = fixture.org,
          campaigns = fixture.campaigns;
        const org = original
          ? {
              id: original.id,
              name: original.name,
              location: original.location,
              cover: original.photos[0],
              isDraft: false,
              verificationStatus: original.verificationStatus,
              reviewAction: null,
              reviewReason: null,
              submittedAt: now.toISOString(),
              hasRegistrationDocuments: true,
            }
          : null;
        const data = {
          fullName: fixture.me.name,
          organizations: org ? [org] : [],
          selectedOrganization: org,
          reviewProgress: org ? { documentsChecked: false, leadershipChecked: false } : null,
          period: { start: "2026-10-01", end: "2026-11-01", timezone: "UTC" },
          giving: { lifetime: 0, thisMonth: 0, campaignsSupported: 0, activeRecurring: 0 },
          overview: {
            totalReceived: original?.totalReceived ?? 0,
            thisMonthReceived: original ? Math.round(original.totalReceived * 0.09) : 0,
            giftsReceived: 0,
            givers: original?.supporters ?? 0,
            recurringSupporters: original ? Math.round(original.supporters * 0.18) : 0,
            liveCampaigns: campaigns.filter((c) => c.verificationStatus === "verified").length,
            pendingCampaigns: 0,
          },
          campaigns: campaigns.map((c) => ({
            id: c.id,
            title: c.title,
            cover: c.cover,
            goal: c.goal ?? null,
            raised: c.raised,
            givers: c.donors,
            giftCount: c.donors,
            galleryCount: c.gallery.length,
            lastUpdateAt: c.updates[0]?.date ?? null,
            mode: c.mode,
            verificationStatus: c.verificationStatus,
            isDraft: false,
            reviewAction: null,
            reviewReason: null,
          })),
          recentGifts: campaigns
            .flatMap((c) =>
              c.donations.map((g) => ({
                id: g.id,
                amount: g.amount,
                donorName: g.donor,
                date: giftDate(g.date),
                campaignId: c.id,
                campaignTitle: c.title,
                note: g.note,
                canThank: g.donor !== "Anonymous",
              })),
            )
            .slice(0, 6),
          payout: {
            availableBalance: state === "verified" ? Math.round(original.totalReceived * 0.031) : 0,
            totalPlatformFees: 0,
            totalReleased: 0,
            account:
              state === "verified"
                ? { status: "verified", bankName: "QA Bank", accountNumberLast4: "4821" }
                : null,
          },
        };
        // Designer estimates are used only to equalize test content, never imported by the app.
        await liveContext.route(api + "/**", (route) => {
          const req = route.request(),
            path = new URL(req.url()).pathname;
          const headers = {
            "access-control-allow-origin": frontendUrl,
            "access-control-allow-credentials": "true",
            "access-control-allow-methods": "GET,OPTIONS",
            "access-control-allow-headers": "content-type",
          };
          if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
          let body,
            status = 200;
          if (path === "/auth/session")
            body = {
              user: {
                id: "qa",
                fullName: fixture.me.name,
                email: "qa@example.invalid",
                role: "donor",
                status: "active",
                isVerified: true,
              },
            };
          else if (path === "/me/dashboard") body = data;
          else if (path === "/me/notifications")
            body = { items: [], page: 1, pageSize: 8, total: 0, unreadCount: 0 };
          else if (path === "/me/payout-requests") body = [];
          else {
            status = 404;
            body = { message: "Unexpected comparison endpoint" };
          }
          return route.fulfill({
            status,
            headers,
            contentType: "application/json",
            body: JSON.stringify(body),
          });
        });
        await live.goto(frontendUrl + "/dashboard");
        await live
          .getByText(state === "onboarding" ? "Quick start guide" : "Available to pay out", {
            exact: true,
          })
          .waitFor();
        if (state === "verified")
          await live.getByRole("button", { name: "Pay out now", exact: true }).waitFor();
        for (const page of [reference, live]) {
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(250);
        }
        const source = await geometry(reference),
          restored = await geometry(live);
        await reference.screenshot({
          path: `${out}/reference-${state}-${width}.png`,
          fullPage: true,
        });
        await live.screenshot({ path: `${out}/restored-${state}-${width}.png`, fullPage: true });
        const deltas = {};
        for (const key of Object.keys(source).filter((key) => key !== "overflow")) {
          assert.equal(
            Boolean(restored[key]),
            Boolean(source[key]),
            `${key}: source section presence`,
          );
          if (!source[key]) continue;
          deltas[key] = {};
          for (const axis of ["x", "y", "width", "height"]) {
            const delta = restored[key][axis] - source[key][axis];
            deltas[key][axis] = delta;
            assert(
              Math.abs(delta) <= 1,
              `${key}.${axis}: ${delta}px difference at ${width} ${state}`,
            );
          }
          for (const property of [
            "fontSize",
            "lineHeight",
            "fontWeight",
            "letterSpacing",
            "color",
            "background",
            "radius",
          ])
            assert.equal(
              restored[key][property],
              source[key][property],
              `${key}.${property}: source styling`,
            );
        }
        assert(source.overflow <= width + 1 && restored.overflow <= width + 1);
        assert.deepEqual(errors, []);
        results.push({ width, state, source, restored, deltas });
        console.log(`PASS Source dashboard geometry ${state} ${width}`);
      } catch (error) {
        failures.push(`${state} ${width}: ${error.message}`);
        console.error("FAIL " + failures.at(-1));
      } finally {
        await referenceContext.close();
        await liveContext.close();
      }
    }
} finally {
  await browser.close();
  writeFileSync(out + "/geometry.json", JSON.stringify({ results, failures }, null, 2));
}
console.log(`Dashboard parity: ${results.length} comparisons passed`);
if (failures.length) process.exitCode = 1;
