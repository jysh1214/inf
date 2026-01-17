# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inf is a web-based diagram note-taking application implemented as a single HTML file with vanilla JavaScript and HTML Canvas. It supports multiple node types (rectangles, circles, diamonds, and text blocks) with inline text editing, visual connection tools, and advanced interaction features like z-ordering, infinite canvas with scrolling, adjustable canvas size, and zoom controls.

## How to Run

**End Users**: Simply open `index.html` in a web browser (Chrome recommended). No installation needed.

**Developers**: Edit source files in `src/` directory, then run `python3 build.py` to rebuild `index.html`. Optionally run `python3 check.py` to validate the build, or use `python3 build.py --check` to build and validate in one command.

## Implementation Architecture

### Technology Stack
- **Source**: Modular JavaScript files in `src/` directory
- **Build**: Python script merges into single `index.html`
- **Distribution**: Single file with all HTML/CSS/JS embedded
- **Rendering**: HTML Canvas API for drawing nodes and arrows
- **File operations**: File System Access API for save location picker (Chrome/Edge), with fallback for other browsers
- **No dependencies**: Pure vanilla JavaScript (no frameworks)
- **Browser compatibility**: Chrome only (recommended and tested)

### Development Workflow

**Modular source** → **Build script** → **Validation** → **Single-file output**

1. Edit source files in `src/` directory
2. Run `python3 build.py` to generate `index.html`
3. (Optional) Run `python3 check.py` to validate the build
   - Or use `python3 build.py --check` to build and validate in one step
4. Open `index.html` in browser to test
5. Changes in `src/` automatically included on rebuild

### Build Scripts

**build.py** (~90 lines):
- Reads all source files from `src/` in dependency order
- Replaces placeholders (`<!-- CSS -->`, `<!-- JS -->`) in template
- Adds build timestamp comment
- Outputs complete `index.html`
- Usage:
  - `python3 build.py` - Build only
  - `python3 build.py --check` - Build and validate

**check.py** (~450 lines):
- Validates generated `index.html` for correctness
- 12 validation checks:
  1. File exists
  2. File size (50-100 KB)
  3. HTML structure (DOCTYPE, tags)
  4. No unreplaced placeholders
  5. All 10 modules included
  6. CSS included
  7. Constants defined
  8. Key functions present
  9. Event listeners set up
  10. DOM elements present
  11. Build timestamp
  12. No syntax errors
- Returns exit code 0 on success, 1 on failure
- Usage: `python3 check.py`

### File Structure

```
inf/
├── src/                      # Source files (for development)
│   ├── template.html         # HTML skeleton with placeholders
│   ├── styles.css            # All CSS styles
│   ├── constants.js          # Configuration constants (~23 lines)
│   ├── state.js              # Global state variables (~44 lines)
│   ├── autoSave.js           # Auto-save/load system (~138 lines)
│   ├── uiHelpers.js          # UI controls and helpers (~144 lines)
│   ├── fileOperations.js     # Save/load/export (~186 lines)
│   ├── nodeManager.js        # Node creation and management (~186 lines)
│   ├── connectionManager.js  # Connection utilities (~48 lines)
│   ├── renderer.js           # All drawing functions (~536 lines)
│   ├── eventHandlers.js      # Mouse/keyboard events (~487 lines)
│   └── main.js               # Initialization (~11 lines)
├── build.py                  # Python build script (~90 lines)
├── check.py                  # Python validation script (~450 lines)
├── index.html                # Generated output (single-file app)
├── index.backup.html         # Backup of original monolithic file
├── CLAUDE.md                 # Development documentation
└── README.md                 # Build instructions
```

**Benefits of modular structure:**
- ✅ Maintainability: 10 files of ~50-536 lines each (vs 1 file of 2,059 lines)
- ✅ Discoverability: Clear file names indicate responsibility
- ✅ Collaboration: Easier to work on separate features in parallel
- ✅ Single-file output: Users still get simple "just open it" experience
- ✅ No npm dependency: Just Python (usually pre-installed)

**Build process:**
1. `build.py` reads all source files from `src/` directory
2. Replaces `<!-- CSS -->` placeholder with `styles.css` content
3. Replaces `<!-- JS -->` placeholder with concatenated JavaScript files
4. Adds build timestamp comment
5. Writes complete `index.html` file
6. (Optional) `check.py` validates the build output with 12 checks

### Layout Architecture

The application uses a **horizontal flexbox layout** for clean separation of toolbar and canvas:

```html
<div id="app-layout">              <!-- Horizontal flexbox container -->
  <div id="sidebar">               <!-- Left sidebar: 320px fixed width -->
    <div id="controls">            <!-- Toolbar: flex: 1 (fills height) -->
      [All toolbar buttons...]
    </div>
    <div id="status">Ready</div>   <!-- Status bar: flex: 0 0 auto (sticky footer) -->
  </div>
  <div id="canvas-container">      <!-- Right canvas: flex: 1 (fills remaining width) -->
    <canvas id="canvas"></canvas>
  </div>
</div>
```

**Key CSS Properties:**
- `#app-layout`: `display: flex; flex-direction: row; width: 100vw; height: 100vh;`
- `#sidebar`: `flex: 0 0 320px; display: flex; flex-direction: column;`
- `#controls`: `position: static; flex: 1;` (no longer absolutely positioned)
- `#status`: `position: static; flex: 0 0 auto;` (sticky footer in sidebar)
- `#canvas-container`: `flex: 1; position: relative;` (fills remaining space)

This approach eliminates overlapping elements and provides clear visual separation between the toolbar and canvas areas.

### Core Data Structures

```javascript
// Rectangle Node
{
  id: unique_id,
  type: 'rectangle',
  x, y: top-left position,
  width, height: dimensions,
  text: string content (max 1000 chars),
  textAlign: 'left' | 'center' | 'right' (default: 'center')
}

// Circle Node
{
  id: unique_id,
  type: 'circle',
  x, y: center position,
  radius: size,
  text: string content (max 1000 chars),
  textAlign: 'left' | 'center' | 'right' (default: 'center')
}

// Diamond Node
{
  id: unique_id,
  type: 'diamond',
  x, y: top-left position of bounding box,
  width, height: dimensions,
  text: string content (max 1000 chars),
  textAlign: 'left' | 'center' | 'right' (default: 'center')
}

// Text Block Node (no visible border)
{
  id: unique_id,
  type: 'text',
  x, y: top-left position,
  width, height: dimensions for hit detection,
  text: string content (max 1000 chars),
  textAlign: 'left' | 'center' | 'right' (default: 'center')
}

// Connection/arrow
{
  id: unique_id,
  fromId: source node id,
  toId: target node id,
  directed: boolean (true for arrows, false for lines)
}
```

