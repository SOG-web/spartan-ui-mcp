#!/usr/bin/env node
// @ts-check

/**
 * Test script for MCP Resources
 * This script tests the resource functionality of the Spartan UI MCP server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testResources() {
  console.log("🚀 Starting MCP Resources Test...\n");

  // Create client and connect to server
  const client = new Client(
    {
      name: "test-resources-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
      },
    }
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"],
  });

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  try {
    // Test 1: List all resources
    console.log("📋 Test 1: Listing all resources...");
    const resourcesList = await client.listResources();
    console.log(`Found ${resourcesList.resources.length} total resources`);

    // Show first few resources
    console.log("\nFirst 10 resources:");
    resourcesList.resources.slice(0, 10).forEach((resource) => {
      console.log(`  - ${resource.name}`);
      console.log(`    URI: ${resource.uri}`);
      console.log(`    Type: ${resource.mimeType}`);
    });
    console.log(`  ... and ${resourcesList.resources.length - 10} more\n`);

    // Test 2: Read component list resource
    console.log("📖 Test 2: Reading component list resource...");
    const componentList = await client.readResource({
      uri: "spartan://components/list",
    });
    const listData = JSON.parse(componentList.contents[0].text);
    console.log(`Total components: ${listData.totalComponents}`);
    console.log(`First 5 components:`);
    listData.components.slice(0, 5).forEach((comp) => {
      console.log(`  - ${comp.name}: ${comp.url}`);
    });
    console.log();

    // Test 3: Read button API resource
    console.log("🔘 Test 3: Reading button API resource...");
    const buttonAPI = await client.readResource({
      uri: "spartan://component/button/api",
    });
    const buttonData = JSON.parse(buttonAPI.contents[0].text);
    console.log(`Component: ${buttonData.component}`);
    console.log(`Brain API components: ${buttonData.metadata.brainAPICount}`);
    console.log(`Helm API components: ${buttonData.metadata.helmAPICount}`);

    if (buttonData.helmAPI.length > 0) {
      const hlmButton = buttonData.helmAPI[0];
      console.log(`\nHlmButton inputs:`);
      hlmButton.inputs.forEach((input) => {
        console.log(`  - ${input.prop}: ${input.type}`);
      });
    }
    console.log();

    // Test 4: Read button examples resource
    console.log("💡 Test 4: Reading button examples resource...");
    const buttonExamples = await client.readResource({
      uri: "spartan://component/button/examples",
    });
    const examplesData = JSON.parse(buttonExamples.contents[0].text);
    console.log(`Total examples: ${examplesData.metadata.totalExamples}`);
    if (examplesData.examples && examplesData.examples.length > 0) {
      const firstExample = examplesData.examples[0];
      console.log(`First example (${firstExample.language || "unknown"}):`);
      const code = firstExample.code || "";
      console.log(
        code.substring(0, Math.min(200, code.length)) +
          (code.length > 200 ? "..." : "") +
          "\n"
      );
    } else {
      console.log("No examples found\n");
    }

    // Test 5: Read avatar full resource
    console.log("👤 Test 5: Reading avatar full documentation resource...");
    const avatarFull = await client.readResource({
      uri: "spartan://component/avatar/full",
    });
    const avatarData = JSON.parse(avatarFull.contents[0].text);
    console.log(`Component: ${avatarData.component}`);
    console.log(`Brain API: ${avatarData.metadata.brainAPICount} components`);
    console.log(`Helm API: ${avatarData.metadata.helmAPICount} components`);
    console.log(`Examples: ${avatarData.metadata.totalExamples} code blocks`);
    console.log(`Fetched at: ${avatarData.metadata.fetchedAt}`);
    console.log();

    // Test 6: Try invalid resource
    console.log("❌ Test 6: Testing error handling with invalid resource...");
    try {
      await client.readResource({
        uri: "spartan://component/nonexistent/api",
      });
      console.log("ERROR: Should have thrown an error!");
    } catch (error) {
      console.log(`✅ Correctly caught error: ${error.message}\n`);
    }

    console.log("✨ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from server");
  }
}

// Run tests
testResources().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
