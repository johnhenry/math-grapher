# Changelog

All notable changes to `@johnhenry/math-grapher` will be documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Runnable examples under `examples/` (session basics, the graph-theory
  preset, snapshot/resume). Not wired into CI — the library API is
  pre-1.0 and unstable; the settled contract is the MCP tool surface.
- This changelog.

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
