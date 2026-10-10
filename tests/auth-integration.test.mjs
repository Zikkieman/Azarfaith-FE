import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const environment = { VITE_API_BASE_URL: "https://test-api.example///" };

// Execute the production modules with only their build-time environment substituted.
function loadModule(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8").replaceAll(
    "import.meta.env",
    JSON.stringify(environment),
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

const api = loadModule("../src/lib/api.ts");
const errors = loadModule("../src/lib/errors.ts");
const auth = loadModule("../src/features/auth/authSlice.ts", { "@/lib/api": api });
const { configureStore } = require("@reduxjs/toolkit");
const user = {
  id: "test-donor",
  email: "donor@example.com",
  fullName: "Test Donor",
  role: "donor",
  status: "active",
  isVerified: true,
  phone: null,
};
const store = () => configureStore({ reducer: { auth: auth.authReducer } });

function interceptFetch(t, handler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  t.after(() => {
    globalThis.fetch = original;
  });
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("API normalizes base URL and always includes cookies without adding JSON headers to GET", async (t) => {
  interceptFetch(t, async (url, options) => {
    assert.equal(url, "https://test-api.example/auth/session");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers.has("Content-Type"), false);
    return json({ user });
  });
  assert.deepEqual(await api.apiFetch("/auth/session", { credentials: "omit" }), { user });
});

test("API preserves multipart boundary handling and JSON request encoding", async (t) => {
  const body = new FormData();
  body.append("folder", "user-avatar");
  interceptFetch(t, async (_url, options) => {
    assert.equal(options.headers.has("Content-Type"), false);
    assert.equal(options.body, body);
    return json({ url: "https://example.com/avatar.png" });
  });
  await api.apiFetch("/media/upload", { method: "POST", body });
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get("Content-Type"), "application/json");
    return json({ user });
  };
  await api.apiFetch("/auth/login", { method: "POST", body: "{}" });
});

test("Nest validation arrays become readable API error messages", async (t) => {
  interceptFetch(t, async () =>
    json({ message: ["Email is invalid.", "Password is required."] }, 400),
  );
  await assert.rejects(api.apiFetch("/auth/signup"), (error) => {
    assert.equal(error.status, 400);
    assert.equal(error.message, "Email is invalid. Password is required.");
    return true;
  });
});

test("serialized Redux errors retain actionable messages", () => {
  assert.equal(
    errors.getErrorMessage({ message: "Your account is not verified yet." }, "Login failed"),
    "Your account is not verified yet.",
  );
  assert.equal(errors.getErrorMessage(null, "Login failed"), "Login failed");
});

test("signup sends real fields and does not authenticate before OTP succeeds", async (t) => {
  const app = store();
  const payload = {
    fullName: user.fullName,
    email: user.email,
    phone: "+2348000000000",
    password: "Test-password-123",
  };
  const requests = [];
  interceptFetch(t, async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return url.endsWith("/signup")
      ? json({ email: user.email, message: "Code sent" })
      : json({ user });
  });
  await app.dispatch(auth.signup(payload)).unwrap();
  assert.equal(app.getState().auth.user, null);
  assert.equal(app.getState().auth.pendingVerificationEmail, user.email);
  assert.deepEqual(requests[0].body, payload);
  await app.dispatch(auth.verifyOtp({ email: user.email, code: "1234" })).unwrap();
  assert.equal(requests[1].url, "https://test-api.example/auth/verify-otp");
  assert.deepEqual(app.getState().auth.user, user);
  assert.equal(app.getState().auth.pendingVerificationEmail, null);
});

test("failed OTP leaves the donor unauthenticated and preserves verification email", async (t) => {
  const app = store();
  app.dispatch(auth.setPendingVerificationEmail(user.email));
  interceptFetch(t, async () => json({ message: "Invalid verification code" }, 400));
  await assert.rejects(app.dispatch(auth.verifyOtp({ email: user.email, code: "9999" })).unwrap());
  assert.equal(app.getState().auth.user, null);
  assert.equal(app.getState().auth.error, "Invalid verification code");
  assert.equal(app.getState().auth.pendingVerificationEmail, user.email);
});

