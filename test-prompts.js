#!/usr/bin/env node
// Test script for MCP Prompts

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testPrompts() {
  console.log("🚀 Starting MCP Prompts Test...\n");

  const client = new Client(
    { name: "test-prompts-client", version: "1.0.0" },
    { capabilities: { prompts: {} } }
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"],
  });

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  try {
    // Test 1: List all prompts
    console.log("📋 Test 1: Listing all prompts...");
    const promptsList = await client.listPrompts();
    console.log(`Found ${promptsList.prompts.length} prompts\n`);
    promptsList.prompts.forEach((prompt) => {
      console.log(`  - ${prompt.name}`);
      console.log(`    Description: ${prompt.description || "No description"}`);
      if (prompt.arguments && prompt.arguments.length > 0) {
        console.log(
          `    Arguments: ${prompt.arguments.map((a) => a.name).join(", ")}`
        );
      }
    });
    console.log();

    // Test 2: Get started with button component
    console.log(
      "🔘 Test 2: Getting started with button component (Helm API)..."
    );
    const buttonPrompt = await client.getPrompt({
      name: "spartan-get-started",
      arguments: {
        componentName: "button",
        variant: "helm",
      },
    });
    console.log(`Messages returned: ${buttonPrompt.messages.length}`);
    const assistantMessage = buttonPrompt.messages.find(
      (m) => m.role === "assistant"
    );
    if (assistantMessage && assistantMessage.content.type === "text") {
      const preview = assistantMessage.content.text.substring(0, 300);
      console.log(`Preview:\n${preview}...\n`);
    }

    // Test 3: Compare APIs for calendar
    console.log("📅 Test 3: Comparing Brain vs Helm API for calendar...");
    const comparePrompt = await client.getPrompt({
      name: "spartan-compare-apis",
      arguments: {
        componentName: "calendar",
      },
    });
    console.log(`Messages returned: ${comparePrompt.messages.length}`);
    const compareAssistant = comparePrompt.messages.find(
      (m) => m.role === "assistant"
    );
    if (compareAssistant && compareAssistant.content.type === "text") {
      // Find the summary table
      const text = compareAssistant.content.text;
      const summaryMatch = text.match(
        /## 📊 Summary[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|/
      );
      if (summaryMatch) {
        console.log("Found summary table:");
        console.log(summaryMatch[0]);
      }
    }
    console.log();

    // Test 4: Implement feature with dialog
    console.log("💬 Test 4: Implementing form validation with dialog...");
    const featurePrompt = await client.getPrompt({
      name: "spartan-implement-feature",
      arguments: {
        componentName: "dialog",
        feature: "form validation",
        framework: "standalone",
      },
    });
    console.log(`Messages returned: ${featurePrompt.messages.length}`);
    console.log();

    // Test 5: Troubleshoot issue
    console.log("🐛 Test 5: Troubleshooting button styling issue...");
    const troubleshootPrompt = await client.getPrompt({
      name: "spartan-troubleshoot",
      arguments: {
        componentName: "button",
        issue: "Button variants not working, all buttons look the same",
      },
    });
    console.log(`Messages returned: ${troubleshootPrompt.messages.length}`);
    const troubleshootAssistant = troubleshootPrompt.messages.find(
      (m) => m.role === "assistant"
    );
    if (
      troubleshootAssistant &&
      troubleshootAssistant.content.type === "text"
    ) {
      const text = troubleshootAssistant.content.text;
      const commonIssuesMatch = text.match(
        /## Common Issues & Solutions[\s\S]{0,500}/
      );
      if (commonIssuesMatch) {
        console.log("Found troubleshooting section:");
        console.log(commonIssuesMatch[0].substring(0, 300) + "...");
      }
    }
    console.log();

    // Test 6: List all components
    console.log("📚 Test 6: Listing all components...");
    const listPrompt = await client.getPrompt({
      name: "spartan-list-components",
      arguments: {},
    });
    console.log(`Messages returned: ${listPrompt.messages.length}`);
    const listAssistant = listPrompt.messages.find(
      (m) => m.role === "assistant"
    );
    if (listAssistant && listAssistant.content.type === "text") {
      const text = listAssistant.content.text;
      const totalMatch = text.match(/\*\*Total Components\*\*: (\d+)/);
      if (totalMatch) {
        console.log(`Total components listed: ${totalMatch[1]}`);
      }
      // Show first category
      const categoryMatch = text.match(/## (.+?) \((\d+)\)/);
      if (categoryMatch) {
        console.log(
          `First category: ${categoryMatch[1]} with ${categoryMatch[2]} components`
        );
      }
    }
    console.log();

    // Test 7: Try invalid component
    console.log("❌ Test 7: Testing error handling with invalid component...");
    try {
      await client.getPrompt({
        name: "spartan-get-started",
        arguments: {
          componentName: "nonexistent",
        },
      });
      console.log("ERROR: Should have thrown an error!");
    } catch (error) {
      console.log(`✅ Correctly caught error: ${error.message}\n`);
    }

    console.log("✨ All prompt tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from server");
  }
}

testPrompts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
