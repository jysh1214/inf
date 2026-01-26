// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let nextId = 1;

// State
let canvasWidth = DEFAULT_CANVAS_WIDTH;
let canvasHeight = DEFAULT_CANVAS_HEIGHT;
let zoom = 1.0;
let nodes = [];
let connections = [];
let groups = [];  // Array of group objects: {id, name, nodeIds}
let selectedNodeIds = new Set();  // Set of node IDs currently selected (multi-select)
let selectedConnection = null;
let selectedCell = null;  // {table: node, row: number, col: number}
let hoveredNode = null;
let connectionMode = false;
let connectionStart = null;
let directedMode = true;
let currentNodeType = 'rectangle';
let currentTextAlign = 'center';
let currentFontFamily = FONT_FAMILY;  // Use the default font from constants
let currentCodeFontFamily = CODE_FONT_FAMILY;  // Use the default code font from constants
let editingNode = null;
let copiedNodes = [];  // Array of copied nodes for multi-select copy/paste
let textClipboard = '';  // Text clipboard for cut/copy/paste operations within text editing

// Interaction state
let isDragging = false;
let isResizing = false;
let resizeCorner = null;
let dragOffset = { x: 0, y: 0 };

// Table cell border resizing state
let isResizingTableBorder = false;
let resizingBorder = null;  // { type: 'col'|'row', index: number, table: node }
let resizeBorderStartPos = 0;  // Starting mouse position (x for col, y for row)
let resizeBorderStartSize = 0;  // Original size of the row/column being resized

// Canvas panning state
let isPanning = false;
let panStart = { x: 0, y: 0 };
let scrollStart = { x: 0, y: 0 };

// Node lookup map for performance
let nodeMap = new Map();

// Cursor blink state for text editing
let cursorVisible = true;
let cursorBlinkInterval = null;
let cursorPosition = 0; // Current cursor position in text (0 = start, text.length = end)
let selectionStart = null; // Start of text selection (null if no selection)
let selectionEnd = null; // End of text selection (null if no selection)

// Subgraph navigation state
let subgraphStack = [];  // Array of {parentState, nodeId, nodePath, fileHandle?} objects
let currentDepth = 0;     // Track nesting depth for breadcrumb display (0 = root level)
let currentPath = [];     // Array of node IDs representing the path: [parentNodeId, childNodeId, ...]
let fileHandleMap = new Map(); // Map<nodeId, FileSystemFileHandle> for file-based subgraphs
let currentFileName = null; // Current file name (string for file-based, null for unsaved/root)
let currentFileHandle = null; // Current file handle for quick save (FileSystemFileHandle or null)
let workspaceFolderName = null; // Workspace folder name (string when set, null otherwise)
