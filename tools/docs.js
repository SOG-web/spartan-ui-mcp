//@ts-check
import { z } from "zod";
import {
  SPARTAN_DOCS_BASE,
  fetchContent,
  extractCodeBlocks,
  extractHeadings,
  extractLinks,
} from "./utils.js";

export function registerDocsTools(server) {
  server.registerTool(
    "spartan.docs.get",
    {
      title: "Get a Spartan docs section",
      description:
        "Fetch an official Spartan documentation section by topic (installation, theming, dark-mode, typography, health-checks, update-guide).",
      inputSchema: {
        topic: z
          .enum([
            "installation",
            "theming",
            "dark-mode",
            "typography",
            "health-checks",
            "update-guide",
            "analog-dark-mode",
          ])
          .describe(
            "Documentation topic to fetch. Includes 'analog-dark-mode' external article."
          ),
        format: z
          .enum(["html", "text"])
          .default("html")
          .describe("Return format: raw HTML or plain text."),
        extract: z
          .enum(["none", "code", "headings", "links"])
          .default("none")
          .describe("Optional extraction: code blocks, headings, or links."),
        noCache: z.boolean().default(false).describe("Bypass cache when true."),
      },
    },
    async (args) => {
      const topic = /** @type {string} */ (args.topic);
      const format = args.format === "text" ? "text" : "html";
      const extract = args.extract || "none";
      const noCache = Boolean(args.noCache);
      const url =
        topic === "analog-dark-mode"
          ? "https://dev.to/this-is-angular/dark-mode-with-analog-tailwind-4049"
          : `${SPARTAN_DOCS_BASE}/${encodeURIComponent(topic)}`;
      const content = await fetchContent(url, format, noCache);
      if (extract === "none" || format === "text") {
        return {
          content: [{ type: "text", text: `${content}\n\nSource: ${url}` }],
        };
      }
      const html = /** @type {string} */ (
        await fetchContent(url, "html", noCache)
      );
      let extracted;
      if (extract === "code") extracted = extractCodeBlocks(html);
      else if (extract === "headings") extracted = extractHeadings(html);
      else if (extract === "links") extracted = extractLinks(html);
      else extracted = [];
      const payload = {
        url,
        extract,
        count: Array.isArray(extracted) ? extracted.length : 0,
        data: extracted,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    }
  );
}
