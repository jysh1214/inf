# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inf is a web-based diagram note-taking application implemented as a single HTML file with vanilla JavaScript and HTML Canvas. It supports multiple node types (rectangles, circles, diamonds, and text blocks) with inline text editing, visual connection tools, and advanced interaction features like z-ordering, infinite canvas with scrolling, adjustable canvas size, and zoom controls.

## How to Run

Simply open `index.html` in a web browser (Chrome recommended). No build step or dependencies required.

## Implementation Architecture

### Technology Stack
- **Single file**: `index.html` contains all HTML, CSS, and JavaScript
- **Rendering**: HTML Canvas API for drawing nodes and arrows
- **No dependencies**: Pure vanilla JavaScript
- **Browser compatibility**: Works best in Chrome; Safari may have double-click issues

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

### Constants (index.html:252-273)

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

**Global state variables** (index.html:275-290):
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

**Interaction state** (index.html:292-301):
- `isDragging` - Boolean for node drag operation
- `isResizing` - Boolean for resize operation
- `resizeCorner` - String identifier for which handle is being dragged
- `dragOffset` - Object {x, y} storing drag offset from node origin
- `isPanning` - Boolean for canvas panning operation
- `panStart` - Object {x, y} storing mouse position when panning started
- `scrollStart` - Object {x, y} storing container scroll position when panning started

**Performance optimizations** (index.html:298):
- `nodeMap` - Map<id, node> for O(1) node lookups

**Auto-save state** (index.html:300-303):
- `autoSaveTimer` - Timer for debounced auto-save (1 second delay)
- `autoSaveStatusTimer` - Timer for auto-save status message
- `AUTO_SAVE_DELAY` - Constant: 1000ms delay before auto-save triggers

**Cursor blink state** (index.html:305-334):
- `cursorVisible` - Boolean for cursor visibility in blink cycle
- `cursorBlinkInterval` - Timer for cursor blink animation (500ms interval)
- `startCursorBlink()` - Starts cursor blinking animation, only renders if editingNode exists
- `stopCursorBlink()` - Stops cursor blinking and clears interval

### Key Functions

**Canvas Setup** (index.html:443-450):
- `resizeCanvas()` - Updates canvas dimensions to custom size (canvasWidth x canvasHeight)
- Canvas wrapped in scrollable container for navigation
- `getMousePos(e)` - Helper function to get mouse coordinates accounting for zoom and scroll offset (index.html:1520-1528)

**Auto-save Functions** (index.html:336-441):
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

**UI Helper Functions** (index.html:452-598):
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

**File Operations** (index.html:599-791):
- `saveToJSON()` - Saves diagram to JSON file
  - Prompts for filename with timestamp default
  - Sanitizes filename (removes invalid characters: `< > : " / \ | ? *`)
  - Creates downloadable blob with formatted JSON
  - Saves: version, nodes, connections, nextId, canvasWidth, canvasHeight, zoom
- `loadFromJSON(event)` - Loads diagram from JSON file
  - Validates data structure
  - Calculates nextId safely (handles empty arrays)
  - Restores canvas size and zoom level if saved
  - Rebuilds nodeMap after loading
  - Resets all interaction state
  - Triggers auto-save after successful load
- `exportToPNG()` - Exports canvas as PNG image
  - Warns if canvas is empty
  - Prompts for filename with timestamp default
  - Sanitizes filename
  - Temporarily sets zoom to 1.0 (100%) for export, then restores original zoom
  - Uses canvas.toBlob() for high-quality export

**Node Management** (index.html:668-720):
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

**Connection Management** (index.html:473-550):
- `distanceToLineSegment(px, py, x1, y1, x2, y2)` - Point-to-line distance
- `getConnectionAtPoint(x, y)` - Hit detection for connections
  - Uses nodeMap for O(1) lookups
  - 8px click threshold
  - Checks actual edge-to-edge line segments

**Rendering** (index.html:590-1018):
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
- `drawNodeText(node, centerX, centerY, maxWidth)` - Text rendering (index.html:1029-1163)
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
- **Double-click** (index.html:1403-1444): Create/edit nodes, enters inline edit mode
  - Updates text alignment buttons using `updateAlignmentButtons()` helper
  - For new nodes: shows default alignment (currentTextAlign) and triggers auto-save
  - For existing nodes: shows that node's textAlign property
- **Mouse down** (index.html:1447-1574): Selection, connection completion, drag/resize start, canvas panning
  - Updates text alignment buttons when selecting a node
  - Resets to default alignment buttons when deselecting
  - Triggers auto-save when completing connection
  - Triggers auto-save when exiting edit mode by clicking outside
  - Z-ordering: Selected nodes move to front of render order
  - Connection mode behavior: Clicking different node switches connection start
  - Visual feedback for invalid connections (flash + warning)
  - **Canvas panning**: Clicking empty canvas starts panning (disabled in connection/edit mode)
