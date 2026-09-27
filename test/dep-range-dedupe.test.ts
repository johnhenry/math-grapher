/**
 * Regression test for issue #79: a caret range on a pre-1.0 `0.0.x` version
 * only ever matches that EXACT version (npm's well-known 0.0.x-caret
 * quirk), so a stale `@johnhenry/math: "^0.0.0"` dependency installs a
 * SECOND copy of `@johnhenry/math` alongside whatever newer patch version a
 * consumer actually depends on -- `instanceof` checks and CAS-object
 * identity across the two copies then silently diverge. The fix widens the
 * range to the non-caret `">=0.0.0 <0.1.0"`, which keeps matching every
 * 0.0.x patch release without needing a bump in lockstep with `math`.
 *
 * This packs the REAL local tree with `npm pack` and installs it into a
 * fresh temp consumer alongside a real, currently-published
 * `@johnhenry/math` version newer than `0.0.0` -- an actual install, not a
 * simulated range check -- then asserts `npm ls` shows one deduped copy.
 * Needs npm registry access (same as `npm ci` elsewhere in this repo's CI).
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(import.meta.dirname, "..");

test(
  "install-time dedupe: a fresh consumer depending on @johnhenry/math@0.0.1 alongside this package resolves ONE copy of @johnhenry/math, not two",
  { timeout: 120_000 },
  async () => {
    const work = await mkdtemp(path.join(tmpdir(), "math-grapher-dedupe-"));
    try {
      const { stdout: packOut } = await execFileAsync("npm", ["pack", "--silent", "--pack-destination", work], { cwd: REPO_ROOT });
      const tarballName = packOut.trim().split("\n").pop()!.trim();
      const tarballPath = path.join(work, tarballName);

      const consumerDir = path.join(work, "consumer");
      await mkdir(consumerDir);
      await writeFile(
        path.join(consumerDir, "package.json"),
        JSON.stringify(
          {
            name: "math-grapher-dedupe-consumer",
            private: true,
            version: "0.0.0",
            dependencies: {
              // 0.0.1 is real and published on npm, and is newer than the
              // exact 0.0.0 this package's dependency used to caret-pin --
              // exactly the "moved past 0.0.0" scenario issue #79 describes.
              "@johnhenry/math": "0.0.1",
              "@johnhenry/math-grapher": `file:${tarballPath}`,
            },
          },
          null,
          2,
        ),
      );

      await execFileAsync("npm", ["install", "--no-audit", "--no-fund"], { cwd: consumerDir });

      const { stdout: lsOut } = await execFileAsync("npm", ["ls", "@johnhenry/math", "--all", "--json"], { cwd: consumerDir });
      const tree = JSON.parse(lsOut) as {
        dependencies: {
          "@johnhenry/math"?: { version?: string };
          "@johnhenry/math-grapher"?: { dependencies?: Record<string, { version?: string; resolved?: string }> };
        };
      };
      const topLevel = tree.dependencies["@johnhenry/math"];
      const nested = tree.dependencies["@johnhenry/math-grapher"]?.dependencies?.["@johnhenry/math"];
      assert.ok(topLevel?.version, "expected a top-level @johnhenry/math dependency to be installed at all");
      // A single deduped copy means math-grapher's OWN @johnhenry/math
      // dependency is satisfied by hoisting to the top-level install --
      // `npm ls --json` represents that as EITHER omitting the nested entry
      // entirely, or listing it with no "resolved" of its own (nothing
      // separate was fetched for it) and the SAME version as the top-level
      // copy. A genuine duplicate (the pre-fix caret-pin bug) instead shows
      // its own "resolved" tarball/registry URL and typically a different
      // version -- see this test's own doc comment for the exact JSON shape
      // observed for each case.
      assert.ok(
        !nested || (nested.resolved === undefined && nested.version === topLevel.version),
        `expected @johnhenry/math to dedupe to a single copy matching the top-level version ${topLevel?.version}; math-grapher's own dependency entry was ${JSON.stringify(nested)} (a separately-"resolved" or differently-versioned entry means npm installed a second, separate copy)`,
      );
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  },
);