test("a late session response cannot overwrite a successful login", async (t) => {
  const app = store();
  let resolveSession;
  interceptFetch(t, (url) =>
    url.endsWith("/session")
      ? new Promise((resolve) => {
          resolveSession = resolve;
        })
      : Promise.resolve(json({ user })),
  );
  const pendingSession = app.dispatch(auth.fetchSession());
  await app
    .dispatch(auth.login({ identifier: user.email, password: "Test-password-123" }))
    .unwrap();
  resolveSession(json({ message: "Unauthorized" }, 401));
  await pendingSession;
  assert.deepEqual(app.getState().auth.user, user);
  assert.equal(app.getState().auth.hydrated, true);
});

test("expired sessions remove stale users while temporary network errors preserve the last session", async (t) => {
  const app = store();
  interceptFetch(t, async () => json({ user }));
  await app.dispatch(auth.login({ identifier: user.email, password: "Test-password-123" }));
  globalThis.fetch = async () => {
    throw new Error("Network unavailable");
  };
  await app.dispatch(auth.fetchSession());
  assert.deepEqual(app.getState().auth.user, user);
  globalThis.fetch = async () => json({ message: "Unauthorized" }, 401);
  await app.dispatch(auth.fetchSession());
  assert.equal(app.getState().auth.user, null);
  assert.equal(app.getState().auth.hydrated, true);
});

test("admin login uses the admin endpoint and a denied login grants no local role", async (t) => {
  const app = store();
  interceptFetch(t, async (url) => {
    assert.equal(url, "https://test-api.example/auth/admin/login");
    return json({ message: "Admin access required" }, 403);
  });
  await assert.rejects(
    app
      .dispatch(auth.adminLogin({ identifier: user.email, password: "Test-password-123" }))
      .unwrap(),
  );
  assert.equal(app.getState().auth.user, null);
  assert.equal(app.getState().auth.error, "Admin access required");
});

test("Google sign-in sends the provider credential only to the backend", async (t) => {
  const app = store();
  interceptFetch(t, async (url, options) => {
    assert.equal(url, "https://test-api.example/auth/google");
    assert.deepEqual(JSON.parse(options.body), { idToken: "test-provider-credential" });
    return json({ user });
  });
  await app.dispatch(auth.googleAuth({ idToken: "test-provider-credential" })).unwrap();
  assert.deepEqual(app.getState().auth.user, user);
  assert.equal("accessToken" in app.getState().auth, false);
});

test("logout prevents an in-flight session from restoring a logged-out user", async (t) => {
  const app = store();
  let resolveSession;
  interceptFetch(t, (url) =>
    url.endsWith("/session")
      ? new Promise((resolve) => {
          resolveSession = resolve;
        })
      : Promise.resolve(json({ message: "Logged out" })),
  );
  const pendingSession = app.dispatch(auth.fetchSession());
  await app.dispatch(auth.logout()).unwrap();
  resolveSession(json({ user }));
  await pendingSession;
  assert.equal(app.getState().auth.user, null);
  assert.equal(app.getState().auth.hydrated, true);
});

test("failed logout does not pretend the server cookie has been cleared", async (t) => {
  const app = store();
  interceptFetch(t, async () => json({ user }));
  await app
    .dispatch(auth.login({ identifier: user.email, password: "Test-password-123" }))
    .unwrap();
  globalThis.fetch = async () => json({ message: "Please try signing out again" }, 503);
  await assert.rejects(app.dispatch(auth.logout()).unwrap());
  assert.deepEqual(app.getState().auth.user, user);
  assert.equal(app.getState().auth.error, "Please try signing out again");
});

test("reset and resend actions target the existing API contracts", async (t) => {
  const requests = [];
  interceptFetch(t, async (url, options) => {
    requests.push({ path: new URL(url).pathname, body: JSON.parse(options.body) });
    return json({ message: "OK", email: user.email });
  });
  const app = store();
  await app.dispatch(auth.resendOtp({ email: user.email })).unwrap();
  await app.dispatch(auth.forgotPassword({ email: user.email })).unwrap();
  await app
    .dispatch(auth.resetPassword({ token: "test-reset-token", password: "New-password-123" }))
    .unwrap();
  assert.deepEqual(requests, [
    { path: "/auth/resend-otp", body: { email: user.email } },
    { path: "/auth/forgot-password", body: { email: user.email } },
    {
      path: "/auth/reset-password",
      body: { token: "test-reset-token", password: "New-password-123" },
    },
  ]);
});
