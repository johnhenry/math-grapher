// Snapshot/resume: serialize a session's free-cell values + define-specs
// (NOT computed caches — those re-derive lazily) and reconstruct an
// equivalent LIVE session, possibly in a different process.
//
// Run: npm run build && node examples/03-snapshot-resume.mjs
import { SessionTable } from "../dist/index.js";

const table = new SessionTable();
const { sessionId: original } = table.open("generic");
await table.setCell(original, "a", 3);
await table.define(original, {
  cell: "doubled",
  op: "math_eval",
  args: { expr: "2 * a", vars: { a: { $cell: "a" } } },
});

const snapshot = await table.snapshot(original);
console.log(JSON.stringify(snapshot, null, 2));
// { "v": 1, "kind": "generic", "free": { "a": 3 }, "defines": [...] }
// This JSON document is the ONLY thing that needs to travel between
// processes. It does not carry capabilities — a resumed session is
// exactly as trusted as a freshly opened one.

// Resume on the same table here; in real use this would be a new process.
const { sessionId: resumed } = table.resume(snapshot);
console.log(await table.getCell(resumed, "doubled")); // { value: 6 }

// The resumed session is live, not a frozen copy.
await table.setCell(resumed, "a", 10);
console.log(await table.getCell(resumed, "doubled")); // { value: 20 }

table.close(original);
table.close(resumed);
