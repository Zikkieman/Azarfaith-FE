import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("tests/fixtures/auth-design.json"));
const hash = (value) => createHash("sha256").update(value).digest("hex");
function classes(path) {
  const source = read(path),
    ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    result = new Set();
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.text === "className" && node.initializer)
      result.add(
        hash(
          node.initializer
            .getText(ast)
            .replace(/designer-auth/g, "")
            .replace(/\s+/g, ""),
        ),
      );
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return result;
}
test("auth frame, cards, logo, buttons and OTP retain the pinned original designer class expressions", () => {
  for (const [path, values] of Object.entries(manifest.classes)) {
    const current = classes(path);
    for (const value of values)
      assert.ok(current.has(value), `${path}: original style expression removed`);
  }
  for (const [path, value] of Object.entries(manifest.assets))
    assert.equal(hash(read(path)), value, path);
  assert.ok(read("src/components/auth/AuthField.tsx").includes(manifest.recipes.inputClass));
  assert.ok(read("src/components/auth/AuthField.tsx").includes(manifest.recipes.labelClass));
  assert.ok(read("src/components/auth/AuthBack.tsx").includes(manifest.recipes.backClass));
});
test("signup restores choice, split-name form, terms links and real verification without mock authentication", () => {
  const source = read("src/routes/signup.tsx");
  for (const text of [
    "Continue with email",
    "First name",
    "Last name",
    "Phone number",
    "Check your email",
    "resendOtp",
    "verifyOtp",
    "requestSubmit",
  ])
    assert.ok(source.includes(text), text);
  assert.match(source, /fullName:.*values\.firstName\.trim\(\).*values\.lastName\.trim\(\)/);
  assert.match(source, /lastAttempt\.current === code/);
  assert.match(source, /clearPendingVerification/);
  assert.doesNotMatch(source, /setAuthed|localStorage|lib\/store|lib\/mock/);
});
test("login, admin and reset remain bound to server actions and provider failures are not simulated successes", () => {
  const login = read("src/routes/login.tsx"),
    admin = read("src/routes/admin.login.tsx"),
    reset = read("src/routes/reset-password.tsx");
  assert.match(login, /dispatch\(googleAuth\(\{ idToken \}\)\)/);
  assert.match(login, /login\(\{ identifier: identifier\.trim\(\), password \}\)/);
  assert.match(admin, /adminLogin\(\{ identifier: identifier\.trim\(\), password \}\)/);
  assert.match(reset, /resetPassword\(\{ token, password \}\)/);
  assert.match(read("src/routes/forgot-password.tsx"), /forgotPassword\(\{ email: normalized \}\)/);
  assert.match(read("src/components/auth/UnavailableFacebook.tsx"), /disabled/);
  assert.doesNotMatch(login + admin + reset, /setAuthed|document\.cookie\s*=|localStorage/);
});
test("Google retains single initialization, current callback ownership and numeric widths with a proportional designer fit", () => {
  const google = read("src/components/GoogleSignInButton.tsx");
  assert.match(google, /window\.__azarfaithGoogleClientId !== clientId/);
  assert.match(google, /Math\.min\(400, available\)/);
  assert.match(google, /scale\(\$\{available \/ width\}\)/);
  assert.match(google, /observer\.observe\(wrapperRef\.current \?\? container\)/);
  assert.match(google, /disabledRef\.current/);
  assert.match(google, /script\.dataset\.failed/);
});
