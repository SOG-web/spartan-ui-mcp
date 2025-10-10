# MCP Prompts Implementation Guide

## 🎨 What Are MCP Prompts?

**Prompts** are pre-defined, reusable templates for AI interactions. They help structure conversations and provide consistent, high-quality responses.

Think of them as **"recipes for AI conversations"** - predefined question/answer patterns that users (or AI assistants) can invoke with specific parameters.

---

## 📋 What We Implemented

### 5 Prompts for Spartan UI

1. **`spartan-get-started`** - Get started with any component
2. **`spartan-compare-apis`** - Compare Brain vs Helm API
3. **`spartan-implement-feature`** - Implement specific features
4. **`spartan-troubleshoot`** - Debug component issues
5. **`spartan-list-components`** - Browse all components

---

## 🏗️ How Prompts Work

### Anatomy of a Prompt

```javascript
server.prompt(
  "prompt-name", // 1. Unique identifier
  "Description of prompt", // 2. What it does
  {
    // 3. Arguments (Zod schemas)
    argName: z.string().describe("What this arg is for"),
    optionalArg: z.string().optional(),
  },
  async (args) => {
    // 4. Handler function
    // Process arguments
    // Fetch data
    // Return structured messages

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "User's question",
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: "Pre-generated helpful response with data",
          },
        },
      ],
    };
  }
);
```

### Key Components

1. **Name**: Unique identifier (kebab-case)
2. **Description**: Explains what the prompt does
3. **Arguments**: Zod schema for validation
4. **Handler**: Async function that returns messages
5. **Messages**: Array of user/assistant messages

---

## 💡 Prompt Examples

### Example 1: Simple Prompt (No Arguments)

```javascript
server.prompt(
  "spartan-list-components",
  "List all available Spartan UI components",
  async () => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Show me all available components",
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: "Here are all 46 components:\n- button\n- calendar\n...",
          },
        },
      ],
    };
  }
);
```

### Example 2: Prompt with Required Argument

```javascript
server.prompt(
  "spartan-get-started",
  "Get started with a component",
  {
    componentName: z.string().describe("Component name"),
  },
  async (args) => {
    const name = args.componentName;

    // Fetch component data
    const data = await fetchComponentData(name);

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me get started with ${name}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# ${name.toUpperCase()}\n\n${data.description}\n\n...`,
          },
        },
      ],
    };
  }
);
```

### Example 3: Prompt with Optional Arguments

```javascript
server.prompt(
  "spartan-get-started",
  "Get started with a component",
  {
    componentName: z.string().describe("Component name"),
    variant: z.enum(["brain", "helm"]).optional().describe("API variant")
  },
  async (args) => {
    const name = args.componentName;
    const variant = args.variant || "helm";  // Default value

    // Use both arguments
    const api = variant === "brain" ? brainAPI : helmAPI;

    return {
      messages: [...]
    };
  }
);
```

---

## 🎯 Our 5 Spartan UI Prompts

### 1. Get Started (`spartan-get-started`)

**Purpose**: Quick start guide for any component

**Arguments**:

- `componentName` (required): Component to learn about
- `variant` (optional): "brain" or "helm" API

**What it provides**:

- Component overview and URL
- API specifications (inputs/outputs)
- Quick start code example
- Installation instructions
- Next steps

**Example usage**:

```json
{
  "name": "spartan-get-started",
  "arguments": {
    "componentName": "button",
    "variant": "helm"
  }
}
```

---

### 2. Compare APIs (`spartan-compare-apis`)

**Purpose**: Compare Brain API vs Helm API for a component

**Arguments**:

- `componentName` (required): Component to compare

**What it provides**:

- Brain API overview (unstyled primitives)
- Helm API overview (pre-styled)
- When to use each
- Summary comparison table
- Recommendation

**Example usage**:

```json
{
  "name": "spartan-compare-apis",
  "arguments": {
    "componentName": "calendar"
  }
}
```

---

### 3. Implement Feature (`spartan-implement-feature`)

**Purpose**: Get help implementing specific features

**Arguments**:

- `componentName` (required): Which component to use
- `feature` (required): What feature to implement
- `framework` (optional): Angular context (standalone/NgModule/etc)

**What it provides**:

- Component API overview
- Relevant properties for the feature
- Complete code example
- Step-by-step implementation guide
- Links to additional examples

**Example usage**:

```json
{
  "name": "spartan-implement-feature",
  "arguments": {
    "componentName": "dialog",
    "feature": "form validation",
    "framework": "standalone"
  }
}
```

---

### 4. Troubleshoot (`spartan-troubleshoot`)

**Purpose**: Debug component issues

**Arguments**:

- `componentName` (required): Component with issues
- `issue` (required): Description of the problem

**What it provides**:

- Common issues checklist
- Import verification
- Required props check
- Dependency verification
- API documentation links
- Next troubleshooting steps

**Example usage**:

```json
{
  "name": "spartan-troubleshoot",
  "arguments": {
    "componentName": "button",
    "issue": "Button variants not working"
  }
}
```

---

### 5. List Components (`spartan-list-components`)

**Purpose**: Browse all available components by category

**Arguments**: None

**What it provides**:

- Components organized by category:
  - Form Controls (12 components)
  - Data Display (8 components)
  - Navigation (5 components)
  - Feedback (6 components)
  - Overlay (4 components)
  - Layout (6 components)
  - Date & Time (2 components)
  - Advanced (4 components)
- Resource URIs for each component
- Quick links to other prompts

**Example usage**:

```json
{
  "name": "spartan-list-components",
  "arguments": {}
}
```

---

## 🔄 How Clients Use Prompts

### 1. List Available Prompts

```javascript
const prompts = await client.listPrompts();
// Returns: [
//   { name: "spartan-get-started", description: "...", arguments: [...] },
//   { name: "spartan-compare-apis", ... },
//   ...
// ]
```

### 2. Get a Prompt with Arguments

```javascript
const result = await client.getPrompt({
  name: "spartan-get-started",
  arguments: {
    componentName: "button",
    variant: "helm",
  },
});

