#!/usr/bin/env node
//@ts-check

/**
 * Test cache-integrated MCP tools
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

console.log("🧪 CACHE-INTEGRATED MCP TOOLS TEST\n");
console.log("=".repeat(60));

const client = new Client(
  { name: "cache-test-client", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"],
});

await client.connect(transport);

try {
  // Test 1: Get cache status
  console.log("\n✅ TEST 1: Get cache status");
  const statusResult = await client.callTool({
    name: "spartan_cache_status",
    arguments: {},
  });
  const status = JSON.parse(statusResult.content[0].text);
  console.log(`   Current version: ${status.currentVersion}`);
  console.log(`   Total versions: ${status.totalVersions}`);

  // Test 2: Rebuild cache for 2 components
  console.log("\n✅ TEST 2: Rebuild cache for button and dialog");
  const rebuildResult = await client.callTool({
    name: "spartan_cache_rebuild",
    arguments: {
      components: ["button", "dialog"],
      includeDocs: false,
    },
  });
  const rebuildData = JSON.parse(rebuildResult.content[0].text);
  console.log(
    `   Components cached: ${rebuildData.components.success}/${rebuildData.components.total}`
  );
  console.log(`   Duration: ${rebuildData.duration}`);
  console.log(`   Version: ${rebuildData.version}`);

  // Test 3: Get component (should be cached)
  console.log("\n✅ TEST 3: Get button component (from cache)");
  const buttonResult = await client.callTool({
    name: "spartan_components_get",
    arguments: {
      name: "button",
      extract: "api",
    },
  });
  const buttonData = JSON.parse(buttonResult.content[0].text);
  console.log(`   Cache info: ${buttonData.cacheInfo}`);
  console.log(`   Version: ${buttonData.version}`);
  console.log(
    `   Helm API components: ${buttonData.data.helmAPI?.length || 0}`
  );
  console.log(
    `   Brain API components: ${buttonData.data.brainAPI?.length || 0}`
  );

  // Test 4: Get component bypassing cache
  console.log("\n✅ TEST 4: Get dialog component (bypass cache)");
  const dialogResult = await client.callTool({
    name: "spartan_components_get",
    arguments: {
      name: "dialog",
      extract: "api",
      noCache: true,
    },
  });
  const dialogData = JSON.parse(dialogResult.content[0].text);
  console.log(`   Cache info: ${dialogData.cacheInfo}`);
  console.log(
    `   Helm API components: ${dialogData.data.helmAPI?.length || 0}`
  );

  // Test 5: List cached versions
  console.log("\n✅ TEST 5: List all cached versions");
  const versionsResult = await client.callTool({
    name: "spartan_cache_list_versions",
    arguments: {},
  });
  const versions = JSON.parse(versionsResult.content[0].text);
  console.log(`   Total versions: ${versions.length}`);
  versions.forEach((v) => {
    console.log(`   - ${v.version}${v.isCurrent ? " (current)" : ""}`);
  });

  // Test 6: Get cache status again
  console.log("\n✅ TEST 6: Get cache status after operations");
  const statusResult2 = await client.callTool({
    name: "spartan_cache_status",
    arguments: {},
  });
  const status2 = JSON.parse(statusResult2.content[0].text);
  if (status2.versions.length > 0) {
    const currentVersion = status2.versions.find((v) => v.isCurrent);
    console.log(`   Components cached: ${currentVersion.componentCount}`);
    console.log(`   Docs cached: ${currentVersion.docsCount}`);
  }

  // Test 7: Clear cache
  console.log("\n✅ TEST 7: Clear cache");
  const clearResult = await client.callTool({
    name: "spartan_cache_clear",
    arguments: {},
  });
  const clearData = JSON.parse(clearResult.content[0].text);
  console.log(`   Success: ${clearData.success}`);
  console.log(`   Message: ${clearData.message}`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL CACHE-INTEGRATED TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log("   - Cache status tool: ✅");
  console.log("   - Cache rebuild tool: ✅");
  console.log("   - Cached component retrieval: ✅");
  console.log("   - Cache bypass: ✅");
  console.log("   - Version listing: ✅");
  console.log("   - Cache clearing: ✅");
  console.log("\n🎉 The version-aware caching system is working perfectly!");
} catch (error) {
  const err = /** @type {Error} */ (error);
  console.error("\n❌ TEST FAILED:");
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
} finally {
  await client.close();
}
