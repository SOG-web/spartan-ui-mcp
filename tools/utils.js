//@ts-check

// Base URLs for Spartan UI docs
export const SPARTAN_DOCS_BASE = "https://www.spartan.ng/documentation";
export const SPARTAN_COMPONENTS_BASE = "https://www.spartan.ng/components";

/**
 * Known Spartan components (from docs navigation). Keep this list updated.
 * Some entries may be marked as "soon" on the site.
 */
export const KNOWN_COMPONENTS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "card",
  "carousel",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "data-table",
  "date-picker",
  "dialog",
  "dropdown-menu",
  // "form", // soon
  "form-field",
  "hover-card",
  "icon",
  "input",
  "input-otp",
  "label",
  "menubar",
  // "navigation-menu", // soon
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle",
  "toggle-group",
  "tooltip",
];

/**
 * Minimal HTML -> text converter for callers that want plain text.
 * This is not a full HTML sanitizer. It strips tags and decodes basic entities.
 * @param {string} html
 */
export function htmlToText(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, "");
  const withBreaks = withoutStyles
    .replace(/<\/(p|div|section|article|li|h[1-6]|br|pre)>/gi, "\n")
    .replace(/<(br|hr)\s*\/>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Simple in-memory cache for fetched pages.
 */
const responseCache = new Map();

/**
 * Fetch a URL and return HTML or text with basic caching.
 * @param {string} url
 * @param {"html"|"text"} format
 * @param {boolean} noCache
 */
export async function fetchContent(url, format = "html", noCache = false) {
  const ttlMs = Number(process.env.SPARTAN_CACHE_TTL_MS || 5 * 60 * 1000);
  const cacheKey = `${url}::${format}`;
  const now = Date.now();
  if (!noCache && responseCache.has(cacheKey)) {
    const entry = responseCache.get(cacheKey);
    if (now - entry.timestampMs < ttlMs) {
      return entry.content;
    }
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "spartan-ui-mcp/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const result = format === "text" ? htmlToText(html) : html;
  if (!noCache) {
    responseCache.set(cacheKey, { content: result, timestampMs: now });
  }
  return result;
}

/**
 * Extract code blocks from HTML and return as an array of strings.
 * @param {string} html
 */
export function extractCodeBlocks(html) {
  const blocks = [];
  const preCodeRegex = /<pre[^>]*><code[^>]*>[\s\S]*?<\/code><\/pre>/gi;
  const codeRegex = /<code[^>]*>[\s\S]*?<\/code>/gi;
  const pushMatchText = (s) => {
    const inner = s.replace(/^<[^>]+>/, "").replace(/<[^>]+>$/, "");
    blocks.push(htmlToText(inner));
  };
  let match;
  while ((match = preCodeRegex.exec(html)) !== null) pushMatchText(match[0]);
  while ((match = codeRegex.exec(html)) !== null) pushMatchText(match[0]);
  return blocks;
}

/**
 * Extract headings (h1-h3) and return as plain text in order.
 * @param {string} html
 */
export function extractHeadings(html) {
  const regex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  const headings = [];
  let match;
  while ((match = regex.exec(html)) !== null)
    headings.push(htmlToText(match[2]));
  return headings;
}

/**
 * Extract links: { text, href }
 * @param {string} html
 */
export function extractLinks(html) {
  const regex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.push({ href: match[1], text: htmlToText(match[2]) });
  }
  return links;
}

/**
 * Extract structured API information from component documentation
 * @param {string} html
 */
export function extractAPIInfo(html) {
  const apiInfo = {
    brainAPI:
      /** @type {Array<{name: string, selector: string, inputs: Array<{prop: string, type: string, default: string, description: string}>, outputs: Array<{prop: string, type: string, description: string}>}>} */ ([]),
    helmAPI:
      /** @type {Array<{name: string, selector: string, inputs: Array<{prop: string, type: string, default: string, description: string}>, outputs: Array<{prop: string, type: string, description: string}>}>} */ ([]),
    examples:
      /** @type {Array<{title: string, code: string, language: string}>} */ ([]),
    usage:
      /** @type {Array<{component: string, template: string, imports: Array<string>}>} */ ([]),
    interfaces:
      /** @type {Array<{name: string, properties: Array<{name: string, type: string, description: string}>}>} */ ([]),
    accessibility:
      /** @type {Array<{feature: string, description: string}>} */ ([]),
  };

  try {
    // Enhanced Brain API extraction with detailed parsing
    const brainSections = html.split(/(?=Brn\w+)/gi).slice(1);
    for (const section of brainSections) {
      const component = parseBrainAPIComponent(section);
      if (component) apiInfo.brainAPI.push(component);
    }

    // Enhanced Helm API extraction
    const helmSections = html.split(/(?=Hlm\w+)/gi).slice(1);
    for (const section of helmSections) {
      const component = parseHelmAPIComponent(section);
      if (component) apiInfo.helmAPI.push(component);
    }

    // Enhanced code examples with context
    apiInfo.examples = extractEnhancedCodeBlocks(html);

    // Extract usage patterns
    apiInfo.usage = extractUsagePatterns(html);

    // Extract TypeScript interfaces
    apiInfo.interfaces = extractTypeScriptInterfaces(html);

    // Extract accessibility information
    apiInfo.accessibility = extractAccessibilityInfo(html);
  } catch (error) {
    console.error("Error extracting API info:", error);
  }

  return apiInfo;
}

/**
 * Parse Brain API component section
 * @param {string} section
 */
function parseBrainAPIComponent(section) {
  const text = htmlToText(section);
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length === 0) return null;

  const name = lines[0].trim();
  const selectorMatch = text.match(/Selector:\s*([^\n]+)/i);
  const selector = selectorMatch ? selectorMatch[1].trim() : "";

  const inputs = parsePropsTable(text, "Inputs");
  const outputs = parsePropsTable(text, "Outputs");

  return { name, selector, inputs, outputs };
}