### Constants (src/constants.js)

All magic numbers are extracted as constants for easy configuration:

```javascript
const HANDLE_SIZE = 8;                    // Resize handle size in pixels
const CONNECTION_THRESHOLD = 8;           // Click tolerance for connection lines
const MIN_NODE_SIZE = 40;                 // Minimum node dimensions
const DEFAULT_CIRCLE_RADIUS = 50;         // Default circle radius
const DEFAULT_DIAMOND_SIZE = 100;         // Default diamond width/height
const DEFAULT_RECTANGLE_WIDTH = 120;      // Default rectangle width
const DEFAULT_RECTANGLE_HEIGHT = 80;      // Default rectangle height
const DEFAULT_TEXT_WIDTH = 150;           // Default text block width
const DEFAULT_TEXT_HEIGHT = 60;           // Default text block height
const ARROWHEAD_OFFSET = 3;              // Pullback distance for arrowhead visibility
const MAX_TEXT_LENGTH = 1000;            // Maximum characters per node
const CURSOR_BLINK_RATE = 500;           // Cursor blink interval in milliseconds
const LINE_HEIGHT = 18;                  // Line height for multi-line text
const CANVAS_SIZE_STEP = 500;            // Canvas size increase/decrease step (pixels)
const MIN_CANVAS_SIZE = 1000;            // Minimum canvas size (pixels)
const MAX_CANVAS_SIZE = 20000;           // Maximum canvas size (pixels)
const DEFAULT_CANVAS_WIDTH = 2000;       // Default canvas width (pixels)
const DEFAULT_CANVAS_HEIGHT = 2000;      // Default canvas height (pixels)
const ZOOM_STEP = 0.1;                   // Zoom in/out step (10%)
const MIN_ZOOM = 0.1;                    // Minimum zoom level (10%)
const MAX_ZOOM = 3.0;                    // Maximum zoom level (300%)
```

### State Management

**Global state variables** (src/state.js):
- `canvasWidth` - Current canvas width in pixels (default: 2000)
- `canvasHeight` - Current canvas height in pixels (default: 2000)
- `zoom` - Current zoom level (default: 1.0 = 100%)
- `nodes[]` - Array of all node objects (order determines z-index)
- `connections[]` - Array of all connection objects
- `selectedNode` - Currently selected node (or null)
- `selectedConnection` - Currently selected connection (or null)
- `hoveredNode` - Node under mouse cursor
- `connectionMode` - Boolean indicating if in connection creation mode
- `connectionStart` - Node where connection starts (when in connection mode)
- `directedMode` - Boolean for arrow vs line connections
- `currentNodeType` - String: 'rectangle', 'circle', 'diamond', or 'text'
- `currentTextAlign` - String: 'left', 'center', or 'right' (default for new nodes)
- `editingNode` - Node currently being edited (inline text editing)
- `copiedNode` - Node copied to clipboard for paste operation

**Interaction state** (src/state.js):
- `isDragging` - Boolean for node drag operation
- `isResizing` - Boolean for resize operation
- `resizeCorner` - String identifier for which handle is being dragged
- `dragOffset` - Object {x, y} storing drag offset from node origin
- `isPanning` - Boolean for canvas panning operation
- `panStart` - Object {x, y} storing mouse position when panning started
- `scrollStart` - Object {x, y} storing container scroll position when panning started

**Performance optimizations** (src/state.js):
- `nodeMap` - Map<id, node> for O(1) node lookups

**Auto-save state** (src/state.js):
- `autoSaveTimer` - Timer for debounced auto-save (1 second delay)
- `autoSaveStatusTimer` - Timer for auto-save status message
- `AUTO_SAVE_DELAY` - Constant: 1000ms delay before auto-save triggers

**Cursor blink state** (src/state.js, src/autoSave.js):
- `cursorVisible` - Boolean for cursor visibility in blink cycle
- `cursorBlinkInterval` - Timer for cursor blink animation (500ms interval)
- `startCursorBlink()` - Starts cursor blinking animation, only renders if editingNode exists (src/autoSave.js)
- `stopCursorBlink()` - Stops cursor blinking and clears interval (src/autoSave.js)

### Key Functions

**Canvas Setup** (src/autoSave.js, src/renderer.js):
- `resizeCanvas()` - Updates canvas dimensions to custom size (canvasWidth x canvasHeight) (src/autoSave.js)
- Canvas wrapped in scrollable container for navigation
- `getMousePos(e)` - Helper function to get mouse coordinates accounting for zoom and scroll offset (src/renderer.js)

**Auto-save Functions** (src/autoSave.js):
- `triggerAutoSave()` - Debounces auto-save with 1 second delay
- `autoSave()` - Saves to localStorage with error handling
  - Shows "✓ Auto-saved" status for 2 seconds
  - Handles QuotaExceededError with user-visible message
  - Saves: nodes, connections, nextId, canvasWidth, canvasHeight, zoom, timestamp
- `autoLoad()` - Loads from localStorage on startup
  - Validates data structure and node properties
  - Type-specific validation (circles need radius, etc.)
  - Restores canvas size and zoom level if saved
  - Rebuilds nodeMap after loading
  - Shows "Restored X nodes from auto-save" status

**UI Helper Functions** (src/uiHelpers.js):
- `setStatus(text)` - Updates status bar text
- `setNodeType(type)` - Changes current node type and updates UI
- `updateAlignmentButtons(align)` - Helper to update alignment button states
- `setTextAlign(align)` - Changes text alignment
  - Updates `currentTextAlign` (default for new nodes)
  - If node selected: updates that node's `textAlign` and re-renders
  - Uses `updateAlignmentButtons()` helper
  - Shows status: "Text alignment: {align}" or "Default text alignment: {align}"
  - Triggers auto-save when changing node alignment
