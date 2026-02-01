# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inf is a comprehensive diagram note-taking system with three main components:

1. **Canvas Application** - Single-file HTML5 Canvas-based diagram editor (JavaScript)
2. **YAML Tools** - Python utilities for converting YAML diagrams to Inf JSON format
3. **Claude Code Skill** - `/inf` command for generating hierarchical documentation

## Repository Structure

```
inf/
├── src/                    # Canvas app source files (JavaScript/CSS/HTML)
│   ├── template.html       # HTML structure
│   ├── styles.css          # Styling
│   └── *.js                # 12 JavaScript modules (see order below)
├── tools/                  # Python conversion tools
│   ├── converter.py        # YAML → Inf structure conversion
│   ├── graphviz.py         # Layout computation with Graphviz
│   ├── yaml2inf.py         # Main conversion script
│   └── yaml_checker.py     # Validation-only script
├── build.py                # Builds src/ → index.html
├── check.py                # Validates build output
├── SKILL.md                # /inf skill documentation (includes YAML format spec)
└── INF_FORMAT.md           # JSON format specification
```

## Build System

### Canvas Application Build

```bash
# Build the application
python3 build.py

# Build and validate in one step
python3 build.py --check

# Validate existing build
python3 check.py
```

**Build Process:**
1. Reads `src/template.html` as base HTML structure
2. Injects CSS from `src/styles.css` into `<!-- CSS -->` placeholder
3. Injects JavaScript files from `src/` in dependency order into `<!-- JS -->` placeholder
4. Outputs single `index.html` file (gitignored)

**Important**: `index.html` is generated and should never be edited directly. All changes must be made to source files in `src/`.

### YAML Tools Usage

```bash
# Validate a single YAML file
python3 tools/yaml_checker.py <file.yaml>

# Validate all YAML files in a folder
python3 tools/yaml2inf.py <folder>/ --validate --verbose

# Convert YAML files to Inf JSON
python3 tools/yaml2inf.py <folder>/ --verbose

# Convert with custom layout
python3 tools/yaml2inf.py <folder>/ --engine neato --rankdir LR
```

**Common Options:**
- `--validate` - Validate only, don't generate JSON
- `--verbose` - Show conversion progress
- `--debug` - Detailed debugging output
- `--engine` - Layout engine: dot (default), neato, fdp, circo, twopi
- `--rankdir` - Direction: TB (default), LR, BT, RL

**Docker Usage (no local dependencies required):**
```bash
# Build the Docker image (one time)
docker build -t yaml2inf .

# Validate YAML files only
docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --validate --verbose

# Convert YAML to JSON
docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --verbose

# Convert with custom layout engine
docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --engine neato --rankdir LR
```

The Docker image includes all dependencies (Python, Graphviz, pygraphviz), eliminating the need for local installation.

## Architecture

### Canvas Application

The canvas app uses vanilla JavaScript with HTML5 Canvas for rendering. The build system merges modular source files into a single `index.html` for distribution.

#### JavaScript Module Loading Order

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

#### State Management

Global state is managed through variables in `state.js`. Key state includes:

**Diagram Data:**
- `nodes` array - All diagram nodes
- `connections` array - All connections between nodes
- `nodeMap` Map - Performance lookup for nodes by ID
- `nextId` - Next available ID for nodes/connections

**Interaction State:**
- `selectedNodeIds` Set - Multi-select support (set of node IDs)
- `selectedConnection`, `selectedCell` - Selected connection or table cell
- `editingNode`, `hoveredNode` - Current interaction state
- `isDragging`, `isResizing`, `isPanning` - Interaction mode flags
- `connectionMode`, `connectionStart` - Connection creation state
- `cursorPosition` - Current cursor position in text (0 = start, text.length = end)
- `cursorVisible`, `cursorBlinkInterval` - Cursor blink animation state
- `copiedNodes` array - Clipboard for multi-node copy/paste
- `currentFileName` string - Current file name display (null for unsaved)

**Canvas State:**
- `canvasWidth`, `canvasHeight`, `zoom` - Canvas dimensions and zoom level

