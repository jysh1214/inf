# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inf is a single-file canvas-based diagram note-taking application. The app uses vanilla JavaScript with HTML5 Canvas for rendering. The build system merges modular source files into a single `index.html` file for distribution.

## Build System

The project uses Python scripts to build and validate the final output:

```bash
# Build the application
python3 build.py

# Build and validate in one step
python3 build.py --check

# Validate existing build
python3 check.py
```

The build process:
1. Reads `src/template.html` as the base HTML structure
2. Injects CSS from `src/styles.css` into the `<!-- CSS -->` placeholder
3. Injects JavaScript files from `src/` in dependency order into the `<!-- JS -->` placeholder
4. Outputs a single `index.html` file (gitignored)

**Important**: The `index.html` file is generated and should never be edited directly. All changes must be made to source files in `src/`.

## Architecture

### JavaScript Module Loading Order

The build system concatenates JavaScript files in a specific dependency order (defined in `build.py:34-46`):

1. `constants.js` - Global constants (version, sizes, thresholds)
2. `state.js` - Global state variables and canvas initialization
3. `autoSave.js` - Auto-save/load to localStorage, canvas resizing
4. `uiHelpers.js` - UI helper functions and status updates
5. `ui.js` - Modal UI components (subgraph type selection)
6. `fileOperations.js` - JSON save/load with validation, subgraph management
7. `nodeManager.js` - Node creation, hit detection, resize corner detection
8. `connectionManager.js` - Connection creation and hit detection
9. `renderer.js` - Canvas rendering for all node types and connections
10. `eventHandlers.js` - Mouse and keyboard event listeners
11. `main.js` - Initialization code

**Critical**: When adding new JavaScript files or modifying dependencies between files, update both the `js_files` array in `build.py` and the `expected_modules` list in `check.py` to maintain the correct load order.

### State Management

Global state is managed through variables in `state.js`. Key state includes:

**Diagram Data:**
- `nodes` array - All diagram nodes
- `connections` array - All connections between nodes
- `nodeMap` Map - Performance lookup for nodes by ID
- `nextId` - Next available ID for nodes/connections

**Interaction State:**
- `selectedNode`, `editingNode`, `hoveredNode` - Current interaction state
- `isDragging`, `isResizing`, `isPanning` - Interaction mode flags
- `connectionMode`, `connectionStart` - Connection creation state

**Canvas State:**
- `canvasWidth`, `canvasHeight`, `zoom` - Canvas dimensions and zoom level

**Subgraph Navigation State:**
- `subgraphStack` array - Stack of parent states when navigating into subgraphs
- `currentDepth` number - Current nesting depth (0 = root level)
- `currentPath` array - Array of node IDs from root to current position
- `fileHandleMap` Map - Maps node IDs to FileSystemFileHandle objects for file-based subgraphs

### Node System

Four node types are supported: `rectangle`, `circle`, `diamond`, `text`. Each type has different:
- Geometry representation (x/y/width/height for rectangles, x/y/radius for circles)
- Hit detection algorithms (`isPointInNode` in `nodeManager.js`)
- Rendering functions (`drawRectangleNode`, `drawCircleNode`, etc. in `renderer.js`)
- Resize handle positions and logic (`getResizeCorner` in `nodeManager.js`)

All nodes share common properties: `id`, `type`, `text`, `textAlign`.

**Subgraph Support:** Nodes can optionally contain a `subgraph` property:
- **Embedded subgraphs**: `subgraph` is an object with full diagram structure (`{version, nodes, connections, nextId, ...}`)
- **File-based subgraphs**: `subgraph` is a string filename (e.g., `"external-system.json"`)
- Nodes with subgraphs are visually indicated by a 4px thick border
- Ctrl+Click on a node creates a new subgraph or enters an existing one
- The modal in `ui.js` prompts users to choose: Embedded, New File, or Load Existing

### Connection System

Connections are directional or undirectional edges between nodes. The system:
- Prevents self-connections and duplicate connections (`createConnection` in `nodeManager.js`)
- Calculates edge points on node boundaries (`getNodeEdgePoint` in `renderer.js`)
- Uses distance-to-line-segment for hit detection (`distanceToLineSegment` in `connectionManager.js`)
- Renders arrowheads for directed connections

### File Operations & Subgraph System

The app supports multiple storage mechanisms:

1. **Auto-save to localStorage**: Automatic debounced saves (1s delay) to localStorage with validation on load. Includes subgraph navigation state (stack, depth, path).

2. **Manual JSON save/load**:
   - Uses File System Access API (Chrome/Edge) for native file picker
   - Falls back to prompt-based filename input and blob download for other browsers
   - Includes comprehensive validation with detailed error messages (`validateNode`, `validateConnection`, `validateSubgraph` in `fileOperations.js`)

3. **Hierarchical Subgraph Navigation**:
   - **Creating subgraphs**: Ctrl+Click on a node opens a modal with three options (via `showSubgraphModal()` in `ui.js`)
   - **Entering subgraphs**: After creation or Ctrl+Click on nodes with subgraphs, calls `enterSubgraph()` which:
     - Saves current state to `subgraphStack`
     - Loads subgraph data (from embedded object or external file via File System Access API)
     - Updates `currentDepth` and `currentPath`
     - Validates against circular references
   - **Exiting subgraphs**: Escape key or "Back to Parent" button calls `exitSubgraph()` which:
     - Saves current subgraph changes (to parent node object or external file)
     - Pops from `subgraphStack` to restore parent state
     - Updates navigation breadcrumb
   - **File-based subgraphs**: FileSystemFileHandle objects are stored in `fileHandleMap` (session-only, not persisted to localStorage)
   - **Circular reference prevention**: Validates that embedded subgraphs don't create cycles via node ID path checking, and file-based subgraphs aren't already in the stack

