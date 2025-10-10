//@ts-check
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Version-aware cache manager for Spartan UI documentation
 * Stores cached data in cache/{version}/ directory structure
 */
export class CacheManager {
  constructor() {
    this.cacheDir = path.join(PROJECT_ROOT, "cache");
    this.currentVersion = null;
    this.cacheMetadata = null;
  }

  /**
   * Initialize cache directory with version
   * @param {string} [spartanVersion] - Spartan UI version (defaults to "latest")
   */
  async initialize(spartanVersion) {
    // Use provided version or default to "latest"
    this.currentVersion = spartanVersion || "latest";

    // Ensure cache directory structure exists
    await this.ensureCacheDir();

    // Load or create metadata
    await this.loadMetadata();

    return this.currentVersion;
  }

  /**
   * Ensure cache directory structure exists
   */
  async ensureCacheDir() {
    const versionDir = path.join(this.cacheDir, this.currentVersion);
    const componentsDir = path.join(versionDir, "components");
    const docsDir = path.join(versionDir, "docs");

    await fs.mkdir(componentsDir, { recursive: true });
    await fs.mkdir(docsDir, { recursive: true });
  }

  /**
   * Load cache metadata
   */
  async loadMetadata() {
    const metadataPath = path.join(
      this.cacheDir,
      this.currentVersion,
      "metadata.json"
    );

    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      this.cacheMetadata = JSON.parse(data);
    } catch (error) {
      // Create new metadata if it doesn't exist
      this.cacheMetadata = {
        version: this.currentVersion,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        components: {},
        docs: {},
      };
      await this.saveMetadata();
    }
  }

  /**
   * Save cache metadata
   */
  async saveMetadata() {
    const metadataPath = path.join(
      this.cacheDir,
      this.currentVersion,
      "metadata.json"
    );
    await fs.writeFile(
      metadataPath,
      JSON.stringify(this.cacheMetadata, null, 2),
      "utf-8"
    );
  }

  /**
   * Get cached component data
   * @param {string} componentName
   * @param {string} dataType - "html", "api", "examples", "full"
   */
  async getComponent(componentName, dataType = "full") {
    const componentFile = path.join(
      this.cacheDir,
      this.currentVersion,
      "components",
      `${componentName}.json`
    );

    try {
      const data = await fs.readFile(componentFile, "utf-8");
      const componentData = JSON.parse(data);

      // Check if cache is still valid (TTL check)
      const ttlHours = Number(process.env.SPARTAN_CACHE_TTL_HOURS || 24);
      const cacheAge = Date.now() - new Date(componentData.cachedAt).getTime();
      const isStale = cacheAge > ttlHours * 60 * 60 * 1000;

      return {
        data: componentData[dataType] || componentData,
        cached: true,
        stale: isStale,
        cachedAt: componentData.cachedAt,
        version: this.currentVersion,
      };
    } catch (error) {
      return {
        data: null,
        cached: false,
        stale: false,
        cachedAt: null,
        version: this.currentVersion,
      };
    }
  }

  /**
   * Set cached component data
   * @param {string} componentName
   * @param {Object} data - { html, api, examples, full }
   */
  async setComponent(componentName, data) {
    const componentFile = path.join(
      this.cacheDir,
      this.currentVersion,
      "components",
      `${componentName}.json`
    );

    const cacheEntry = {
      ...data,
      componentName,
      version: this.currentVersion,
      cachedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      componentFile,
      JSON.stringify(cacheEntry, null, 2),
      "utf-8"
    );

    // Update metadata
    this.cacheMetadata.components[componentName] = {
      cachedAt: cacheEntry.cachedAt,
      size: JSON.stringify(cacheEntry).length,
    };
    this.cacheMetadata.lastUpdated = new Date().toISOString();
    await this.saveMetadata();
  }

  /**
   * Get cached docs data
   * @param {string} topic - "installation", "theming", etc.
   */
  async getDocs(topic) {
    const docsFile = path.join(
      this.cacheDir,
      this.currentVersion,
      "docs",
      `${topic}.json`
    );

    try {
      const data = await fs.readFile(docsFile, "utf-8");
      const docsData = JSON.parse(data);

      const ttlHours = Number(process.env.SPARTAN_CACHE_TTL_HOURS || 24);
      const cacheAge = Date.now() - new Date(docsData.cachedAt).getTime();
      const isStale = cacheAge > ttlHours * 60 * 60 * 1000;

      return {
        data: docsData.content,
        cached: true,
        stale: isStale,
        cachedAt: docsData.cachedAt,
        version: this.currentVersion,
      };
    } catch (error) {
      return {
        data: null,
        cached: false,
        stale: false,
        cachedAt: null,
        version: this.currentVersion,
      };
    }
  }

  /**
   * Set cached docs data
   * @param {string} topic
   * @param {string} content
   */
  async setDocs(topic, content) {
    const docsFile = path.join(
      this.cacheDir,
      this.currentVersion,
      "docs",
      `${topic}.json`
    );

    const cacheEntry = {
      topic,
      content,
      version: this.currentVersion,
      cachedAt: new Date().toISOString(),
    };

    await fs.writeFile(docsFile, JSON.stringify(cacheEntry, null, 2), "utf-8");

    // Update metadata
    this.cacheMetadata.docs[topic] = {
      cachedAt: cacheEntry.cachedAt,
      size: JSON.stringify(cacheEntry).length,
    };
    this.cacheMetadata.lastUpdated = new Date().toISOString();
    await this.saveMetadata();
  }

  /**
   * Clear all cached data for current version
   */
  async clearVersion() {
    const versionDir = path.join(this.cacheDir, this.currentVersion);

    try {
      await fs.rm(versionDir, { recursive: true, force: true });
      await this.ensureCacheDir();
      await this.loadMetadata();

      return {
        success: true,
        message: `Cleared cache for version ${this.currentVersion}`,
        version: this.currentVersion,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear cache: ${error.message}`,
        version: this.currentVersion,
      };
    }
  }

  /**
   * Clear all cached data for all versions
   */
  async clearAll() {
    try {
      const versions = await fs.readdir(this.cacheDir);
      let clearedVersions = [];

      for (const version of versions) {
        const versionPath = path.join(this.cacheDir, version);
        const stats = await fs.stat(versionPath);

        if (stats.isDirectory()) {
          await fs.rm(versionPath, { recursive: true, force: true });
          clearedVersions.push(version);
        }
      }

      await this.ensureCacheDir();
      await this.loadMetadata();

      return {
        success: true,
        message: `Cleared cache for ${clearedVersions.length} version(s)`,
        versions: clearedVersions,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear all cache: ${error.message}`,
        versions: [],
      };
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const versions = await fs.readdir(this.cacheDir);
      const versionStats = [];

      for (const version of versions) {
        const versionPath = path.join(this.cacheDir, version);
        const stats = await fs.stat(versionPath);

        if (stats.isDirectory()) {
          const metadataPath = path.join(versionPath, "metadata.json");
          try {
            const metadataContent = await fs.readFile(metadataPath, "utf-8");
            const metadata = JSON.parse(metadataContent);

            const componentCount = Object.keys(
              metadata.components || {}
            ).length;
            const docsCount = Object.keys(metadata.docs || {}).length;

            versionStats.push({
              version,
              componentCount,
              docsCount,
              createdAt: metadata.createdAt,
              lastUpdated: metadata.lastUpdated,
              isCurrent: version === this.currentVersion,
            });
          } catch (error) {
            // Skip invalid directories
          }
        }
      }

      return {
        currentVersion: this.currentVersion,
        totalVersions: versionStats.length,
        versions: versionStats,
      };
    } catch (error) {
      return {
        currentVersion: this.currentVersion,
        totalVersions: 0,
        versions: [],
        error: error.message,
      };
    }
  }

  /**
   * List all available versions
   */
  async listVersions() {
    try {
      const versions = await fs.readdir(this.cacheDir);
      const validVersions = [];

      for (const version of versions) {
        const versionPath = path.join(this.cacheDir, version);
        const stats = await fs.stat(versionPath);

        if (stats.isDirectory()) {
          validVersions.push({
            version,
            path: versionPath,
            isCurrent: version === this.currentVersion,
          });
        }
      }

      return validVersions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Switch to a different version
   * @param {string} version
   */
  async switchVersion(version) {
    this.currentVersion = version;
    await this.ensureCacheDir();
    await this.loadMetadata();

    return {
      success: true,
      version: this.currentVersion,
      message: `Switched to version ${version}`,
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