- **Mouse move** (index.html:1576-1688): Hover effects, drag, resize, canvas panning
  - **Canvas panning**: Updates scroll position during pan (uses screen-space deltas)
  - Applies bounds checking during node drag
  - Conditional rendering (only when hover changes or in connection mode)
  - Type-specific cursors for resize handles
  - Cursor feedback: grab (default), grabbing (panning), move (over node)
- **Mouse up** (index.html:1690-1699): Ends drag/resize/panning operations
  - Triggers auto-save if was dragging or resizing (not for panning)
  - Resets cursor to 'grab' after operations complete
- **Keyboard** (index.html:1701-1820): Text editing and shortcuts
  - Focus check: Only handles shortcuts when body/canvas has focus
  - Text editing filters: Excludes Alt, Tab, Ctrl, Meta keys
  - Max length enforcement: 1000 character limit with visual feedback
  - Immediate rendering on input (lines 1712, 1727, 1750)
  - **Auto-save triggers**: On text input, Enter, Backspace, Shift+Enter, Esc
  - Escape in connection mode: Resets cursor to default
  - Delete: Clears editingNode reference if deleting edited node, triggers auto-save

### UI Components

**Node Type Toolbar** (index.html:166-174):
- 4 buttons in 2x2 grid: Rectangle, Circle, Diamond, Text
- Active button highlighted in blue
- `setNodeType(type)` function updates state and UI

**Text Alignment Toolbar** (index.html:196-203):
- 3 buttons in horizontal layout: L (left), C (center), R (right)
- Active button highlighted in blue (default: center)
- `setTextAlign(align)` function updates state and UI
- When no node selected: sets default alignment for new nodes
- When node selected: changes that node's alignment immediately and triggers auto-save
- Buttons automatically update to show selected node's alignment using `updateAlignmentButtons()` helper
- Revert to default alignment when node is deselected

**Canvas Size Toolbar** (index.html:205-211):
- 2 buttons in grid layout: "Larger +" and "Smaller −"
- Larger: Increases canvas size by 500px (up to 20000x20000)
- Smaller: Decreases canvas size by 500px (down to 1000x1000)
- Status bar shows current canvas size when changed
- Canvas wrapped in scrollable container for navigation

**Zoom Toolbar** (index.html:213-219):
- 2 buttons in grid layout: "Zoom In +" and "Zoom Out −"
- Zoom In: Increases zoom by 10% (up to 300%)
- Zoom Out: Decreases zoom by 10% (down to 10%)
- Status bar shows current zoom percentage when changed
- Mouse coordinates automatically adjusted for zoom level

**Connection Type Toolbar** (index.html:221-227):
- 2 buttons: "Directed →" and "Undirected —"
- Buttons only activate when connection mode starts
- Can switch between types while in connection mode
- Automatically deactivate after connection completes or is cancelled
- No flash when clicking without a node selected

**File Operations Toolbar** (index.html:229-235):
- 3 buttons in grid layout: Save, Load, Export
- Save: Downloads diagram as JSON file with user-specified name (includes canvas size and zoom)
- Load: Opens file picker to load JSON diagram (restores canvas size and zoom)
- Export: Downloads canvas as PNG image with user-specified name (always at 100% zoom)
- All filenames are sanitized to remove invalid characters

**Clear Canvas Button** (index.html:238):
- Single button below file operations toolbar
- Prompts for confirmation before clearing

**Status Bar** (index.html:176):
- Shows current mode and feedback messages
- Located at bottom-left corner
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
   - Prompts for filename (sanitized automatically)
   - Downloads with .json extension
   - Saves all nodes, connections, canvas size, zoom level, and state
16. **Load diagram**: Button to load JSON file
   - Opens file picker
   - Validates data structure and node properties
   - Restores canvas size and zoom level
   - Triggers auto-save after loading
17. **Export diagram**: Button to export as PNG image
   - Prompts for filename (sanitized automatically)
   - Warns if canvas is empty
   - Always exports at 100% zoom for consistency
   - High-quality canvas export
18. **Clear canvas**: Button at bottom of toolbar with confirmation
   - Clears auto-save data as well
19. **Z-ordering**: Selected nodes automatically move to front
20. **Copy/Paste nodes**: Ctrl+C to copy, Ctrl+V to paste
   - Pasted nodes offset by 20px to avoid overlapping

## User Interface

- **Toolbar** (top-left): Node type selector, text alignment selector, canvas size controls, zoom controls, connection type selector, file operations (Save/Load/Export), clear button
- **Scrollable canvas container**: Canvas wrapped in scrollable div for navigation of large canvases
- **Status bar** (bottom-left): Shows current mode, feedback, canvas size, zoom level, and auto-save status ("✓ Auto-saved")
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

