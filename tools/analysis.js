//@ts-check
import { z } from "zod";
import {
  KNOWN_COMPONENTS,
  SPARTAN_COMPONENTS_BASE,
  fetchContent,
  extractAPIInfo,
  htmlToText,
} from "./utils.js";

export function registerAnalysisTools(server) {
  // Show component dependencies
  server.registerTool(
    "spartan.components.dependencies",
    {
      title: "Show component dependencies",
      description:
        "Analyze what other components, packages, or dependencies a Spartan UI component requires. " +
        "Includes Angular CDK dependencies, peer components, and installation requirements.",
      inputSchema: {
        componentName: z
          .string()
          .min(1, "componentName is required")
          .describe("Spartan component name (e.g., 'calendar', 'dialog')"),
        includeTransitive: z
          .boolean()
          .default(false)
          .describe(
            "Include transitive dependencies (dependencies of dependencies)"
          ),
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

      const dependencies = await analyzeComponentDependencies(
        componentName,
        args.includeTransitive
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: componentName,
                dependencies,
                processingInstructions:
                  "Present dependencies with installation commands, import statements, and setup instructions. Group by type (npm packages, Angular CDK, peer components).",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Find related/similar components
  server.registerTool(
    "spartan.components.related",
    {
      title: "Find related or similar components",
      description:
        "Find Spartan UI components that are related to or similar to a given component. " +
        "Analyzes functionality, use cases, and API patterns to suggest alternatives and complementary components.",
      inputSchema: {
        componentName: z
          .string()
          .min(1, "componentName is required")
          .describe("Spartan component name to find related components for"),
        relationshipType: z
          .enum(["similar", "complementary", "alternative", "all"])
          .default("all")
          .describe(
            "Type of relationship: 'similar' (same use case), 'complementary' (work together), 'alternative' (different approach), 'all'"
          ),
        limit: z
          .number()
          .min(1)
          .max(10)
          .default(5)
          .describe("Maximum number of related components to return"),
      },
    },
    async (args) => {
      const componentName = String(args.componentName || "")
        .trim()
        .toLowerCase();
      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const related = await findRelatedComponents(
        componentName,
        args.relationshipType,
        args.limit
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: componentName,
                relationshipType: args.relationshipType,
                relatedComponents: related,
                processingInstructions:
                  "Present related components with explanations of relationships, use case comparisons, and when to choose each option.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // List component variants (Brain vs Helm API)
  server.registerTool(
    "spartan.components.variants",
    {
      title: "List component variants (Brain vs Helm API)",
      description:
        "Compare Brain API (low-level, unstyled) and Helm API (high-level, styled) variants of a component. " +
        "Shows differences in API, styling approach, and when to use each variant.",
      inputSchema: {
        componentName: z
          .string()
          .min(1, "componentName is required")
          .describe("Spartan component name"),
        includeComparison: z
          .boolean()
          .default(true)
          .describe("Include detailed comparison between variants"),
      },
    },
    async (args) => {
      const componentName = String(args.componentName || "")
        .trim()
        .toLowerCase();
      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const variants = await analyzeComponentVariants(
        componentName,
        args.includeComparison
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: componentName,
                variants,
                processingInstructions:
                  "Present variants with clear explanations of differences, use cases, and migration guidance between Brain and Helm APIs.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Accessibility check
  server.registerTool(
    "spartan.accessibility.check",
    {
      title: "Check component accessibility features",
      description:
        "Analyze accessibility features, ARIA support, keyboard navigation, and screen reader compatibility " +
        "for a Spartan UI component. Provides accessibility best practices and implementation guidance.",
      inputSchema: {
        componentName: z
          .string()
          .min(1, "componentName is required")
          .describe("Spartan component name"),
        checkType: z
          .enum(["overview", "aria", "keyboard", "screenreader", "wcag", "all"])
          .default("all")
          .describe(
            "Type of accessibility check: specific area or 'all' for comprehensive analysis"
          ),
      },
    },
    async (args) => {
      const componentName = String(args.componentName || "")
        .trim()
        .toLowerCase();
      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const accessibility = await analyzeAccessibility(
        componentName,
        args.checkType
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: componentName,
                checkType: args.checkType,
                accessibility,
                processingInstructions:
                  "Present accessibility information with actionable recommendations, code examples, and compliance notes for WCAG guidelines.",
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
 * Analyze component dependencies
 * @param {string} componentName
 * @param {boolean} includeTransitive
 */
async function analyzeComponentDependencies(componentName, includeTransitive) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
    const html = await fetchContent(url, "html", false);
    const text = htmlToText(html);
    const apiInfo = extractAPIInfo(html);

    const dependencies = {
      npm: /** @type {string[]} */ ([]),
      angularCdk: /** @type {string[]} */ ([]),
      peerComponents: /** @type {string[]} */ ([]),
      imports: /** @type {Array<{items: string, from: string}>} */ ([]),
      setup: /** @type {string[]} */ ([]),
    };

    // Extract npm dependencies from installation instructions
    const npmRegex = /npm\s+install\s+([^\n]+)/gi;
    let match;
    while ((match = npmRegex.exec(text)) !== null) {
      const packages = match[1]
        .split(/\s+/)
        .filter((pkg) => pkg.startsWith("@") || !pkg.includes("-"));
      dependencies.npm.push(...packages);
    }

    // Extract Angular CDK dependencies
    const cdkComponents = [
      "@angular/cdk/a11y",
      "@angular/cdk/dialog",
      "@angular/cdk/overlay",
      "@angular/cdk/portal",
      "@angular/cdk/scrolling",
      "@angular/cdk/table",
    ];

    for (const cdkComponent of cdkComponents) {
      if (text.includes(cdkComponent)) {
        dependencies.angularCdk.push(cdkComponent);
      }
    }

    // Extract peer component dependencies
    for (const otherComponent of KNOWN_COMPONENTS) {
      if (
        otherComponent !== componentName &&
        text.toLowerCase().includes(otherComponent)
      ) {
        dependencies.peerComponents.push(otherComponent);
      }
    }

    // Extract import statements
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/gi;
    match = null;
    while ((match = importRegex.exec(text)) !== null) {
      dependencies.imports.push({
        items: match[1].trim(),
        from: match[2].trim(),
      });
    }

    // Generate setup instructions
    dependencies.setup = generateSetupInstructions(componentName, dependencies);

    // Add transitive dependencies if requested
    if (includeTransitive) {
      dependencies.transitive = await getTransitiveDependencies(
        dependencies.peerComponents
      );
    }

    return dependencies;
  } catch (error) {
    console.error(`Error analyzing dependencies for ${componentName}:`, error);
    return {
      npm: [],
      angularCdk: [],
      peerComponents: [],
      imports: [],
      setup: [`Failed to analyze dependencies: ${error.message}`],
      error: error.message,
    };
  }
}

/**
 * Find related components
 * @param {string} componentName
 * @param {string} relationshipType
 * @param {number} limit
 */
async function findRelatedComponents(componentName, relationshipType, limit) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
    const content = await fetchContent(url, "text", false);

    const related = [];

    // Component relationship mapping
    const relationships = {
      similar: getSimilarComponents(componentName),
      complementary: getComplementaryComponents(componentName),
      alternative: getAlternativeComponents(componentName),
    };

    const targetRelationships =
      relationshipType === "all"
        ? Object.values(relationships).flat()
        : relationships[relationshipType] || [];

    for (const relatedComponent of targetRelationships) {
      if (KNOWN_COMPONENTS.includes(relatedComponent)) {
        try {
          const relatedUrl = `${SPARTAN_COMPONENTS_BASE}/${relatedComponent}`;
          const relatedContent = await fetchContent(relatedUrl, "text", false);

          related.push({
            name: relatedComponent,
            relationship: determineRelationshipType(
              componentName,
              relatedComponent
            ),
            description: extractDescription(relatedContent),
            reason: generateRelationshipReason(componentName, relatedComponent),
            url: relatedUrl,
          });

          if (related.length >= limit) break;
        } catch (error) {
          console.warn(
            `Failed to analyze related component ${relatedComponent}:`,
            error.message
          );
        }
      }
    }

    return related;
  } catch (error) {
    console.error(
      `Error finding related components for ${componentName}:`,
      error
    );
    return [];
  }
}

/**
 * Analyze component variants (Brain vs Helm)
 * @param {string} componentName
 * @param {boolean} includeComparison
 */
async function analyzeComponentVariants(componentName, includeComparison) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
    const html = await fetchContent(url, "html", false);
    const apiInfo = extractAPIInfo(html);

    const variants = {
      brain: /** @type {any} */ (null),
      helm: /** @type {any} */ (null),
      comparison: /** @type {any} */ (null),
    };

    // Extract Brain API variants
    if (apiInfo.brainAPI && apiInfo.brainAPI.length > 0) {
      variants.brain = {
        components: apiInfo.brainAPI,
        characteristics: {
          level: "low-level",
          styling: "unstyled/minimal",
          flexibility: "high",
          complexity: "higher",
          useCase: "custom designs, full control",
        },
      };
    }

    // Extract Helm API variants
    if (apiInfo.helmAPI && apiInfo.helmAPI.length > 0) {
      variants.helm = {
        components: apiInfo.helmAPI,
        characteristics: {
          level: "high-level",
          styling: "pre-styled",
          flexibility: "moderate",
          complexity: "lower",
          useCase: "rapid development, consistent design",
        },
      };
    }

    // Generate comparison if requested
    if (includeComparison && variants.brain && variants.helm) {
      variants.comparison = generateVariantComparison(
        variants.brain,
        variants.helm
      );
    }

    // Add recommendations
    variants.recommendations = generateVariantRecommendations(
      componentName,
      variants
    );

    return variants;
  } catch (error) {
    console.error(`Error analyzing variants for ${componentName}:`, error);
    return {
      brain: null,
      helm: null,
      comparison: null,
      error: error.message,
    };
  }
}

/**
 * Analyze accessibility features
 * @param {string} componentName
 * @param {string} checkType
 */
async function analyzeAccessibility(componentName, checkType) {
  try {
    const url = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
    const html = await fetchContent(url, "html", false);
    const text = htmlToText(html);
    const apiInfo = extractAPIInfo(html);

    const accessibility = {
      overview: {},
      aria: {},
      keyboard: {},
      screenreader: {},
      wcag: {},
      recommendations: /** @type {string[]} */ ([]),
    };

    // Extract accessibility information from the enhanced API info
    if (apiInfo.accessibility && apiInfo.accessibility.length > 0) {
      for (const a11yItem of apiInfo.accessibility) {
        const category = categorizeA11yFeature(a11yItem.feature);
        if (!accessibility[category]) accessibility[category] = {};
        accessibility[category][a11yItem.feature] = a11yItem.description;
      }
    }

    // Analyze specific accessibility aspects
    if (checkType === "all" || checkType === "aria") {
      accessibility.aria = analyzeAriaSupport(text, apiInfo);
    }

    if (checkType === "all" || checkType === "keyboard") {
      accessibility.keyboard = analyzeKeyboardSupport(text, componentName);
    }

    if (checkType === "all" || checkType === "screenreader") {
      accessibility.screenreader = analyzeScreenReaderSupport(
        text,
        componentName
      );
    }

    if (checkType === "all" || checkType === "wcag") {
      accessibility.wcag = analyzeWcagCompliance(text, componentName);
    }

    // Generate recommendations
    accessibility.recommendations = generateA11yRecommendations(
      componentName,
      accessibility
    );

    // Add overview if requested
    if (checkType === "all" || checkType === "overview") {
      accessibility.overview = generateA11yOverview(accessibility);
    }

    return accessibility;
  } catch (error) {
    console.error(`Error analyzing accessibility for ${componentName}:`, error);
    return {
      overview: {},
      aria: {},
      keyboard: {},
      screenreader: {},
      wcag: {},
      recommendations: [`Failed to analyze accessibility: ${error.message}`],
      error: error.message,
    };
  }
}

// Helper functions

function getSimilarComponents(componentName) {
  const similarityMap = {
    button: ["toggle", "switch"],
    input: ["textarea", "select"],
    dialog: ["alert-dialog", "sheet"],
    calendar: ["date-picker"],
    table: ["data-table"],
    alert: ["alert-dialog"],
    popover: ["tooltip", "dropdown-menu"],
    tabs: ["toggle-group"],
    checkbox: ["radio-group", "switch"],
    card: ["sheet"],
    menubar: ["dropdown-menu", "context-menu"],
  };

  return similarityMap[componentName] || [];
}

function getComplementaryComponents(componentName) {
  const complementaryMap = {
    input: ["form-field", "label", "button"],
    calendar: ["input", "form-field", "button"],
    table: ["pagination", "input", "select"],
    dialog: ["button", "card"],
    "form-field": ["input", "textarea", "select", "checkbox"],
    card: ["button", "avatar", "badge"],
    breadcrumb: ["button", "separator"],
    "dropdown-menu": ["button", "menubar"],
    "data-table": ["pagination", "input", "checkbox"],
  };

  return complementaryMap[componentName] || [];
}

function getAlternativeComponents(componentName) {
  const alternativeMap = {
    dialog: ["sheet", "popover"],
    "dropdown-menu": ["popover", "context-menu"],
    button: ["toggle", "switch"],
    input: ["combobox", "select"],
    alert: ["sonner", "toast"],
    calendar: ["date-picker", "input"],
    table: ["data-table"],
    tabs: ["accordion", "collapsible"],
  };

  return alternativeMap[componentName] || [];
}

function determineRelationshipType(component1, component2) {
  if (getSimilarComponents(component1).includes(component2)) return "similar";
  if (getComplementaryComponents(component1).includes(component2))
    return "complementary";
  if (getAlternativeComponents(component1).includes(component2))
    return "alternative";
  return "related";
}

function generateRelationshipReason(component1, component2) {
  const relationship = determineRelationshipType(component1, component2);
  const reasons = {
    similar: `${component2} provides similar functionality to ${component1}`,
    complementary: `${component2} works well together with ${component1}`,
    alternative: `${component2} offers an alternative approach to ${component1}`,
    related: `${component2} is related to ${component1} in functionality or use case`,
  };

  return reasons[relationship];
}

function extractDescription(content) {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  return lines.length > 1 ? lines[1].trim() : lines[0]?.trim() || "";
}

function generateSetupInstructions(componentName, dependencies) {
  const instructions = [];

  if (dependencies.npm.length > 0) {
    instructions.push(
      `Install dependencies: npm install ${dependencies.npm.join(" ")}`
    );
  }

  instructions.push(
    `Install Spartan UI component: npx ng g @spartan-ng/cli:ui ${componentName}`
  );

  if (dependencies.imports.length > 0) {
    instructions.push("Add imports to your component:");
    dependencies.imports.forEach((imp) => {
      instructions.push(`  import { ${imp.items} } from '${imp.from}';`);
    });
  }

  return instructions;
}

async function getTransitiveDependencies(peerComponents) {
  const transitive = [];
  for (const component of peerComponents.slice(0, 3)) {
    // Limit to avoid too many requests
    try {
      const deps = await analyzeComponentDependencies(component, false);
      transitive.push({
        component,
        dependencies: deps.peerComponents,
      });
    } catch (error) {
      console.warn(
        `Failed to get transitive dependencies for ${component}:`,
        error.message
      );
    }
  }
  return transitive;
}

function generateVariantComparison(brain, helm) {
  return {
    "API Complexity": { brain: "Higher", helm: "Lower" },
    "Styling Control": { brain: "Full control", helm: "Pre-styled" },
    "Learning Curve": { brain: "Steeper", helm: "Gentler" },
    Customization: { brain: "Unlimited", helm: "Theme-based" },
    "Development Speed": { brain: "Slower", helm: "Faster" },
    "Bundle Size": { brain: "Smaller", helm: "Larger" },
  };
}

function generateVariantRecommendations(componentName, variants) {
  const recommendations = [];

  if (variants.brain && variants.helm) {
    recommendations.push(
      "Use Brain API when you need full control over styling and behavior"
    );
    recommendations.push(
      "Use Helm API for rapid development with consistent design"
    );
    recommendations.push(
      "Consider starting with Helm API and migrating to Brain API if needed"
    );
  } else if (variants.brain) {
    recommendations.push(
      "This component only provides Brain API - you'll need to handle styling"
    );
  } else if (variants.helm) {
    recommendations.push(
      "This component only provides Helm API - pre-styled and ready to use"
    );
  }

  return recommendations;
}

function categorizeA11yFeature(feature) {
  if (feature.includes("aria")) return "aria";
  if (feature.includes("keyboard") || feature.includes("focus"))
    return "keyboard";
  if (feature.includes("screen reader")) return "screenreader";
  return "overview";
}

function analyzeAriaSupport(text, apiInfo) {
  const ariaFeatures = {};
  const ariaAttributes = [
    "aria-label",
    "aria-describedby",
    "aria-expanded",
    "aria-selected",
    "role",
  ];

  for (const attr of ariaAttributes) {
    if (text.includes(attr)) {
      ariaFeatures[attr] = `${attr} support detected`;
    }
  }

  return ariaFeatures;
}

function analyzeKeyboardSupport(text, componentName) {
  const keyboardFeatures = {};
  const keyboardTerms = [
    "keyboard",
    "focus",
    "tab",
    "enter",
    "space",
    "arrow keys",
  ];

  for (const term of keyboardTerms) {
    if (text.toLowerCase().includes(term)) {
      keyboardFeatures[term] = `${term} navigation supported`;
    }
  }

  return keyboardFeatures;
}

function analyzeScreenReaderSupport(text, componentName) {
  const srFeatures = {};

  if (text.includes("screen reader")) {
    srFeatures.general = "Screen reader support mentioned";
  }

  if (text.includes("announcements")) {
    srFeatures.announcements = "Screen reader announcements supported";
  }

  return srFeatures;
}

function analyzeWcagCompliance(text, componentName) {
  const wcagFeatures = {};

  if (text.includes("WCAG")) {
    wcagFeatures.compliance = "WCAG compliance mentioned";
  }

  // Check for common WCAG criteria
  const wcagCriteria = ["contrast", "focus visible", "keyboard accessible"];

  for (const criteria of wcagCriteria) {
    if (text.toLowerCase().includes(criteria)) {
      wcagFeatures[criteria] = `${criteria} support detected`;
    }
  }

  return wcagFeatures;
}

function generateA11yRecommendations(componentName, accessibility) {
  const recommendations = [];

  recommendations.push(
    `Test ${componentName} with screen readers like NVDA or JAWS`
  );
  recommendations.push(`Verify keyboard navigation works without mouse`);
  recommendations.push(`Check color contrast meets WCAG AA standards`);
  recommendations.push(`Ensure focus indicators are visible and clear`);

  return recommendations;
}

function generateA11yOverview(accessibility) {
  const hasAria = Object.keys(accessibility.aria).length > 0;
  const hasKeyboard = Object.keys(accessibility.keyboard).length > 0;
  const hasScreenReader = Object.keys(accessibility.screenreader).length > 0;

  return {
    score: calculateA11yScore(hasAria, hasKeyboard, hasScreenReader),
    features: {
      "ARIA Support": hasAria ? "Yes" : "Limited",
      "Keyboard Navigation": hasKeyboard ? "Yes" : "Limited",
      "Screen Reader": hasScreenReader ? "Yes" : "Limited",
    },
  };
}

function calculateA11yScore(hasAria, hasKeyboard, hasScreenReader) {
  let score = 0;
  if (hasAria) score += 33;
  if (hasKeyboard) score += 33;
  if (hasScreenReader) score += 34;
  return `${score}%`;
}
