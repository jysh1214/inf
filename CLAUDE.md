# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inf is a web-based diagram note-taking application implemented as a single HTML file with vanilla JavaScript and HTML Canvas. It supports multiple node types (rectangles, circles, diamonds, and text blocks) with inline text editing, visual connection tools, and advanced interaction features like z-ordering and bounds checking.

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

### Constants (index.html:184-198)

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
const WINDOW_RESIZE_DEBOUNCE = 100;      // Debounce delay for window resize (ms)
const CURSOR_BLINK_RATE = 500;           // Cursor blink interval in milliseconds
const LINE_HEIGHT = 18;                  // Line height for multi-line text
```

### State Management

**Global state variables** (index.html:237-248):
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

**Interaction state** (index.html:210-214):
- `isDragging` - Boolean for drag operation
- `isResizing` - Boolean for resize operation
- `resizeCorner` - String identifier for which handle is being dragged
- `dragOffset` - Object {x, y} storing drag offset from node origin

**Performance optimizations** (index.html:256-260):
- `nodeMap` - Map<id, node> for O(1) node lookups
- `resizeTimer` - Timer for debounced window resize

**Auto-save state** (index.html:262-265):
- `autoSaveTimer` - Timer for debounced auto-save (1 second delay)
- `autoSaveStatusTimer` - Timer for auto-save status message
- `AUTO_SAVE_DELAY` - Constant: 1000ms delay before auto-save triggers

**Cursor blink state** (index.html:267-291):
- `cursorVisible` - Boolean for cursor visibility in blink cycle
- `cursorBlinkInterval` - Timer for cursor blink animation (500ms interval)
- `startCursorBlink()` - Starts cursor blinking animation, only renders if editingNode exists
- `stopCursorBlink()` - Stops cursor blinking and clears interval

### Key Functions

**Helper Functions** (index.html:242-260):
- `constrainNodePosition(node)` - Keeps nodes within canvas bounds (20px margin)
  - Handles all node types with type-specific logic
  - Ensures at least part of node remains visible
  - Called during drag and node creation

**Canvas Setup** (index.html:262-257):
- `resizeCanvas()` - Updates canvas dimensions to window size
- `handleResize()` - Debounced resize handler (100ms delay)
- Window resize events use debouncing for performance

**Auto-save Functions** (index.html:293-391):
- `triggerAutoSave()` - Debounces auto-save with 1 second delay
- `autoSave()` - Saves to localStorage with error handling
  - Shows "✓ Auto-saved" status for 2 seconds
  - Handles QuotaExceededError with user-visible message
  - Saves: nodes, connections, nextId, timestamp
- `autoLoad()` - Loads from localStorage on startup
  - Validates data structure and node properties
  - Type-specific validation (circles need radius, etc.)
  - Rebuilds nodeMap after loading
  - Shows "Restored X nodes from auto-save" status

**UI Helper Functions** (index.html:412-446):
- `setStatus(text)` - Updates status bar text
- `setNodeType(type)` - Changes current node type and updates UI
- `updateAlignmentButtons(align)` - Helper to update alignment button states (lines 415-420)
- `setTextAlign(align)` - Changes text alignment (lines 422-435)
  - Updates `currentTextAlign` (default for new nodes)
  - If node selected: updates that node's `textAlign` and re-renders
  - Uses `updateAlignmentButtons()` helper
  - Shows status: "Text alignment: {align}" or "Default text alignment: {align}"
  - Triggers auto-save when changing node alignment
- `setConnectionType(directed)` - Starts/switches connection mode
  - If already in connection mode: switches type
  - If node selected: starts connection mode
  - If no node: shows error message
- `clearConnectionButtons()` - Resets connection button states
- `clearCanvas()` - Clears all nodes, connections, and auto-save with confirmation

**File Operations** (index.html:507-666):
- `saveToJSON()` - Saves diagram to JSON file (lines 507-541)
  - Prompts for filename with timestamp default
  - Sanitizes filename (removes invalid characters: `< > : " / \ | ? *`)
  - Creates downloadable blob with formatted JSON
  - Saves: version, nodes, connections, nextId
- `loadFromJSON(event)` - Loads diagram from JSON file (lines 543-618)
  - Validates data structure
  - Calculates nextId safely (handles empty arrays)
  - Rebuilds nodeMap after loading
  - Resets all interaction state
  - Triggers auto-save after successful load
