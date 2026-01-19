# AI Prompt for Creating Notes with Inf

Use this concise prompt when asking AI assistants to create structured notes in Inf diagram format.

**Key Capabilities:**
- ✨ **Infinite Nesting**: Subgraphs can be nested to unlimited depth - go as deep as needed
- 🤖 **AI-Powered Content**: AI can generate comprehensive, detailed diagrams with rich hierarchical structures
- 📊 **Full Feature Set**: AI can use all node types (rectangle, circle, diamond, text, code, table) with embedded or file-based subgraphs

---

## The Prompt

```
Please follow the inf/INF_NOTE_GUIDE.md format to create a structured note diagram for [TOPIC/DOCUMENTATION/REPOSITORY].

Structure:
- Comprehensive overview / full picture at root level
- Put detailed explanations in separate JSON files as file-based subgraphs
- Use appropriate node types:
  - rectangle (concepts)
  - circle (entry / exit points)
  - diamond (decisions)
  - text (details / annotations)
  - code (pseudocode / source code snippets)
  - table (data / comparisons with subgraph-capable cells)
- Create meaningful connections (directed for flow / dependency, undirected for associations)
- **Go as deep as needed** - subgraphs support infinite nesting levels

Output:
- **root.json** - Main diagram file with root-level overview (REQUIRED - this name is mandatory)
- Separate JSON files for each subgraph (named clearly, e.g., "module-authentication.json", "concept-event-loop.json")
- In parent nodes, use `"subgraph": "filename.json"` to reference files (relative path only)
- Save all files in [DEST]

Important:
- ⚠️ **Main file MUST be named "root.json"** - Inf auto-loads this file when workspace is set
- Subgraph references are **relative paths only** (e.g., "module-auth.json") - NO absolute paths
- All files must be in the same folder
- canvasWidth and canvasHeight must be between 1000-20000 (use 2000 as default)
- All IDs must be unique, nextId must be greater than any used ID
```

---

## Usage Examples

**For Documentation:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for Python's asyncio library.

Structure:
- Comprehensive overview / full picture at root level (event loop, coroutines, tasks, futures)
- Put detailed explanations in embedded subgraphs (each concept's API, patterns, examples)
```

**For Repository:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for this Express.js REST API repository.

Structure:
- Comprehensive overview / full picture at root level (main folders, architecture layers)
- Put detailed explanations in embedded subgraphs (routes, middleware, models, controllers)
```

**For Learning:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for understanding Kubernetes.

Structure:
- Comprehensive overview / full picture at root level (core components and their relationships)
- Put detailed explanations in embedded subgraphs (pods, services, deployments, networking)
```

**For Code Documentation:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for this authentication module.

Structure:
- Comprehensive overview / full picture at root level (authentication flow, main components)
- Use code nodes for important source code snippets (login function, JWT verification, middleware)
- Use rectangle nodes for concepts and text nodes for explanations
- Put detailed implementation in embedded subgraphs
```

**For Comparisons and Data:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram comparing different database solutions.

Structure:
- Comprehensive overview / full picture at root level (database landscape, selection criteria)
- Use table nodes for side-by-side comparisons (features, performance, use cases, pros/cons)
- Each cell can have subgraphs with detailed explanations, examples, or benchmarks
- Use rectangle nodes for concepts and connections to show relationships
- Put detailed case studies in embedded subgraphs
```

---

## Tips

- Reference INF_NOTE_GUIDE.md for complete JSON format specification
- AI assistants can read the guide directly to understand all details
- Keep your prompt focused on what to document and how to organize it
- Let the guide handle the technical format details
- **Workflow**: Save all files in one folder with main file named `root.json`, then user clicks "Set Folder" in Inf to select that folder - `root.json` loads automatically!
- **File naming**: Main file = `root.json` (required), subgraphs = descriptive names like `module-auth.json`, `concept-events.json`
- **Code nodes**: Use `"type": "code"` for source code snippets - supports syntax highlighting for JavaScript/TypeScript, C/C++, and Python with monospace font and no word wrapping

---

## Creating Comprehensive Content with AI

AI assistants excel at generating detailed, well-structured Inf diagrams:

### Depth and Detail
- **No Limits**: Inf supports infinite subgraph nesting - AI can create arbitrarily deep hierarchies
- **Be Comprehensive**: Don't hold back on detail - add as many subgraphs and nodes as needed
- **Nested Structures**: Each node can contain a subgraph, which can contain nodes with their own subgraphs, infinitely
- **Rich Content**: Use code nodes for real source code, text nodes for explanations, tables for comparisons

### Content Generation Strategies

**Breadth-First Approach:**
1. Create root.json with high-level overview and main topics
2. Create separate files for each major topic (file-based subgraphs)
3. Within each topic file, add embedded subgraphs for detailed concepts
4. Add code examples, tables, and detailed text nodes as needed

**Depth-First Approach:**
1. Create root.json with overview
2. Use embedded subgraphs extensively for immediate detail
3. Nest subgraphs within subgraphs to arbitrary depth
4. Keep everything in one file for simplicity

**Hybrid Approach (Recommended for Large Topics):**
1. Root.json contains overview with file-based subgraphs for major sections
2. Each section file uses embedded subgraphs for detailed explanations
3. Balance between file organization and embedded detail
4. Create as many levels as needed - there are no artificial limits
