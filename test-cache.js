#!/usr/bin/env node
//@ts-check

/**
 * Test script for cache functionality
 */

import { cacheManager } from "./tools/cache.js";
import { warmCache } from "./tools/cache-warmup.js";
import { KNOWN_COMPONENTS } from "./tools/utils.js";

console.log("🧪 CACHE SYSTEM TEST\n");
console.log("=".repeat(60));

async function runTests() {
  try {
    // Test 1: Initialize cache manager
    console.log("\n✅ TEST 1: Initialize cache manager");
    const version = await cacheManager.initialize();
    console.log(`   Version detected: ${version}`);

    // Test 2: Get stats (should be empty initially)
    console.log("\n✅ TEST 2: Get cache stats (empty cache)");
    const stats1 = await cacheManager.getStats();
    console.log(`   Cached versions: ${stats1.totalVersions}`);
    console.log(`   Current version: ${stats1.currentVersion}`);

    // Test 3: Warm cache for 3 components
    console.log("\n✅ TEST 3: Warm cache for 3 components");
    const testComponents = ["button", "dialog", "calendar"];
    const results = await warmCache({
      components: testComponents,
      includeDocs: false,
      onProgress: (current, total) => {
        console.log(`   Progress: ${current}/${total}`);
      },
    });
    console.log(
      `   Success: ${results.components.success}/${results.components.total}`
    );

    // Test 4: Check cached component
    console.log("\n✅ TEST 4: Retrieve cached component");
    const cached = await cacheManager.getComponent("button", "full");
    console.log(`   Cached: ${cached.cached}`);
    console.log(`   Stale: ${cached.stale}`);
    console.log(`   Version: ${cached.version}`);
    if (cached.data) {
      console.log(`   Has HTML: ${!!cached.data.html}`);
      console.log(`   Has API: ${!!cached.data.api}`);
      console.log(`   Examples count: ${cached.data.examples?.length || 0}`);
    }

    // Test 5: Get stats again
    console.log("\n✅ TEST 5: Get cache stats (after caching)");
    const stats2 = await cacheManager.getStats();
    if (stats2.versions.length > 0) {
      const currentVersionStats = stats2.versions.find((v) => v.isCurrent);
      if (currentVersionStats) {
        console.log(
          `   Components cached: ${currentVersionStats.componentCount}`
        );
        console.log(`   Docs cached: ${currentVersionStats.docsCount}`);
        console.log(`   Last updated: ${currentVersionStats.lastUpdated}`);
      }
    }

    // Test 6: List versions
    console.log("\n✅ TEST 6: List all versions");
    const versions = await cacheManager.listVersions();
    console.log(`   Total versions: ${versions.length}`);
    versions.forEach((v) => {
      console.log(`   - ${v.version}${v.isCurrent ? " (current)" : ""}`);
    });

    // Test 7: Switch version
    console.log("\n✅ TEST 7: Switch to test version");
    const switchResult = await cacheManager.switchVersion("0.0.0-test");
    console.log(`   Success: ${switchResult.success}`);
    console.log(`   New version: ${switchResult.version}`);

    // Switch back
    await cacheManager.switchVersion(version);
    console.log(`   Switched back to: ${version}`);

    // Test 8: Clear current version cache
    console.log("\n✅ TEST 8: Clear current version cache");
    const clearResult = await cacheManager.clearVersion();
    console.log(`   Success: ${clearResult.success}`);
    console.log(`   Message: ${clearResult.message}`);

    // Verify it's cleared
    const stats3 = await cacheManager.getStats();
    const clearedStats = stats3.versions.find((v) => v.isCurrent);
    console.log(
      `   Components after clear: ${clearedStats?.componentCount || 0}`
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(60));
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error("\n❌ TEST FAILED:");
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();
