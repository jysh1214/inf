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
let selectedNode = null;
let selectedConnection = null;
let hoveredNode = null;
let connectionMode = false;
let connectionStart = null;
let directedMode = true;
let currentNodeType = 'rectangle';
let currentTextAlign = 'center';
let editingNode = null;
let copiedNode = null;

// Interaction state
let isDragging = false;
let isResizing = false;
let resizeCorner = null;
let dragOffset = { x: 0, y: 0 };

// Canvas panning state
let isPanning = false;
let panStart = { x: 0, y: 0 };
let scrollStart = { x: 0, y: 0 };

// Node lookup map for performance
let nodeMap = new Map();

// Auto-save timer
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = 1000; // Save 1 second after last change
let autoSaveStatusTimer = null;

// Cursor blink state for text editing
let cursorVisible = true;
let cursorBlinkInterval = null;
let cursorPosition = 0; // Current cursor position in text (0 = start, text.length = end)

// Subgraph navigation state
let subgraphStack = [];  // Array of {parentState, nodeId, nodePath, fileHandle?} objects
let currentDepth = 0;     // Track nesting depth for breadcrumb display (0 = root level)
let currentPath = [];     // Array of node IDs representing the path: [parentNodeId, childNodeId, ...]
let fileHandleMap = new Map(); // Map<nodeId, FileSystemFileHandle> for file-based subgraphs