### Validation System

**Build Validation** (`check.py`):
- File existence and size checks
- HTML structure validation
- Placeholder replacement verification
- Module inclusion checks (all 11 JS files)
- CSS inclusion verification
- Constants and function presence checks
- Event listener verification
- DOM element presence checks
- Build timestamp validation
- Line count sanity checks
- Basic syntax error detection

**Runtime Validation** (`fileOperations.js`):
- `validateNode()`: Checks node structure, required properties, type-specific geometry
- `validateConnection()`: Validates connection references, prevents self-connections
- `validateSubgraph()`: Recursively validates embedded subgraphs or file path format
- Circular reference detection for both embedded and file-based subgraphs
- JSON parsing with detailed error context (node index, property names)

## Code Patterns

### Adding New Node Types

To add a new node type:
1. Add default size constants to `constants.js`
2. Add creation logic to `createNode()` in `nodeManager.js`
3. Add hit detection to `isPointInNode()` in `nodeManager.js`
4. Add resize corner logic to `getResizeCorner()` in `nodeManager.js`
5. Add drawing function in `renderer.js` (e.g., `drawNewTypeNode()`)
6. Add case to `drawNode()` switch statement in `renderer.js`
7. Add button to `src/template.html` UI
8. Update validation in `fileOperations.js` if needed

### Adding New Global State

When adding new global state:
1. Declare in `state.js` at the top level
2. Include in save/load data objects in `autoSave.js` and `fileOperations.js`
3. Reset appropriately in `clearCanvas()` if needed

### Triggering Re-renders

Call `render()` after any state change that affects visual output. Call `triggerAutoSave()` after any state change that should be persisted.

## Canvas Rendering

The rendering pipeline (`render()` in `renderer.js`):
1. Clear canvas
2. Draw all connections with edge point calculations
3. Draw all nodes with type-specific rendering
4. Draw connection preview if in connection mode
5. Handle text editing cursor and selection

Visual states are indicated by colors and borders:
- Selected: blue border (`#2196f3`)
- Editing: yellow background (`#fff9c4`) and orange border (`#ffa000`)
- Hovered: visual feedback via cursor changes
- Has subgraph: 4px thick border (normal, selected, or editing color)

## Important Architecture Principles

### The Spirit of Infinity

The project name "Inf" reflects a core principle: **no artificial limits**. This manifests in:
- No maximum depth limit for subgraph nesting (intentionally infinite)
- Large canvas sizes supported (up to 20000×20000 pixels)
- No limit on node count (though performance may degrade with 1000+ nodes)

When implementing features, avoid adding arbitrary limits unless there's a technical necessity (like browser/canvas limitations).

### Modal UI Pattern

The modal system in `ui.js` provides a template for future UI components:
- Promise-based async API (`showSubgraphModal()` returns user choice)
- Overlay with blur backdrop for modern aesthetics
- Close on overlay click or Escape key (using `stopImmediatePropagation()` to prevent event conflicts)
- Smooth CSS animations (slide-in effect)
- Consistent styling with the rest of the app

### File System Access API Strategy

For file operations:
- **Prefer** File System Access API when available (`'showSaveFilePicker' in window`)
- **Fallback** to prompt-based input and blob downloads for unsupported browsers
- **Session-only** file handles: FileSystemFileHandle objects cannot be serialized to localStorage
- After page reload, prompt user to reselect files when needed

### Event Handler Priority

Multiple keydown listeners exist on `document`. When adding new global keyboard shortcuts:
- Check for conflicts in both `eventHandlers.js` and `ui.js`
- Use `stopImmediatePropagation()` (not just `stopPropagation()`) to prevent other listeners on the same element from firing
- Modal/overlay handlers should check visibility state before acting

## Key Interactions

### Ctrl+Click on Node
1. `eventHandlers.js` detects Ctrl/Cmd+Click
2. Calls `createNewSubgraph(node)` if node has no subgraph
3. Modal appears via `showSubgraphModal()` (Promise-based)
4. User selects: Embedded, New File, or Load Existing
5. For "Load Existing": File is read and validated immediately before linking
6. `enterSubgraph(node)` is called automatically after creation
7. Browser context menu is prevented via `stopPropagation()` and contextmenu handler

### Escape Key Priority
1. If modal is visible: `ui.js` closes modal and prevents propagation
2. If editing text: `eventHandlers.js` exits edit mode
3. If in connection mode: `eventHandlers.js` cancels connection
4. If in subgraph (depth > 0): `eventHandlers.js` exits to parent
5. Order matters - use `stopImmediatePropagation()` to prevent cascading

## Documentation

- **INF_NOTE_GUIDE.md**: Comprehensive guide to the JSON format for users who want to write diagrams by hand
- **CLAUDE.md**: This file - architectural guidance for Claude Code instances
