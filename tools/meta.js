//@ts-check
import {
  KNOWN_COMPONENTS,
  SPARTAN_COMPONENTS_BASE,
  SPARTAN_DOCS_BASE,
} from "./utils.js";

export function registerMetaTools(server) {
  server.registerTool(
    "spartan_meta",
    {
      title: "Spartan metadata",
      description:
        "Return known docs topics and components for client autocomplete.",
      inputSchema: {},
    },
    async () => {
      const topics = [
        "installation",
        "theming",
        "dark-mode",
        "typography",
        "health-checks",
        "update-guide",
        "analog-dark-mode",
      ];
      const responseData = {
        topics: topics.map((t) => ({
          topic: t,
          url:
            t === "analog-dark-mode"
              ? "https://dev.to/this-is-angular/dark-mode-with-analog-tailwind-4049"
              : `${SPARTAN_DOCS_BASE}/${t}`,
        })),
        components: KNOWN_COMPONENTS.map((n) => ({
          name: n,
          url: `${SPARTAN_COMPONENTS_BASE}/${n}`,
        })),
        usage: {
          "spartan.docs.get": "Fetch documentation topics",
          "spartan.components.get":
            "Fetch component APIs with extract='api' for structured data",
          "spartan.components.list": "List all available components",
        },
      };
      const responseText =
        JSON.stringify(responseData, null, 2) +
        "\n\nPROCESSING INSTRUCTIONS:\n" +
        "- Use this metadata to understand available topics and components\n" +
        "- Always fetch component documentation with extract='api' for structured API data\n" +
        "- Parse and present Brain API and Helm API information from responses\n" +
        "- Include code examples and usage patterns in your responses";
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
}
