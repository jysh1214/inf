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

The build system concatenates JavaScript files in a specific dependency order (defined in `build.py:34-45`):

1. `constants.js` - Global constants (version, sizes, thresholds)
2. `state.js` - Global state variables and canvas initialization
3. `autoSave.js` - Auto-save/load to localStorage, canvas resizing
4. `uiHelpers.js` - UI helper functions and status updates
5. `fileOperations.js` - JSON save/load with validation
6. `nodeManager.js` - Node creation, hit detection, resize corner detection
7. `connectionManager.js` - Connection creation and hit detection
8. `renderer.js` - Canvas rendering for all node types and connections
9. `eventHandlers.js` - Mouse and keyboard event listeners
10. `main.js` - Initialization code

**Critical**: When adding new JavaScript files or modifying dependencies between files, update the `js_files` array in `build.py` to maintain the correct load order.

### State Management

Global state is managed through variables in `state.js`. Key state includes:
- `nodes` array - All diagram nodes
- `connections` array - All connections between nodes
- `nodeMap` Map - Performance lookup for nodes by ID
- `selectedNode`, `editingNode`, `hoveredNode` - Current interaction state
- `isDragging`, `isResizing`, `isPanning` - Interaction mode flags
- `connectionMode`, `connectionStart` - Connection creation state
- Canvas state: `canvasWidth`, `canvasHeight`, `zoom`

### Node System

Four node types are supported: `rectangle`, `circle`, `diamond`, `text`. Each type has different:
- Geometry representation (x/y/width/height for rectangles, x/y/radius for circles)
- Hit detection algorithms (`isPointInNode` in `nodeManager.js`)
- Rendering functions (`drawRectangleNode`, `drawCircleNode`, etc. in `renderer.js`)
- Resize handle positions and logic (`getResizeCorner` in `nodeManager.js`)

All nodes share common properties: `id`, `type`, `text`, `textAlign`.

### Connection System

Connections are directional or undirectional edges between nodes. The system:
- Prevents self-connections and duplicate connections (`createConnection` in `nodeManager.js`)
- Calculates edge points on node boundaries (`getNodeEdgePoint` in `renderer.js`)
- Uses distance-to-line-segment for hit detection (`distanceToLineSegment` in `connectionManager.js`)
- Renders arrowheads for directed connections

### File Operations

The app supports two storage mechanisms:

1. **Auto-save to localStorage**: Automatic debounced saves (1s delay) to localStorage with validation on load
2. **Manual JSON save/load**:
   - Uses File System Access API (Chrome/Edge) for native file picker
   - Falls back to prompt-based filename input and blob download for other browsers
   - Includes comprehensive validation with detailed error messages (`validateNode`, `validateConnection` in `fileOperations.js`)

### Validation System

The `check.py` script performs extensive validation:
- File existence and size checks
- HTML structure validation
- Placeholder replacement verification
- Module inclusion checks (all 10 JS files)
- CSS inclusion verification
- Constants and function presence checks
- Event listener verification
- DOM element presence checks
- Build timestamp validation
- Line count sanity checks
- Basic syntax error detection

Use this when debugging build issues or ensuring build integrity.

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
