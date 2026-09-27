/**
 * Regression test for issue #78: the package's "." entry (`src/index.ts`)
 * must stay bundleable for the browser with zero Node built-ins in the
 * import graph. `randomUUID` from `node:crypto` used to leak into this
 * entry via `session.ts`; the fix is `globalThis.crypto.randomUUID()`
 * (Node >=19 and every modern browser). `node:http` (the Streamable HTTP
 * transport) lives only in `cli.ts`, the `bin` entry -- never imported by
 * `index.ts` -- so it was never actually part of this bundle's graph, but
 * this test still asserts that stays true so a future refactor can't
 * silently pull it back in.
 *
 * Deliberately bundles `src/index.ts` directly (esbuild strips TS types
 * itself) rather than `dist/index.js`, so this test doesn't depend on
 * `npm run build` having already run -- matching this repo's `test` script,
 * which runs before `build` in CI (see .github/workflows/ci.yml).
 */
import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import * as esbuild from "esbuild";

const ENTRY = path.resolve(import.meta.dirname, "../src/index.ts");

test("browser bundle: the '.' entry (src/index.ts) bundles clean for platform:'browser', no unresolved node:* imports", async () => {
  const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    logLevel: "silent",
  });
  assert.equal(result.errors.length, 0, `expected a clean browser bundle, got errors: ${JSON.stringify(result.errors)}`);
  const code = result.outputFiles[0]!.text;
  // Belt-and-suspenders: even though a genuinely unresolved node:* import
  // would already have failed the build above (esbuild refuses to resolve
  // Node built-ins under platform:'browser'), also assert none of the
  // bundled source text still names a node: specifier -- catches the case
  // where a future change marks one `external` and lets the build "succeed"
  // while still shipping a Node-only import for a browser consumer to trip
  // over at runtime.
  assert.doesNotMatch(code, /(?:from|require\()\s*["']node:/, "bundled output must not reference any node:* specifier");
});

test("browser bundle: cli.ts (the bin entry, not part of '.') is where node:http actually lives -- it must NOT be reachable from src/index.ts", async () => {
  const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    logLevel: "silent",
    metafile: true,
  });
  const inputs = Object.keys(result.metafile!.inputs).map((p) => path.basename(p));
  assert.ok(!inputs.includes("cli.ts"), `expected cli.ts to be absent from the '.' entry's bundle graph, got inputs: ${inputs.join(", ")}`);
});
