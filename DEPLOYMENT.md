# Deployment Guide - Spartan UI MCP Server

## 🚀 Publishing to NPM

### 1. **Prepare for Publishing**

```bash
# Update author information in package.json
# Set up GitHub repository
# Test the server locally
npm test
```

### 2. **Publish to NPM**

```bash
# Login to NPM (one-time setup)
npm login

# Publish the package
npm publish
```

### 3. **Users Don't Need to Install** (npx approach)

No installation required! Users can run directly with `npx`.

### 4. **MCP Client Configuration**

Users configure their MCP clients (Claude Desktop, Cursor, etc.):

**Option 1: Using npx (Recommended)**

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "npx",
      "args": ["spartan-ui-mcp"]
    }
  }
}
```

**Option 2: Global installation**

```bash
npm install -g spartan-ui-mcp
```

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "spartan-ui-mcp"
    }
  }
}
```

**Option 3: Local installation**

```bash
npm install spartan-ui-mcp
```

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "node",
      "args": ["./node_modules/spartan-ui-mcp/server.js"]
    }
  }
}
```

## 🐳 Docker Deployment

### 1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Make server executable
RUN chmod +x server.js

# Expose port (if needed for HTTP mode)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
```

### 2. **Build and Run**

```bash
# Build Docker image
docker build -t spartan-ui-mcp .

# Run container
docker run -d --name spartan-ui-mcp spartan-ui-mcp

# For MCP clients, use:
docker run --rm spartan-ui-mcp
```

### 3. **Docker Hub Publishing**

```bash
# Tag and push to Docker Hub
docker tag spartan-ui-mcp sog-web/spartan-ui-mcp:latest
docker push sog-web/spartan-ui-mcp:latest
```

Users can then run:

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "sog-web/spartan-ui-mcp:latest"]
    }
  }
}
```

## ☁️ Cloud Deployment Options

### 1. **Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### 2. **Vercel** (for HTTP mode)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 3. **Heroku**

```bash
# Install Heroku CLI
# Create Procfile: web: node server.js

heroku create spartan-ui-mcp
git push heroku main
```

## 🔧 GitHub Actions CI/CD

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📋 Pre-Publishing Checklist

- [ ] Update `package.json` author and repository URLs
- [ ] Test server locally: `npm start`
- [ ] Test with MCP client (Claude Desktop/Cursor)
- [ ] Update README.md with installation instructions
- [ ] Create GitHub repository
- [ ] Add license file
- [ ] Test all 18 tools work correctly
- [ ] Verify no secrets or local paths in code

## 🎯 Recommended Approach

**For maximum accessibility:**

1. **Publish to NPM** - Users can run with `npx` (no installation needed)
2. **Create GitHub repository** - For source code and issues
3. **Add to MCP registry** - If available, for discoverability

**No installation required! Users just configure:**

```json
{
  "mcpServers": {
    "spartan-ui-mcp": {
      "command": "npx",
      "args": ["spartan-ui-mcp"]
    }
  }
}
```

**Benefits of npx approach:**

- ✅ No global installation required
- ✅ Always runs latest version
- ✅ No version management needed
- ✅ Cleaner user experience

## 🔄 Updates and Versioning

```bash
# Update version and publish
npm version patch  # or minor/major
npm publish

# Users update with:
npm update -g spartan-ui-mcp
```

## 📖 Documentation for Users

Include in your README:

1. **Installation instructions**
2. **MCP client configuration**
3. **Available tools list**
4. **Usage examples**
5. **Troubleshooting guide**

This makes your Spartan UI MCP server easily accessible to the entire Angular and Spartan UI community! 🎉
