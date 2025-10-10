# Resources vs Resource Templates Explanation

## 📚 What We Actually Implemented

### ✅ We Used BOTH:

1. **Static Resources** (1)
2. **Resource Templates** (3 types)

---

## 🔍 The Difference

### 1. **Static Resource** (Regular Resource)

A fixed URI that always returns the same type of data.

**Example: Component List**

```javascript
server.resource(
  "Spartan UI Components List",
  "spartan://components/list",  // ← Fixed URI, no variables
  { description: "...", mimeType: "application/json" },
  async () => {
    return { contents: [...] };
  }
);
```

**Usage:**

- Single, fixed URI: `spartan://components/list`
- Returns list of all 46 components
- No parameters needed
- Always the same resource

---

### 2. **Resource Template** (Dynamic Resource)

A URI pattern with variables that generates multiple resources dynamically.

**Example: Component API Resources**

```javascript
// Step 1: Create the template with pattern
const apiTemplate = new ResourceTemplate(
  "spartan://component/{name}/api",  // ← URI pattern with {variable}
  {
    list: async () => {
      // Returns ALL resources matching this pattern
      return {
        resources: KNOWN_COMPONENTS.map((name) => ({
          uri: `spartan://component/${name}/api`,
          name: `${name} - API Documentation`,
          description: `...",
          mimeType: "application/json",
        })),
      };
    },
    complete: {},  // Optional: autocomplete for variables
  }
);

// Step 2: Register the template
server.resource(
  "Component API Documentation",
  apiTemplate,  // ← Pass the template object
  { description: "...", mimeType: "application/json" },
  async (uri, variables) => {
    const name = variables.name;  // ← Extract variable from URI
    // Fetch data for this specific component
    return { contents: [...] };
  }
);
```

**Usage:**

- Creates 46 resources from ONE registration:
  - `spartan://component/button/api`
  - `spartan://component/calendar/api`
  - `spartan://component/dialog/api`
  - ... and 43 more!
- The `{name}` variable gets extracted automatically
- Each URI is a separate resource

---

## 📊 What We Implemented

### Static Resources (1)

1. **Component List**: `spartan://components/list`

### Resource Templates (3 patterns → 138 resources)

1. **API Template**: `spartan://component/{name}/api`

   - Creates 46 resources (one per component)
   - Example: `spartan://component/button/api`

2. **Examples Template**: `spartan://component/{name}/examples`

   - Creates 46 resources (one per component)
   - Example: `spartan://component/calendar/examples`

3. **Full Docs Template**: `spartan://component/{name}/full`
   - Creates 46 resources (one per component)
   - Example: `spartan://component/dialog/full`

### Total: 1 + 138 = **139 Resources**

---

## 🎯 Benefits of Resource Templates

### Without Templates (Manual Registration):

```javascript
// Would need to write this 46 times! 😱
server.resource("button API", "spartan://component/button/api", ...);
server.resource("calendar API", "spartan://component/calendar/api", ...);
server.resource("dialog API", "spartan://component/dialog/api", ...);
// ... 43 more times!
```

### With Templates (Smart Registration):

```javascript
// Write ONCE, generates 46 resources! 🚀
const template = new ResourceTemplate("spartan://component/{name}/api", {
  list: () => ({ resources: KNOWN_COMPONENTS.map(...) })
});
server.resource("Component API", template, ...);
```

---

## 🎨 Key Features of Resource Templates

### 1. **Variable Extraction**

```javascript
URI: "spartan://component/button/api";
Pattern: "spartan://component/{name}/api";
Result: variables.name = "button";
```

### 2. **Resource Listing**

The `list` callback tells MCP clients about all available resources:

```javascript
list: async () => ({
  resources: [
    { uri: "spartan://component/button/api", ... },
    { uri: "spartan://component/calendar/api", ... },
    // ... all 46 components
  ]
})
```

### 3. **Autocomplete (Optional)**

The `complete` callback can suggest values for variables:

```javascript
complete: {
  name: async () => ["button", "calendar", "dialog", ...]
}
```

(We didn't implement this, but it's available!)

---

## 💡 Real-World Analogy

### Static Resource = Single Book

- You ask for "The Complete Component Guide"
- You always get the same book
- URI: `library://complete-guide`

### Resource Template = Book Series

- You ask for "Component Guide for {component}"
- Library generates books on-demand:
  - "Component Guide for Buttons"
  - "Component Guide for Calendars"
  - "Component Guide for Dialogs"
- URI Pattern: `library://guide/{component}`
- The library knows all available books from the `list` callback

---

## 🔧 Technical Implementation Details

### ResourceTemplate Constructor

```javascript
new ResourceTemplate(
  uriPattern,  // string with {variables}
  {
    list: async () => ({ resources: [...] }),  // Required
    complete: { varName: async () => [...] }   // Optional
  }
)
```

### Callback Signature

```javascript
async (uri, variables, extra) => {
  // uri: URL object of the requested resource
  // variables: { name: "button", ... }
  // extra: Additional request context

  return {
    contents: [
      {
        uri: uri.toString(),
        mimeType: "application/json",
        text: JSON.stringify(data),
      },
    ],
  };
};
```

---

## 📈 Summary

| Feature           | Static Resource    | Resource Template               |
| ----------------- | ------------------ | ------------------------------- |
| **URI**           | Fixed              | Pattern with {variables}        |
| **Count**         | 1 resource         | N resources from 1 registration |
| **Variables**     | None               | Yes, extracted from URI         |
| **List Callback** | Not needed         | Required for discovery          |
| **Use Case**      | Single data source | Multiple similar resources      |
| **Example**       | Component list     | Individual component docs       |

### What We Built:

- ✅ **1 static resource** for the component list
- ✅ **3 resource templates** generating 138 dynamic resources
- ✅ **Total: 139 resources** from 4 registrations!

---

## 🎯 Why This Matters

**Efficiency**: 4 registrations → 139 resources  
**Maintainability**: Add new component? All 3 resource types automatically available!  
**Scalability**: Works for 46 components today, will work for 100 tomorrow  
**DRY Principle**: Don't Repeat Yourself - write pattern once, apply everywhere

---

**Resource Templates are the smart, scalable way to expose structured data through MCP!** 🚀
