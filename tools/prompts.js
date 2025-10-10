// @ts-check

import { z } from "zod";
import {
  KNOWN_COMPONENTS,
  SPARTAN_COMPONENTS_BASE,
  fetchContent,
  extractAPIInfo,
  extractCodeBlocks,
} from "./utils.js";

/**
 * Register prompt handlers for Spartan UI
 * Prompts are pre-defined templates for AI interactions
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 */
export function registerPromptHandlers(server) {
  // Prompt 1: Get started with a component
  server.prompt(
    "spartan-get-started",
    "Get started with a Spartan UI component",
    {
      componentName: z
        .string()
        .describe(
          "Name of the Spartan UI component (e.g., 'button', 'calendar')"
        ),
      variant: z
        .enum(["brain", "helm"])
        .optional()
        .describe("Which API to use: 'brain' (unstyled) or 'helm' (styled)"),
    },
    async (args) => {
      const componentName = args.componentName.toLowerCase();
      const variant = args.variant?.toLowerCase() || "helm";

      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(
          `Unknown component: ${componentName}. Available: ${KNOWN_COMPONENTS.slice(
            0,
            5
          ).join(", ")}...`
        );
      }

      const componentUrl = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
      const html = await fetchContent(componentUrl, "html", false);
      const apiData = extractAPIInfo(html);
      const codeBlocks = extractCodeBlocks(html);

      const relevantAPI =
        variant === "brain" ? apiData.brainAPI : apiData.helmAPI;
      const firstExample = codeBlocks[0] || "No examples available";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Help me get started with the Spartan UI ${componentName} component using the ${variant.toUpperCase()} API.`,
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `# Getting Started with Spartan UI ${componentName.toUpperCase()}

## Overview
The **${componentName}** component is available at: ${componentUrl}

## ${variant.toUpperCase()} API
${
  relevantAPI.length > 0
    ? `
This component has ${relevantAPI.length} ${variant} API component(s):

${relevantAPI
  .map(
    (comp, i) => `
### ${i + 1}. ${comp.name}
${comp.selector ? `**Selector**: \`${comp.selector}\`` : ""}

**Inputs**:
${comp.inputs
  .map(
    (input) =>
      `- \`${input.prop}\`: ${input.type}${
        input.default !== "-" ? ` (default: ${input.default})` : ""
      }`
  )
  .join("\n")}

${
  comp.outputs.length > 0
    ? `**Outputs**:
${comp.outputs
  .map((output) => `- \`${output.prop}\`: ${output.type}`)
  .join("\n")}`
    : ""
}
`
  )
  .join("\n")}
