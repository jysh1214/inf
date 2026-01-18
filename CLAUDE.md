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
6. `indexedDB.js` - IndexedDB operations for persistent FileSystemFileHandle storage
7. `fileOperations.js` - JSON save/load with validation, subgraph management
8. `nodeManager.js` - Node creation, hit detection, resize corner detection
9. `connectionManager.js` - Connection creation and hit detection
10. `renderer.js` - Canvas rendering for all node types and connections
11. `eventHandlers.js` - Mouse and keyboard event listeners
12. `main.js` - Initialization code

**Critical**: When adding new JavaScript files or modifying dependencies between files, update both the `js_files` array in `build.py` and the `expected_modules` list in `check.py` to maintain the correct load order. Currently 12 modules total.

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

**Connection Rendering (v1.2):**
The rendering approach ensures perfect alignment and no gaps:
1. **Edge point calculation**: Uses parametric line intersection to find where the center-to-center line intersects each node's boundary
   - Rectangle: Checks all 4 edges, returns closest intersection (smallest t parameter)
   - Circle: Calculates point on circumference along center-to-center direction
   - Diamond: Uses `lineIntersection()` helper to find exact edge intersections
2. **Arrow drawing**: Draws full line to border first, then arrowhead on top (no offset)
3. **Mathematical correctness**: Line equation is `Point = (fromX, fromY) + t * (dx, dy)` where t ∈ [0, 1]
   - Handles vertical/horizontal lines (checks `dx !== 0`, `dy !== 0` before division)
   - Handles overlapping nodes (finds exit intersection)
   - Handles zero-length connections (epsilon check: `|dx| < 0.001`)
   - Uses floating-point epsilon values (0.0001, 0.001) for comparisons

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
   - **File-based subgraphs**: Three-tier file access system
     - `fileHandleMap` (memory): Session-only cache for fast access
     - IndexedDB: Persistent FileSystemFileHandle storage (survives page reload)
     - Workspace folder: Directory-level permission for batch file access
   - **Workspace folder**: Users can authorize a folder via Directory Picker API (`selectWorkspaceFolder()`)
     - All files in authorized folder open automatically without file picker
     - Directory handle stored in IndexedDB (persists across reloads)
     - `findFileInDirectory()` searches workspace for subgraph files by filename
   - **Circular reference prevention**: Validates that embedded subgraphs don't create cycles via node ID path checking, and file-based subgraphs aren't already in the stack

