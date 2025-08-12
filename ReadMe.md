# Spartan UI MCP Server

A comprehensive MCP (Model Context Protocol) server that exposes the entire Spartan Angular UI ecosystem as consumable tools. This server transforms Spartan UI documentation and component information into intelligent development tools for IDEs, AI assistants, and other MCP clients.

## 🎯 Purpose

The server provides comprehensive access to:

- **46+ UI Components** with detailed API specifications (Brain & Helm APIs)
- **Complete Documentation** (installation, theming, accessibility, etc.)
- **Code Generation** capabilities for Angular components
- **Intelligent Search** across components and docs
- **Accessibility Analysis** and WCAG compliance checking
- **Component Relationships** and dependency analysis
- **Health Checks** and CLI utilities

## 🚀 Features

### 🔧 **Code Generation**

- Generate complete Angular component boilerplate
- Create working examples from API specifications
- Validate component prop usage against official APIs

### 🔍 **Intelligent Search & Discovery**

- Full-text search across all components and documentation
- Feature-based component discovery ("multi-selection", "form input", etc.)
- Find related, similar, or alternative components

### 📊 **Component Analysis**

- Analyze component dependencies (npm, Angular CDK, peer components)
- Compare Brain API vs Helm API variants
- Discover component relationships and use cases

### ♿ **Accessibility Tools**

- Comprehensive accessibility feature analysis
- ARIA support detection
- Keyboard navigation and screen reader compatibility
- WCAG compliance checking

### 🎨 **Enhanced API Extraction**

- Structured Brain API and Helm API parsing
- TypeScript interface extraction
- Code examples with context
- Usage patterns and import statements

## 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd spartan-ui-mcp
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## 🛠 Usage

### MCP Client Configuration

Configure your MCP client (Claude Desktop, Cursor, etc.) to connect to this server:

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "node",
      "args": ["/path/to/spartan-ui-mcp/server.js"]
    }
  }
}
```

### Example Tool Calls

#### **Component Discovery**

```json
// List all available components
{ "tool": "spartan.components.list" }

// Search components by feature
{ "tool": "spartan.components.search", "feature": "multi-selection" }

// Get component with enhanced API extraction
{ "tool": "spartan.components.get", "name": "calendar", "extract": "api" }
```

#### **Code Generation**

```json
// Generate Angular component boilerplate
{
  "tool": "spartan.generate.component",
  "componentName": "calendar",
  "variant": "helm",
  "outputFormat": "standalone"
}

// Create working example
{
  "tool": "spartan.generate.example",
  "componentName": "dialog",
  "scenario": "advanced"
}

// Validate component props
{
  "tool": "spartan.validate.props",
  "componentName": "calendar",
  "props": { "date": "2024-01-01", "min": "invalid" }
}
```

#### **Search & Analysis**

```json
// Full-text search
{ "tool": "spartan.search", "query": "date picker accessibility" }

// Find related components
{ "tool": "spartan.components.related", "componentName": "calendar" }

// Analyze dependencies
{ "tool": "spartan.components.dependencies", "componentName": "dialog" }

// Compare API variants
{ "tool": "spartan.components.variants", "componentName": "calendar" }
```

#### **Accessibility Analysis**

```json
// Comprehensive accessibility check
{ "tool": "spartan.accessibility.check", "componentName": "dialog" }

// Specific accessibility aspect
{ "tool": "spartan.accessibility.check", "componentName": "button", "checkType": "aria" }
```

## 🛠 Available Tools (18 Total)

### **Core Tools (7)**

- `spartan.components.list` - List all components with URLs
- `spartan.components.get` - Get component docs with enhanced API extraction
- `spartan.docs.get` - Fetch documentation topics
- `spartan.health.check` - Check page availability
- `spartan.health.instructions` - CLI health check guidance
- `spartan.health.command` - Generate health check commands
- `spartan.meta` - Metadata for autocompletion

### **Code Generation Tools (3)**

- `spartan.generate.component` - Generate Angular component boilerplate
- `spartan.generate.example` - Create working examples from specs
- `spartan.validate.props` - Validate component property usage

### **Search & Discovery Tools (3)**

- `spartan.search` - Full-text search across components and docs
- `spartan.components.search` - Search components by feature/use-case
- `spartan.examples.get` - Get specific examples by component

### **Component Analysis Tools (4)**

- `spartan.components.dependencies` - Analyze component dependencies
- `spartan.components.related` - Find related/similar components
- `spartan.components.variants` - Compare Brain vs Helm API variants
- `spartan.accessibility.check` - Comprehensive accessibility analysis

## 📊 Output Formats

- **`html`** - Raw HTML from documentation pages
- **`text`** - Clean plain text (HTML tags stripped)
- **`api`** - Structured JSON with Brain/Helm API specifications
- **`code`** - Extracted code blocks with context
- **`headings`** - Section headings for navigation
- **`links`** - Extracted links and references

## 🏗 Project Structure

```
spartan-ui-mcp/
├── server.js              # Main MCP server entry point (32 lines)
├── package.json            # Dependencies and npm scripts
├── plan.md                 # Comprehensive project documentation
└── tools/                  # Modular tool implementations
    ├── utils.js            # Enhanced API extraction & utilities (431 lines)
    ├── components.js       # Component tools with processing hints (121 lines)
    ├── docs.js             # Documentation fetching tools (78 lines)
    ├── health.js           # Health check and CLI tools (154 lines)
    ├── meta.js             # Metadata and autocompletion (64 lines)
    ├── generation.js       # Code generation tools (NEW)
    ├── search.js           # Search and discovery tools (NEW)
    └── analysis.js         # Component analysis tools (NEW)
```

## ⚡ Performance & Caching

- **Intelligent Caching**: 5-minute TTL with configurable cache via `SPARTAN_CACHE_TTL_MS`
- **Batch Processing**: Efficient handling of multiple component requests
- **Error Resilience**: Graceful handling of failed requests with fallbacks
- **Response Optimization**: Structured outputs for faster AI processing

## 🎯 AI Processing Enhancements

The server includes special features to guide AI models:

- **Processing Instructions**: Clear guidance in every response
- **Structured Outputs**: JSON format with metadata and instructions
- **Enhanced Descriptions**: Detailed tool descriptions with usage examples
- **Error Context**: Comprehensive error messages with suggestions

## 🧪 Testing & Validation

- ✅ All 46 components validated and accessible
- ✅ Complete API extraction testing
- ✅ Code generation validation
- ✅ Search functionality verification
- ✅ Accessibility analysis testing

## 🔧 Configuration

### Environment Variables

- `SPARTAN_CACHE_TTL_MS` - Cache TTL in milliseconds (default: 300000 = 5 minutes)

### NPM Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload (--watch)
- `npm test` - Run tests (placeholder)

## 📝 Notes

- **Data Source**: All content fetched from public Spartan UI pages at [spartan.ng](https://www.spartan.ng)
- **Input Validation**: Comprehensive Zod schema validation for all tool inputs
- **Source Attribution**: All responses include source URLs for transparency
- **Error Handling**: Graceful handling of 404s and network issues
- **Type Safety**: Full TypeScript support with proper type annotations

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

ISC License - see package.json for details.

---

**Built for the Spartan Angular UI community** 🏛️

This MCP server transforms static documentation into intelligent, queryable tools that enhance the developer experience with Spartan UI components.
