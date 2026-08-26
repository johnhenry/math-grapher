/**
 * The MCP tool surface end-to-end (real Client <-> Server over an in-memory
 * transport, not a direct call into buildServer's closures) -- specifically
 * the audit-flagged Infinity/NaN serialization gap: plain `JSON.stringify`
 * turns non-finite numbers into `null`, indistinguishable from a genuinely
 * null result.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../src/server.ts";
import { SessionTable } from "../src/session.ts";

/** A connected Client for a fresh server/table pair, over an in-memory transport pair. */
async function connectedClient(): Promise<{ client: Client; table: SessionTable }> {
  const table = new SessionTable();
  const server = buildServer(table);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, table };
}

/** The concatenated text of a tool call's content blocks -- the raw JSON string a real caller sees. */
function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text?: string }>;
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
}

test("session_get_cell: math_eval('1/0') is distinguishable from a genuinely null result, not silently {\"value\":null}", async () => {
  const { client } = await connectedClient();
  const opened = (await client.callTool({ name: "session_open", arguments: { kind: "generic" } })) as {
    structuredContent?: { sessionId: string };
  };
  const openText = textOf(opened as never);
  const { sessionId } = JSON.parse(openText) as { sessionId: string };

  await client.callTool({
    name: "session_define",
    arguments: { sessionId, cell: "infinite", op: "math_eval", args: { expr: "1/0" } },
  });
  const got = await client.callTool({ name: "session_get_cell", arguments: { sessionId, cell: "infinite" } });
  const text = textOf(got);

  // The bug: plain JSON.stringify(Infinity) -> null, so the response would
  // read `{"value": null}` -- indistinguishable from a real null result.
  assert.doesNotMatch(text, /"value":\s*null/);
  assert.match(text, /"value":\s*"Infinity"/);
  assert.notEqual(JSON.parse(text).value, null);
});

test("session_get_cell: math_eval producing NaN (0/0) is likewise distinguishable from null", async () => {
  const { client } = await connectedClient();
  const opened = await client.callTool({ name: "session_open", arguments: { kind: "generic" } });
  const { sessionId } = JSON.parse(textOf(opened)) as { sessionId: string };

  await client.callTool({
    name: "session_define",
    arguments: { sessionId, cell: "indeterminate", op: "math_eval", args: { expr: "0/0" } },
  });
  const got = await client.callTool({ name: "session_get_cell", arguments: { sessionId, cell: "indeterminate" } });
  const text = textOf(got);

  assert.doesNotMatch(text, /"value":\s*null/);
  assert.match(text, /"value":\s*"NaN"/);
});

test("session_get_cell: an ACTUAL null value still serializes as null (the fix doesn't mask real nulls)", async () => {
  const { client } = await connectedClient();
  const opened = await client.callTool({ name: "session_open", arguments: { kind: "generic" } });
  const { sessionId } = JSON.parse(textOf(opened)) as { sessionId: string };

  await client.callTool({ name: "session_set_cell", arguments: { sessionId, cell: "n", value: null } });
  const got = await client.callTool({ name: "session_get_cell", arguments: { sessionId, cell: "n" } });
  assert.deepEqual(JSON.parse(textOf(got)), { value: null });
});