/**
 * Parse Helm API component section
 * @param {string} section
 */
function parseHelmAPIComponent(section) {
  const text = htmlToText(section);
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length === 0) return null;

  const name = lines[0].trim();
  const selectorMatch = text.match(/Selector:\s*([^\n]+)/i);
  const selector = selectorMatch ? selectorMatch[1].trim() : "";

  const inputs = parsePropsTable(text, "Inputs");
  const outputs = parsePropsTable(text, "Outputs");

  return { name, selector, inputs, outputs };
}

/**
 * Parse props table (Inputs/Outputs)
 * @param {string} text
 * @param {string} section
 */
function parsePropsTable(text, section) {
  const props = [];
  const sectionRegex = new RegExp(
    `${section}[\\s\\S]*?(?=(?:Inputs|Outputs|Examples|$))`,
    "i"
  );
  const sectionMatch = text.match(sectionRegex);

  if (!sectionMatch) return props;

  const tableText = sectionMatch[0];
  const propRegex = /(\w+)\s+([^\s]+)\s+([^\s]+)\s+(.+?)(?=\n\w+|\n$|$)/g;

  let match;
  while ((match = propRegex.exec(tableText)) !== null) {
    if (section === "Inputs") {
      props.push({
        prop: match[1].trim(),
        type: match[2].trim(),
        default: match[3].trim(),
        description: match[4].trim(),
      });
    } else {
      props.push({
        prop: match[1].trim(),
        type: match[2].trim(),
        description: match[3].trim(),
      });
    }
  }

  return props;
}

/**
 * Extract enhanced code blocks with context
 * @param {string} html
 */
function extractEnhancedCodeBlocks(html) {
  const examples = [];
  const codeRegex =
    /<pre[^>]*><code[^>]*class="language-(\w+)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi;

  let match;
  while ((match = codeRegex.exec(html)) !== null) {
    const language = match[1];
    const code = htmlToText(match[2]);

    // Find preceding heading for context
    const precedingText = html.substring(0, match.index);
    const headingMatch = precedingText.match(
      /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>(?![\s\S]*<h[1-6])/i
    );
    const title = headingMatch ? htmlToText(headingMatch[1]) : "Example";

    examples.push({ title, code, language });
  }

  return examples;
}

/**
 * Extract usage patterns
 * @param {string} html
 */
function extractUsagePatterns(html) {
  const patterns = [];
  const usageRegex = /<(hlm-[\w-]+)[^>]*[\s\S]*?(?:\/?>|<\/\1>)/gi;

  let match;
  while ((match = usageRegex.exec(html)) !== null) {
    const component = match[1];
    const template = htmlToText(match[0]);

    // Extract imports from nearby code blocks
    const imports = extractImportsFromContext(html, match.index);

    patterns.push({ component, template, imports });
  }

  return patterns;
}

/**
 * Extract TypeScript interfaces
 * @param {string} html
 */
function extractTypeScriptInterfaces(html) {
  const interfaces = [];
  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/gi;

  let match;
  while ((match = interfaceRegex.exec(htmlToText(html))) !== null) {
    const name = match[1];
    const body = match[2];

    const properties = [];
    const propRegex = /(\w+)(\??):\s*([^;,\n]+)/g;
    let propMatch;

    while ((propMatch = propRegex.exec(body)) !== null) {
      properties.push({
        name: propMatch[1] + (propMatch[2] ? "?" : ""),
        type: propMatch[3].trim(),
        description: "",
      });
    }

    interfaces.push({ name, properties });
  }

  return interfaces;
}

/**
 * Extract accessibility information
 * @param {string} html
 */
function extractAccessibilityInfo(html) {
  const a11yInfo = [];
  const text = htmlToText(html);

  // Look for accessibility-related keywords
  const a11yKeywords = [
    "accessibility",
    "aria",
    "keyboard",
    "screen reader",
    "focus",
    "tab",
  ];

  for (const keyword of a11yKeywords) {
    const regex = new RegExp(`[^.]*${keyword}[^.]*\\.`, "gi");
    const matches = text.match(regex);

    if (matches) {
      for (const match of matches) {
        a11yInfo.push({
          feature: keyword,
          description: match.trim(),
        });
      }
    }
  }

  return a11yInfo;
}

/**
 * Extract imports from context around a usage example
 * @param {string} html
 * @param {number} position
 */
function extractImportsFromContext(html, position) {
  const imports = [];
  const contextStart = Math.max(0, position - 1000);
  const contextEnd = Math.min(html.length, position + 1000);
  const context = html.substring(contextStart, contextEnd);

  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/gi;

  let match;
  while ((match = importRegex.exec(htmlToText(context))) !== null) {
    imports.push(`import { ${match[1].trim()} } from '${match[2].trim()}';`);
  }

  return imports;
}
