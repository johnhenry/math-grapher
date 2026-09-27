# Changelog

All notable changes to `@johnhenry/math-grapher` will be documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Runnable examples under `examples/` (session basics, the graph-theory
  preset, snapshot/resume). Not wired into CI — the library API is
  pre-1.0 and unstable; the settled contract is the MCP tool surface.
- This changelog.

## [0.0.1] - 2026-09-27

### Fixed

- **#79**: the `@johnhenry/math` dependency was pinned `^0.0.0`, which (per
  npm's well-known 0.0.x-caret quirk — a caret range on a pre-1.0 `0.0.x`
  version only ever matches that EXACT version) installed a second, nested
  copy of `@johnhenry/math` once a consumer depended on any newer patch
  (e.g. `0.0.1`) at the top level — `instanceof`/CAS-object-identity checks
  across the two copies then silently diverge. Widened to the non-caret
  `">=0.0.0 <0.1.0"`, matching this range's established fix pattern
  elsewhere in the family (`browsermesh`, `hostable`, `servable`, …).
  Verified with a real `npm pack` + fresh-consumer install
  (`test/dep-range-dedupe.test.ts`) asserting `npm ls @johnhenry/math`
  resolves one copy, not two — confirmed failing against the pre-fix range
  before the fix, passing after.
- **#78**: `session.ts` imported `randomUUID` from `node:crypto` at module
  scope, reachable from the `.` entry (`index.ts` → `session.ts`), so
  bundling this package for the browser (e.g. to run the headless
  `SessionTable`/`buildServer` runtime in-page, as ORRERY's Grapher Cells
  room does) failed without a Node-builtin shim. Switched to
  `globalThis.crypto.randomUUID()` (Node ≥19, every modern browser),
  removing the `node:crypto` import outright rather than hiding it behind a
  conditional export. `node:http` (the `--http` Streamable HTTP transport)
  turned out to already live only in `src/cli.ts`, the `bin` entry — never
  imported by `.` — so no further isolation was needed there beyond adding
  an explicit `browser` condition to the `.` export (documenting the
  guarantee going forward, see `package.json`'s `exports` map) and a
  regression test (`test/browser-bundle.test.ts`) that bundles `src/index.ts`
  with esbuild under `platform: 'browser'` and asserts both a clean build
  and that `cli.ts` never re-enters that bundle's graph. See the new
  "Platform" section in the README.

## [0.0.0] - 2026-08-25

Provenance entry — the state of the repo when this changelog was introduced,
not a release cut on this date.

- Split out of [mallory#163](https://github.com/johnhenry/mallory/issues/163)
  after its headless-`CellGraph` feasibility spike.
- v1 implemented per `docs/design.md`: `SessionTable` session runtime with
  per-session call serialization, the `OP_CATALOG` define-spec model
  (`math_eval`, `graph_parse_edge_list`, `graph_analyze`,
  `graph_bfs`/`dfs`/`dijkstra`), `session_*` MCP tools including
  `session_explain_cell` (#5), `session_snapshot`/`session_resume` (#6),
  and per-op capability gating (#7, no gated op in the catalog yet).
- Transports: stdio (default) and Streamable HTTP (`--http [port]`).
- Resource guards overridable via `MATH_GRAPHER_MAX_SESSIONS` /
  `MATH_GRAPHER_MAX_CELLS` / `MATH_GRAPHER_EVAL_BUDGET_MS` /
  `MATH_GRAPHER_MAX_PAYLOAD_BYTES`.
- npm-only (no JSR): blocked upstream by
  [modelcontextprotocol/typescript-sdk#2701](https://github.com/modelcontextprotocol/typescript-sdk/issues/2701).
