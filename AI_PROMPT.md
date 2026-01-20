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
  - code (commands / pseudocode / source code snippets)
  - table (data / comparisons with subgraph-capable cells)
- Create meaningful connections (directed for flow / dependency, undirected for associations)
- Use groups to organize related nodes with visual boundaries and labels
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
- canvasWidth and canvasHeight must be larger than 500
- All IDs must be unique, nextId must be greater than any used ID
```
