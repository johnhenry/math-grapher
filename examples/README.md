# Examples

Runnable walkthroughs of the library surface (the same runtime the MCP
tools drive). Each imports the built output, so build first:

```bash
npm install
npm run build
node examples/01-session-basics.mjs
```

| Example | Shows |
|---|---|
| `01-session-basics.mjs` | open / set_cell / define / get_cell, reactive recompute, `explainCell` provenance |
| `02-graph-theory-preset.mjs` | the `graph-theory` preset's edge-list → analyze → BFS chain, typed value projection, live re-input |
| `03-snapshot-resume.mjs` | `snapshot()`/`resume()` — portable session state, and what deliberately does NOT survive (computed caches, capabilities) |

These are deliberately **not** wired into CI: the library API is
pre-1.0 and unstable, and the settled contract is the MCP tool surface,
not these imports. Expect to update them across releases.