- `increaseCanvasSize()` - Increases canvas size by 500px (up to 20000x20000)
- `decreaseCanvasSize()` - Decreases canvas size by 500px (down to 1000x1000)
- `zoomIn()` - Increases zoom by 10% (up to 300%)
- `zoomOut()` - Decreases zoom by 10% (down to 10%)
- `setConnectionType(directed)` - Starts/switches connection mode
  - If already in connection mode: switches type
  - If node selected: starts connection mode
  - If no node: shows error message
- `clearConnectionButtons()` - Resets connection button states
- `clearCanvas()` - Clears all nodes, connections, and auto-save with confirmation

**File Operations** (src/615-807):
- `saveToJSON()` - Saves diagram to JSON file (async)
  - Uses File System Access API in Chrome/Edge (lets user choose save location)
  - Falls back to download prompt in other browsers
  - Prompts for filename with timestamp default
  - Sanitizes filename (removes invalid characters: `< > : " / \ | ? *`)
  - Creates downloadable blob with formatted JSON
  - Saves: version, nodes, connections, nextId, canvasWidth, canvasHeight, zoom
  - Enhanced error handling: specific messages for AbortError, SecurityError, NotAllowedError
- `loadFromJSON(event)` - Loads diagram from JSON file
  - Comprehensive JSON validation with detailed error messages:
    - JSON parsing errors (malformed JSON)
    - Missing or invalid top-level structure (null, undefined, non-object)
    - Null/undefined element detection in arrays
    - Node validation:
      - Required fields: id (positive integer), type (string), x (number), y (number)
      - Robust null/undefined checks for all fields
      - NaN/Infinity rejection for numeric fields
      - Valid node types: rectangle, circle, diamond, text
      - Type-specific fields: radius for circles, width/height for others
      - Dimension range validation: 1-10000 pixels
      - Optional fields: text (string), textAlign (left/center/right)
    - Connection validation:
      - Required fields: id (positive integer), fromId (integer), toId (integer), directed (boolean)
      - Null/undefined checks for all fields
      - Integer validation for all IDs
      - Valid node references (fromId/toId point to existing nodes)
    - Duplicate ID detection (both nodes and connections)
    - Canvas size validation: 1000-20000px, rejects NaN/Infinity
    - Zoom validation: 0.1-3.0, rejects NaN/Infinity
    - nextId validation: must be positive integer if present
  - Calculates nextId safely (handles empty arrays)
  - Restores canvas size and zoom level if saved
  - Rebuilds nodeMap after loading
  - Resets all interaction state
  - Triggers auto-save after successful load
  - Helper functions: isValidNumber(), isValidId(), validateNode(), validateConnection()
- `exportToPNG()` - Exports canvas as PNG image (async)
  - Uses File System Access API in Chrome/Edge (lets user choose save location)
  - Falls back to download prompt in other browsers
  - Warns if canvas is empty
  - Prompts for filename with timestamp default (fallback mode)
  - Sanitizes filename (removes invalid characters: `< > : " / \ | ? *`)
  - Temporarily sets zoom to 1.0 (100%) for export, then restores original zoom
  - Uses canvas.toBlob() for high-quality export
  - Enhanced error handling: specific messages for AbortError, SecurityError, NotAllowedError

**Validation Helper Functions** (src/fileOperations.js):
- `isValidNumber(value)` - Robust numeric validation
  - Returns true only if value is a number AND not NaN AND finite
  - Rejects: NaN, Infinity, -Infinity, null, undefined, strings, objects
  - Used for: x, y, width, height, radius, canvasWidth, canvasHeight, zoom
  - Example: `isValidNumber(5)` → true, `isValidNumber(NaN)` → false
- `isValidId(value)` - Integer ID validation
  - Returns true only if value is a valid number AND an integer AND positive
  - Rejects: floats (1.5), zero, negative numbers, NaN, Infinity, null
  - Used for: all node IDs, connection IDs, fromId, toId, nextId
  - Example: `isValidId(5)` → true, `isValidId(5.5)` → false, `isValidId(0)` → false
- `validateNode(node, index)` - Comprehensive node validation
  - Checks node is an object (not null, undefined, or primitive)
  - Validates all required fields with robust null/undefined/NaN checks
  - Validates node type against whitelist: rectangle, circle, diamond, text
  - Type-specific validation: radius for circles, width/height for others
  - Range validation: dimensions must be 1-10000 pixels
  - Optional field validation: text (string), textAlign (left/center/right)
  - Throws descriptive errors with node index and field names
- `validateConnection(conn, index, nodeIds)` - Comprehensive connection validation
  - Checks connection is an object (not null, undefined, or primitive)
  - Validates all required fields with robust null/undefined checks
  - Validates all IDs are positive integers
  - Validates directed is boolean (not truthy/falsy values)
  - Cross-references fromId/toId against Set of valid node IDs
  - Throws descriptive errors with connection index and field names

**Node Management** (src/809-856):
- `createNode(x, y, type)` - Creates new node of specified type at position
  - Rectangle: centered at position
  - Circle: center at position
  - Diamond: centered at position
  - Text: centered at position
  - Sets `textAlign` property to `currentTextAlign`
  - Adds node to nodeMap for O(1) lookup
- `createConnection(fromId, toId)` - Creates new connection
  - Prevents self-connections
  - Prevents duplicate connections
  - Returns null if invalid
- `isPointInNode(x, y, node)` - Shape-specific hit detection
  - Circle: distance from center <= radius
  - Diamond: point-in-polygon algorithm
  - Rectangle/Text: rectangular bounds check
- `getNodeAtPoint(x, y)` - Returns topmost node at point (or null)
- `getResizeCorner(x, y, node)` - Detects resize handle at point
  - Circle: 8 handles (named 'circle-0' through 'circle-7')
  - Diamond: 4 handles (named 'n', 'e', 's', 'w')
  - Rectangle/Text: 4 handles (named 'nw', 'ne', 'sw', 'se')

**Connection Management** (src/976-1022):
- `distanceToLineSegment(px, py, x1, y1, x2, y2)` - Point-to-line distance
- `getConnectionAtPoint(x, y)` - Hit detection for connections
  - Uses nodeMap for O(1) lookups
  - 8px click threshold
  - Checks actual edge-to-edge line segments

