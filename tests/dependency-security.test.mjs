import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const patched = {
  "@tanstack/react-start": [1, 168, 60],
  "@tanstack/start-server-core": [1, 169, 39],
};

// GHSA-qx66-fv34-fjm8 affects both Start and its server runtime, including nested copies.
for (const [name, minimum] of Object.entries(patched)) {
  test(`${name} lockfile contains only releases patched for CVE-2026-102989`, () => {
    const copies = Object.entries(lock.packages).filter(([path]) =>
      path.endsWith(`node_modules/${name}`),
    );
    assert.ok(copies.length > 0, `${name} must be present in the lockfile`);
    for (const [path, entry] of copies) {
      assert.match(entry.version, /^\d+\.\d+\.\d+$/, `${path} must use a stable release`);
      const version = entry.version.split(".").map(Number);
      const difference = version
        .map((part, index) => part - minimum[index])
        .find((part) => part !== 0);
      assert.ok(
        difference === undefined || difference > 0,
        `${path}@${entry.version} is vulnerable`,
      );
    }
  });
}

test("manifest pins the tested Start release and agrees with the lockfile", () => {
  for (const name of [
    "@tanstack/react-start",
    "@tanstack/react-router",
    "@tanstack/router-plugin",
  ]) {
    const version = manifest.dependencies[name];
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages[""].dependencies[name], version);
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
  }
});