- `exportToPNG()` - Exports canvas as PNG image (lines 620-666)
  - Warns if canvas is empty
  - Prompts for filename with timestamp default
  - Sanitizes filename
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
- **Mouse down** (index.html:1447-1574): Selection, connection completion, drag/resize start
  - Updates text alignment buttons when selecting a node
  - Resets to default alignment buttons when deselecting
  - Triggers auto-save when completing connection
  - Triggers auto-save when exiting edit mode by clicking outside
  - Z-ordering: Selected nodes move to front of render order
  - Connection mode behavior: Clicking different node switches connection start
  - Visual feedback for invalid connections (flash + warning)
- **Mouse move** (index.html:1576-1688): Hover effects, drag, resize
  - Applies bounds checking during drag
  - Conditional rendering (only when hover changes or in connection mode)
  - Type-specific cursors for resize handles
- **Mouse up** (index.html:1690-1699): Ends drag/resize operations
  - Triggers auto-save if was dragging or resizing
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

**Text Alignment Toolbar** (index.html:176-183):
- 3 buttons in horizontal layout: L (left), C (center), R (right)
- Active button highlighted in blue (default: center)
- `setTextAlign(align)` function updates state and UI
- When no node selected: sets default alignment for new nodes
- When node selected: changes that node's alignment immediately and triggers auto-save
- Buttons automatically update to show selected node's alignment using `updateAlignmentButtons()` helper
- Revert to default alignment when node is deselected

**File Operations Toolbar** (index.html:193-199):
- 3 buttons in grid layout: Save, Load, Export
- Save: Downloads diagram as JSON file with user-specified name
- Load: Opens file picker to load JSON diagram
- Export: Downloads canvas as PNG image with user-specified name
- All filenames are sanitized to remove invalid characters

**Connection Type Toolbar** (index.html:185-191):
- 2 buttons: "Directed →" and "Undirected —"
- Buttons only activate when connection mode starts
- Can switch between types while in connection mode
- Automatically deactivate after connection completes or is cancelled
- No flash when clicking without a node selected

**Clear Canvas Button** (index.html:173):
- Single button below connection type toolbar
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
6. **Move nodes**: Click and drag node body (disabled while editing)
   - Bounds checking keeps nodes partially visible (20px margin)
   - Z-ordering: Selected nodes move to front
   - **Auto-save**: Triggers after drag completes
7. **Resize nodes**: Drag handles (works even while editing)
   - Rectangle/Text: 4 corner handles
   - Circle: 8 radial handles around circumference
   - Diamond: 4 cardinal point handles (N, E, S, W)
   - Minimum size enforcement (40px)
   - Type-specific cursors (ns-resize, ew-resize, nwse-resize, nesw-resize)
   - **Auto-save**: Triggers after resize completes
8. **Create connections**:
   - Select a node (click it)
   - Click "Directed →" or "Undirected —" button
   - Click target node to complete connection
   - Can switch connection type while in connection mode
   - Clicking different node switches connection start
   - Prevents self-connections and duplicates
   - Press Esc to cancel (cursor resets)
   - Visual feedback for invalid connections (flash + warning)
   - **Auto-save**: Triggers after connection created
9. **Edge-to-edge connections**: Lines connect at node boundaries, not centers
   - Arrowheads pulled back 3px for visibility
   - Works correctly for all node shape combinations
10. **Select connections**: Click on connection line (highlights in blue)
   - 8px click tolerance
11. **Delete items**: Select node or connection, press Delete/Backspace
   - Disabled while editing text
   - Clears editingNode reference if deleting edited node
   - Removes associated connections when deleting nodes
   - **Auto-save**: Triggers after deletion
12. **Save diagram**: Button to save as JSON file
   - Prompts for filename (sanitized automatically)
   - Downloads with .json extension
   - Saves all nodes, connections, and state
13. **Load diagram**: Button to load JSON file
   - Opens file picker
   - Validates data structure and node properties
   - Triggers auto-save after loading
14. **Export diagram**: Button to export as PNG image
   - Prompts for filename (sanitized automatically)
   - Warns if canvas is empty
   - High-quality canvas export
15. **Clear canvas**: Button at bottom of toolbar with confirmation
   - Clears auto-save data as well
16. **Z-ordering**: Selected nodes automatically move to front
17. **Bounds checking**: Nodes cannot be completely dragged off-screen