**Rendering** (src/1008-1278):
- `render()` - Main render loop, clears and redraws everything
- `drawNode(node)` - Dispatcher function calling type-specific draw functions
- `drawRectangleNode(node, isSelected)` - Draws rectangle with fill, border, text, handles
  - Edit mode indication: yellow fill (#fff9c4) and orange border (#ffa000) with 3px width
- `drawCircleNode(node, isSelected)` - Draws circle with 8 radial resize handles
  - Edit mode indication: yellow fill and orange border
- `drawDiamondNode(node, isSelected)` - Draws diamond shape with 4 cardinal point handles
  - Edit mode indication: yellow fill and orange border
- `drawTextNode(node, isSelected)` - Draws text only (no border, dashed selection outline)
  - Edit mode indication: orange dashed border with 2px width
- `drawNodeText(node, centerX, centerY, maxWidth)` - Text rendering (src/1172-1294)
  - Respects node's `textAlign` property ('left', 'center', or 'right')
  - Calculates text x-position based on alignment with 8px padding:
    - Left: `centerX - maxWidth / 2 + 8px` (text starts at left edge with padding)
    - Center: `centerX` (text centered, no padding)
    - Right: `centerX + maxWidth / 2 - 8px` (text ends at right edge with padding)
  - Cursor position calculated based on alignment:
    - Left: At end of text
    - Center: At center + half text width
    - Right: At text end position (fixed bug)
  - Canvas clipping applied to prevent text overflow outside node bounds
  - Word wrapping with long word breaking
  - Multi-line support (newlines split text into paragraphs)
  - Blinking cursor at end of last line when editing (500ms blink rate)
  - Text rendering order: split by '\n', then word-wrap each paragraph
  - Context save/restore for clipping region
- `drawResizeHandles(corners)` - Draws blue squares at handle positions
- `drawArrow(x1, y1, x2, y2, directed, isSelected)` - Draws line with optional arrowhead
- `drawConnection(conn)` - Draws edge-to-edge connections
  - Calculates start and end points on node edges
  - Applies ARROWHEAD_OFFSET for directed connections (arrowhead visibility)
  - Uses nodeMap for O(1) lookups
- `getNodeEdgePoint(fromX, fromY, toNode)` - Calculates edge intersection point
  - Circle: Point on circumference at angle toward source
  - Diamond: Line intersection with diamond edges
  - Rectangle/Text: Intersection with rectangle edges based on angle
- `lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4)` - Line segment intersection
- `getNodeCenter(node)` - Gets center point for any node type

**Event Handlers**:
- **Double-click** (src/1563-1606): Create/edit nodes, enters inline edit mode
  - Updates text alignment buttons using `updateAlignmentButtons()` helper
  - For new nodes: shows default alignment (currentTextAlign) and triggers auto-save
  - For existing nodes: shows that node's textAlign property
- **Mouse down** (src/1608-1747): Selection, connection completion, drag/resize start, canvas panning
  - Updates text alignment buttons when selecting a node
  - Resets to default alignment buttons when deselecting
  - Triggers auto-save when completing connection
  - Triggers auto-save when exiting edit mode by clicking outside
  - Z-ordering: Selected nodes move to front of render order
  - Connection mode behavior: Clicking different node switches connection start
  - Visual feedback for invalid connections (flash + warning)
  - **Canvas panning**: Clicking empty canvas starts panning (disabled in connection/edit mode)
- **Mouse move** (src/1749-1868): Hover effects, drag, resize, canvas panning
  - **Canvas panning**: Updates scroll position during pan (uses screen-space deltas)
  - Applies bounds checking during node drag
  - Conditional rendering (only when hover changes or in connection mode)
  - Type-specific cursors for resize handles
  - Cursor feedback: grab (default), grabbing (panning), move (over node)
- **Mouse up** (src/1870-1885): Ends drag/resize/panning operations
  - Triggers auto-save if was dragging or resizing (not for panning)
  - Resets cursor to 'grab' after operations complete
- **Keyboard** (src/1887-2047): Text editing and shortcuts
  - Focus check: Only handles shortcuts when body/canvas has focus
  - Text editing filters: Excludes Alt, Tab, Ctrl, Meta keys
  - Max length enforcement: 1000 character limit with visual feedback
  - Immediate rendering on input (lines 1928, 1910, 1933)
  - **Auto-save triggers**: On text input, Enter, Backspace, Shift+Enter, Esc
  - Escape in connection mode: Resets cursor to default
  - Delete: Clears editingNode reference if deleting edited node, triggers auto-save

### UI Components

**Node Type Toolbar** (src/198-206):
- 4 buttons in 2x2 grid: Rectangle, Circle, Diamond, Text
- Active button highlighted in blue
- `setNodeType(type)` function updates state and UI

**Text Alignment Toolbar** (src/210-214):
- 3 buttons in horizontal layout: L (left), C (center), R (right)
- Active button highlighted in blue (default: center)
- `setTextAlign(align)` function updates state and UI
- When no node selected: sets default alignment for new nodes
- When node selected: changes that node's alignment immediately and triggers auto-save
- Buttons automatically update to show selected node's alignment using `updateAlignmentButtons()` helper
- Revert to default alignment when node is deselected

**Canvas Size Toolbar** (src/218-222):
- 2 buttons in grid layout: "Larger +" and "Smaller −"
- Larger: Increases canvas size by 500px (up to 20000x20000)
- Smaller: Decreases canvas size by 500px (down to 1000x1000)
- Status bar shows current canvas size when changed
- Canvas wrapped in scrollable container for navigation

**Zoom Toolbar** (src/226-230):
- 2 buttons in grid layout: "Zoom In +" and "Zoom Out −"
- Zoom In: Increases zoom by 10% (up to 300%)
- Zoom Out: Decreases zoom by 10% (down to 10%)
- Status bar shows current zoom percentage when changed
- Mouse coordinates automatically adjusted for zoom level

**Connection Type Toolbar** (src/234-238):
- 2 buttons: "Directed →" and "Undirected —"
- Buttons only activate when connection mode starts
- Can switch between types while in connection mode
- Automatically deactivate after connection completes or is cancelled
- No flash when clicking without a node selected

**File Operations Toolbar** (src/243-247):
- 3 buttons in grid layout: Save, Load, Export
- Save: Opens file picker to choose location (Chrome/Edge) or downloads to Downloads folder (includes canvas size and zoom)
- Load: Opens file picker to load JSON diagram (restores canvas size and zoom)
- Export: Opens file picker to choose location (Chrome/Edge) or downloads to Downloads folder (always at 100% zoom)
- All filenames are sanitized to remove invalid characters

**Clear Canvas Button** (src/250):
- Single button below file operations toolbar
- Prompts for confirmation before clearing

**Status Bar** (src/252):
- Shows current mode and feedback messages
- Located at bottom of sidebar (sticky footer)
- Displays warnings with emoji (e.g., ⚠️ for invalid connections)

## Implemented Features

1. **Auto-save**: Work is automatically saved to localStorage
   - Saves 1 second after any change
   - Shows "✓ Auto-saved" status briefly
   - Automatically restored on page refresh
   - Saves canvas size and zoom level
   - Protected against storage quota errors
2. **Create nodes**: Double-click empty canvas, automatically enters edit mode
3. **Choose node type**: Click node type button (Rectangle/Circle/Diamond/Text) before creating
4. **Set text alignment**: Click alignment button (L/C/R) to set default for new nodes or change selected node's alignment
5. **Inline text editing**: Double-click existing node or create new node, type directly
   - Type to add text (max 1000 characters with warning when limit reached)
   - **Multi-line support**: Press Enter to add new lines
   - Backspace to delete characters (shows character counter when <50 remaining)
   - **Shift+Enter** to finish editing (alternative to clicking outside)
   - Esc to cancel editing
   - Click outside node to finish editing
   - **Visual feedback**: Yellow fill and orange border while editing
   - **Blinking cursor** at end of last line (500ms rate)
   - **Text clipping**: Text automatically clipped to node boundaries
   - **Text alignment**: Respects node's alignment setting (left/center/right with 8px padding)
   - Filters Alt, Tab, Ctrl, Meta keys
   - Supports all printable characters including Shift combinations
   - **Auto-save**: Triggers on text input, Enter, Backspace, and exit
6. **Adjustable canvas size**: Buttons to increase/decrease canvas size
   - Click "Larger +" to increase by 500px (up to 20000x20000)
   - Click "Smaller −" to decrease by 500px (down to 1000x1000)
   - Canvas wrapped in scrollable container for navigation
   - Infinite canvas - nodes can be placed anywhere
   - Canvas size saved in auto-save and JSON files
7. **Zoom controls**: Buttons to zoom in/out
   - Click "Zoom In +" to increase zoom by 10% (up to 300%)
   - Click "Zoom Out −" to decrease zoom by 10% (down to 10%)
   - Mouse coordinates automatically adjusted for zoom level
   - Zoom level saved in auto-save and JSON files
   - PNG exports always use 100% zoom for consistency
8. **Move nodes**: Click and drag node body (disabled while editing)
   - No bounds checking - infinite canvas
   - Z-ordering: Selected nodes move to front
   - **Auto-save**: Triggers after drag completes
9. **Pan canvas**: Click and drag empty canvas background to navigate
   - Natural "grab and drag" feel with grab/grabbing cursor
   - Disabled during connection mode or text editing
   - Works smoothly at all zoom levels
   - No auto-save triggered (only viewport changes, not data)
10. **Resize nodes**: Drag handles (works even while editing)
   - Rectangle/Text: 4 corner handles
   - Circle: 8 radial handles around circumference
   - Diamond: 4 cardinal point handles (N, E, S, W)
   - Minimum size enforcement (40px)
   - Type-specific cursors (ns-resize, ew-resize, nwse-resize, nesw-resize)
   - **Auto-save**: Triggers after resize completes
11. **Create connections**:
   - Select a node (click it)
   - Click "Directed →" or "Undirected —" button
   - Click target node to complete connection
   - Can switch connection type while in connection mode
   - Clicking different node switches connection start
   - Prevents self-connections and duplicates
   - Press Esc to cancel (cursor resets)
   - Visual feedback for invalid connections (flash + warning)
   - **Auto-save**: Triggers after connection created
12. **Edge-to-edge connections**: Lines connect at node boundaries, not centers
   - Arrowheads pulled back 3px for visibility
   - Works correctly for all node shape combinations
13. **Select connections**: Click on connection line (highlights in blue)
   - 8px click tolerance
14. **Delete items**: Select node or connection, press Delete/Backspace
   - Disabled while editing text
   - Clears editingNode reference if deleting edited node
   - Removes associated connections when deleting nodes
   - **Auto-save**: Triggers after deletion
15. **Save diagram**: Button to save as JSON file
   - **Chrome/Edge**: Shows native file picker to choose save location
   - **Other browsers**: Prompts for filename, saves to Downloads folder
   - Filename automatically sanitized (removes invalid characters)
   - Downloads with .json extension
   - Saves all nodes, connections, canvas size, zoom level, and state
16. **Load diagram**: Button to load JSON file
   - Opens file picker
   - Comprehensive validation with detailed error messages:
     - JSON format validation (detects malformed JSON)
     - Required field validation with null/undefined checks
     - Type validation (rejects NaN, Infinity, null for numeric fields)
     - ID validation (all IDs must be positive integers)
     - Node type validation (rectangle, circle, diamond, text)
     - Dimension range validation (1-10000 pixels for all node sizes)
     - Connection reference validation (ensures fromId/toId point to existing nodes)
     - Duplicate ID detection (both nodes and connections)
     - Range validation (canvas size: 1000-20000px, zoom: 0.1-3.0)
     - Null element detection in arrays
   - Restores canvas size and zoom level if saved
   - Triggers auto-save after loading
17. **Export diagram**: Button to export as PNG image
   - **Chrome/Edge**: Shows native file picker to choose save location
   - **Other browsers**: Prompts for filename, saves to Downloads folder
   - Warns if canvas is empty
   - Always exports at 100% zoom for consistency
   - High-quality canvas export
18. **Clear canvas**: Button at bottom of toolbar with confirmation
   - Clears auto-save data as well
19. **Z-ordering**: Selected nodes automatically move to front
20. **Copy/Paste nodes**: Ctrl+C to copy, Ctrl+V to paste
   - Pasted nodes offset by 20px to avoid overlapping

## User Interface

The application uses a **flexbox layout** with two main regions:

- **Left Sidebar (320px fixed width)**:
  - **Toolbar**: Node type selector, text alignment selector, canvas size controls, zoom controls, connection type selector, file operations (Save/Load/Export), clear button
  - **Status bar** (sticky footer): Shows current mode, feedback, canvas size, zoom level, and auto-save status ("✓ Auto-saved")
  - Scrollable if toolbar content exceeds viewport height
- **Right Canvas Area (fills remaining width)**:
  - **Scrollable canvas container**: Canvas wrapped in scrollable div for navigation of large canvases
  - No overlap with toolbar - clean separation
- **Canvas cursor**: Grab cursor by default, changes contextually
  - Grab cursor over empty canvas (ready to pan)
  - Grabbing cursor while panning
  - Move cursor over nodes
  - Resize cursors over handles (type-specific: nwse-resize, nesw-resize, ns-resize, ew-resize)
  - Crosshair cursor in connection mode
- **Visual feedback**:
  - Selected nodes highlighted in blue
  - **Editing nodes** highlighted with yellow fill (#fff9c4) and orange border (#ffa000)
  - Active node type button highlighted in blue
  - Active text alignment button highlighted in blue (shows selected node's alignment or default)
  - Connection type buttons highlight only during connection creation
  - Resize handles shown on selected nodes
  - Blinking cursor shown when editing text at end of last line (500ms rate)
  - Hover preview when creating connections (dashed line)
  - Shape-specific hover effects (circles show circular hover, diamonds show diamond hover)
  - Invalid connection feedback (flash + warning message)
  - Text limit feedback (warning message when limit reached, character counter at <50 remaining)
  - Auto-save status feedback ("✓ Auto-saved" shown for 2 seconds)
  - Storage quota error feedback (warns user to save manually)
  - Canvas size feedback (shows current dimensions when changed)
  - Zoom level feedback (shows current percentage when changed)

## Node Type Details

### Rectangle
- Standard rectangular node
- Position: (x, y) is top-left corner
- Resize: 4 corner handles, drag to adjust width/height
- Hit detection: Point-in-rectangle check
- Edge calculation: Intersection with rectangle edges based on angle
- Cursor: nwse-resize or nesw-resize depending on corner

### Circle
- Circular node
- Position: (x, y) is center
- Resize: 8 handles around circumference (N, NE, E, SE, S, SW, W, NW)
- Resizing adjusts radius, center stays fixed
- Hit detection: Distance from center <= radius
- Edge calculation: Point on circumference at angle toward source
- Hover effect: Circular dashed outline
- Cursor: nwse-resize for all handles

### Diamond
- Diamond/rhombus shaped node
- Position: (x, y) is top-left of bounding box
- Resize: 4 handles at diamond points (top, right, bottom, left)
- Resizing adjusts width/height symmetrically from center
- Hit detection: Point-in-polygon algorithm with 4 vertices
- Edge calculation: Line intersection with diamond's 4 edges
- Hover effect: Diamond-shaped dashed outline
- Cursor: ns-resize (N/S) or ew-resize (E/W)

### Text Block
- Transparent node with no visible border
- Position: (x, y) is top-left of text bounding box
- Resize: 4 corner handles (only visible when selected)
- When selected, shows dashed outline for positioning
- Hit detection: Point-in-rectangle check
- Edge calculation: Same as rectangle
- Purpose: Free-floating text labels without visual container
- Cursor: nwse-resize or nesw-resize depending on corner

## Text Alignment

Text alignment can be set globally (default for new nodes) or per-node:

**Setting alignment**:
- Click L/C/R buttons when no node selected: Sets default for new nodes
- Click L/C/R buttons when node selected: Changes that node's alignment immediately

**How alignment works**:
- **Left**: Text starts at left edge of text area, cursor at end of text
- **Center**: Text centered in text area, cursor at center + half text width
- **Right**: Text ends at right edge of text area, cursor at end of text

**Button behavior**:
- When selecting a node: Buttons update to show that node's alignment
- When deselecting: Buttons revert to showing default alignment (`currentTextAlign`)
- Double-clicking to edit: Buttons update to show node's alignment

## Auto-Save and Persistence

**How it works**:
- Automatically saves to browser's localStorage every 1 second after changes
- On page load/refresh: Automatically restores previous state including canvas size and zoom
- Shows "✓ Auto-saved" status briefly when save occurs
- Handles storage quota errors gracefully with user warnings

**What triggers auto-save**:
- Creating, moving, resizing, deleting nodes
- Creating, deleting connections
- Text input (typing, Enter, Backspace)
- Finishing text editing (Shift+Enter, Esc, click outside)
- Changing text alignment of selected node
- Changing canvas size or zoom level
- Loading a JSON file

**Storage format**:
- Key: `inf-autosave` in localStorage
- Data: `{ version, nodes, connections, nextId, canvasWidth, canvasHeight, zoom, timestamp }`
- Validation on load: Checks data structure and node properties
- Canvas size and zoom restored if present in saved data

**Error handling**:
- QuotaExceededError: Shows "⚠️ Auto-save failed: Storage full. Please save manually."
- Invalid data: Logs warning and returns to fresh state

## Inline Text Editing

When `editingNode` is set (src/1895-1956):
- **Visual indication**: Node shows yellow fill and orange border
- **Cursor**: Blinking cursor at end of last line (500ms rate)
  - Position varies based on text alignment (left/center/right)
  - Right-aligned cursor correctly positioned at text end
- Keyboard input directly modifies `editingNode.text`
- **Multi-line support**: Enter key adds newline (\n) instead of finishing edit
- **Text limit**: 1000 characters max (enforced before adding)
  - Warning message shown when limit reached: "⚠️ Text limit reached (1000 characters max)"
  - Character counter shown when <50 characters remaining
- **Backspace**: Removes last character (checks length > 0)
  - Updates character counter after deletion
- **Shift+Enter**: Finishes editing (alternative to clicking outside)
- **Esc key**: Cancels editing
- **Text clipping**: Text automatically clipped to node boundaries (no overflow)
- Filters unwanted keys:
  - Alt/Option key combinations blocked
  - Tab key blocked
  - Ctrl/Meta key combinations passed through
  - All printable characters including Shift combinations allowed
- Normal shortcuts (Delete, Esc) disabled during editing
- **Dragging disabled** while editing (resizing still allowed)
- Clicking outside node completes editing
- Status bar shows: "Editing node #X - Click outside, press Esc, or Shift+Enter to finish"

## Performance Optimizations

1. **NodeMap for O(1) lookups** (src/319)
   - Map<id, node> replaces O(n) array searches
   - Used in `getConnectionAtPoint()` and `drawConnection()`
   - Synchronized with nodes array (create, delete, clear)

2. **Debounced auto-save** (src/354-360)
   - 1 second debounce prevents excessive localStorage writes
   - Only saves after user stops making changes

3. **Conditional rendering** (src/1863-1868)
   - Only renders when hover state changes or in connection mode
   - Reduces unnecessary full canvas redraws

4. **Optimized cursor blink** (src/332-343)
   - Only renders during blink if editingNode still exists
   - Prevents unnecessary renders after edit mode ends
   - Uses CURSOR_BLINK_RATE constant (500ms)

5. **Optimized text editing** (src/2003-2047)
   - Length checks before string operations
   - Early filtering of unwanted key combinations
   - Character counter only shown when <50 remaining
   - Immediate render on input for responsive typing

6. **Text clipping** (src/1184-1294)
   - Canvas clipping prevents expensive overflow calculations
   - Shape-specific clip regions (circle, diamond, rectangle)

7. **Zoom transform with coordinate adjustment** (src/1536-1561)
   - Mouse coordinates adjusted for zoom and scroll in one function
   - Efficient canvas scaling for zoom rendering

## Connection Behavior

**Starting connections**:
1. Select a node (click it)
2. Click "Directed →" or "Undirected —" button
3. Connection mode activates, button highlights

**While in connection mode**:
- Hover over target nodes to see preview (dashed line)
- Can switch between Directed/Undirected by clicking other button
- Can click a different node to switch connection start point
- Press Escape to cancel (cursor resets to default)

**Completing connections**:
- Click target node to create connection
- Connection mode ends automatically
- Button deactivates
- Success message in status bar

**Invalid connections**:
- Self-connections blocked
- Duplicate connections blocked
- Visual feedback: Brief flash + warning message "⚠️ Connection already exists"
- Connection mode remains active

**Edge-to-edge rendering**:
- Lines start and end at node boundaries
- Works correctly for all shape combinations (circle-to-rectangle, etc.)
- Arrowheads pulled back 3px so they're visible outside target node

## Z-Ordering

Nodes are rendered in array order (last = on top). When a node is selected:
- It's moved to end of `nodes` array (src/1670)
- Automatically brings it to front
- All subsequent operations render it on top
- Order persists until another node is selected

## Infinite Canvas

The canvas is no longer bounded, allowing for unlimited workspace:
- Nodes can be placed anywhere without position constraints
- Canvas size adjustable from 1000x1000 to 20000x20000 pixels
- Scrollbars appear automatically when canvas exceeds window size
- Zoom controls (10%-300%) allow viewing at different scales
- Mouse coordinates automatically adjusted for both zoom and scroll offset
- Canvas size and zoom level persist across sessions

## Extensibility

The codebase uses a node-based architecture where nodes have a `type` field. Four types are implemented: 'rectangle', 'circle', 'diamond', and 'text'.

**To add a new node type:**
1. Add constant for default size (src/268-289)
2. Add button to toolbar HTML (src/198-206)
3. Update `createNode()` to handle new type (src/809-856)
   - Add to nodeMap
   - Return appropriate data structure
4. Create new `draw[Type]Node()` function (similar to src/1045-1170)
5. Add case to `drawNode()` dispatcher (src/1025-1043)
6. Update `isPointInNode()` for shape-specific hit detection (src/867-904)
7. Update `getNodeEdgePoint()` for shape-specific edge calculations (src/1337-1409)
8. Update `getResizeCorner()` for shape-specific handles (src/916-974)
9. Update resize logic in mousemove handler if needed (src/1773-1830)
10. Update hover effect in `render()` if needed (src/1516-1547)

## Known Limitations

**Not Yet Implemented:**
- No undo/redo (but has auto-save)
- No multi-select
- Connections are straight lines (no routing or curves)
- No styling options (colors, fonts, line styles, line width)
- Text editing is append-only (no cursor positioning within text, no selection)
- No alignment guides or snapping
- No font size controls
- No bold/italic/underline formatting
- No keyboard shortcuts for Save/Load/Export (Ctrl+S, etc.)

**Browser Compatibility:**
- Safari may have double-click issues (Chrome recommended)
- File System Access API (save location picker) available in Chrome/Edge only
  - Safari/Firefox use fallback download-to-Downloads-folder method

**Text Editing Limitations:**
- Max 1000 characters per node (enforced with visual feedback)
- No rich text formatting
- No text selection or cursor positioning (cursor always at end)
- Text clipped at node boundaries (no scrolling for overflow)

**Auto-Save Limitations:**
- Uses browser localStorage (limited to ~5-10MB)
- Only one auto-save slot (no history/versions)
- localStorage can be cleared by browser
- QuotaExceededError shows warning but doesn't prevent work loss if not manually saved

## Common Development Tasks

**When adding new features:**
1. Add constants near line 268
2. Add state variables near line 291
3. Add helper functions after line 464
4. Add rendering logic in appropriate draw function
5. Add event handlers after existing handlers (line 1563+)
6. Update toolbar HTML if adding UI controls (lines 195-251)
7. Add auto-save trigger if feature modifies data

**When debugging mouse interactions:**
- Check `getMousePos()` is being used (accounts for zoom and scroll offset)
- Verify hit detection thresholds (8px for handles and connections)
- Test in Chrome first before other browsers
- Remember that editing mode disables drag but not resize
- Check if zoom level is affecting coordinate calculations
- Verify z-ordering isn't causing selection issues
- Ensure scroll offset is properly accounted for

**When debugging performance:**
- Check if nodeMap is being used for node lookups
- Verify debouncing is working for auto-save
- Check if unnecessary renders are occurring
- Look for O(n²) operations in loops
- Monitor performance with large canvases and high zoom levels

**When adding new node types:**
- Start by adding constant for default size
- Modify `createNode()` to create the new type's data structure
- Create a dedicated `draw[Type]Node()` function
- Update all geometric functions to handle the new shape
- Consider how resize handles should work for the shape
- Test edge point calculations for connections with all other node types
- Add type-specific hover effect if needed
- Test interaction with zoom and coordinate transformation

**When modifying connection behavior:**
- Remember connections are edge-to-edge, not center-to-center
- Arrowheads use ARROWHEAD_OFFSET constant
- Check both `drawConnection()` and connection preview in `render()`
- Test with all node type combinations
- Verify hit detection matches actual line segment

**When debugging file operations and validation:**
- JSON validation errors show specific field and reason in status bar
- Check browser console for full error stack traces
- Common validation failures:
  - "must be a positive integer" → ID is float, zero, negative, NaN, or Infinity
  - "must be a valid number" → Value is NaN, Infinity, null, or non-numeric
  - "references non-existent node" → Connection has invalid fromId/toId
  - "duplicate IDs found" → Multiple nodes or connections share same ID
  - "too large (max: 10000)" → Node dimensions exceed maximum allowed size
- Use helper functions for custom validation:
  - `isValidNumber(value)` for numeric fields
  - `isValidId(value)` for ID fields
- Test with edge cases: null, undefined, NaN, Infinity, negative numbers, floats
- Validation happens before any data is loaded (all-or-nothing approach)

## File Structure

The codebase is organized into modular source files that are merged into a single `index.html` by the build script:

**Source Files** (src/ directory):

**HTML & CSS**:
- `src/template.html` (~83 lines): HTML skeleton with placeholders for CSS and JS
  - `#app-layout` flexbox container
  - `#sidebar` containing controls and status
  - `#canvas-container` with canvas element
  - All toolbar buttons (node types, alignment, canvas size, zoom, connections, file operations)
  - Hidden file input element
- `src/styles.css` (~183 lines): All CSS styles
  - Flexbox layout styles
  - Button and toolbar styles
  - Canvas and sidebar styling

**JavaScript Modules**:
- `src/constants.js` (~23 lines): Configuration constants
  - Canvas size, zoom, node defaults, UI constants
- `src/state.js` (~44 lines): Global state variables
  - Canvas state, nodes, connections, selection state
  - Interaction state (drag, resize, panning)
  - Performance optimization (nodeMap)
  - Auto-save and cursor blink state
- `src/autoSave.js` (~138 lines): Auto-save/load system
  - `startCursorBlink()`, `stopCursorBlink()` - Cursor animation
  - `triggerAutoSave()`, `autoSave()`, `autoLoad()` - Persistence
  - `resizeCanvas()` - Canvas dimension updates
- `src/uiHelpers.js` (~144 lines): UI controls and helpers
  - Button handlers (node type, alignment, canvas size, zoom)
  - Connection mode handlers
  - `clearCanvas()` - Reset functionality
- `src/fileOperations.js` (~448 lines): File I/O with comprehensive validation
  - `isValidNumber()`, `isValidId()` - Validation helper functions
  - `validateNode()`, `validateConnection()` - Comprehensive validation functions
  - `saveToJSON()`, `loadFromJSON()`, `exportToPNG()` - Import/export with error handling
- `src/nodeManager.js` (~186 lines): Node management
  - `createNode()`, `createConnection()` - Node/connection creation
  - `isPointInNode()`, `getNodeAtPoint()` - Hit detection
  - `getResizeCorner()` - Resize handle detection
- `src/connectionManager.js` (~48 lines): Connection utilities
  - `distanceToLineSegment()`, `getConnectionAtPoint()` - Connection hit testing
- `src/renderer.js` (~536 lines): All drawing functions
  - `render()` - Main render loop with zoom transform
  - `drawNode()`, `drawRectangleNode()`, `drawCircleNode()`, `drawDiamondNode()`, `drawTextNode()` - Node rendering
  - `drawNodeText()` - Text rendering with alignment and clipping
  - `drawConnection()`, `drawArrow()` - Connection rendering
  - `getNodeEdgePoint()`, `lineIntersection()` - Geometric calculations
  - `getMousePos()` - Mouse coordinate helper with zoom and scroll
- `src/eventHandlers.js` (~487 lines): Mouse/keyboard events
  - Canvas event listeners (dblclick, mousedown, mousemove, mouseup)
  - Keyboard event listener (text editing, shortcuts, copy/paste)
- `src/main.js` (~11 lines): Initialization
  - Initial canvas setup, auto-load, render

**Build Output**:
- `index.html` (~2,070 lines): Generated single-file application
  - Built by running `python3 build.py`
  - Contains all merged HTML, CSS, and JavaScript
  - Ready for distribution (no build step needed by end users)

**Build Process** (build.py ~80 lines):
- Reads source files in dependency order
- Replaces placeholders in template.html
- Adds build timestamp
- Outputs single index.html file

## Code Quality Notes

**Performance:**
- O(1) node lookups via nodeMap
- Debounced auto-save (1 second)
- Conditional rendering in mousemove
- Efficient zoom transform with coordinate adjustment
- No unused variables or dead code

**Error Handling:**
- Connection validation (no self-connections, no duplicates)
- Visual feedback for invalid operations
- Max text length prevents memory issues
- Storage quota error handling
- Canvas size and zoom validation
- File System Access API error handling (AbortError, SecurityError, NotAllowedError)
- Specific user-friendly error messages for file save/export failures
- Comprehensive JSON validation on load with robust checks:
  - Malformed JSON detection
  - Null/undefined checks for all required fields
  - NaN and Infinity rejection for all numeric fields
  - Type checking (numbers, strings, booleans, integers)
  - ID validation (all IDs must be positive integers)
  - Node type validation (rectangle, circle, diamond, text)
  - Dimension range validation (1-10000 pixels)
  - Connection reference validation (fromId/toId exist)
  - Duplicate ID detection (both nodes and connections)
  - Null element detection in arrays
  - Range validation for canvas size (1000-20000px) and zoom (0.1-3.0)
  - Helper functions: isValidNumber(), isValidId()

**Maintainability:**
- All magic numbers extracted as constants
- Type-specific functions with clear naming
- Comprehensive comments
- Consistent code style
- Single responsibility principle
- Clean separation of concerns

**User Experience:**
- Visual feedback for all actions
- Contextual cursor changes
- Clear status messages with emoji
- No UI flashing or glitches
- Keyboard shortcuts filtered appropriately
- Z-ordering feels natural
- Infinite canvas with scrollable navigation
- Zoom controls for flexible viewing
- Canvas size and zoom persistence
