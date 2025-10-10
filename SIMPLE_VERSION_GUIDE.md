# 📦 Simplified Version Management

## Overview

The Spartan UI MCP cache system uses a **simple, explicit version management** approach:

- **Default**: All docs cached as `"latest"` version
- **Explicit versions**: User specifies version when needed (e.g., `"1.2.3"`)
- **No auto-detection**: Keeps things simple and predictable

## 🎯 How It Works

### Default Behavior (No Version Specified)

```javascript
// User doesn't specify version
await mcp.callTool("spartan_components_get", {
  name: "button",
});

// Uses cache/latest/ automatically
// [📦 CACHED DATA - Version: latest, ...]
```

### Explicit Version (When User Knows Version)

```javascript
// User specifies their Spartan UI version
await mcp.callTool("spartan_components_get", {
  name: "button",
  spartanVersion: "1.2.3",
});

// Uses cache/1.2.3/
// [📦 CACHED DATA - Version: 1.2.3, ...]
```

## 📁 Cache Structure

```
cache/
├── latest/              ← Default cache (most common)
│   ├── metadata.json
│   ├── components/
│   └── docs/
├── 1.2.3/              ← Explicit version cache
│   ├── metadata.json
│   ├── components/
│   └── docs/
└── 0.8.0/              ← Another explicit version
    ├── metadata.json
    ├── components/
    └── docs/
```

## 🚀 Typical Workflows

### Workflow 1: Simple Usage (Most Common)

```bash
# 1. Warm up default cache
node tools/cache-warmup.js

# 2. Use normally - everything uses "latest"
# All AI queries served from cache/latest/
```

This covers 99% of use cases!

### Workflow 2: Multiple Versions

```javascript
// Project A (old version)
await mcp.callTool("spartan_components_get", {
  name: "dialog",
  spartanVersion: "0.8.0",
});

// Project B (current version)
await mcp.callTool("spartan_components_get", {
  name: "dialog",
  spartanVersion: "1.2.3",
});

// Default (latest docs)
await mcp.callTool("spartan_components_get", {
  name: "dialog",
  // No version = uses "latest"
});
```

### Workflow 3: Updating Cache

```javascript
// When Spartan UI releases new version:

// 1. Clear latest cache
await mcp.callTool("spartan_cache_clear", {});

// 2. Rebuild with new docs
await mcp.callTool("spartan_cache_rebuild", {});

// Now cache/latest/ has the new documentation!
```

## 💡 Why This Approach?

### ✅ Advantages

1. **Simple** - No complex detection logic
2. **Predictable** - Always know which version you're using
3. **Explicit** - User controls the version
4. **Fast** - No detection overhead
5. **Reliable** - No false detections or conflicts

### ❌ What We Removed

- ❌ Auto-detection from package.json
- ❌ Workspace path scanning
- ❌ Monorepo traversal
- ❌ Environment variable checking
- ❌ Parent directory searching

All that complexity is gone! 🎉

## 🎯 Mental Model

```
No version specified? → Use "latest"
Version specified?    → Use that version
```

That's it! Dead simple.

## 📊 Examples

### Example 1: AI Assistant Helping User

```
User: "How do I use the button component?"

AI calls:
  spartan_components_get({ name: "button" })

Response from cache/latest/:
  [📦 CACHED DATA - Version: latest, ...]
  ... button documentation ...
```

### Example 2: User Working with Specific Version

```
User: "I'm using Spartan UI 1.2.3, show me dialog docs"

AI calls:
  spartan_components_get({
    name: "dialog",
    spartanVersion: "1.2.3"
  })

Response from cache/1.2.3/:
  [📦 CACHED DATA - Version: 1.2.3, ...]
  ... dialog documentation ...
```

### Example 3: Cache Management

```javascript
// Check what's cached
await mcp.callTool("spartan_cache_status", {});
// Shows: latest, 1.2.3, 0.8.0

// Clear specific version
await mcp.callTool("spartan_cache_switch_version", {
  version: "1.2.3",
});
await mcp.callTool("spartan_cache_clear", {});

// Clear everything
await mcp.callTool("spartan_cache_clear", {
  allVersions: true,
});
```

## 🔧 Configuration

### spartanVersion Parameter

Available in these tools:

- `spartan_components_get`
- `spartan_docs_get`
- `spartan_cache_rebuild`
- `spartan_cache_switch_version`

```javascript
{
  spartanVersion: "1.2.3"; // Optional, defaults to "latest"
}
```

### When to Specify Version

**Specify version when:**

- Working with older Spartan UI versions
- Need to keep multiple versions cached
- Documenting version-specific features

**Don't specify version when:**

- Using current/latest Spartan UI (99% of cases)
- Don't care about specific version
- Want simplest experience

## 🎊 Summary

- **Default**: `"latest"` version (no parameter needed)
- **Explicit**: Pass `spartanVersion: "1.2.3"` when needed
- **Simple**: No auto-detection complexity
- **Fast**: Instant cache lookups
- **Reliable**: Always predictable behavior

This is the **simplest version management** that actually works! 🚀

---

**Previous documentation about auto-detection is obsolete.** The system is now much simpler!