// result.messages = [
//   { role: "user", content: { type: "text", text: "..." } },
//   { role: "assistant", content: { type: "text", text: "..." } }
// ]
```

### 3. Use in AI Conversation

The AI assistant can:

1. Receive the prompt messages
2. Use them as context for the conversation
3. Provide the pre-generated helpful response
4. Continue the conversation naturally

---

## 🎨 Message Format

### Structure

```javascript
{
  messages: [
    {
      role: "user" | "assistant",
      content: {
        type: "text" | "image" | "resource",
        text?: string,           // For type: "text"
        data?: string,           // For type: "image" (base64)
        mimeType?: string,       // For images
        resource?: {             // For type: "resource"
          uri: string,
          text?: string,
          blob?: string
        }
      }
    }
  ]
}
```

### We Use Text Content

All our prompts return markdown-formatted text in assistant messages:

```javascript
{
  role: "assistant",
  content: {
    type: "text",
    text: `
# Component Name

## Overview
Description...

## Code Example
\`\`\`typescript
// Code here
\`\`\`

## Next Steps
1. Do this
2. Do that
    `
  }
}
```

---

## 🚀 Benefits of Prompts

### 1. **Consistency**

- Same high-quality responses every time
- Structured, predictable format
- Professional documentation style

### 2. **Discoverability**

- Users can list all available prompts
- Clear descriptions of what each does
- Argument specifications with descriptions

### 3. **Context-Aware**

- Prompts fetch live data from Spartan.ng
- Always up-to-date information
- Real component APIs and examples

### 4. **Reusability**

- Define once, use many times
- Works across different MCP clients
- Easy to maintain and update

### 5. **Better UX**

- Users don't need to craft perfect questions
- Get comprehensive answers immediately
- Natural conversation starters

---

## 📊 Prompts vs Tools vs Resources

| Feature            | Tools            | Resources      | Prompts           |
| ------------------ | ---------------- | -------------- | ----------------- |
| **Purpose**        | Actions          | Data           | Conversations     |
| **Input**          | Parameters       | URI            | Arguments         |
| **Output**         | Result           | Content        | Messages          |
| **Example**        | Search, Generate | Component API  | Get started guide |
| **Use Case**       | DO something     | READ something | LEARN something   |
| **Active/Passive** | Active           | Passive        | Interactive       |

### When to Use Each

**Tools**: When you need to **perform an action**

- Search for components
- Generate code
- Validate props
- Analyze dependencies

**Resources**: When you need to **access data**

- Browse component list
- Read API documentation
- Get code examples
- Access structured info

**Prompts**: When you need **guided assistance**

- Get started with something new
- Learn best practices
- Troubleshoot problems
- Compare options

---

## 🎯 Real-World Usage

### Scenario 1: New User

```
User: "I want to add a calendar to my app"

MCP Client uses prompt: spartan-list-components
→ User sees calendar in "Date & Time" category

MCP Client uses prompt: spartan-get-started
→ User gets full guide with code example

User copies code and starts building!
```

### Scenario 2: Experienced Developer

```
User: "Should I use Brain or Helm API for this dialog?"

MCP Client uses prompt: spartan-compare-apis
→ User sees detailed comparison table
→ Gets recommendation based on use case

User makes informed decision!
```

### Scenario 3: Debugging

```
User: "My button styling isn't working"

MCP Client uses prompt: spartan-troubleshoot
→ User gets checklist of common issues
→ Sees correct import statements
→ Verifies props usage

User fixes the issue!
```

---

## 💻 Implementation Tips

### 1. Use Markdown Formatting

```javascript
text: `
# Heading 1
## Heading 2

**Bold** and *italic*

\`\`\`typescript
code here
\`\`\`

- Bullet points
- Are helpful

| Tables | Work | Too |
|--------|------|-----|
| Yes    | They | Do  |
`;
```

### 2. Fetch Real Data

```javascript
const html = await fetchContent(componentUrl);
const apiData = extractAPIInfo(html);
// Use real, live data in responses
```

### 3. Structure Responses

- Start with clear heading
- Overview section
- Details with examples
- Next steps or recommendations
- Links to more info

### 4. Handle Errors Gracefully

```javascript
if (!KNOWN_COMPONENTS.includes(componentName)) {
  throw new Error(
    `Unknown component. Available: ${KNOWN_COMPONENTS.slice(0, 5).join(
      ", "
    )}...`
  );
}
```

### 5. Provide Context

Include URLs, examples, and clear explanations so users can learn and explore further.

---

## ✨ Summary

**Prompts** are pre-defined conversation templates that:

- ✅ Provide consistent, high-quality responses
- ✅ Fetch live data from documentation
- ✅ Help users get started quickly
- ✅ Guide troubleshooting and decision-making
- ✅ Work seamlessly with AI assistants

We implemented **5 prompts** that cover:

- Getting started
- Comparing options
- Implementing features
- Troubleshooting issues
- Browsing components

Together with **18 tools** and **139 resources**, prompts complete the MCP trinity:

- **Tools** = DO (actions)
- **Resources** = READ (data)
- **Prompts** = LEARN (guidance)

---

**Test Results**: All 5 prompts working perfectly! 🎉
