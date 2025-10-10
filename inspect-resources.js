#!/usr/bin/env node
// Simple test to inspect resource data

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client(
  { name: "test-client", version: "1.0.0" },
  { capabilities: { resources: {} } }
);

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"],
});

await client.connect(transport);

// Test button examples
const buttonExamples = await client.readResource({
  uri: "spartan://component/button/examples",
});

console.log("Button Examples Resource:");
console.log(
  JSON.stringify(JSON.parse(buttonExamples.contents[0].text), null, 2)
);

await client.close();
