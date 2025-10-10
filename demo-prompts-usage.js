#!/usr/bin/env node
// Real-world demonstration of using MCP Prompts

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

console.log("🎯 REAL-WORLD PROMPT USAGE DEMO\n");
console.log("=".repeat(60));
console.log();

const client = new Client(
  { name: "demo-client", version: "1.0.0" },
  { capabilities: { prompts: {} } }
);

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"],
});

await client.connect(transport);

// ============================================
// USE CASE 1: New Developer Getting Started
// ============================================
console.log("📚 USE CASE 1: New Developer Wants to Add a Dialog\n");
console.log(
  "Scenario: Developer is building an Angular app and needs a dialog component"
);
console.log("They don't know much about Spartan UI yet.\n");

console.log("→ Developer asks: 'How do I add a dialog to my Angular app?'\n");
console.log("→ MCP uses prompt: spartan-get-started\n");

const dialogStart = await client.getPrompt({
  name: "spartan-get-started",
  arguments: {
    componentName: "dialog",
    variant: "helm",
  },
});

console.log("✅ RESPONSE RECEIVED:\n");
console.log("-".repeat(60));
const dialogAssistant = dialogStart.messages.find(
  (m) => m.role === "assistant"
);
if (dialogAssistant && dialogAssistant.content.type === "text") {
  // Show first 800 characters
  console.log(dialogAssistant.content.text.substring(0, 800));
  console.log(
    "\n... (truncated for demo, full response has installation, examples, etc.)"
  );
}
console.log("-".repeat(60));
console.log();

// ============================================
// USE CASE 2: Developer Choosing Between APIs
// ============================================
console.log("\n📊 USE CASE 2: Developer Needs to Choose API Type\n");
console.log("Scenario: Developer sees both Brain and Helm APIs in docs");
console.log("They're confused about which one to use.\n");

console.log(
  "→ Developer asks: 'Should I use Brain or Helm API for calendar?'\n"
);
console.log("→ MCP uses prompt: spartan-compare-apis\n");

const calendarCompare = await client.getPrompt({
  name: "spartan-compare-apis",
  arguments: {
    componentName: "calendar",
  },
});

console.log("✅ RESPONSE RECEIVED:\n");
console.log("-".repeat(60));
const compareAssistant = calendarCompare.messages.find(
  (m) => m.role === "assistant"
);
if (compareAssistant && compareAssistant.content.type === "text") {
  const text = compareAssistant.content.text;
  // Show the recommendation section
  const recMatch = text.match(/## 💡 Recommendation[\s\S]{0,300}/);
  if (recMatch) {
    console.log(recMatch[0]);
  }

  // Show summary table
  const tableMatch = text.match(/## 📊 Summary[\s\S]*?\n\n/);
  if (tableMatch) {
    console.log("\n" + tableMatch[0]);
  }
}
console.log("-".repeat(60));
console.log();

// ============================================
// USE CASE 3: Implementing a Specific Feature
// ============================================
console.log("\n🛠️ USE CASE 3: Implementing Multi-Select with Combobox\n");
console.log("Scenario: Developer needs multi-selection functionality");
console.log(
  "They found the combobox component but need implementation help.\n"
);

console.log(
  "→ Developer asks: 'How do I implement multi-select with combobox?'\n"
);
console.log("→ MCP uses prompt: spartan-implement-feature\n");

const comboFeature = await client.getPrompt({
  name: "spartan-implement-feature",
  arguments: {
    componentName: "combobox",
    feature: "multi-select",
    framework: "standalone",
  },
});

console.log("✅ RESPONSE RECEIVED:\n");
console.log("-".repeat(60));
const featureAssistant = comboFeature.messages.find(
  (m) => m.role === "assistant"
);
if (featureAssistant && featureAssistant.content.type === "text") {
  const text = featureAssistant.content.text;
  // Show implementation steps
  const stepsMatch = text.match(/## Implementation Steps[\s\S]{0,500}/);
  if (stepsMatch) {
    console.log(stepsMatch[0]);
  }
}
console.log("-".repeat(60));
console.log();

// ============================================
// USE CASE 4: Debugging an Issue
// ============================================
console.log("\n🐛 USE CASE 4: Button Styles Not Working\n");
console.log("Scenario: Developer added button but all buttons look the same");
console.log("The variant prop doesn't seem to work.\n");

console.log("→ Developer asks: 'My button variants aren't working, help!'\n");
console.log("→ MCP uses prompt: spartan-troubleshoot\n");

const buttonTroubleshoot = await client.getPrompt({
  name: "spartan-troubleshoot",
  arguments: {
    componentName: "button",
    issue: "All buttons look the same, variants not working",
  },
});

console.log("✅ RESPONSE RECEIVED:\n");
console.log("-".repeat(60));
const troubleshootAssistant = buttonTroubleshoot.messages.find(
  (m) => m.role === "assistant"
);
if (troubleshootAssistant && troubleshootAssistant.content.type === "text") {
  const text = troubleshootAssistant.content.text;
  // Show first few common issues
  const issuesMatch = text.match(/## Common Issues & Solutions[\s\S]{0,600}/);
  if (issuesMatch) {
    console.log(issuesMatch[0]);
    console.log("\n... (more solutions available in full response)");
  }
}
console.log("-".repeat(60));
console.log();

// ============================================
// USE CASE 5: Browsing Components
// ============================================
console.log("\n📚 USE CASE 5: New User Exploring Available Components\n");
console.log("Scenario: Developer just discovered Spartan UI");
console.log("They want to see what's available.\n");

console.log("→ Developer asks: 'What components does Spartan UI have?'\n");
console.log("→ MCP uses prompt: spartan-list-components\n");

const listComponents = await client.getPrompt({
  name: "spartan-list-components",
  arguments: {},
});

console.log("✅ RESPONSE RECEIVED:\n");
console.log("-".repeat(60));
const listAssistant = listComponents.messages.find(
  (m) => m.role === "assistant"
);
if (listAssistant && listAssistant.content.type === "text") {
  const text = listAssistant.content.text;
  // Show first category
  const categoryMatch = text.match(/## Form Controls[\s\S]{0,400}/);
  if (categoryMatch) {
    console.log(categoryMatch[0]);
    console.log("\n... (7 more categories available)");
  }

  // Show total
  const totalMatch = text.match(/\*\*Total Components\*\*: (\d+)/);
  if (totalMatch) {
    console.log(`\n📊 ${totalMatch[0]}`);
  }
}
console.log("-".repeat(60));
console.log();

// ============================================
// SUMMARY
// ============================================
console.log("\n" + "=".repeat(60));
console.log("🎯 SUMMARY: HOW PROMPTS HELP DEVELOPERS\n");
console.log("1. ✅ Get Started Quickly - No need to search docs manually");
console.log("2. ✅ Make Informed Decisions - Compare options easily");
console.log("3. ✅ Implement Features - Step-by-step guidance");
console.log("4. ✅ Debug Issues - Common problems & solutions");
console.log("5. ✅ Discover Components - Organized, browsable list");
console.log();
console.log("🚀 All of this happens AUTOMATICALLY when AI assistants");
console.log("   use your MCP server in tools like Claude Desktop or Cursor!");
console.log("=".repeat(60));

await client.close();