When `editingNode` is set (index.html:1722-1776):
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

1. **NodeMap for O(1) lookups** (index.html:298)
   - Map<id, node> replaces O(n) array searches
   - Used in `getConnectionAtPoint()` and `drawConnection()`
   - Synchronized with nodes array (create, delete, clear)

2. **Debounced auto-save** (index.html:336-342)
   - 1 second debounce prevents excessive localStorage writes
   - Only saves after user stops making changes

3. **Conditional rendering** (index.html:1724-1827)
   - Only renders when hover state changes or in connection mode
   - Reduces unnecessary full canvas redraws

4. **Optimized cursor blink** (index.html:314-325)
   - Only renders during blink if editingNode still exists
   - Prevents unnecessary renders after edit mode ends
   - Uses CURSOR_BLINK_RATE constant (500ms)

5. **Optimized text editing** (index.html:1839-1895)
   - Length checks before string operations
   - Early filtering of unwanted key combinations
   - Character counter only shown when <50 remaining
   - Immediate render on input for responsive typing

6. **Text clipping** (index.html:1151-1172)
   - Canvas clipping prevents expensive overflow calculations
   - Shape-specific clip regions (circle, diamond, rectangle)

7. **Zoom transform with coordinate adjustment** (index.html:1520-1528)
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
- It's moved to end of `nodes` array (index.html:1651)
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
1. Add constant for default size (index.html:252-273)
2. Add button to toolbar HTML (index.html:186-193)
3. Update `createNode()` to handle new type (index.html:793-840)
   - Add to nodeMap
   - Return appropriate data structure
4. Create new `draw[Type]Node()` function (similar to index.html:1012-1137)
5. Add case to `drawNode()` dispatcher (index.html:992-1010)
6. Update `isPointInNode()` for shape-specific hit detection (index.html:834-871)
7. Update `getNodeEdgePoint()` for shape-specific edge calculations (index.html:1304-1376)
8. Update `getResizeCorner()` for shape-specific handles (index.html:883-941)
9. Update resize logic in mousemove handler if needed (index.html:1730-1786)
10. Update hover effect in `render()` if needed (index.html:1483-1514)

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
1. Add constants near line 252
2. Add state variables near line 275
3. Add helper functions after line 443
4. Add rendering logic in appropriate draw function
5. Add event handlers after existing handlers (line 1530+)
6. Update toolbar HTML if adding UI controls (lines 183-241)
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

## File Structure

Everything is in `index.html` (~1970 lines):

**HTML & CSS** (lines 1-243):
- Lines 1-177: HTML structure and CSS styles
  - Lines 22-30: Scrollable canvas container CSS
- Lines 179-243: HTML controls panel (toolbar, buttons, status bar)
  - Lines 186-193: Node type buttons
  - Lines 196-203: Text alignment buttons
  - Lines 205-211: Canvas size buttons (Larger/Smaller)
  - Lines 213-219: Zoom buttons (Zoom In/Out)
  - Lines 221-227: Connection type buttons
  - Lines 229-235: File operations buttons (Save, Load, Export)
  - Line 238: Clear canvas button
  - Line 241: Hidden file input element
  - Line 243: Status bar

**JavaScript** (lines 245-1970):
- Lines 246-273: Canvas setup and constants (including canvas size and zoom constants)
- Lines 275-290: Global state variables (including canvasWidth, canvasHeight, zoom, copiedNode)
- Lines 292-296: Interaction state
- Line 298: Performance optimization (nodeMap)
- Lines 300-303: Auto-save state
- Lines 305-334: Cursor blink state and functions
- Lines 336-441: Auto-save functions (with canvas size and zoom persistence)
- Lines 443-450: Canvas setup (resizeCanvas)
- Lines 452-598: UI helper functions (including canvas size and zoom controls)
- Lines 599-791: File operations (with canvas size and zoom save/restore, PNG export at 100% zoom)
- Lines 793-840: Node and connection creation
- Lines 842-990: Geometric calculations and hit detection
- Lines 992-1262: Rendering functions (with zoom transform)
- Lines 1436-1518: Main render loop with zoom transform
- Lines 1520-1528: Mouse coordinate helper (getMousePos with zoom and scroll)
- Lines 1530-1584: Double-click handler (create/edit nodes)
- Lines 1586-1715: Mouse down handler (with zoom-adjusted coordinates)
- Lines 1717-1820: Mouse move handler (with zoom-adjusted coordinates)
- Lines 1822-1831: Mouse up handler
- Lines 1833-1999: Keyboard handlers (including Ctrl+C/V for copy/paste)
- Lines 2001-2006: Initialization with auto-load

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
