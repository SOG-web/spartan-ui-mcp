#!/usr/bin/env node
//@ts-check

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerComponentTools } from "./tools/components.js";
import { registerDocsTools } from "./tools/docs.js";
import { registerHealthTools } from "./tools/health.js";
import { registerMetaTools } from "./tools/meta.js";
import { registerGenerationTools } from "./tools/generation.js";
import { registerSearchTools } from "./tools/search.js";
import { registerAnalysisTools } from "./tools/analysis.js";
import { registerResourceHandlers } from "./tools/resources.js";
import { registerPromptHandlers } from "./tools/prompts.js";
import { registerCacheTools } from "./tools/cache-tools.js";

const server = new McpServer({
  name: "spartan-ui-mcp",
  version: "1.0.0",
  description:
    "MCP server exposing Spartan Angular UI documentation and component tools.",
});

// Register tool modules
registerComponentTools(server);
registerDocsTools(server);
registerHealthTools(server);
registerMetaTools(server);
registerGenerationTools(server);
registerSearchTools(server);
registerAnalysisTools(server);
registerCacheTools(server);

// Register resource handlers
registerResourceHandlers(server);

// Register prompt handlers
registerPromptHandlers(server);

const transport = new StdioServerTransport();

await server.connect(transport);
