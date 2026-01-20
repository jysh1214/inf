# Inf Diagram JSON Format Guide

This guide explains the JSON format for Inf diagrams, allowing you to create and edit diagrams programmatically or by hand.

## Table of Contents

- [Overview](#overview)
- [Top-Level Structure](#top-level-structure)
- [Node Types](#node-types)
- [Connections](#connections)
- [Groups](#groups)
- [Subgraphs](#subgraphs)
- [Complete Examples](#complete-examples)
- [Validation Rules](#validation-rules)
- [Tips & Best Practices](#tips--best-practices)

---

## Overview

Inf diagrams are stored as JSON files with a well-defined structure. You can create these files manually, use the UI to generate them, or have AI assistants create comprehensive, detailed diagrams for you. The format supports:

- Six node types: rectangle, circle, diamond, text, code, and table
- Directed and undirected connections
- **Infinite levels of hierarchical subgraphs** (embedded or file-based)
- Customizable canvas size and zoom levels
- AI-generated content with rich, nested structures

---

## Top-Level Structure

Every Inf diagram JSON file has the following top-level fields:

```json
{
  "version": "1.0",
  "nodes": [],
  "connections": [],
  "groups": [],
  "nextId": 1,
  "canvasWidth": 2000,
  "canvasHeight": 2000,
  "zoom": 1.0
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Format version (current: "1.0") |
| `nodes` | array | Yes | Array of node objects |
| `connections` | array | Yes | Array of connection objects |
| `groups` | array | No | Array of group objects (optional, for backwards compatibility) |
| `nextId` | number | Yes | Next available ID for new nodes/connections/groups |
| `canvasWidth` | number | Yes | Canvas width in pixels (100-20000, default: 2000) |
| `canvasHeight` | number | Yes | Canvas height in pixels (100-20000, default: 2000) |
| `zoom` | number | Yes | Zoom level (0.1-3.0, default: 1.0) |

---

## Node Types

All nodes share common properties, with type-specific properties for positioning and sizing.

### Common Properties

All nodes must have:

```json
{
  "id": 1,
  "type": "rectangle",
  "text": "Node label",
  "textAlign": "center"
}
```

| Property | Type | Required | Valid Values | Description |
|----------|------|----------|--------------|-------------|
| `id` | number | Yes | Unique positive integer | Node identifier |
| `type` | string | Yes | "rectangle", "circle", "diamond", "text", "code", "table" | Node shape |
| `text` | string | Yes | Any string (max 1000 chars) | Node label/content |
| `textAlign` | string | Yes | "left", "center", "right" | Text alignment |
| `subgraph` | object/string | No | Object or filename | Optional subgraph data |

### Rectangle Nodes

```json
{
  "id": 1,
  "type": "rectangle",
  "text": "Process",
  "textAlign": "center",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 80
}
```

**Position:** `(x, y)` is the **top-left corner**

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of top-left corner |
| `y` | number | Y coordinate of top-left corner |
| `width` | number | Width in pixels (min: 40) |
| `height` | number | Height in pixels (min: 40) |

### Circle Nodes

```json
{
  "id": 2,
  "type": "circle",
  "text": "Start",
  "textAlign": "center",
  "x": 300,
  "y": 200,
  "radius": 50
}
```

**Position:** `(x, y)` is the **center point**

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of center |
| `y` | number | Y coordinate of center |
| `radius` | number | Radius in pixels (min: 20) |

### Diamond Nodes

```json
{
  "id": 3,
  "type": "diamond",
  "text": "Decision?",
  "textAlign": "center",
  "x": 500,
  "y": 150,
  "width": 100,
  "height": 100
}
```

**Position:** `(x, y)` is the **top-left corner of bounding box**

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of top-left corner |
| `y` | number | Y coordinate of top-left corner |
| `width` | number | Width in pixels (min: 40) |
| `height` | number | Height in pixels (min: 40) |

### Text Nodes

```json
{
  "id": 4,
  "type": "text",
  "text": "Free-form text annotation",
  "textAlign": "left",
  "x": 700,
  "y": 300,
  "width": 150,
  "height": 60
}
```

**Position:** `(x, y)` is the **top-left corner**

Text nodes have no visible border, only text.

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of top-left corner |
| `y` | number | Y coordinate of top-left corner |
| `width` | number | Width in pixels (min: 40) |
| `height` | number | Height in pixels (min: 40) |

### Code Nodes

```json
{
  "id": 5,
  "type": "code",
  "text": "function hello() {\n  return true;\n}",
  "textAlign": "left",
  "x": 400,
  "y": 500,
  "width": 200,
  "height": 100
}
```

**Position:** `(x, y)` is the **top-left corner**

Code nodes display code with monospace font and syntax highlighting. Features:
- Monospace font (Monaco, Menlo, Courier New)
- Syntax highlighting for JavaScript/TypeScript, C/C++, and Python keywords
- No word wrapping (preserves code formatting)
- Light gray background (#f5f5f5) with visible border

**Syntax Highlighting:**
- Keywords highlighted in blue (if, for, function, class, def, int, template, etc.)
- Strings highlighted in green (starting with ", ', or `)
- Numbers highlighted in dark green
- Comments highlighted in gray (// for JS/C++, # for Python)

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of top-left corner |
| `y` | number | Y coordinate of top-left corner |
| `width` | number | Width in pixels (min: 40, default: 200) |
| `height` | number | Height in pixels (min: 40, default: 100) |

### Table Nodes

```json
{
  "id": 6,
  "type": "table",
  "text": "",
  "textAlign": "center",
  "x": 200,
  "y": 300,
  "rows": 3,
  "cols": 3,
  "cellWidth": 100,
  "cellHeight": 40,
  "cells": [
    [
      {"text": "Header 1", "textAlign": "center"},
      {"text": "Header 2", "textAlign": "center"},
      {"text": "Header 3", "textAlign": "center"}
    ],
    [
      {"text": "Data A1", "textAlign": "left"},
      {"text": "Data A2", "textAlign": "left"},
      {"text": "Data A3", "textAlign": "left"}
    ],
    [
      {"text": "Data B1", "textAlign": "left"},
      {"text": "Data B2", "textAlign": "left"},
      {"text": "Data B3", "textAlign": "left"}
    ]
  ],
  "editingCell": null
}
```

**Position:** `(x, y)` is the **top-left corner** of the table

Table nodes are grids of cells for presenting structured data and comparisons. Each cell behaves like a Text node with independent text, alignment, and optional subgraphs.

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X coordinate of top-left corner |
| `y` | number | Y coordinate of top-left corner |
| `rows` | number | Number of rows (1-20) |
| `cols` | number | Number of columns (1-20) |
| `cellWidth` | number | Width of each cell in pixels (default: 100) |
| `cellHeight` | number | Height of each cell in pixels (default: 40) |
| `cells` | array | 2D array of cell objects |
| `editingCell` | object/null | Internal: {row, col} when editing a cell |

**Cell Object Structure:**

Each cell in the `cells` array is an object with:

```json
{
  "text": "Cell content",
  "textAlign": "left"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | string | Yes | Cell content (max 1000 chars) |
| `textAlign` | string | Yes | "left", "center", or "right" |
| `subgraph` | object/string | No | Optional subgraph (embedded or file-based) |

**Selection Behavior:**

Tables support two levels of selection:

1. **Border Selection** - Clicking the table's outer border (10px edge area) selects the entire table for moving or resizing
2. **Cell Selection** - Clicking inside a cell selects that specific cell for editing or alignment changes

Selected cells are highlighted with a blue border. Only one cell or table can be selected at a time.

**Resizing:**

When resizing a table node, all cells resize proportionally:
- Total table width = `cols × cellWidth`
- Total table height = `rows × cellHeight`
- Dragging resize handles adjusts `cellWidth` and `cellHeight` uniformly

Individual cells cannot be resized independently.

**Use Cases:**

Use table nodes for:
- **Data presentation** - Displaying structured information in rows and columns
- **Comparisons** - Side-by-side feature comparisons, pros/cons lists, specifications
- **Reference tables** - Quick lookup tables, parameter lists, configuration options
- **Hierarchical data** - Cells can have subgraphs for drill-down details

**Cell Subgraph Example:**

```json
{
  "id": 7,
  "type": "table",
  "text": "",
  "textAlign": "center",
  "x": 100,
  "y": 100,
  "rows": 2,
  "cols": 2,
  "cellWidth": 120,
  "cellHeight": 50,
  "cells": [
    [
      {"text": "Feature A", "textAlign": "left"},
      {
        "text": "Details",
        "textAlign": "center",
        "subgraph": {
          "version": "1.0",
          "nodes": [
            {
              "id": 1,
              "type": "text",
              "text": "Feature A is implemented using...",
              "textAlign": "left",
              "x": 400,
              "y": 400,
              "width": 200,
              "height": 100
            }
          ],
          "connections": [],
          "nextId": 2,
          "canvasWidth": 2000,
          "canvasHeight": 2000,
          "zoom": 1.0
        }
      }
    ],
    [
      {"text": "Feature B", "textAlign": "left"},
      {"text": "feature-b-details.json", "textAlign": "center"}
    ]
  ],
  "editingCell": null
}
```

In this example:
- Cell [0][1] has an embedded subgraph with detailed explanation
- Cell [1][1] references a file-based subgraph for Feature B details
- Users can Ctrl+Click any cell to enter/create its subgraph

---

## Connections

Connections link two nodes together with lines. They can be directed (with arrows) or undirected.

```json
{
  "id": 5,
  "fromId": 1,
  "toId": 2,
  "directed": true
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | number | Yes | Unique connection identifier |
| `fromId` | number | Yes | Source node ID (must exist) |
| `toId` | number | Yes | Target node ID (must exist) |
| `directed` | boolean | Yes | `true` for arrow, `false` for plain line |

### Connection Rules

- `fromId` and `toId` must reference existing node IDs
- Self-connections (same `fromId` and `toId`) are not allowed
- Duplicate connections between the same two nodes are not allowed
- Connection IDs must be unique

---

## Groups

Groups provide visual organization for related nodes by drawing a labeled, dashed border around them. Groups are purely visual and don't affect node functionality or connections.

```json
{
  "id": 8,
  "name": "Authentication Module",
  "nodeIds": [1, 2, 3]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | number | Yes | Unique group identifier |
| `name` | string | Yes | Group label displayed at top-left (max 50 chars) |
| `nodeIds` | array | Yes | Array of node IDs in this group (minimum 2) |

### Group Rules

- `id` must be unique across all groups
- `name` cannot be empty
- `nodeIds` must contain at least 2 node IDs
- All node IDs in `nodeIds` must reference existing nodes
- No duplicate node IDs within a group
- Nodes can belong to multiple groups simultaneously

### Visual Rendering

Groups render with:
- **Dashed border**: Light grey (#999) dashed rectangle with 15px padding around all contained nodes
- **Label**: Group name displayed in bold at the top-left corner
- **Auto-sizing**: Border automatically expands/contracts as nodes move
- **Z-order**: Groups render behind connections and nodes

### Group Scope

Groups are **graph-specific**:
- Each graph context (root, subgraphs) has its own independent groups
- When entering a subgraph, parent groups are saved to the navigation stack
- When exiting a subgraph, child groups are saved and parent groups are restored
- Groups are included in JSON save/load for each graph level
- No cross-contamination between different graph contexts

### Example

```json
{
  "version": "1.0",
  "nodes": [
    {"id": 1, "type": "rectangle", "text": "Login", "textAlign": "center", "x": 100, "y": 100, "width": 120, "height": 80},
    {"id": 2, "type": "rectangle", "text": "Signup", "textAlign": "center", "x": 250, "y": 100, "width": 120, "height": 80},
    {"id": 3, "type": "rectangle", "text": "JWT Token", "textAlign": "center", "x": 100, "y": 220, "width": 120, "height": 80},
    {"id": 4, "type": "rectangle", "text": "Database", "textAlign": "center", "x": 500, "y": 100, "width": 120, "height": 80}
  ],
  "connections": [
    {"id": 5, "fromId": 1, "toId": 3, "directed": true},
    {"id": 6, "fromId": 2, "toId": 3, "directed": true}
  ],
  "groups": [
    {
      "id": 7,
      "name": "Auth Module",
      "nodeIds": [1, 2, 3]
    }
  ],
  "nextId": 8,
  "canvasWidth": 2000,
  "canvasHeight": 2000,
  "zoom": 1.0
}
```

In this example, nodes 1, 2, and 3 will be visually enclosed by a dashed border labeled "Auth Module" at the top-left corner.

---

## Subgraphs

Nodes can contain subgraphs, creating hierarchical diagrams. Subgraphs can be **embedded** (stored in the same file) or **file-based** (stored in separate JSON files).

### Embedded Subgraphs

Store complete diagram data inside the node's `subgraph` property:

```json
{
  "id": 6,
  "type": "rectangle",
  "text": "System Component",
  "textAlign": "center",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 80,
  "subgraph": {
    "version": "1.0",
    "nodes": [
      {
        "id": 1,
        "type": "circle",
        "text": "Sub-node",
        "textAlign": "center",
        "x": 500,
        "y": 500,
        "radius": 30
      }
    ],
    "connections": [],
    "nextId": 2,
    "canvasWidth": 2000,
    "canvasHeight": 2000,
    "zoom": 1.0
  }
}
```

**Embedded subgraphs:**
- Are saved automatically with the parent diagram
- Changes are immediately persisted
- Good for keeping everything in one file
- **Can be nested infinitely deep** - there is no limit to subgraph nesting levels
- Perfect for AI-generated content with arbitrary depth and detail

### File-Based Subgraphs

Reference an external JSON file by storing a filename reference as a string:

```json
{
  "id": 7,
  "type": "rectangle",
  "text": "External System",
  "textAlign": "center",
  "x": 300,
  "y": 100,
  "width": 120,
  "height": 80,
  "subgraph": "external-system-details.json"
}
```

**File-based subgraphs:**
- Store the **filename only** (relative path) in the `subgraph` property
- ⚠️ **IMPORTANT:** Only relative paths (filenames) are supported - no absolute paths
- ⚠️ **REQUIRED:** Workspace folder MUST be set before creating file-based subgraphs
- Must be a valid `.json` file
- File must contain a valid Inf diagram structure
- Useful for reusing diagrams across multiple projects
- Changes require manually saving the external file

**Workspace Folder (Required for File-Based Subgraphs):**
- ⚠️ **YOU MUST** click "Set Folder" in the Workspace section before creating file-based subgraphs
- All subgraph files must be in the authorized workspace folder
- Files open automatically (no file picker prompts) after workspace is set
- Folder permission persists across page reloads
- **Best practice**: Name your main diagram file `root.json` - it will auto-load when you set the workspace folder!
- **Workflow**: Create all diagram files in one folder → Click "Set Folder" in Inf → Select that folder → `root.json` loads automatically
- **Relative path example:** `"subgraph": "module-auth.json"` ✓
- **Absolute path example:** `"subgraph": "/Users/alex/diagrams/module.json"` ✗ NOT SUPPORTED

**File Access Priority:**
1. **Memory cache** - Files already opened this session (instant)
2. **IndexedDB** - Previously opened files with stored handles (fast)
3. **Workspace folder** - Files in authorized folder (automatic, no picker)
4. **File picker** - Manual selection for files not found above (fallback)

### Circular Reference Prevention

**Important:** Avoid circular references in subgraphs!

❌ **Don't do this:**
```
File A references File B as subgraph
File B references File A as subgraph
→ Infinite loop!
```

❌ **Or this (embedded):**
```
Node 1 has subgraph containing Node 2
Node 2 has subgraph containing Node 1
→ Infinite loop!
```

The application validates and prevents circular references at runtime.

---

## Complete Examples

### Minimal Diagram

```json
{
  "version": "1.0",
  "nodes": [],
  "connections": [],
  "nextId": 1,
  "canvasWidth": 2000,
  "canvasHeight": 2000,
  "zoom": 1.0
}
```

### Simple Flowchart

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": 1,
      "type": "circle",
      "text": "Start",
      "textAlign": "center",
      "x": 500,
      "y": 200,
      "radius": 50
    },
    {
      "id": 2,
      "type": "rectangle",
      "text": "Process Data",
      "textAlign": "center",
      "x": 440,
      "y": 350,
      "width": 120,
      "height": 80
    },
    {
      "id": 3,
      "type": "diamond",
      "text": "Valid?",
      "textAlign": "center",
      "x": 450,
      "y": 500,
      "width": 100,
      "height": 100
    },
    {
      "id": 4,
      "type": "circle",
      "text": "End",
      "textAlign": "center",
      "x": 500,
      "y": 700,
      "radius": 50
    }
  ],
  "connections": [
    {
      "id": 5,
      "fromId": 1,
      "toId": 2,
      "directed": true
    },
    {
      "id": 6,
      "fromId": 2,
      "toId": 3,
      "directed": true
    },
    {
      "id": 7,
      "fromId": 3,
      "toId": 4,
      "directed": true
    }
  ],
  "nextId": 8,
  "canvasWidth": 2000,
  "canvasHeight": 2000,
  "zoom": 1.0
}
```

### Diagram with Subgraph

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": 1,
      "type": "rectangle",
      "text": "Main Module",
      "textAlign": "center",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 80,
      "subgraph": {
        "version": "1.0",
        "nodes": [
          {
            "id": 1,
            "type": "text",
            "text": "Internal component A",
            "textAlign": "left",
            "x": 400,
            "y": 400,
            "width": 200,
            "height": 60
          },
          {
            "id": 2,
            "type": "text",
            "text": "Internal component B",
            "textAlign": "left",
            "x": 400,
            "y": 500,
            "width": 200,
            "height": 60
          }
        ],
        "connections": [
          {
            "id": 3,
            "fromId": 1,
            "toId": 2,
            "directed": false
          }
        ],
        "nextId": 4,
        "canvasWidth": 2000,
        "canvasHeight": 2000,
        "zoom": 1.0
      }
    },
    {
      "id": 2,
      "type": "rectangle",
      "text": "Database",
      "textAlign": "center",
      "x": 300,
      "y": 100,
      "width": 120,
      "height": 80
    }
  ],
  "connections": [
    {
      "id": 3,
      "fromId": 1,
      "toId": 2,
      "directed": true
    }
  ],
  "nextId": 4,
  "canvasWidth": 2000,
  "canvasHeight": 2000,
  "zoom": 1.0
}
```

---

## Validation Rules

The application validates JSON files when loading. Here are the key rules:

### File-Level Validation

✅ **Valid:**
- All required fields present
- `version` is a string
- `nodes` is an array
- `connections` is an array
- `groups` is an array (optional, can be omitted)
- `nextId` is a positive number
- `canvasWidth` and `canvasHeight` are between 100-20000
- `zoom` is between 0.1-3.0

### Node Validation

✅ **Valid:**
- `id` is a unique positive integer
- `type` is one of: "rectangle", "circle", "diamond", "text", "code", "table"
- `text` is a string (max 1000 characters)
- `textAlign` is one of: "left", "center", "right"
- Type-specific properties match the node type
- All dimension values are numbers ≥ minimum sizes
- For table nodes: `cells` is a 2D array with valid cell objects, `rows` and `cols` match array dimensions

❌ **Invalid:**
- Duplicate node IDs
- Missing required properties
- Unknown node types
- Negative coordinates or dimensions
- Text longer than 1000 characters
- For table nodes: missing `cells`, `rows`, `cols`, or cell objects with invalid structure

### Connection Validation

✅ **Valid:**
- `id` is a unique positive integer
- `fromId` and `toId` reference existing nodes
- `directed` is a boolean
- No self-connections (`fromId` ≠ `toId`)
- No duplicate connections between same nodes

❌ **Invalid:**
- Duplicate connection IDs
- References to non-existent nodes
- Self-connections
- Missing required properties

### Group Validation

✅ **Valid:**
- `id` is a unique positive integer
- `name` is a non-empty string
- `nodeIds` is an array with at least 2 node IDs
- All node IDs reference existing nodes
- No duplicate node IDs within the group

❌ **Invalid:**
- Duplicate group IDs
- Empty or missing `name`
- Fewer than 2 nodes in `nodeIds`
- References to non-existent nodes
- Duplicate node IDs within the group
- Missing required properties

### Subgraph Validation

✅ **Valid:**
- `null` or `undefined` (no subgraph)
- String ending with `.json` (file-based reference)
- Valid diagram object (embedded, recursively validated)

❌ **Invalid:**
- String not ending with `.json`
- Object missing required diagram fields
- Circular references (detected at runtime)

---

## Tips & Best Practices

### ID Management

- **Always increment `nextId`** to be higher than any existing node, connection, or group ID
- Keep IDs unique within each diagram (including subgraphs)
- IDs don't need to be sequential, just unique

Example:
```json
{
  "nodes": [
    {"id": 1, ...},
    {"id": 2, ...},
    {"id": 5, ...}  // Gap is OK
  ],
  "connections": [
    {"id": 6, ...}
  ],
  "groups": [
    {"id": 7, ...}
  ],
  "nextId": 8  // Must be > 7 (highest ID used)
}
```

### Canvas Sizing

- **Default:** 2000×2000 pixels is a good starting size
- **Minimum:** 100×100 pixels
- **Maximum:** 20000×20000 pixels
- Consider your content - larger diagrams need more canvas space

### Node Positioning

- **Plan your layout** before creating nodes
- Leave space between nodes for connections
- Remember position meanings differ by type:
  - Rectangle/Diamond/Text: `(x, y)` = top-left corner
  - Circle: `(x, y)` = center point

### Text Content

- Keep labels concise (max 1000 characters)
- Use `\n` for line breaks if needed
- Text nodes are great for annotations and free-form notes

### Subgraph Strategy

**Use embedded subgraphs when:**
- The subgraph is specific to this diagram
- You want automatic saving
- You prefer single-file diagrams

**Use file-based subgraphs when:**
- Reusing diagrams across projects
- Collaborating with version control
- Managing very large hierarchies
- Wanting independent file management

### Groups Strategy

**Use groups to:**
- Visually organize related nodes (modules, components, layers)
- Create clear boundaries between different functional areas
- Label collections of nodes with meaningful names
- Improve diagram readability without affecting structure

**Best practices:**
- Name groups clearly and concisely (e.g., "Auth Module", "UI Layer")
- Keep related nodes physically close together for better visual grouping
- Nodes can belong to multiple groups (e.g., shared between layers)
- Groups are purely visual - they don't affect connections or node behavior
- Each graph context has independent groups (root vs. subgraphs)

### Performance

- Very large diagrams (1000+ nodes) may slow down
- Consider breaking into multiple file-based subgraphs
- Use appropriate canvas size for your content

### Version Control

- JSON format is git-friendly
- Pretty-print with 2-space indentation (automatic from UI)
- File-based subgraphs enable modular versioning

### Validation

- Use the UI's "Load" function to validate your JSON
- Check browser console for detailed error messages
- Validation errors show which node/connection failed

### AI-Generated Content

Inf is designed to work seamlessly with AI assistants for creating rich, detailed documentation:

**Capabilities:**
- AI can generate comprehensive diagram structures with multiple files
- AI can create deeply nested subgraphs with infinite levels of detail
- AI can populate code nodes with real source code snippets
- AI can create table nodes with detailed comparisons and cell-level subgraphs
- AI can organize complex topics into hierarchical, navigable structures

**Best Practices:**
- Ask AI to create a `root.json` file as the main entry point
- Request file-based subgraphs for large, complex topics
- Have AI use embedded subgraphs for details specific to each node
- Let AI determine the optimal depth and structure based on content complexity
- AI can create arbitrarily deep hierarchies without hitting limits

**Example Prompt:**
> "Create an Inf diagram documenting the React ecosystem. Use root.json as the main file with an overview, and create detailed subgraphs for hooks, state management, routing, and performance. Include code examples in code nodes and comparison tables for library options. Go as deep as needed to be comprehensive."

See `AI_PROMPT.md` for more guidance on working with AI assistants.

---

## Additional Resources

- **Constants:** See `src/constants.js` for default sizes and limits
- **Examples:** Use "Save" from the UI to see generated JSON
- **Validation:** See `src/fileOperations.js` for validation logic

---

**Happy Diagramming!** 🎨

For questions or issues, visit: https://github.com/anthropics/claude-code/issues