## User Interface

- **Toolbar** (top-left): Node type selector, text alignment selector, connection type selector, file operations (Save/Load/Export), clear button
- **Status bar** (bottom-left): Shows current mode, feedback, and auto-save status ("✓ Auto-saved")
- **Canvas cursor**: Default cursor, changes contextually
  - Move cursor over nodes
  - Resize cursors over handles (type-specific)
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
- On page load/refresh: Automatically restores previous state
- Shows "✓ Auto-saved" status briefly when save occurs
- Handles storage quota errors gracefully with user warnings

**What triggers auto-save**:
- Creating, moving, resizing, deleting nodes
- Creating, deleting connections
- Text input (typing, Enter, Backspace)
- Finishing text editing (Shift+Enter, Esc, click outside)
- Changing text alignment of selected node
- Loading a JSON file

**Storage format**:
- Key: `inf-autosave` in localStorage
- Data: `{ version, nodes, connections, nextId, timestamp }`
- Validation on load: Checks data structure and node properties

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

1. **NodeMap for O(1) lookups** (index.html:256)
   - Map<id, node> replaces O(n) array searches
   - Used in `getConnectionAtPoint()` and `drawConnection()`
   - Synchronized with nodes array (create, delete, clear)

2. **Debounced window resize** (index.html:393-398)
   - 100ms debounce prevents excessive redraws
   - Improves performance on large diagrams

3. **Debounced auto-save** (index.html:293-299)
   - 1 second debounce prevents excessive localStorage writes
   - Only saves after user stops making changes

4. **Conditional rendering** (index.html:1576-1688)
   - Only renders when hover state changes or in connection mode
   - Reduces unnecessary full canvas redraws

5. **Optimized cursor blink** (index.html:278-286)
   - Only renders during blink if editingNode still exists
   - Prevents unnecessary renders after edit mode ends
   - Uses CURSOR_BLINK_RATE constant (500ms)

6. **Optimized text editing** (index.html:1722-1776)
   - Length checks before string operations
   - Early filtering of unwanted key combinations
   - Character counter only shown when <50 remaining
   - Immediate render on input for responsive typing

7. **Text clipping** (index.html:1043-1064)
   - Canvas clipping prevents expensive overflow calculations
   - Shape-specific clip regions (circle, diamond, rectangle)

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
- It's moved to end of `nodes` array (index.html:1125)
- Automatically brings it to front
- All subsequent operations render it on top
- Order persists until another node is selected

## Bounds Checking

`constrainNodePosition(node)` function (index.html:242-260):
- Called during node drag and creation
- Keeps at least 20px of node visible on canvas
- Type-specific logic:
  - Circles: Constrains center point accounting for radius
  - Other types: Constrains top-left position accounting for dimensions
- Prevents nodes from being completely lost off-screen
- Allows partial off-screen positioning for flexibility

## Extensibility

The codebase uses a node-based architecture where nodes have a `type` field. Four types are implemented: 'rectangle', 'circle', 'diamond', and 'text'.

**To add a new node type:**
1. Add constant for default size (index.html:184-196)
2. Add button to toolbar HTML (index.html:155-163)
3. Update `createNode()` to handle new type (index.html:312-371)
   - Add to nodeMap
   - Return appropriate data structure
4. Create new `draw[Type]Node()` function (similar to index.html:568-695)
5. Add case to `drawNode()` dispatcher (index.html:552-566)
6. Update `isPointInNode()` for shape-specific hit detection (index.html:373-410)
7. Update `getNodeEdgePoint()` for shape-specific edge calculations (index.html:773-865)
8. Update `getResizeCorner()` for shape-specific handles (index.html:412-471)
9. Update resize logic in mousemove handler if needed (index.html:1175-1244)
10. Update `constrainNodePosition()` if needed (index.html:242-260)
11. Update hover effect in `render()` if needed (index.html:978-1006)

## Known Limitations

**Not Yet Implemented:**
- No undo/redo (but has auto-save)
- No multi-select
- Connections are straight lines (no routing or curves)
- No styling options (colors, fonts, line styles, line width)
- No zoom/pan
- Text editing is append-only (no cursor positioning within text, no selection)
- No copy/paste
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
1. Add constants near line 213
2. Add state variables near line 235
3. Add helper functions after line 393
4. Add rendering logic in appropriate draw function
5. Add event handlers after existing handlers (line 1403+)
6. Update toolbar HTML if adding UI controls (lines 165-211)
7. Add auto-save trigger if feature modifies data

