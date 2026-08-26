// Session basics: open a generic session, set free cells, define a
// computed cell from the op catalog, and watch it recompute reactively.
//
// Run: npm run build && node examples/01-session-basics.mjs
// (Imports the built output directly; the published equivalent is
//  `import { SessionTable } from "@johnhenry/math-grapher"`.)
import { SessionTable } from "../dist/index.js";

const table = new SessionTable();
const { sessionId } = table.open("generic");

// Free cells are plain JSON values.
await table.setCell(sessionId, "a", 3);

// Computed cells are define-specs: an op name from the server-side
// catalog plus args, with {"$cell": "name"} live references. No code
// crosses this boundary — that's the whole design.
await table.define(sessionId, {
  cell: "doubled",
  op: "math_eval",
  args: { expr: "2 * a", vars: { a: { $cell: "a" } } },
});

console.log(await table.getCell(sessionId, "doubled")); // { value: 6 }

// Reactivity: changing the upstream cell recomputes the downstream one.
await table.setCell(sessionId, "a", 10);
console.log(await table.getCell(sessionId, "doubled")); // { value: 20 }

// One level of provenance: what op produced this cell, from what inputs.
console.log(await table.explainCell(sessionId, "doubled"));
// { cell: 'doubled', role: 'computed', op: 'math_eval', args: {...},
//   dependencies: [ { cell: 'a', value: 10 } ], value: 20 }

table.close(sessionId);