4. **IndexedDB for Persistent Storage** (`indexedDB.js`):
   - Stores FileSystemFileHandle objects (can't use localStorage)
   - Stores FileSystemDirectoryHandle for workspace folder
   - DB_VERSION = 2 (v1: fileHandles, v2: added directoryHandle store)
   - Functions: `storeFileHandle()`, `getFileHandle()`, `deleteFileHandle()`, `storeDirectoryHandle()`, `getDirectoryHandle()`, `findFileInDirectory()`
   - Verifies permissions before using stored handles (`verifyPermission()`)
   - File access priority: memory cache → IndexedDB → workspace folder → file picker
   - **Singleton promise pattern**: Prevents race conditions during initialization
     - `dbPromise` variable tracks initialization in progress
     - If `db` exists, returns immediately
     - If `dbPromise` exists, waits for existing initialization
     - On failure, resets `dbPromise` to null to allow retry
   - **Error handling**: All functions wrapped in try/catch with graceful degradation
     - Returns null on failure to allow fallback to file picker
     - Detects QuotaExceededError with specific error messages
     - Non-critical operations (delete) log warnings instead of throwing

### Validation System

**Build Validation** (`check.py`):
- File existence and size checks
- HTML structure validation
- Placeholder replacement verification
- Module inclusion checks (all 12 JS files)
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
2. Apply zoom transform (`ctx.scale(zoom, zoom)`)
3. Draw all connections with edge point calculations
4. Draw connection preview if in connection mode (dashed green line)
5. Draw all nodes with type-specific rendering
6. Draw hover effects (dashed border around hovered node)
7. Restore transform

Visual states are indicated by colors and borders:
- Selected: blue border (`#2196f3`)
- Editing: yellow background (`#fff9c4`) and orange border (`#ffa000`)
- Hovered: dashed blue border (`#2196f3`), green in connection mode (`#4caf50`)
- Has subgraph: 4px thick border (normal, selected, or editing color)
- Connection selected: blue line and arrowhead (`#2196f3`, width 3)
- Connection normal: gray line and arrowhead (`#666`, width 2)

**Mouse coordinate transformation:**
- `getMousePos()` converts viewport coordinates to canvas coordinates
- Accounts for canvas position: `e.clientX - rect.left`
- Accounts for zoom: divide by `zoom` factor
- Does NOT account for scroll (getBoundingClientRect already viewport-relative)

**Performance note:** Rendering is O(n + m) where n = nodes, m = connections. No quadratic loops.

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
- **Prefer** File System Access API when available (`'showSaveFilePicker' in window`, `'showDirectoryPicker' in window`)
- **Fallback** to prompt-based input and blob downloads for unsupported browsers
- **IndexedDB persistence**: FileSystemFileHandle objects ARE stored in IndexedDB (not localStorage)
  - Handles persist across page reloads
  - Permission verification on retrieval (`verifyPermission()`)
  - Three-tier access: memory → IndexedDB → workspace → file picker

### Workspace Folder Strategy

**Recommended workflow** for file-based subgraphs:
1. User clicks "Set Folder" to authorize a workspace directory
2. All diagram files for a project live in that folder
3. Files in workspace open automatically (no picker prompts)
4. Directory permission persists across sessions (stored in IndexedDB)

**Implementation:**
- Use Directory Picker API (`showDirectoryPicker()`)
- Store `FileSystemDirectoryHandle` in IndexedDB
- Search workspace by filename using `dirHandle.getFileHandle(filename)`
- Falls back to individual file picker for files outside workspace
- Best UX: Minimal permission prompts, maximum automation

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

## Common Issues and Solutions

### Connection Rendering Issues

If connections don't touch node borders or have gaps:
1. Check `getNodeEdgePoint()` calculates intersections correctly
2. Verify parametric line math: `Point = from + t * (to - from)` where t > 0
3. Ensure edge bounds checking (x/y within rectangle/circle/diamond boundaries)
4. For rectangles, verify all 4 edges are checked and closest intersection is returned
5. Check epsilon values for floating-point comparisons (0.001 for distance, 0.0001 for line intersection)

### IndexedDB Issues

If file handles don't persist or errors occur:
1. Check DB_VERSION matches the schema (currently 2)
2. Verify singleton promise pattern prevents race conditions
3. Ensure all async operations have try/catch blocks
4. Check QuotaExceededError handling (browser storage limits)
5. Verify permission checks before using stored handles

### Mouse Position Issues

If clicks don't match visual positions:
1. Verify `getMousePos()` doesn't double-count scroll offset
2. Check getBoundingClientRect() is used (viewport-relative coordinates)
3. Ensure zoom transformation is applied correctly
4. Do NOT add `container.scrollLeft/Top` (rect is already adjusted for scroll)

## Version History

- **v1.2** (2026-01-18): Connection rendering fixes (arrowhead gaps, 45-degree angles, center-to-center alignment)
- **v1.1** (2026-01-17): Workspace folder permission, IndexedDB persistence, mouse position fix, race condition fix
- **v1.0** (2026-01-17): Initial major release with hierarchical subgraph navigation

## Documentation

- **INF_NOTE_GUIDE.md**: Comprehensive guide to the JSON format for users who want to write diagrams by hand
- **AI_PROMPT.md**: Concise prompt for AI assistants to create diagrams in Inf format
- **RELEASE_V*.md**: Detailed release notes for each version
- **CLAUDE.md**: This file - architectural guidance for Claude Code instances
