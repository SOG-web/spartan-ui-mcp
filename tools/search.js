//@ts-check
import { z } from "zod";
import {
  KNOWN_COMPONENTS,
  SPARTAN_COMPONENTS_BASE,
  SPARTAN_DOCS_BASE,
  fetchContent,
  htmlToText,
  extractCodeBlocks,
  extractAPIInfo,
} from "./utils.js";

export function registerSearchTools(server) {
  // Full-text search across all components and docs
  server.registerTool(
    "spartan.search",
    {
      title: "Full-text search across Spartan UI",
      description:
        "Search across all Spartan UI components and documentation for specific terms, features, or concepts. " +
        "Returns relevant components, examples, and documentation sections matching the query.",
      inputSchema: {
        query: z
          .string()
          .min(1, "query is required")
          .describe(
            "Search query (e.g., 'date picker', 'form validation', 'accessibility')"
          ),
        scope: z
          .enum(["all", "components", "docs"])
          .default("all")
          .describe(
            "Search scope: 'all' for everything, 'components' for components only, 'docs' for documentation only"
          ),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Maximum number of results to return"),
      },
    },
    async (args) => {
      const query = String(args.query || "")
        .trim()
        .toLowerCase();
      const results = await performFullTextSearch(
        query,
        args.scope,
        args.limit
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                scope: args.scope,
                resultCount: results.length,
                results,
                processingInstructions:
                  "Present search results with component names, relevance scores, and matching content. Include usage examples and API information when relevant.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Search components by feature/use-case
  server.registerTool(
    "spartan.components.search",
    {
      title: "Search components by feature or use-case",
      description:
        "Find Spartan UI components based on specific features, use cases, or functionality. " +
        "Analyzes component APIs and descriptions to match user needs with appropriate components.",
      inputSchema: {
        feature: z
          .string()
          .min(1, "feature is required")
          .describe(
            "Feature or use case (e.g., 'multi-selection', 'form input', 'overlay', 'navigation')"
          ),
        includeExamples: z
          .boolean()
          .default(true)
          .describe("Include usage examples in results"),
        includeAPI: z
          .boolean()
          .default(false)
          .describe("Include detailed API information"),
      },
    },
    async (args) => {
      const feature = String(args.feature || "")
        .trim()
        .toLowerCase();
      const matches = await searchComponentsByFeature(
        feature,
        args.includeExamples,
        args.includeAPI
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                feature,
                matchCount: matches.length,
                components: matches,
                processingInstructions:
                  "Present components that match the requested feature. Explain why each component is relevant and provide usage guidance.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Get specific examples by component name
  server.registerTool(
    "spartan.examples.get",
    {
      title: "Get specific examples by component name",
      description:
        "Retrieve all available examples for a specific Spartan UI component, including basic usage, " +
        "advanced scenarios, and integration patterns.",
      inputSchema: {
        componentName: z
          .string()
          .min(1, "componentName is required")
          .describe("Spartan component name (e.g., 'calendar', 'button')"),
        exampleType: z
          .enum(["all", "basic", "advanced", "integration", "accessibility"])
          .default("all")
          .describe("Type of examples to retrieve"),
        includeCode: z
          .boolean()
          .default(true)
          .describe("Include full code examples"),
      },
    },
    async (args) => {
      const componentName = String(args.componentName || "")
        .trim()
        .toLowerCase();
      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(
          `Unknown component: ${componentName}. Available: ${KNOWN_COMPONENTS.join(
            ", "
          )}`
        );
      }

      const examples = await getComponentExamples(
        componentName,
        args.exampleType,
        args.includeCode
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: componentName,
                exampleType: args.exampleType,
                exampleCount: examples.length,
                examples,
                processingInstructions:
                  "Present examples with clear descriptions, code snippets, and usage context. Explain when to use each pattern.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

/**
 * Perform full-text search across components and docs
 * @param {string} query
 * @param {string} scope
 * @param {number} limit
 */
async function performFullTextSearch(query, scope, limit) {
  const results = [];
  const searchTerms = query.split(/\s+/).filter((term) => term.length > 2);

  try {
    // Search components
    if (scope === "all" || scope === "components") {
      for (const component of KNOWN_COMPONENTS) {
        try {
          const url = `${SPARTAN_COMPONENTS_BASE}/${component}`;
          const content = await fetchContent(url, "text", false);
          const score = calculateRelevanceScore(content, searchTerms);

          if (score > 0) {
            const matches = extractMatchingContent(content, searchTerms);
            results.push({
              type: "component",
              name: component,
              url,
              score,
              matches,
              description: extractDescription(content),
            });
          }
        } catch (error) {
          console.warn(
            `Failed to search component ${component}:`,
            error.message
          );
        }
      }
    }

    // Search documentation
    if (scope === "all" || scope === "docs") {
      const docTopics = [
        "installation",
        "theming",
        "dark-mode",
        "typography",
        "health-checks",
        "update-guide",
      ];

      for (const topic of docTopics) {
        try {
          const url = `${SPARTAN_DOCS_BASE}/${topic}`;
          const content = await fetchContent(url, "text", false);
          const score = calculateRelevanceScore(content, searchTerms);

          if (score > 0) {
            const matches = extractMatchingContent(content, searchTerms);
            results.push({
              type: "documentation",
              topic,
              url,
              score,
              matches,
              description: extractDescription(content),
            });
          }
        } catch (error) {
          console.warn(`Failed to search doc topic ${topic}:`, error.message);
        }
      }
    }

    // Sort by relevance score and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Search components by feature
 * @param {string} feature
 * @param {boolean} includeExamples
 * @param {boolean} includeAPI
 */
async function searchComponentsByFeature(feature, includeExamples, includeAPI) {
  const matches = [];
  const featureKeywords = feature
    .split(/\s+/)
    .map((term) => term.toLowerCase());

  // Feature mapping - maps features to likely components
  const featureMap = {
    "multi-selection": ["calendar", "select", "combobox", "checkbox"],
    form: [
      "input",
      "textarea",
      "select",
      "checkbox",
      "radio-group",
      "form-field",
    ],
    overlay: ["dialog", "popover", "tooltip", "sheet", "dropdown-menu"],
    navigation: ["breadcrumb", "menubar", "tabs", "pagination"],
    "data-display": ["table", "data-table", "card", "avatar", "badge"],
    feedback: ["alert", "alert-dialog", "progress", "spinner", "sonner"],
    layout: ["separator", "aspect-ratio", "scroll-area", "sheet"],
    interaction: ["button", "toggle", "toggle-group", "switch", "slider"],
  };

  // Find direct feature matches
  for (const [featureType, components] of Object.entries(featureMap)) {
    if (featureKeywords.some((keyword) => featureType.includes(keyword))) {
      for (const component of components) {
        await addComponentMatch(
          component,
          feature,
          matches,
          includeExamples,
          includeAPI
        );
      }
    }
  }

  // Search all components for feature keywords
  for (const component of KNOWN_COMPONENTS) {
    try {
      const url = `${SPARTAN_COMPONENTS_BASE}/${component}`;
      const content = await fetchContent(url, "text", false);

      const hasFeature = featureKeywords.some(
        (keyword) =>
          content.toLowerCase().includes(keyword) ||
          component.toLowerCase().includes(keyword)
      );

      if (hasFeature && !matches.find((m) => m.name === component)) {
        await addComponentMatch(
          component,
          feature,
          matches,
          includeExamples,
          includeAPI
        );
      }
    } catch (error) {
      console.warn(`Failed to analyze component ${component}:`, error.message);
    }
  }

  return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get examples for a specific component
 * @param {string} componentName
 * @param {string} exampleType
 * @param {boolean} includeCode
 */
async function getComponentExamples(componentName, exampleType, includeCode) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
    const html = await fetchContent(url, "html", false);
    const apiInfo = extractAPIInfo(html);

    const examples = [];

    // Extract all examples from the page
    const allExamples = apiInfo.examples || [];

    for (const example of allExamples) {
      const type = categorizeExample(example.title, example.code);

      if (exampleType === "all" || type === exampleType) {
        const exampleData = {
          title: example.title,
          type,
          description: generateExampleDescription(example.title, componentName),
        };

        if (includeCode) {
          exampleData.code = example.code;
          exampleData.language = example.language || "typescript";
        }

        examples.push(exampleData);
      }
    }

    // Add generated examples if none found
    if (examples.length === 0) {
      examples.push(
        generateFallbackExample(componentName, exampleType, includeCode)
      );
    }

    return examples;
  } catch (error) {
    console.error(`Error getting examples for ${componentName}:`, error);
    return [generateFallbackExample(componentName, exampleType, includeCode)];
  }
}

// Helper functions

/**
 * Calculate relevance score for search results
 * @param {string} content
 * @param {Array<string>} searchTerms
 */
function calculateRelevanceScore(content, searchTerms) {
  let score = 0;
  const lowerContent = content.toLowerCase();

  for (const term of searchTerms) {
    const termCount = (lowerContent.match(new RegExp(term, "g")) || []).length;
    score += termCount * term.length; // Longer terms get higher weight
  }

  return score;
}

/**
 * Extract matching content snippets
 * @param {string} content
 * @param {Array<string>} searchTerms
 */
function extractMatchingContent(content, searchTerms) {
  const matches = [];
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (searchTerms.some((term) => lowerSentence.includes(term))) {
      matches.push(sentence.trim());
      if (matches.length >= 3) break; // Limit to 3 matching snippets
    }
  }

  return matches;
}

/**
 * Extract description from content
 * @param {string} content
 */
function extractDescription(content) {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  return lines.length > 1 ? lines[1].trim() : lines[0]?.trim() || "";
}

/**
 * Add component match to results
 * @param {string} component
 * @param {string} feature
 * @param {Array} matches
 * @param {boolean} includeExamples
 * @param {boolean} includeAPI
 */
async function addComponentMatch(
  component,
  feature,
  matches,
  includeExamples,
  includeAPI
) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${component}`;
    const content = await fetchContent(url, "text", false);

    const match = {
      name: component,
      url,
      relevanceScore: calculateRelevanceScore(content, feature.split(/\s+/)),
      description: extractDescription(content),
      reason: generateMatchReason(component, feature),
    };

    if (includeExamples || includeAPI) {
      const html = await fetchContent(url, "html", false);
      const apiInfo = extractAPIInfo(html);

      if (includeExamples) {
        match.examples = apiInfo.examples.slice(0, 2); // Limit to 2 examples
      }

      if (includeAPI) {
        match.api = {
          brainAPI: apiInfo.brainAPI,
          helmAPI: apiInfo.helmAPI,
        };
      }
    }

    matches.push(match);
  } catch (error) {
    console.warn(
      `Failed to add component match for ${component}:`,
      error.message
    );
  }
}

/**
 * Categorize example type
 * @param {string} title
 * @param {string} code
 */
function categorizeExample(title, code) {
  const lowerTitle = title.toLowerCase();
  const lowerCode = code.toLowerCase();

  if (lowerTitle.includes("basic") || lowerTitle.includes("simple"))
    return "basic";
  if (lowerTitle.includes("advanced") || lowerTitle.includes("complex"))
    return "advanced";
  if (lowerTitle.includes("form") || lowerTitle.includes("integration"))
    return "integration";
  if (lowerTitle.includes("accessibility") || lowerCode.includes("aria"))
    return "accessibility";

  return "basic";
}

/**
 * Generate example description
 * @param {string} title
 * @param {string} componentName
 */
function generateExampleDescription(title, componentName) {
  return `${title} example demonstrating ${componentName} usage`;
}

/**
 * Generate fallback example when none found
 * @param {string} componentName
 * @param {string} exampleType
 * @param {boolean} includeCode
 */
function generateFallbackExample(componentName, exampleType, includeCode) {
  const example = {
    title: `${exampleType} ${componentName} example`,
    type: exampleType,
    description: `Generated ${exampleType} example for ${componentName} component`,
  };

  if (includeCode) {
    example.code = `// ${exampleType} example for ${componentName}\n// Please refer to the official documentation for complete examples`;
    example.language = "typescript";
  }

  return example;
}

/**
 * Generate match reason for feature search
 * @param {string} component
 * @param {string} feature
 */
function generateMatchReason(component, feature) {
  return `${component} matches feature "${feature}" based on component functionality and API analysis`;
}
