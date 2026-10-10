import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8").replaceAll(
    "import.meta.env",
    JSON.stringify({ VITE_API_BASE_URL: "https://fixture.example" }),
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => imports[id] ?? require(id),
    module,
    module.exports,
  );
  return module.exports;
}
const profile = load("../src/lib/profile.ts");
const api = load("../src/lib/api.ts");
const catalog = load("../src/features/catalog/api.ts", { "@/lib/api": api });
const auth = load("../src/features/auth/authSlice.ts", { "@/lib/api": api });
const { configureStore } = require("@reduxjs/toolkit");
const user = {
  id: "owner",
  email: "owner@example.com",
  fullName: "Riverlight Donor",
  role: "donor",
  status: "active",
  isVerified: true,
  phone: null,
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const intercept = (t, handler) => {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  t.after(() => {
    globalThis.fetch = original;
  });
};

test("avatar validation permits only supported images no larger than 5 MB", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"])
    assert.equal(profile.validateAvatar({ type, size: 5 * 1024 * 1024 }), null);
  assert.match(profile.validateAvatar({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  for (const type of ["image/svg+xml", "image/gif", "application/pdf"])
    assert.match(profile.validateAvatar({ type, size: 1 }), /JPEG/);
});
test("password validation checks confirmation and bcrypt's UTF-8 byte limit", () => {
  assert.equal(profile.validatePassword("Current-pass", "Different-pass", "Different-pass"), null);
  assert.match(profile.validatePassword("", "Different-pass", "Different-pass"), /current/);
  assert.match(profile.validatePassword("Current-pass", "short", "short"), /8 characters/);
  assert.match(
    profile.validatePassword("Current-pass", "Current-pass", "Current-pass"),
    /different/,
  );
  assert.match(profile.validatePassword("Current-pass", "Different-pass", "No-match"), /match/);
  assert.match(
    profile.validatePassword("Current-pass", "é".repeat(37), "é".repeat(37)),
    /72 bytes/,
  );
});
test("notification links cannot send a donor to an external or script URL", () => {
  assert.equal(
    profile.safeNotificationLink("/campaign/cause?tab=updates"),
    "/campaign/cause?tab=updates",
  );
  for (const link of [
    null,
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/\n/evil.example",
  ])
    assert.equal(profile.safeNotificationLink(link), "/profile");
});
test("profile and preference requests use real endpoints, cookie credentials and nullable phone clearing", async (t) => {
  const calls = [];
  intercept(t, async (url, init) => {
    calls.push({
      url,
      body: init.body ? JSON.parse(init.body) : null,
      method: init.method,
      credentials: init.credentials,
    });
    return json({});
  });
  await catalog.updateProfile({ fullName: "Riverlight Donor", phone: null, avatarUrl: "" });
  await catalog.updateNotificationPreferences({ comments: false });
  await catalog.getNotifications({ page: 2, pageSize: 8 });
  await catalog.markNotificationAsRead("notice");
  await catalog.markAllNotificationsAsRead();
  assert.deepEqual(calls[0].body, { fullName: "Riverlight Donor", phone: null, avatarUrl: "" });
  assert.deepEqual(calls[1].body, { comments: false });
  assert.equal(calls[2].url, "https://fixture.example/me/notifications?page=2&pageSize=8");
  assert.equal(calls[3].url, "https://fixture.example/me/notifications/notice/read");
  assert.equal(calls[4].url, "https://fixture.example/me/notifications/read-all");
  assert.ok(calls.every((call) => call.credentials === "include"));
});
test("a failed password change keeps authentication intact and propagates the real server error", async (t) => {
  const store = configureStore({ reducer: { auth: auth.authReducer } });
  intercept(t, async () => json({ user }));
  await store.dispatch(auth.fetchSession());
  globalThis.fetch = async () => json({ message: "Your current password is incorrect." }, 400);
  await assert.rejects(
    store
      .dispatch(auth.changePassword({ currentPassword: "wrong", newPassword: "New-pass-2" }))
      .unwrap(),
    (error) => error.message === "Your current password is incorrect.",
  );
  assert.deepEqual(store.getState().auth.user, user);
});
test("successful password changes clear auth and prevent late session responses restoring revoked login", async (t) => {
  const store = configureStore({ reducer: { auth: auth.authReducer } });
  intercept(t, async () => json({ user }));
  await store.dispatch(auth.fetchSession());
  let resolve;
  globalThis.fetch = (url, init) => {
    if (url.endsWith("/session"))
      return new Promise((done) => {
        resolve = done;
      });
    assert.equal(url, "https://fixture.example/auth/change-password");
    assert.equal(init.credentials, "include");
    assert.deepEqual(JSON.parse(init.body), {
      currentPassword: "Current-pass",
      newPassword: "New-pass-2",
    });
    return Promise.resolve(json({ message: "Password changed." }));
  };
  const pending = store.dispatch(auth.fetchSession());
  await store
    .dispatch(auth.changePassword({ currentPassword: "Current-pass", newPassword: "New-pass-2" }))
    .unwrap();
  assert.equal(store.getState().auth.user, null);
  resolve(json({ user }));
  await pending;
  assert.equal(store.getState().auth.user, null);
});
