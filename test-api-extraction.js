#!/usr/bin/env node

import {
  fetchContent,
  extractAPIInfo,
  extractCodeBlocks,
  extractHeadings,
  extractLinks,
} from "./tools/utils.js";

async function testAPIExtraction() {
  console.log("🧪 Testing API Extraction Functions...\n");

  try {
    // Test with a real component - accordion
    console.log("📥 Fetching accordion component documentation...");
    const accordionHTML = await fetchContent(
      "https://www.spartan.ng/components/accordion",
      "html",
      true
    );

    console.log("✅ Successfully fetched HTML\n");
    console.log(`📏 HTML Length: ${accordionHTML.length} characters\n`);

    // Test 1: Extract API Info
    console.log("========================================");
    console.log("TEST 1: Extract API Info");
    console.log("========================================");
    const apiInfo = extractAPIInfo(accordionHTML);

    console.log("\n📊 Brain API Components Found:", apiInfo.brainAPI.length);
    apiInfo.brainAPI.forEach((component, idx) => {
      console.log(`\n  ${idx + 1}. ${component.name}`);
      console.log(`     Selector: ${component.selector}`);
      console.log(`     Inputs: ${component.inputs.length}`);
      console.log(`     Outputs: ${component.outputs.length}`);
      if (component.inputs.length > 0) {
        console.log("     Sample Inputs:");
        component.inputs.slice(0, 3).forEach((input) => {
          console.log(
            `       - ${input.prop}: ${input.type} = ${input.default}`
          );
        });
      }
    });

    console.log("\n📊 Helm API Components Found:", apiInfo.helmAPI.length);
    apiInfo.helmAPI.forEach((component, idx) => {
      console.log(`\n  ${idx + 1}. ${component.name}`);
      console.log(`     Selector: ${component.selector}`);
      console.log(`     Inputs: ${component.inputs.length}`);
      console.log(`     Outputs: ${component.outputs.length}`);
    });

    console.log("\n📊 Examples Found:", apiInfo.examples.length);
    apiInfo.examples.slice(0, 5).forEach((example, idx) => {
      console.log(`\n  ${idx + 1}. ${example.title} (${example.language})`);
      console.log(`     Code length: ${example.code.length} characters`);
      console.log(
        `     Code preview: ${example.code
          .substring(0, 100)
          .replace(/\n/g, " ")}...`
      );
    });

    console.log("\n📊 Usage Patterns Found:", apiInfo.usage.length);
    console.log("📊 Interfaces Found:", apiInfo.interfaces.length);
    console.log("📊 Accessibility Info Found:", apiInfo.accessibility.length);

    // Test 2: Extract Code Blocks
    console.log("\n========================================");
    console.log("TEST 2: Extract Code Blocks");
    console.log("========================================");
    const codeBlocks = extractCodeBlocks(accordionHTML);
    console.log(`\n✅ Code Blocks Found: ${codeBlocks.length}`);
    codeBlocks.slice(0, 3).forEach((block, idx) => {
      console.log(`\n  Block ${idx + 1}:`);
      console.log(`     Length: ${block.length} characters`);
      console.log(
        `     Preview: ${block.substring(0, 100).replace(/\n/g, " ")}...`
      );
    });

    // Test 3: Extract Headings
    console.log("\n========================================");
    console.log("TEST 3: Extract Headings");
    console.log("========================================");
    const headings = extractHeadings(accordionHTML);
    console.log(`\n✅ Headings Found: ${headings.length}`);
    headings.forEach((heading, idx) => {
      console.log(`  ${idx + 1}. ${heading}`);
    });

    // Test 4: Extract Links
    console.log("\n========================================");
    console.log("TEST 4: Extract Links");
    console.log("========================================");
    const links = extractLinks(accordionHTML);
    console.log(`\n✅ Links Found: ${links.length}`);
    links.slice(0, 10).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.text} -> ${link.href}`);
    });

    // Test 5: Check for data pollution
    console.log("\n========================================");
    console.log("TEST 5: Check for Data Pollution");
    console.log("========================================");

    // Check if API extraction includes non-API content
    const apiInfoStr = JSON.stringify(apiInfo);
    const pollutionChecks = [
      { name: "Navigation Links", regex: /navigation|nav-item|menu-item/i },
      {
        name: "Footer Content",
        regex: /copyright|all rights reserved|footer/i,
      },
      { name: "Header Content", regex: /header|site-title|banner/i },
      { name: "Sidebar Content", regex: /sidebar|aside/i },
      { name: "Advertisement", regex: /advertisement|sponsor|ads/i },
      { name: "Social Links", regex: /twitter|facebook|github-link|social/i },
    ];

    console.log("\n🔍 Checking for non-API content pollution:");
    pollutionChecks.forEach((check) => {
      const found = check.regex.test(apiInfoStr);
      console.log(
        `  ${check.name}: ${
          found ? "⚠️  FOUND (potential pollution)" : "✅ Not found"
        }`
      );
    });

    // Test 6: Verify API extraction specificity
    console.log("\n========================================");
    console.log("TEST 6: Verify API Extraction Specificity");
    console.log("========================================");

    console.log("\n🎯 Checking if API extraction is focused:");

    const hasBrainAPI = apiInfo.brainAPI.length > 0;
    const hasHelmAPI = apiInfo.helmAPI.length > 0;
    const hasExamples = apiInfo.examples.length > 0;
    const hasReasonableExampleCount =
      apiInfo.examples.length > 0 && apiInfo.examples.length < 50;
    const hasReasonableUsageCount = apiInfo.usage.length < 100;

    console.log(`  Has Brain API components: ${hasBrainAPI ? "✅" : "❌"}`);
    console.log(`  Has Helm API components: ${hasHelmAPI ? "✅" : "❌"}`);
    console.log(`  Has examples: ${hasExamples ? "✅" : "❌"}`);
    console.log(
      `  Examples count is reasonable (<50): ${
        hasReasonableExampleCount
          ? "✅"
          : "⚠️  Too many examples - possible pollution"
      }`
    );
    console.log(
      `  Usage patterns count is reasonable (<100): ${
        hasReasonableUsageCount
          ? "✅"
          : "⚠️  Too many patterns - possible pollution"
      }`
    );

    // Test 7: Compare extraction methods
    console.log("\n========================================");
    console.log("TEST 7: Compare Extraction Methods");
    console.log("========================================");

    console.log("\n📊 Data size comparison:");
    console.log(`  Original HTML: ${accordionHTML.length} characters`);
    console.log(
      `  API Info JSON: ${apiInfoStr.length} characters (${(
        (apiInfoStr.length / accordionHTML.length) *
        100
      ).toFixed(2)}% of original)`
    );
    console.log(
      `  Code Blocks combined: ${codeBlocks.reduce(
        (sum, block) => sum + block.length,
        0
      )} characters`
    );
    console.log(
      `  Headings combined: ${headings.reduce(
        (sum, h) => sum + h.length,
        0
      )} characters`
    );

    const ratio = apiInfoStr.length / accordionHTML.length;
    if (ratio > 0.5) {
      console.log(
        "\n⚠️  WARNING: API extraction contains >50% of original HTML size - likely includes too much extra content!"
      );
    } else if (ratio > 0.3) {
      console.log(
        "\n⚠️  CAUTION: API extraction contains >30% of original HTML size - may include extra content"
      );
    } else {
      console.log("\n✅ API extraction size seems reasonable");
    }

    // Save results for inspection
    const fs = await import("fs");
    fs.writeFileSync(
      "/Users/rou/Desktop/ui-mcp/test-results-api-info.json",
      JSON.stringify(apiInfo, null, 2)
    );
    fs.writeFileSync(
      "/Users/rou/Desktop/ui-mcp/test-results-code-blocks.json",
      JSON.stringify(codeBlocks, null, 2)
    );
    fs.writeFileSync(
      "/Users/rou/Desktop/ui-mcp/test-results-headings.json",
      JSON.stringify(headings, null, 2)
    );

    console.log("\n💾 Results saved to:");
    console.log("   - test-results-api-info.json");
    console.log("   - test-results-code-blocks.json");
    console.log("   - test-results-headings.json");

    // Final assessment
    console.log("\n========================================");
    console.log("FINAL ASSESSMENT");
    console.log("========================================");

    const issues = [];
    if (!hasBrainAPI && !hasHelmAPI) issues.push("No API components extracted");
    if (!hasReasonableExampleCount) issues.push("Too many examples extracted");
    if (!hasReasonableUsageCount)
      issues.push("Too many usage patterns extracted");
    if (ratio > 0.5)
      issues.push("Extracted data is too large relative to source");

    if (issues.length === 0) {
      console.log(
        "\n✅ All tests passed! API extraction appears to be working correctly."
      );
    } else {
      console.log("\n⚠️  Issues found:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    return issues.length === 0;
  } catch (error) {
    console.error("\n❌ Error during testing:", error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testAPIExtraction()
  .then((success) => {
    console.log(
      `\n🎯 Overall Test Result: ${success ? "✅ PASSED" : "❌ FAILED"}`
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Test failed with error:", error);
    process.exit(1);
  });
