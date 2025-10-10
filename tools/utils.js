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
 * Filters out single-line snippets and very short code blocks.
 * @param {string} html
 */
export function extractCodeBlocks(html) {
  const blocks = [];
  const preCodeRegex = /<pre[^>]*><code[^>]*>[\s\S]*?<\/code><\/pre>/gi;
  const codeRegex = /<code[^>]*>[\s\S]*?<\/code>/gi;

  const pushMatchText = (s) => {
    const inner = s.replace(/^<[^>]+>/, "").replace(/<[^>]+>$/, "");
    const code = htmlToText(inner);

    // Filter out short, insignificant code snippets
    const lines = code.split("\n").filter((line) => line.trim().length > 0);

    // Skip single-line imports
    if (lines.length === 1 && code.includes("import")) {
      return;
    }

    // Only include code blocks that have more than 2 lines of actual code
    // This filters out selectors, single imports, and other tiny snippets
    if (lines.length > 2) {
      blocks.push(code);
    }
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
  };

  try {
    // Extract only the visible documentation section, not embedded JSON
    // Look for Brain API and Helm API sections in the visible HTML
    const brainAPIMatch = html.match(
      /<h[1-6][^>]*>Brain API<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>(?:Helm API|On this page|$)|$)/i
    );
    const helmAPIMatch = html.match(
      /<h[1-6][^>]*>Helm API<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>(?:On this page|$)|$)/i
    );

    // Parse Brain API section
    if (brainAPIMatch) {
      const brainSection = brainAPIMatch[1];
      const brainComponents = extractAPIComponents(brainSection);
      apiInfo.brainAPI = brainComponents;
    }

    // Parse Helm API section
    if (helmAPIMatch) {
      const helmSection = helmAPIMatch[1];
      const helmComponents = extractAPIComponents(helmSection);
      apiInfo.helmAPI = helmComponents;
    }

    // Use extractCodeBlocks for focused code examples
    // This reuses the proven extraction logic and avoids pollution
    const codeBlocks = extractCodeBlocks(html);

    // Convert code blocks to example format with simple titles
    apiInfo.examples = codeBlocks.slice(0, 10).map((code, index) => ({
      title: `Example ${index + 1}`,
      code: code,
      language: detectLanguage(code),
    }));
  } catch (error) {
    console.error("Error extracting API info:", error);
  }

  return apiInfo;
}

/**
 * Extract API components from a section of HTML
 * @param {string} html
 */
function extractAPIComponents(html) {
  const components = [];

  // Look for component definitions with headers like "BrnAvatar" or "HlmAvatar"
  const componentRegex =
    /<h[1-6][^>]*>((Brn|Hlm)\w+)<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>(?:Brn|Hlm)\w+<\/h[1-6]>|$)/gi;

  let match;
  while ((match = componentRegex.exec(html)) !== null) {
    const name = match[1];
    const content = match[3];

    // Extract selector
    const selectorMatch = content.match(/Selector:\s*([^\n<]+)/i);
    const selector = selectorMatch ? selectorMatch[1].trim() : "";

    // Extract inputs table
    const inputs = extractPropsFromTable(content, "Inputs");

    // Extract outputs table
    const outputs = extractPropsFromTable(content, "Outputs");

    components.push({
      name,
      selector,
      inputs,
      outputs,
    });
  }

  return components;
}

/**
 * Extract properties from an API table
 * @param {string} html
 * @param {string} tableType - "Inputs" or "Outputs"
 */
function extractPropsFromTable(html, tableType) {
  const props = [];

  // Look for the table section
  const tableSectionRegex = new RegExp(
    `<h[1-6][^>]*>${tableType}<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6]|$)`,
    "i"
  );
  const tableSectionMatch = html.match(tableSectionRegex);

  if (!tableSectionMatch) return props;

  const tableSection = tableSectionMatch[1];

  // Extract table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let isHeaderRow = true;

  while ((rowMatch = rowRegex.exec(tableSection)) !== null) {
    const rowContent = rowMatch[1];

    // Skip header row
    if (isHeaderRow) {
      isHeaderRow = false;
      continue;
    }

    // Extract cells
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(htmlToText(cellMatch[1]).trim());
    }

    if (cells.length >= 3) {
      if (tableType === "Inputs") {
        props.push({
          prop: cells[0],
          type: cells[1],
          default: cells[2],
          description: cells[3] || "",
        });
      } else {
        // Outputs
        props.push({
          prop: cells[0],
          type: cells[1],
          description: cells[2] || "",
        });
      }
    }
  }

  return props;
}

/**
 * Simple language detection based on code content
 * @param {string} code
 */
function detectLanguage(code) {
  if (code.includes("import") && code.includes("Component")) {
    return "typescript";
  }
  if (code.includes("import") && code.includes("from")) {
    return "javascript";
  }
  if (code.includes("<") && code.includes(">") && code.includes("hlm")) {
    return "html";
  }
  if (code.includes("npm") || code.includes("npx") || code.includes("ng ")) {
    return "bash";
  }
  return "typescript"; // default
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