**When debugging mouse interactions:**
- Check `getBoundingClientRect()` is called on `canvas`, not `e`
- Verify hit detection thresholds (8px for handles and connections)
- Test in Chrome first before other browsers
- Remember that editing mode disables drag/resize
- Check if bounds checking is preventing intended behavior
- Verify z-ordering isn't causing selection issues

**When debugging performance:**
- Check if nodeMap is being used for node lookups
- Verify debouncing is working for window resize
- Check if unnecessary renders are occurring
- Look for O(n²) operations in loops

**When adding new node types:**
- Start by adding constant for default size
- Modify `createNode()` to create the new type's data structure
- Create a dedicated `draw[Type]Node()` function
- Update all geometric functions to handle the new shape
- Consider how resize handles should work for the shape
- Test edge point calculations for connections with all other node types
- Update bounds checking if shape has unusual dimensions
- Add type-specific hover effect if needed

**When modifying connection behavior:**
- Remember connections are edge-to-edge, not center-to-center
- Arrowheads use ARROWHEAD_OFFSET constant
- Check both `drawConnection()` and connection preview in `render()`
- Test with all node type combinations
- Verify hit detection matches actual line segment

## File Structure

Everything is in `index.html` (~1844 lines):

**HTML & CSS** (lines 1-211):
- Lines 1-163: HTML structure and CSS styles
- Lines 165-211: HTML controls panel (toolbar, buttons, status bar)
  - Lines 166-174: Node type buttons
  - Lines 176-183: Text alignment buttons
  - Lines 185-191: Connection type buttons
  - Lines 193-199: File operations buttons (Save, Load, Export)
  - Line 201: Clear canvas button
  - Line 204: Hidden file input element

**JavaScript** (lines 213-1844):
- Lines 213-233: Canvas setup and constants (including CURSOR_BLINK_RATE, LINE_HEIGHT)
- Lines 235-248: Global state variables (including currentTextAlign)
- Lines 250-265: Performance optimizations and auto-save state
- Lines 267-291: Cursor blink state and functions (startCursorBlink, stopCursorBlink)
- Lines 293-391: Auto-save functions (triggerAutoSave, autoSave with error handling, autoLoad with validation)
- Lines 393-398: Bounds checking helper
- Lines 400-407: Canvas resize with debouncing
- Lines 409-485: UI helper functions (status, node type, updateAlignmentButtons, text alignment, connection type, canvas clear)
- Lines 487-666: File operations (saveToJSON, loadFromJSON, exportToPNG - all with filename sanitization)
- Lines 668-720: Node and connection creation (nodes include textAlign property)
- Lines 722-878: Geometric calculations and hit detection
- Lines 880-1310: Rendering functions (with edit mode visual feedback, text clipping with 8px padding, and alignment support)
- Lines 1312-1348: Main render loop with connection previews and hover effects
- Lines 1350-1401: Mouse event handlers setup
- Lines 1403-1444: Double-click handler (create/edit nodes with cursor blink, updates alignment buttons, triggers auto-save)
- Lines 1447-1574: Mouse down handler (select, connect, drag, resize, updates alignment buttons, triggers auto-save)
- Lines 1576-1688: Mouse move handler (hover, drag, resize with bounds checking)
- Lines 1690-1699: Mouse up handler (end drag/resize, triggers auto-save)
- Lines 1701-1820: Keyboard handlers (multi-line text, Shift+Enter, character counter, immediate render, auto-save triggers, focus check)
- Lines 1822-1827: Initialization with auto-load

## Code Quality Notes

**Performance:**
- O(1) node lookups via nodeMap
- Debounced window resize (100ms)
- Conditional rendering in mousemove
- No unused variables or dead code

**Error Handling:**
- Connection validation (no self-connections, no duplicates)
- Visual feedback for invalid operations
- Bounds checking prevents lost nodes
- Max text length prevents memory issues

**Maintainability:**
- All magic numbers extracted as constants
- Type-specific functions with clear naming
- Comprehensive comments
- Consistent code style
- Single responsibility principle

**User Experience:**
- Visual feedback for all actions
- Contextual cursor changes
- Clear status messages with emoji
- No UI flashing or glitches
- Keyboard shortcuts filtered appropriately
- Z-ordering feels natural
