// The graph-theory preset: an edge-list -> parse -> analyze -> BFS
// pipeline pre-wired as ordinary define-specs (a preset is data, not a
// privileged code path).
//
// Run: npm run build && node examples/02-graph-theory-preset.mjs
import { SessionTable } from "../dist/index.js";

const table = new SessionTable();
const { sessionId } = table.open("graph-theory");

// The preset seeds: edgeListText "A B 4\nA C 2\nC B 1\nB D 5",
// directed=false, startVertex="A" — and defines parsed/analysis/bfsOrder.
console.log(await table.getCell(sessionId, "bfsOrder"));
// { value: [ 'A', 'B', 'C', 'D' ] }

const { value: analysis } = await table.getCell(sessionId, "analysis");
console.log(analysis); // { hasCycle: true, connectedComponents: [...], ... }

// Rich values project to typed JSON at the boundary (a Graph instance
// never crosses the wire raw).
const { value: parsed } = await table.getCell(sessionId, "parsed");
console.log(parsed.$type); // "graph"

// Change the input; the whole chain recomputes.
await table.setCell(sessionId, "edgeListText", "X Y\nY Z");
await table.setCell(sessionId, "startVertex", "X");
console.log(await table.getCell(sessionId, "bfsOrder"));
// { value: [ 'X', 'Y', 'Z' ] }

table.close(sessionId);