`
    : `No ${variant} API components found.`
}

## Quick Start Example

\`\`\`typescript
${firstExample}
\`\`\`

## Installation

\`\`\`bash
npm install @spartan-ng/${
                variant === "brain" ? "brain" : "helm"
              }/${componentName}
\`\`\`

## Next Steps
1. Import the component in your Angular module/component
2. Use the selector in your template
3. Configure inputs as needed
4. Check the documentation for more examples: ${componentUrl}
`,
            },
          },
        ],
      };
    }
  );

  // Prompt 2: Compare Brain vs Helm API
  server.prompt(
    "spartan-compare-apis",
    "Compare Brain API vs Helm API for a component",
    {
      componentName: z
        .string()
        .describe("Name of the Spartan UI component to compare"),
    },
    async (args) => {
      const componentName = args.componentName.toLowerCase();

      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const componentUrl = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
      const html = await fetchContent(componentUrl, "html", false);
      const apiData = extractAPIInfo(html);

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Compare the Brain API and Helm API for the ${componentName} component. When should I use each?`,
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `# Brain API vs Helm API: ${componentName.toUpperCase()}

## 🧠 Brain API (Unstyled, Accessible Primitives)
${
  apiData.brainAPI.length > 0
    ? `
**Available Components**: ${apiData.brainAPI.length}

${apiData.brainAPI
  .map(
    (comp) => `### ${comp.name}
- **Purpose**: Low-level, unstyled, accessible foundation
- **Inputs**: ${comp.inputs.length}
- **Outputs**: ${comp.outputs.length}
`
  )
  .join("\n")}

**Use Brain API when:**
- ✅ You want complete styling control
- ✅ You're building a custom design system
- ✅ You need maximum flexibility
- ✅ You want to understand the underlying behavior
`
    : "No Brain API components available."
}

## ⚡ Helm API (Pre-styled Components)
${
  apiData.helmAPI.length > 0
    ? `
**Available Components**: ${apiData.helmAPI.length}

${apiData.helmAPI
  .map(
    (comp) => `### ${comp.name}
- **Purpose**: Pre-styled, ready-to-use components
- **Inputs**: ${comp.inputs.length}
- **Outputs**: ${comp.outputs.length}
- **Key Props**: ${comp.inputs
      .slice(0, 3)
      .map((i) => i.prop)
      .join(", ")}
`
  )
  .join("\n")}

**Use Helm API when:**
- ✅ You want to get started quickly
- ✅ You're okay with Tailwind CSS styling
- ✅ You want production-ready components
- ✅ You need less customization
`
    : "No Helm API components available."
}

## 📊 Summary
| Aspect | Brain API | Helm API |
|--------|-----------|----------|
| Styling | Unstyled | Tailwind CSS |
| Complexity | Higher | Lower |
| Flexibility | Maximum | Moderate |
| Time to Production | Longer | Faster |
| Components | ${apiData.brainAPI.length} | ${apiData.helmAPI.length} |

## 💡 Recommendation
${
  apiData.helmAPI.length > 0
    ? "Start with **Helm API** for rapid development. Switch to Brain API only if you need custom styling."
    : "Use **Brain API** as it's the only option for this component."
}

More details: ${componentUrl}
`,
            },
          },
        ],
      };
    }
  );

  // Prompt 3: Implement a feature with component
  server.prompt(
    "spartan-implement-feature",
    "Get help implementing a specific feature with a Spartan UI component",
    {
      componentName: z.string().describe("Spartan UI component to use"),
      feature: z
        .string()
        .describe(
          "Feature to implement (e.g., 'form validation', 'multi-select', 'date range')"
        ),
      framework: z
        .string()
        .optional()
        .describe(
          "Framework context (e.g., 'standalone', 'NgModule', 'with Signals')"
        ),
    },
    async (args) => {
      const componentName = args.componentName.toLowerCase();
      const feature = args.feature;
      const framework = args.framework || "standalone";

      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const componentUrl = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
      const html = await fetchContent(componentUrl, "html", false);
      const apiData = extractAPIInfo(html);
      const codeBlocks = extractCodeBlocks(html);

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I want to implement ${feature} using the Spartan UI ${componentName} component in a ${framework} Angular application. Can you help me?`,
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `# Implementing "${feature}" with Spartan UI ${componentName}

## Component Overview
**Documentation**: ${componentUrl}
**Available APIs**: ${apiData.brainAPI.length} Brain + ${
                apiData.helmAPI.length
              } Helm

## Relevant Component Properties
${
  apiData.helmAPI.length > 0
    ? `
### Helm API (${apiData.helmAPI[0].name})
**Inputs you can use**:
${apiData.helmAPI[0].inputs
  .map(
    (input) =>
      `- \`${input.prop}\`: ${input.type} - ${
        input.description || "No description"
      }`
  )
  .join("\n")}

${
  apiData.helmAPI[0].outputs.length > 0
    ? `**Events you can listen to**:
${apiData.helmAPI[0].outputs
  .map((output) => `- \`${output.prop}\`: ${output.type}`)
  .join("\n")}`
    : ""
}
`
    : ""
}

## Example Implementation (${framework})

Here's a working example to get you started:

\`\`\`typescript
${
  codeBlocks[0] ||
  `// Basic example
import { Component } from '@angular/core';
import { Hlm${
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  }Imports } from '@spartan-ng/helm/${componentName}';

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [Hlm${
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  }Imports],
  template: \`
    <!-- Your template here -->
  \`
})
export class FeatureComponent {
  // Your implementation
}
`
}
\`\`\`

## Implementation Steps

1. **Install the component**:
   \`\`\`bash
   npm install @spartan-ng/helm/${componentName}
   \`\`\`

2. **Import in your component**:
   Add the imports shown in the example above

3. **Configure for "${feature}"**:
   - Use relevant inputs from the API table
   - Wire up event handlers if needed
   - Add any necessary form controls

4. **Style and customize**:
   - Use Tailwind classes for styling
   - Refer to ${codeBlocks.length} available examples at ${componentUrl}

## Additional Examples
${
  codeBlocks.length > 1
    ? `
Check out ${
        codeBlocks.length - 1
      } more examples in the documentation for advanced use cases.