**Subgraph Navigation State:**
- `subgraphStack` array - Stack of parent states when navigating into subgraphs
- `currentDepth` number - Current nesting depth (0 = root level)
- `currentPath` array - Array of node IDs from root to current position
- `fileHandleMap` Map - Maps node IDs to FileSystemFileHandle objects for file-based subgraphs

#### Node System

Six node types are supported: `rectangle`, `circle`, `diamond`, `text`, `code`, `table`. Each type has different:
- Geometry representation (x/y/width/height for rectangles, x/y/radius for circles)
- Hit detection algorithms (`isPointInNode` in `nodeManager.js`)
- Rendering functions (`drawRectangleNode`, `drawCircleNode`, etc. in `renderer.js`)
- Resize handle positions and logic (`getResizeCorner` in `nodeManager.js`)

All nodes share common properties: `id`, `type`, `text`, `textAlign`.

**Table Node Type:**
- Grid-based structure with configurable rows/columns (1-20 each)
- Each cell is a mini-text node with independent text and alignment
- Each cell can have its own embedded or file-based subgraph
- Individual cell selection and editing
- Fixed cell dimensions (cellWidth × cellHeight)
- Double-click to edit cell text, Ctrl+Click to create/enter cell subgraph
- Default: 3×3 table with 100×40 pixel cells
- Modal UI for specifying table dimensions on creation

