import { z } from "zod";
import {
  KNOWN_COMPONENTS,
  SPARTAN_COMPONENTS_BASE,
  fetchContent,
  extractCodeBlocks,
  extractHeadings,
  extractLinks,
  extractAPIInfo,
} from "./utils.js";
import { cacheManager } from "./cache.js";

export function registerComponentTools(server) {
  // List components
  server.registerTool(
    "spartan_components_list",
    {
      title: "List Spartan UI components",
      description:
        "Returns a list of known Spartan Angular UI components with their documentation URLs. " +
        "Use this to discover available components, then call spartan_components_get with specific component names to get detailed API documentation.",
      inputSchema: {},
    },
    async () => {
      const items = KNOWN_COMPONENTS.map((name) => ({
        name,
        url: `${SPARTAN_COMPONENTS_BASE}/${name}`,
      }));
      const responseText =
        JSON.stringify({ components: items }, null, 2) +
        "\n\nPROCESSING INSTRUCTIONS:\n" +
        "- This list contains all available Spartan UI components\n" +
        "- Use spartan_components_get with any component name to get detailed API documentation\n" +
        "- Each component has Brain API (Brn*) and Helm API (Hlm*) variants\n" +
        "- Always present component options and APIs when helping users";
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    },
  );

  // Get component page
  server.registerTool(
    "spartan_components_get",
    {
      title: "Get component documentation",
      description:
        "Fetch the Spartan UI documentation page for a given component (e.g., 'accordion'). " +
        "IMPORTANT: The response contains comprehensive API information including Brain API (Brn*) and Helm API (Hlm*) components with their inputs, outputs, selectors, and examples. " +
        "Always parse and present the API tables, code examples, and component specifications from the response. " +
        "Look for structured sections like 'Brain API', 'Helm API', and 'Examples' in the response.",
      inputSchema: {
        name: z
          .string()
          .min(1, "name is required")
          .describe("Component name (kebab-case), e.g., 'accordion'."),
        format: z
          .enum(["html", "text"])
          .default("html")
          .describe("Return format: raw HTML or plain text."),
        extract: z
          .enum(["none", "code", "headings", "links", "api"])
          .default("code")
          .describe(
            "Optional extraction: 'code' for code blocks, 'headings' for section headers, 'links' for URLs, 'api' for structured API information.",
          ),
        noCache: z.boolean().default(false).describe("Bypass cache when true."),
        spartanVersion: z
          .string()
          .optional()
          .describe(
            "Spartan UI version to use for caching (e.g., '1.2.3'). If not provided, defaults to 'latest'.",
          ),
      },
    },
    async (
      /** @type {{ name: any; format: string; extract: string; noCache: any; spartanVersion?: string; }} */ args,
    ) => {
      const name = String(args.name || "")
        .trim()
        .toLowerCase();
      if (!name) throw new Error("Missing component name");

      // Initialize cache with version (defaults to "latest")
      await cacheManager.initialize(args.spartanVersion);

      const url = `${SPARTAN_COMPONENTS_BASE}/${encodeURIComponent(name)}`;
      const format = args.format === "text" ? "text" : "html";
      const extract = args.extract || "code";
      const noCache = Boolean(args.noCache);

      let content;
      let cacheInfo = "";

      // Try cache first if not bypassed
      if (!noCache) {
        const cached = await cacheManager.getComponent(name, "full");
        if (cached.cached && !cached.stale) {
          // Use cached data
          if (format === "text") {
            content = cached.data.html; // Will be converted below if needed
          } else {
            content = cached.data.html;
          }
          cacheInfo = `\n[📦 CACHED DATA - Version: ${cached.version}, Cached at: ${cached.cachedAt}]`;
        } else if (cached.cached && cached.stale) {
          // Cache exists but stale - fetch fresh and update
          content = await fetchContent(url, format, true);
          const html = format === "text" ? content : content;
          const api = extractAPIInfo(/** @type {string} */ (html));
          const examples = extractCodeBlocks(/** @type {string} */ (html));
          await cacheManager.setComponent(name, {
            html,
            api,
            examples,
            full: { html, api, examples, url },
          });
          cacheInfo = `\n[🔄 CACHE REFRESHED - Version: ${cacheManager.currentVersion}]`;
        } else {
          // No cache - fetch and cache
          content = await fetchContent(url, format, true);
          const html = format === "text" ? content : content;
          const api = extractAPIInfo(/** @type {string} */ (html));
          const examples = extractCodeBlocks(/** @type {string} */ (html));
          await cacheManager.setComponent(name, {
            html,
            api,
            examples,
            full: { html, api, examples, url },
          });
          cacheInfo = `\n[✨ NEWLY CACHED - Version: ${cacheManager.currentVersion}]`;
        }
      } else {
        // Bypass cache completely
        content = await fetchContent(url, format, true);
        cacheInfo = "\n[🌐 LIVE FETCH - Cache bypassed]";
      }

      if (extract === "none" || format === "text") {
        const responseText =
          `${content}${cacheInfo}\n\nSource: ${url}\n\n` +
          "PROCESSING INSTRUCTIONS:\n" +
          "- This response contains detailed API documentation\n" +
          "- Look for 'Brain API' and 'Helm API' sections, etc. look out for all headers and other sections\n" +
          "- Extract component selectors, inputs, outputs, and examples\n" +
          "- Present API information in structured format\n" +
          "- Include code examples and usage patterns";
        return {
          content: [{ type: "text", text: responseText }],
        };
      }

      const html = /** @type {string} */ (
        await fetchContent(url, "html", noCache)
      );
      let extracted;
      if (extract === "code") extracted = extractCodeBlocks(html);
      else if (extract === "headings") extracted = extractHeadings(html);
      else if (extract === "links") extracted = extractLinks(html);
      else if (extract === "api") extracted = extractAPIInfo(html);
      else extracted = [];
      const payload = {
        url,
        extract,
        count: Array.isArray(extracted) ? extracted.length : 0,
        data: extracted,
        cacheInfo: cacheInfo.trim(),
        version: cacheManager.currentVersion,
        processingInstructions:
          "Always parse and present the API information, code examples, and component specifications from this data.",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );
}