`
    : ""
}

Need more help? Check the full documentation: ${componentUrl}
`,
            },
          },
        ],
      };
    }
  );

  // Prompt 4: Troubleshoot component issues
  server.prompt(
    "spartan-troubleshoot",
    "Get help troubleshooting issues with a Spartan UI component",
    {
      componentName: z.string().describe("Component you're having issues with"),
      issue: z.string().describe("Description of the problem"),
    },
    async (args) => {
      const componentName = args.componentName.toLowerCase();
      const issue = args.issue;

      if (!KNOWN_COMPONENTS.includes(componentName)) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const componentUrl = `${SPARTAN_COMPONENTS_BASE}/${componentName}`;
      const html = await fetchContent(componentUrl, "html", false);
      const apiData = extractAPIInfo(html);

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I'm having trouble with the Spartan UI ${componentName} component. Issue: ${issue}`,
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `# Troubleshooting Spartan UI ${componentName.toUpperCase()}

## Your Issue
> ${issue}

## Common Issues & Solutions

### 1. ✅ Check Imports
Make sure you have the correct imports:
\`\`\`typescript
// For Helm API (styled)
import { Hlm${
                componentName.charAt(0).toUpperCase() + componentName.slice(1)
              }Imports } from '@spartan-ng/helm/${componentName}';

// For Brain API (unstyled)
import { Brn${
                componentName.charAt(0).toUpperCase() + componentName.slice(1)
              }Imports } from '@spartan-ng/brain/${componentName}';
\`\`\`

### 2. ✅ Verify Required Props
${
  apiData.helmAPI.length > 0
    ? `
Check if you're missing required inputs:
${
  apiData.helmAPI[0].inputs
    .filter((i) => i.description?.includes("required") || i.default === "-")
    .map((input) => `- \`${input.prop}\`: ${input.type}`)
    .join("\n") || "No required props found."
}
`
    : ""
}

### 3. ✅ Check Angular Version
Spartan UI requires Angular 17+ with standalone components support.

### 4. ✅ Verify Dependencies
\`\`\`bash
npm install @spartan-ng/helm/${componentName}
# May also need:
npm install @angular/cdk
\`\`\`

### 5. ✅ Review API Documentation
**Component API**: ${
                apiData.brainAPI.length + apiData.helmAPI.length
              } components available
**Full docs**: ${componentUrl}

${
  apiData.helmAPI.length > 0
    ? `
## Available Props for ${apiData.helmAPI[0].name}
${apiData.helmAPI[0].inputs
  .map(
    (input) =>
      `- \`${input.prop}\`: ${input.type}${
        input.default !== "-" ? ` = ${input.default}` : ""
      }`
  )
  .join("\n")}
`
    : ""
}

## Next Steps
1. Compare your code with examples: ${componentUrl}
2. Check browser console for errors
3. Verify all imports are correct
4. Check if the issue is styling-related (try Brain API to isolate)

Still stuck? Provide more details about your setup and error messages.
`,
            },
          },
        ],
      };
    }
  );

  // Prompt 5: List all available components
  server.prompt(
    "spartan-list-components",
    "List all available Spartan UI components with their categories",
    async () => {
      // Group components by category
      const categories = {
        "Form Controls": [
          "button",
          "checkbox",
          "input",
          "label",
          "radio-group",
          "select",
          "switch",
          "textarea",
          "toggle",
          "toggle-group",
          "slider",
          "input-otp",
        ],
        "Data Display": [
          "table",
          "card",
          "badge",
          "avatar",
          "separator",
          "progress",
          "skeleton",
          "spinner",
        ],
        Navigation: ["breadcrumb", "menubar", "pagination", "tabs", "command"],
        Feedback: [
          "alert",
          "alert-dialog",
          "dialog",
          "sonner",
          "tooltip",
          "hover-card",
        ],
        Overlay: ["popover", "dropdown-menu", "context-menu", "sheet"],
        Layout: [
          "aspect-ratio",
          "scroll-area",
          "collapsible",
          "accordion",
          "carousel",
        ],
        "Date & Time": ["calendar", "date-picker"],
        Advanced: ["data-table", "form-field", "combobox", "icon"],
      };

      const categorizedList = Object.entries(categories)
        .map(([category, components]) => {
          const availableComponents = components.filter((c) =>
            KNOWN_COMPONENTS.includes(c)
          );
          return `## ${category} (${availableComponents.length})
${availableComponents
  .map((c) => `- **${c}**: \`spartan://component/${c}/api\``)
  .join("\n")}`;
        })
        .join("\n\n");

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Show me all available Spartan UI components organized by category.",
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `# Spartan UI Component Library

**Total Components**: ${KNOWN_COMPONENTS.length}
**Documentation**: https://www.spartan.ng

${categorizedList}

## How to Use
1. Pick a component from above
2. Use the prompt: \`spartan-get-started\` with the component name
3. Or access directly: \`spartan://component/<name>/api\`

## Quick Links
- 📚 **Get Started**: Use \`spartan-get-started\` prompt
- 🔍 **Compare APIs**: Use \`spartan-compare-apis\` prompt
- 🛠️ **Implement Feature**: Use \`spartan-implement-feature\` prompt
- 🐛 **Troubleshoot**: Use \`spartan-troubleshoot\` prompt
`,
            },
          },
        ],
      };
    }
  );
}
