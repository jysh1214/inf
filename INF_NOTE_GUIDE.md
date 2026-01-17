# Inf Diagram JSON Format Guide

This guide explains the JSON format for Inf diagrams, allowing you to create and edit diagrams programmatically or by hand.

## Table of Contents

- [Overview](#overview)
- [Top-Level Structure](#top-level-structure)
- [Node Types](#node-types)
- [Connections](#connections)
- [Subgraphs](#subgraphs)
- [Complete Examples](#complete-examples)
- [Validation Rules](#validation-rules)
- [Tips & Best Practices](#tips--best-practices)

---

## Overview

Inf diagrams are stored as JSON files with a well-defined structure. You can create these files manually or use the UI to generate them. The format supports:

- Four node types: rectangle, circle, diamond, and text
- Directed and undirected connections
- Hierarchical subgraphs (embedded or file-based)
- Customizable canvas size and zoom levels

---

## Top-Level Structure

Every Inf diagram JSON file has the following top-level fields:

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

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Format version (current: "1.0") |
| `nodes` | array | Yes | Array of node objects |
| `connections` | array | Yes | Array of connection objects |
| `nextId` | number | Yes | Next available ID for new nodes/connections |
| `canvasWidth` | number | Yes | Canvas width in pixels (1000-20000, default: 2000) |
| `canvasHeight` | number | Yes | Canvas height in pixels (1000-20000, default: 2000) |
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
| `type` | string | Yes | "rectangle", "circle", "diamond", "text" | Node shape |
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
- Can be nested infinitely deep

### File-Based Subgraphs

Reference an external JSON file by storing the filename as a string:

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
- Store the filename (string) in the `subgraph` property
- Must be a valid `.json` file
- File must contain a valid Inf diagram structure
- Useful for reusing diagrams across multiple projects
- Changes require manually saving the external file

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
- `nextId` is a positive number
- `canvasWidth` and `canvasHeight` are between 1000-20000
- `zoom` is between 0.1-3.0

### Node Validation

✅ **Valid:**
- `id` is a unique positive integer
- `type` is one of: "rectangle", "circle", "diamond", "text"
- `text` is a string (max 1000 characters)
- `textAlign` is one of: "left", "center", "right"
- Type-specific properties match the node type
- All dimension values are numbers ≥ minimum sizes

❌ **Invalid:**
- Duplicate node IDs
- Missing required properties
- Unknown node types
- Negative coordinates or dimensions
- Text longer than 1000 characters

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

### Subgraph Validation

✅ **Valid:**
- `null` or `undefined` (no subgraph)
- String ending with `.json` (file-based)
- Valid diagram object (embedded, recursively validated)

❌ **Invalid:**
- String not ending with `.json`
- Object missing required diagram fields
- Circular references (detected at runtime)

---

## Tips & Best Practices

### ID Management

- **Always increment `nextId`** to be higher than any existing node or connection ID
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
  "nextId": 6  // Must be > 5
}
```

### Canvas Sizing

- **Default:** 2000×2000 pixels is a good starting size
- **Minimum:** 1000×1000 pixels
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

---

## Additional Resources

- **Constants:** See `src/constants.js` for default sizes and limits
- **Examples:** Use "Save" from the UI to see generated JSON
- **Validation:** See `src/fileOperations.js` for validation logic

---

**Happy Diagramming!** 🎨

For questions or issues, visit: https://github.com/anthropics/claude-code/issues