**Code Node Type:**
- Monospace font (Monaco, Menlo, Courier New) with light gray background (#f5f5f5)
- Syntax highlighting for JavaScript/TypeScript, C/C++, and Python (70+ keywords)
- Conditional highlighting: plain text while editing, highlighted when viewing
- No word wrapping (preserves code formatting)
- Default size: 200×100 pixels (vs 150×60 for text nodes)
- Keywords in blue, strings in green, numbers in dark green, comments in gray
- Comment pattern supports both `//` (JS/C++) and `#` (Python)

**Subgraph Support:** Nodes can optionally contain a `subgraph` property:
- **Embedded subgraphs**: `subgraph` is an object with full diagram structure (`{version, nodes, connections, nextId, ...}`)
- **File-based subgraphs**: `subgraph` is a string filename (e.g., `"external-system.json"`)
- Nodes with subgraphs are visually indicated by a 4px thick border
- Ctrl+Click on a node creates a new subgraph or enters an existing one
- The modal in `ui.js` prompts users to choose: Embedded, New File, or Load Existing

#### Connection System

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

#### Validation System

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

### YAML Tools Architecture

The Python tools follow a modular architecture with clear separation of concerns:

```
┌─────────────────┐
│  yaml2inf.py    │  Main script (orchestration)
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         v                  v                  v
┌────────────────┐  ┌───────────────┐  ┌──────────────┐
│ converter.py   │  │ graphviz.py   │  │ File I/O     │
│                │  │               │  │              │
│ YAML → Inf     │  │ Layout        │  │ Read/Write   │
│ (structure)    │  │ (positions)   │  │ JSON files   │
└────────────────┘  └───────────────┘  └──────────────┘

┌─────────────────┐
│yaml_checker.py  │  Single-file validation wrapper
└────────┬────────┘
         │
         v
┌────────────────┐
│ converter.py   │  Validate only (no layout, no JSON output)
└────────────────┘
```

**Design Principles:**
- **Separation of Concerns**: `converter.py` handles YAML → Inf structure, `graphviz.py` handles layout, `yaml2inf.py` orchestrates
- **Modularity**: Each module can be imported and used independently
- **Single Responsibility**: Each function does one thing well

**Key Modules:**

**converter.py** - Core conversion logic:
- `parse_yaml_file(file_path)` - Parse YAML file
- `convert_yaml_to_inf(yaml_path, validate_only)` - Convert YAML to Inf structure
- `create_inf_node(...)` - Create node structure
- `create_inf_connection(...)` - Create connection structure
- `create_inf_group(...)` - Create group structure
- `resolve_subgraph_path(...)` - Resolve subgraph file references

**graphviz.py** - Layout computation:
- `calculate_text_dimensions(text, node_type)` - Calculate node size
- `create_graphviz_layout(nodes, connections, layout_config)` - Compute positions
- `apply_layout(inf_json, yaml_data, layout_config)` - Apply layout to Inf structure
- `calculate_canvas_bounds(positions, nodes)` - Calculate canvas size

### Claude Code Skill (`/inf`)

The `/inf` skill generates hierarchical documentation for any repository using multi-agent orchestration:

**Phase 1: Repository Analysis**
1. Explore codebase structure
2. Identify architecture and key components
3. Create `inf-notes/root.yaml` with 5-10 major components

**Phase 2: Parallel Subgraph Creation**
1. Spawn 8-16 agents in parallel using Task tool
2. Each agent creates a focused YAML file (5-15 nodes)
3. **Each agent MUST validate their YAML** using `tools/yaml_checker.py`
4. Agents fix validation errors before marking complete

**Phase 2.5: Validation**
1. Each agent validates their own file with `tools/yaml_checker.py`
2. Batch validation with `tools/yaml2inf.py --validate --verbose`
3. Fix errors before proceeding to next level

**Phase 3: Deep Nesting (Recursive)**
1. Review generated files, identify nodes needing detail
2. Spawn agents for level-2 subgraphs
3. Use naming: `parent-name__child-name.yaml`
4. Continue recursively (no depth limit!)

**Phase 4: Final Report & Conversion**
1. Run final batch validation
2. Convert all YAML to JSON: `python3 tools/yaml2inf.py inf-notes/ --verbose`
3. Report completion summary

**Important**: Agents create YAML files only. JSON conversion happens once at the end in Phase 4. Agents MUST validate their YAML before completing.

## YAML Format

The YAML format is designed for AI-friendly diagram creation. **AI writes structure, script handles layout.**

### Basic Template

```yaml
nodes:
  - text: "Node 1"
    type: rectangle    # Optional: rectangle (default), circle, diamond, text, code, table
    align: center      # Optional: left, center (default), right

  - text: "Node 2"
    type: circle

connections:
  - from: "Node 1"
    to: "Node 2"
    directed: true     # Optional: true (default), false

groups:
  - name: "Group Name"
    nodes: ["Node 1", "Node 2"]

layout:
  engine: dot          # Optional: dot (default), neato, fdp, circo, twopi
  rankdir: TB          # Optional: TB (default), LR, BT, RL
```

### Key Principles

**AI specifies:**
- Node text, types, connections, relationships, groups
- Layout preferences (engine, direction, spacing)

**AI does NOT specify:**
- Coordinates, IDs, sizes, canvas dimensions (computed automatically)

**File-based subgraphs:**
```yaml
nodes:
  - text: "Authentication"
    subgraph: "module-auth.yaml"  # Always include .yaml extension
```

**Table nodes (Markdown format):**
```yaml
nodes:
  - text: "Configuration Matrix"
    type: table
    table: |
      | Component  | Status | Version |
      |:-----------|:------:|--------:|
      | API        | Active | 2.1.0   |
      | Database   | Active | 14.5    |
```

**Table alignment:**
- `:---` = left-aligned column
- `:---:` = center-aligned column
- `---:` = right-aligned column

The converter automatically detects row/column counts and cell alignment from the Markdown table syntax. This is more AI-friendly than manual coordinate specification.

## Code Patterns

### Adding New Node Types to Canvas App

To add a new node type (example: Code node was added in v1.4):
1. Add default size constants to `constants.js` (e.g., `DEFAULT_CODE_WIDTH`, `DEFAULT_CODE_HEIGHT`)
2. Add creation logic to `createNode()` in `nodeManager.js`
3. Add hit detection to `isPointInNode()` in `nodeManager.js`
4. Add resize corner logic to `getResizeCorner()` in `nodeManager.js`
5. Add drawing function in `renderer.js` (e.g., `drawCodeNode()` with helper `drawCodeText()`)
6. Add case to `drawNode()` switch statement in `renderer.js`
7. Add button to `src/template.html` UI with onclick handler
8. Update `setNodeType()` in `uiHelpers.js` to include new button in classList operations
9. Update validation in `fileOperations.js`:
   - Add to `validTypes` array in `validateNode()`
   - Add to type-specific validation conditions (width/height checks)
10. Update `autoSave.js` validation if type needs special handling
11. Update documentation (INF_FORMAT.md, SKILL.md)

### Adding New Global State

When adding new global state:
1. Declare in `state.js` at the top level
2. Include in save/load data objects in `autoSave.js` and `fileOperations.js`
3. Reset appropriately in `clearCanvas()` if needed

### Triggering Re-renders

Call `render()` after any state change that affects visual output. Call `triggerAutoSave()` after any state change that should be persisted.

### Common Bug Patterns to Avoid

**Variable naming consistency:**
- The multi-select clipboard is `copiedNodes` (plural array), NOT `copiedNode`
- Common mistake: `copiedNode = null` creates undefined variable pollution

**State reset in subgraph navigation:**
- When entering/exiting subgraphs, reset all interaction state including:
  - `selectedNodeIds.clear()` (multi-select)
  - `editingNode = null`, `connectionMode = false`
  - All drag/resize/pan state variables
- **NOTE:** `copiedNodes` is NOT reset to enable cross-graph copy/paste (v2.4+)
  - Users can copy nodes from any graph and paste into any other graph
  - Clipboard persists across all navigation operations

## Important Architecture Principles

### The Spirit of Infinity

The project name "Inf" reflects a core principle: **no artificial limits**. This manifests in:
- No maximum depth limit for subgraph nesting (intentionally infinite)
- Large canvas sizes supported (up to 20000×20000 pixels)
- No limit on node count (though performance may degrade with 1000+ nodes)

When implementing features, avoid adding arbitrary limits unless there's a technical necessity (like browser/canvas limitations).

### YAML Validation Philosophy

**Critical**: Agents MUST validate YAML before considering their work complete:
- Each agent validates their own file using `tools/yaml_checker.py`
- Agents fix validation errors immediately
- NO JSON conversion by agents (only YAML creation)
- Batch validation happens after each level completes
- Never proceed to next level with validation failures
- Conversion to JSON happens once at the end (Phase 4)

**Why this matters:**
- Catches errors early before they cascade to deeper levels
- Each agent is responsible for their output quality
- Ensures `tools/yaml2inf.py` can successfully convert all files
- Validates connections and groups reference real nodes
- Confirms all subgraph references are resolvable

### Validation Workflow

**For agents creating YAML files:**
```bash
# Agent validates their own file (REQUIRED)
python3 tools/yaml_checker.py inf-notes/module-auth.yaml

# Expected: "✓ Valid" output
# If errors: Fix immediately, re-validate, repeat until clean
```

**After all agents complete a level:**
```bash
# Batch validate entire folder
python3 tools/yaml2inf.py inf-notes/ --validate --verbose

# Expected: "✓ All files validated successfully!"
# Only proceed to next level if this passes
```

**Final conversion (Phase 4 only):**
```bash
# Convert all YAML to JSON (after all YAML complete)
python3 tools/yaml2inf.py inf-notes/ --verbose
```

## Common Issues and Solutions

### Connection Rendering Issues

If connections don't touch node borders or have gaps:
1. Check `getNodeEdgePoint()` calculates intersections correctly
2. Verify parametric line math: `Point = from + t * (to - from)` where t > 0
3. Ensure edge bounds checking (x/y within rectangle/circle/diamond boundaries)
4. For rectangles, verify all 4 edges are checked and closest intersection is returned
5. Check epsilon values for floating-point comparisons (0.001 for distance, 0.0001 for line intersection)

### YAML Validation Errors

**Common validation errors:**
- `Node text '...' not found in nodes` - Connection/group references don't match node text exactly
  - **Fix**: Ensure connection `from`/`to` and group `nodes` use exact node text (including all `\n` line breaks)
- `Subgraph file not found: ...` - Subgraph reference points to non-existent file
  - **Fix**: Either create the referenced file or remove the subgraph reference
- `Invalid YAML` - Syntax error in YAML file
  - **Fix**: Check indentation, quotes, special characters

**How to debug:**
1. Run `tools/yaml_checker.py` on the problematic file
2. Read error messages carefully (they include context)
3. Check that connection text matches node text exactly (case-sensitive, including `\n`)
4. Verify all subgraph files exist before referencing them
5. Use `--debug` flag for detailed output

### IndexedDB Issues

If file handles don't persist or errors occur:
1. Check DB_VERSION matches the schema (currently 2)
2. Verify singleton promise pattern prevents race conditions
3. Ensure all async operations have try/catch blocks
4. Check QuotaExceededError handling (browser storage limits)
5. Verify permission checks before using stored handles
6. Validate file handles are not stale before use (file may have been deleted/moved)

### Stale File Handle Errors

If "Failed to access file" errors occur:
1. File handles can become stale when files are deleted, moved, or permissions change
2. `loadSubgraphFromFile` validates handles by calling `getFile()` early
3. Stale handles are automatically cleared from memory and IndexedDB
4. System falls back to workspace folder search, then file picker
5. No user action needed - automatic recovery handles this gracefully

## Version History

- **v3.2** (2026-02-01):
  - **/inf Skill Enhancements**:
    - Added `--focus <file>` argument for targeted subgraph expansion
    - Enables deep exploration of specific areas without affecting others
    - Supports parallel work and iterative refinement workflows
  - **Aggressive Extensibility**:
    - Default behavior: mark nearly all nodes as extensible
    - "When to Stop" reframed as "Extensibility Exceptions"
    - Bias toward expansion - creates richer hierarchies for exploration
  - **Documentation**:
    - Comprehensive usage examples (focused expansion, parallel work, iterative refinement)
    - Clear guidance on when to use --focus argument
    - Updated quality standards to emphasize extensibility
- **v3.1** (2026-01-30):
  - **YAML Tools Enhancements**:
    - Fixed node positioning and canvas bounds calculation in Graphviz layout engine
    - Proper coordinate conversion from Graphviz (points, bottom-left) to screen (pixels, top-left)
    - All nodes now fit within canvas boundaries with correct 100px padding
    - Added debug logging for position tracking
  - **Docker Support**:
    - Enhanced Dockerfile to copy all required modules (converter.py, graphviz.py, yaml2inf.py)
    - Added comprehensive Docker usage examples
    - Documented Docker workflow in CLAUDE.md
  - **Documentation & Safety**:
    - Added special characters warning in SKILL.md (3 locations)
    - Prevents Graphviz DOT syntax errors from characters like `\` `"` `<` `>` `{}` `..`
    - Updated validation checklist and best practices
- **v2.5** (2026-01-30):
  - **Robustness & Error Handling**: Critical stability improvements
    - Canvas transform protection: try/finally in render() ensures ctx.restore() always executes
    - Private browsing detection: User-friendly error modal when IndexedDB is unavailable
    - Comprehensive input validation: 14 public API functions now validate parameters
    - Clear error messages with context for debugging
  - **Defensive programming**: Graceful degradation (returns null/false instead of crashing)
  - **Production-ready**: All validation tested, +192 lines of robust error handling
- **v2.3** (2026-01-20):
  - Critical bug fixes (memory leak, circular references, ID generation, IndexedDB)
  - Extract all magic numbers to named constants (15 new constants)
- **v2.0** (2026-01-19):
  - UI/UX overhaul with modern purple gradient design
  - Beautiful error modal replaces browser alert()
  - File path display, 6 critical bug fixes
- **v1.5** (2026-01-19):
  - Table node type with cell-level subgraph support
  - Multi-node selection, alignment, copy/paste
- **v1.4** (2026-01-18):
  - Code node type with syntax highlighting
  - Full cursor position tracking with arrow key navigation
- **v1.3** (2026-01-18):
  - Workspace folder with `root.json` auto-load
  - Relative paths, stale file handle recovery
- **v1.2** (2026-01-18): Connection rendering fixes
- **v1.1** (2026-01-17): Workspace folder permission, IndexedDB persistence
- **v1.0** (2026-01-17): Initial major release with hierarchical subgraph navigation

## Documentation

- **INF_FORMAT.md**: JSON format specification for Inf diagrams
- **SKILL.md**: `/inf` skill documentation with YAML format specification
- **tools/README.md**: Python tools architecture and usage
- **CLAUDE.md**: This file - architectural guidance for Claude Code instances
