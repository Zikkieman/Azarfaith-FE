import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");

const origin = "http://127.0.0.1:18080", api = "http://127.0.0.1:19000";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const user = { id: "owner", fullName: "Riverlight Donor", email: "owner@example.com", role: "donor", status: "active", isVerified: true, phone: "+2348012345678" };
const baseline = { ...user, createdAt: "2026-01-01T00:00:00Z", totalGiven: 15000, activeRecurringGiftCount: 1, avatarUrl: null, ownedOrganizations: [{ id: "org", name: "Riverlight Mission", verificationStatus: "verified" }], ownedCampaigns: [{ id: "cause", title: "Riverlight Outreach", verificationStatus: "verified" }], donationHistory: [], verifications: ["Email verified"] };
const saved = { id: "bank", ownerType: "user", bankCode: "001", bankName: "Alpha Bank", accountHolderName: "Riverlight Donor", accountName: "RIVERLIGHT DONOR", accountNumberMasked: "******5678", status: "verified" };
const card = { id: "card", email: user.email, channel: "card", label: "VISA ending in 1234", reusable: true, active: true, linkedRecurringGiftCount: 0, linkedRecurringGiftTitles: [] };
let passed = 0;
async function run(name, fn, options = {}) {
  if (process.env.QA_FILTER && !name.includes(process.env.QA_FILTER)) return;
  const context = await browser.newContext({ viewport: { width: options.width ?? 1440, height: options.height ?? 1000 } });
  const page = await context.newPage(), requests = [], errors = [];
  page.setDefaultTimeout(15000); page.on("pageerror", (error) => errors.push(error.message));
  await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await context.route("https://accounts.google.com/**", (route) => route.abort());
  let profile = { ...structuredClone(baseline), avatarUrl: options.avatarUrl ?? null }, preferences = { donationsReceived: true, campaignUpdates: true, comments: true, systemMessages: true }, payout = structuredClone(saved), cards = [structuredClone(card)];
  await context.route("https://fixture.example/**", (route) => {
    if (new URL(route.request().url()).pathname === "/broken-avatar.png") return route.abort();
    return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBMUAAAAASUVORK5CYII=", "base64") });
  });
  let profileFails = options.profileFails ?? 0, prefSaveFails = options.prefSaveFails ?? 0, prefReadFails = options.prefReadFails ?? 0, passwordFails = options.passwordFails ?? 0, notificationFails = options.notificationFails ?? 0, readFails = options.readFails ?? 0;
  let signedOut = options.guest ?? false;
  let profileGets = 0;
  const notices = Array.from({ length: 11 }, (_, index) => ({ id: `notice-${index}`, type: "system", title: `Real notification ${index + 1}`, message: `Actual event ${index + 1}`, link: "/profile", createdAt: "2026-10-10T00:00:00Z", read: index > 2 }));
  await context.route(`${api}/**`, async (route) => {
    const req = route.request(), url = new URL(req.url()), method = req.method(), body = req.postData() && req.headers()["content-type"]?.includes("json") ? req.postDataJSON() : null;
    const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS" };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    requests.push({ path: url.pathname, search: url.search, method, body, multipart: req.headers()["content-type"]?.includes("multipart") ? req.postData() : null });
    let data = {}, status = 200;
    if (url.pathname === "/auth/session") { if (options.sessionDelay) await new Promise((resolve) => setTimeout(resolve, options.sessionDelay)); status = signedOut ? 401 : 200; data = signedOut ? { message: "Unauthorized" } : { user: { ...user, fullName: profile.fullName, phone: profile.phone } }; }
    else if (url.pathname === "/auth/change-password") { if (passwordFails-- > 0) { status = 400; data = { message: "Your current password is incorrect." }; } else { signedOut = true; data = { message: "Password changed." }; } }
    else if (url.pathname === "/auth/signout-other-devices") data = { message:"Other sessions revoked." };
    else if (url.pathname === "/auth/email-change/request") data = { challengeId:"891c0af9-bad2-444d-a3d0-9a8a15ea9f27",newEmail:body.email,expiresAt:"2099-01-01T00:00:00Z" };
    else if (url.pathname === "/auth/email-change/confirm") { if (body.oldCode !== "123456" || body.newCode !== "654321") { status=400;data={ message:"The verification codes do not match." }; } else { signedOut=true;data={ message:"Email updated." }; } }
    else if (url.pathname === "/auth/logout") { signedOut = true; data = { message: "Signed out." }; }
    else if (url.pathname === "/public/giving") data={since:"2026-10-04",until:"2026-10-11",locations:[],totals:{given:0,gifts:0,organizations:0}};
    else if (url.pathname === "/campaigns/discover") data={items:[],page:1,pageSize:6,total:0,hasMore:false};
    else if (url.pathname === "/me/profile") { if (method === "PATCH") profile = { ...profile, ...body }; else profileGets++; if (options.profileAuthFailure && profileGets > 1) { signedOut = true; status = 401; data = { message: "Authentication required." }; } else if (profileFails-- > 0 || (options.backgroundProfileError && method === "GET" && profileGets > 1)) { status = 503; data = { message: "Profile unavailable." }; } else data = profile; }
    else if (url.pathname === "/media/cloudinary/status") data = { enabled: true };
    else if (url.pathname === "/media/upload") data = { url: "https://fixture.example/avatar.png" };
    else if (url.pathname === "/me/notification-preferences") { if (method === "GET" && prefReadFails-- > 0) { status = 503; data = { message: "Preferences unavailable." }; } else if (method === "PATCH" && prefSaveFails-- > 0) { status = 503; data = { message: "Preferences could not be saved." }; } else { if (method === "PATCH") preferences = { ...preferences, ...body }; data = preferences; } }
    else if (url.pathname === "/me/payout-banks") { status = options.bankError ?? 200; data = status === 200 ? [{ code: "001", name: "Alpha Bank" }, { code: "002", name: "Beta Bank" }] : { message: "Banks unavailable." }; }
    else if (url.pathname === "/me/payout-account/resolve") { if (options.staleLookup && body.bankCode === "001") await new Promise((resolve) => setTimeout(resolve, 1500)); status = options.lookupError ?? 200; data = status === 200 ? { ...body, accountName: body.bankCode === "001" ? "ALPHA BENEFICIARY" : "BETA BENEFICIARY" } : { message: "Test lookup unavailable; enter beneficiary name manually." }; }
    else if (url.pathname === "/me/payout-account") { if (method === "PATCH") payout = { ...payout, ...body, status: options.lookupError ? "pending" : "verified" }; data = payout; }
    else if (url.pathname === "/me/payout-summary") { status = options.summaryError ?? 200; data = status === 200 ? { totalCollected: 10000, totalPlatformFees: 250, totalNetCollected: 9750, totalReleased: 5000, availableBalance: 4750, recentTransfers: [] } : { message: "Balance unavailable." }; }
    else if (url.pathname === "/me/payment-methods") data = options.linkedCard ? [{ ...card, linkedRecurringGiftCount: 1 }] : cards;
    else if (url.pathname.endsWith("/preferred")) { cards=cards.map(card=>({ ...card,isPreferred:true }));data={ message:"Preferred card updated." }; }
    else if (url.pathname.endsWith("/deactivate")) { cards = []; data = { message: "Removed." }; }
    else if (url.pathname === "/me/notifications") { if (notificationFails-- > 0) { status = 503; data = { message: "Inbox unavailable." }; } else { const index = Number(url.searchParams.get("page") ?? 1), pageSize = Number(url.searchParams.get("pageSize") ?? 8); data = { page: index, pageSize, total: notices.length, unreadCount: notices.filter((row) => !row.read).length, items: notices.slice((index - 1) * pageSize, index * pageSize) }; } }
    else if (url.pathname === "/me/notifications/read-all") { notices.forEach((row) => { row.read = true; }); data = { message: "Read." }; }
    else if (url.pathname.endsWith("/read")) { if (readFails-- > 0) { status = 503; data = { message: "Could not mark this notification read." }; } else { const id = url.pathname.split("/")[3]; notices.find((row) => row.id === id).read = true; data = { message: "Read." }; } }
    return route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(data) });
  });
  try { await fn({ page, requests }); assert.deepEqual(errors, []); passed++; console.log(`PASS ${name}`); }
  catch (error) { await page.screenshot({ path: "/private/tmp/azarfaith-qa/profile-failure.png", fullPage: true }); throw error; }
  finally { await context.close(); }
}
const section = (page, id) => page.locator(`#${id}`);
const patch = (requests, path) => requests.filter((req) => req.method === "PATCH" && req.path === path);
async function refocus(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    window.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    window.dispatchEvent(new Event("visibilitychange"));
  });
}
try {
  await run("Delayed session and profile render actual details, stats, balances and working owner links", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByRole("heading", { name: user.fullName, exact: true }).waitFor();
    await section(page, "payouts").getByText("₦4,750", { exact: true }).waitFor();
    assert.equal(await section(page, "activity").getByRole("link", { name: /Riverlight Mission/ }).getAttribute("href"), "/org/org");
    assert.equal(await page.getByText("Phone verified", { exact: true }).count(), 0);
    await page.screenshot({ path: "/private/tmp/azarfaith-qa/profile-desktop.png", fullPage: true });
  }, { sessionDelay: 500 });
  await run("Profile edits discard without a request and save nullable phone; header refreshes canonical name", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const details = section(page, "details");
    await details.getByLabel("Full name", { exact: true }).fill("Discard me"); await details.getByRole("button", { name: "Discard changes" }).click();
    assert.equal(await details.getByLabel("Full name", { exact: true }).inputValue(), user.fullName); assert.equal(patch(requests, "/me/profile").length, 0);
    await details.getByLabel("Full name", { exact: true }).fill("Riverlight Updated"); await details.getByLabel(/Phone number/).fill(""); await details.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("heading", { name: "Riverlight Updated", exact: true }).waitFor();
    assert.deepEqual(patch(requests, "/me/profile")[0].body, { fullName: "Riverlight Updated", phone: null, avatarUrl: "", city: "" });
  });
  await run("Profile failure offers retry instead of fabricated user or login text", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByText("Could not load your profile.").waitFor(); await page.getByRole("button", { name: "Retry", exact: true }).click(); await page.getByRole("heading", { name: user.fullName, exact: true }).waitFor();
  }, { profileFails: 4 });
  await run("Background profile refresh errors preserve unsaved form details", async ({ page }) => {
    await page.goto(`${origin}/profile`); const input = section(page, "details").getByLabel("Full name", { exact: true }); await input.fill("My unsaved name");
    await refocus(page);
    await page.getByText("Could not refresh your profile. Your unsaved changes are still here.").waitFor();
    assert.equal(await input.inputValue(), "My unsaved name");
  }, { backgroundProfileError: true });
  await run("A revoked session clears private profile state after a failed refresh", async ({ page }) => {
    await page.goto(`${origin}/profile`); await section(page, "details").getByLabel("Full name", { exact: true }).waitFor(); await refocus(page); await page.waitForURL(`${origin}/`); assert.equal(await page.getByRole("button", { name: /^Notifications/ }).count(), 0);
  }, { profileAuthFailure: true });
  await run("Notification preferences persist via Save, discard locally, and preserve draft on a failed save", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const prefs = section(page, "notifications");
    await prefs.getByRole("switch", { name: "Comments", exact: true }).uncheck(); await prefs.getByRole("button", { name: "Discard changes" }).click();
    assert.equal(await prefs.getByRole("switch", { name: "Comments", exact: true }).isChecked(), true); assert.equal(patch(requests, "/me/notification-preferences").length, 0);
    await prefs.getByRole("switch", { name: "Comments", exact: true }).uncheck(); await prefs.getByRole("button", { name: "Save changes" }).click();
    await prefs.getByText("Preferences could not be saved.").waitFor(); assert.equal(await prefs.getByRole("switch", { name: "Comments", exact: true }).isChecked(), false);
    await prefs.getByRole("button", { name: "Save changes" }).click(); await prefs.getByText("Preferences could not be saved.").waitFor({ state: "hidden" });
    assert.equal(patch(requests, "/me/notification-preferences").length, 2);
  }, { prefSaveFails: 1 });
  await run("Unsupported and oversized avatar files are blocked before any upload request", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const input = section(page, "details").locator('input[type="file"]');
    await input.setInputFiles({ name: "avatar.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") }); await page.getByText("Choose a JPEG, PNG or WebP image.").waitFor();
    await input.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }); await page.getByText("Choose an image no larger than 5 MB.").waitFor();
    assert.equal(requests.filter((req) => req.path === "/media/upload").length, 0);
  });
  await run("Valid avatar uploads to the user-avatar folder and is persisted only after saving profile", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const details = section(page, "details");
    await details.locator('input[type="file"]').setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBMUAAAAASUVORK5CYII=", "base64") });
    await details.getByRole("img", { name: "Profile photo preview", exact: true }).locator("img").waitFor({ state: "visible" }); assert.equal(patch(requests, "/me/profile").length, 0);
    assert.ok(requests.find((req) => req.path === "/media/upload").multipart.includes("user-avatar"));
    await details.getByRole("button", { name: "Save changes" }).click(); await page.getByText("Profile updated.", { exact: true }).waitFor(); assert.equal(patch(requests, "/me/profile")[0].body.avatarUrl, "https://fixture.example/avatar.png");
  });
  for (const width of [390, 1440]) {
    await run(`Broken avatar falls back in header and editor ${width}px and recovers after upload`, async ({ page, requests }) => {
      await page.goto(`${origin}/profile`);
      const header = page.getByRole("img", { name: "Profile photo", exact: true });
      const preview = section(page, "details").getByRole("img", { name: "Profile photo preview", exact: true });
      for (const avatar of [header, preview]) {
        await avatar.getByText("RD", { exact: true }).waitFor();
        await avatar.locator("img").waitFor({ state: "detached" });
        const bounds = await avatar.boundingBox();
        assert.equal(bounds.width, 64); assert.equal(bounds.height, 64);
      }
      assert.equal(patch(requests, "/me/profile").length, 0);
      const details = section(page, "details");
      await details.getByLabel("Full name", { exact: true }).fill("");
      await preview.locator("svg").waitFor();
      await details.getByLabel("Full name", { exact: true }).fill("Riverlight Donor");
      await details.locator('input[type="file"]').setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBMUAAAAASUVORK5CYII=", "base64") });
      await preview.locator("img").waitFor({ state: "visible" });
      await details.getByRole("button", { name: "Save changes" }).click();
      await page.getByText("Profile updated.", { exact: true }).waitFor();
      await header.locator("img").waitFor({ state: "visible" });
      assert.equal(patch(requests, "/me/profile")[0].body.avatarUrl, "https://fixture.example/avatar.png");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }, { width, avatarUrl: "https://fixture.example/broken-avatar.png" });
  }
  await run("Preference load failure does not invent enabled toggles", async ({ page }) => {
    await page.goto(`${origin}/profile`); const prefs = section(page, "notifications"); await prefs.getByText("Could not load notification preferences.").waitFor(); assert.equal(await prefs.getByRole("switch").count(), 0); await prefs.getByRole("button", { name: "Retry", exact: true }).click(); await prefs.getByRole("switch", { name: "Comments", exact: true }).waitFor();
  }, { prefReadFails: 4 });
  await run("Saved-card removal requires confirmation and refreshes server data", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); await section(page, "payments").getByRole("button", { name: "Remove", exact: true }).click();
    assert.equal(requests.filter((req) => req.path.endsWith("/deactivate")).length, 0);
    await page.getByRole("dialog").getByRole("button", { name: "Remove card", exact: true }).click(); await section(page, "payments").getByText(/No saved cards yet/).waitFor();
  });
  await run("Linked recurring cards cannot be removed", async ({ page }) => {
    await page.goto(`${origin}/profile`); assert.equal(await section(page, "payments").getByRole("button", { name: "Remove", exact: true }).isDisabled(), true);
  }, { linkedCard: true });
  await run("Payout banks/balances failures show retry rather than zero funds", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByText("Could not load payout account settings.").waitFor(); await page.getByText("Could not load payout balances.").waitFor(); assert.equal(await section(page, "payouts").getByText("₦0", { exact: true }).count(), 0);
  }, { bankError: 503, summaryError: 503 });
  await run("Late bank lookup cannot overwrite beneficiary for newly selected bank/account", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const payouts = section(page, "payouts");
    await payouts.getByLabel("Account number", { exact: true }).fill("1111111111"); await page.waitForTimeout(650);
    assert.equal(requests.filter((req) => req.path.endsWith("/resolve")).length, 1);
    await payouts.getByLabel("Bank", { exact: true }).selectOption("002"); await payouts.getByLabel("Account number", { exact: true }).fill("2222222222"); await page.waitForTimeout(1800);
    assert.equal(await payouts.getByLabel("Beneficiary name", { exact: true }).inputValue(), "BETA BENEFICIARY");
  }, { staleLookup: true });
  await run("Manual payout account saves pending when provider lookup fails", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const payouts = section(page, "payouts");
    await payouts.getByLabel("Account number", { exact: true }).fill("1111111111"); await payouts.getByText(/Test lookup unavailable/).waitFor();
    await payouts.getByLabel("Beneficiary name", { exact: true }).fill("Manual Name"); await payouts.getByRole("button", { name: "Save payout account", exact: true }).click(); await payouts.getByText(/Manual Name · Pending verification/).waitFor();
    assert.equal(patch(requests, "/me/payout-account")[0].body.accountName, "Manual Name");
  }, { lookupError: 503 });
  await run("Manual typing before debounce does not leave lookup spinner or disable save", async ({ page }) => {
    await page.goto(`${origin}/profile`); const payouts = section(page, "payouts");
    await payouts.getByLabel("Account number", { exact: true }).fill("1111111111"); await payouts.getByLabel("Beneficiary name", { exact: true }).fill("Manual Name"); await page.waitForTimeout(800);
    assert.equal(await payouts.getByRole("button", { name: "Save payout account", exact: true }).isDisabled(), false);
  });
  await run("Password mismatch makes no request; failed current-password check keeps user signed in", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const security = section(page, "security");
    await security.getByLabel("Current password", { exact: true }).fill("wrong"); await security.getByLabel("New password", { exact: true }).fill("New-pass-2"); await security.getByLabel("Confirm new password", { exact: true }).fill("New-pass-3"); await security.getByRole("button", { name: "Change password", exact: true }).click();
    await security.getByText("The new passwords do not match.").waitFor(); assert.equal(requests.filter((req) => req.path === "/auth/change-password").length, 0);
    await security.getByLabel("Confirm new password", { exact: true }).fill("New-pass-2"); await security.getByRole("button", { name: "Change password", exact: true }).click(); await security.getByText("Your current password is incorrect.").waitFor(); assert.equal(new URL(page.url()).pathname, "/profile");
  }, { passwordFails: 1 });
  await run("Successful password change clears cookie-auth UI and redirects to login", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const security = section(page, "security");
    await security.getByLabel("Current password", { exact: true }).fill("Current-pass-1"); await security.getByLabel("New password", { exact: true }).fill("New-pass-2"); await security.getByLabel("Confirm new password", { exact: true }).fill("New-pass-2"); await security.getByRole("button", { name: "Change password", exact: true }).click(); await page.waitForURL(`${origin}/login`);
    assert.deepEqual(requests.find((req) => req.path === "/auth/change-password").body, { currentPassword: "Current-pass-1", newPassword: "New-pass-2" });
    assert.equal(await page.getByRole("button", { name: /^Notifications/ }).count(), 0);
  });
  await run("Inbox paginates, marks individual/all read, caps height and returns keyboard focus", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); const trigger = page.getByRole("button", { name: "Notifications, 3 unread", exact: true }); await trigger.click();
    const dialog = page.getByRole("dialog"); await dialog.getByRole("link", { name: /Real notification 8 / }).waitFor();
    assert.equal(await dialog.locator("li").count(), 8); const bounds = await dialog.boundingBox(); assert.ok(bounds.height <= 501);
    await dialog.getByRole("button", { name: "Load more", exact: true }).click(); await dialog.getByRole("link", { name: /Real notification 11 / }).waitFor(); assert.equal(await dialog.locator("li").count(), 11);
    assert.ok(requests.some((req) => req.search.includes("page=2")));
    await dialog.getByRole("button", { name: "Mark read", exact: true }).first().click(); await page.locator('nav button[aria-label="Notifications, 2 unread"]').waitFor();
    await dialog.getByRole("button", { name: "Mark all read", exact: true }).click(); await page.locator('nav button[aria-label="Notifications"]').waitFor();
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" }); assert.equal(await page.getByRole("button", { name: "Notifications", exact: true }).evaluate((node) => node === document.activeElement), true);
  });
  await run("Inbox outage is visible with Retry, not a false empty state", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByRole("button", { name: /^Notifications/ }).click(); await page.getByText("Could not load your notifications.").waitFor(); assert.equal(await page.getByText("No notifications yet.").count(), 0); await page.getByRole("dialog").getByRole("button", { name: "Retry", exact: true }).click(); await page.getByRole("dialog").getByText("Actual event 1", { exact: true }).waitFor();
  }, { notificationFails: 4 });
  await run("Failed mark-read does not invent a lower unread count; retry updates canonical count", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByRole("button", { name: /^Notifications/ }).click(); const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "Mark read", exact: true }).first().click(); await page.getByText("Could not mark this notification read.", { exact: true }).waitFor(); assert.equal(await page.locator('nav button[aria-label="Notifications, 3 unread"]').count(), 1); await dialog.getByRole("button", { name: "Mark read", exact: true }).first().click(); await page.locator('nav button[aria-label="Notifications, 2 unread"]').waitFor();
  }, { readFails: 1 });
  await run("Mobile profile and inbox fit viewport and scroll within half-screen panel", async ({ page }) => {
    await page.goto(`${origin}/profile`); await page.getByRole("heading", { name: user.fullName, exact: true }).waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: "/private/tmp/azarfaith-qa/profile-mobile.png", fullPage: true });
    await page.getByRole("button", { name: /^Notifications/ }).click(); const bounds = await page.getByRole("dialog").boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.height <= 422); await page.screenshot({ path: "/private/tmp/azarfaith-qa/notifications-mobile.png" });
  }, { width: 390, height: 844 });
  await run("Guests return to landing page and never request private profile, payout or notification data", async ({ page, requests }) => {
    await page.goto(`${origin}/profile`); await page.waitForURL(`${origin}/`); assert.equal(requests.filter((req) => req.path.startsWith("/me/")).length, 0);
  }, { guest: true });
  await run("City persists to real profile API",async({page,requests})=>{
    await page.goto(`${origin}/profile`);const details=section(page,"details");await details.getByLabel("City (optional)",{exact:true}).fill("Ibadan");await details.getByRole("button",{name:"Save changes"}).click();await page.getByText("Profile updated.",{exact:true}).waitFor();assert.equal(patch(requests,"/me/profile")[0].body.city,"Ibadan");
  });
  await run("Preferred card persists without changing existing recurring authorizations",async({page,requests})=>{
    await page.goto(`${origin}/profile`);await page.getByRole("button",{name:"Make preferred"}).click();await page.getByText("Preferred",{exact:true}).waitFor();assert.equal(patch(requests,"/me/payment-methods/card/preferred").length,1);assert.equal(requests.filter(req=>req.path.includes("/recurring-gifts/")).length,0);
  });
  await run("Other device signout requires confirmation and keeps this profile signed in",async({page,requests})=>{
    await page.goto(`${origin}/profile`);await page.getByRole("button",{name:"Sign out other devices",exact:true}).click();assert.equal(requests.filter(req=>req.path==="/auth/signout-other-devices").length,0);await page.getByRole("dialog").getByRole("button",{name:"Confirm",exact:true}).click();await page.getByRole("dialog").waitFor({state:"hidden"});assert.equal(requests.filter(req=>req.path==="/auth/signout-other-devices").length,1);await page.getByRole("heading",{name:user.fullName,exact:true}).waitFor();
  });
  await run("Email change verifies both codes, retains errors and signs out only after success",async({page,requests})=>{
    await page.goto(`${origin}/profile`);await page.getByRole("button",{name:"Change sign-in email",exact:true}).click();const dialog=page.getByRole("dialog");await dialog.getByLabel("New sign-in email").fill("replacement@example.com");await dialog.getByRole("button",{name:"Send verification codes"}).click();await dialog.getByLabel("Code from current inbox").fill("111111");await dialog.getByLabel("Code from new inbox").fill("222222");await dialog.getByRole("button",{name:"Verify and change email"}).click();await dialog.getByRole("alert").waitFor();assert.equal(await dialog.getByLabel("Code from current inbox").inputValue(),"111111");await dialog.getByLabel("Code from current inbox").fill("123456");await dialog.getByLabel("Code from new inbox").fill("654321");await dialog.getByRole("button",{name:"Verify and change email"}).click();await page.waitForURL(`${origin}/login`);assert.equal(requests.filter(req=>req.path==="/auth/email-change/confirm").length,2);
  });
  console.log(`PROFILE/NOTIFICATIONS BROWSER QA: ${passed} passed`);
} finally { await browser.close(); }
