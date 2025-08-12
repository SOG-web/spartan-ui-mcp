//@ts-check
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

export function registerComponentTools(server) {
  // List components
  server.registerTool(
    "spartan.components.list",
    {
      title: "List Spartan UI components",
      description:
        "Returns a list of known Spartan Angular UI components with their documentation URLs. " +
        "Use this to discover available components, then call spartan.components.get with specific component names to get detailed API documentation.",
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
        "- Use spartan.components.get with any component name to get detailed API documentation\n" +
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
    }
  );

  // Get component page
  server.registerTool(
    "spartan.components.get",
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
          .default("none")
          .describe(
            "Optional extraction: 'code' for code blocks, 'headings' for section headers, 'links' for URLs, 'api' for structured API information."
          ),
        noCache: z.boolean().default(false).describe("Bypass cache when true."),
      },
    },
    async (args) => {
      const name = String(args.name || "")
        .trim()
        .toLowerCase();
      if (!name) throw new Error("Missing component name");
      const url = `${SPARTAN_COMPONENTS_BASE}/${encodeURIComponent(name)}`;
      const format = args.format === "text" ? "text" : "html";
      const extract = args.extract || "none";
      const noCache = Boolean(args.noCache);
      const content = await fetchContent(url, format, noCache);
      if (extract === "none" || format === "text") {
        const responseText =
          `${content}\n\nSource: ${url}\n\n` +
          "PROCESSING INSTRUCTIONS:\n" +
          "- This response contains detailed API documentation\n" +
          "- Look for 'Brain API' and 'Helm API' sections, e.t.c lookout for all headers and other sections\n" +
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
        processingInstructions:
          "Always parse and present the API information, code examples, and component specifications from this data.",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    }
  );
}
