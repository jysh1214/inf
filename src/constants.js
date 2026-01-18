// Constants
const VERSION = '1.3';
const HANDLE_SIZE = 8;
const CONNECTION_THRESHOLD = 8;
const MIN_NODE_SIZE = 40;
const DEFAULT_CIRCLE_RADIUS = 50;
const DEFAULT_DIAMOND_SIZE = 100;
const DEFAULT_RECTANGLE_WIDTH = 120;
const DEFAULT_RECTANGLE_HEIGHT = 80;
const DEFAULT_TEXT_WIDTH = 150;
const DEFAULT_TEXT_HEIGHT = 60;
const DEFAULT_CODE_WIDTH = 200;
const DEFAULT_CODE_HEIGHT = 100;
const ARROWHEAD_OFFSET = 0;
const MAX_TEXT_LENGTH = 1000;
const CURSOR_BLINK_RATE = 500;
const LINE_HEIGHT = 18;
const FONT_FAMILY = 'sans-serif';
const FONT_SIZE = 14;
const CODE_FONT_FAMILY = 'Monaco, Menlo, "Courier New", monospace';
const CODE_FONT_SIZE = 13;

// Syntax highlighting color map
const SYNTAX_COLORS = {
    keyword: '#0000ff',      // Blue
    string: '#008000',       // Green
    number: '#098658',       // Dark green
    comment: '#808080',      // Gray
    default: '#333'          // Default text color
};

// JavaScript/TypeScript keywords
const SYNTAX_KEYWORDS = [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
    'class', 'import', 'export', 'from', 'async', 'await', 'new', 'this',
    'try', 'catch', 'throw', 'switch', 'case', 'break', 'continue', 'default',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'void',
    'do', 'in', 'of', 'extends', 'super', 'static', 'get', 'set', 'delete',
    'yield', 'with', 'debugger', 'finally', 'enum', 'implements', 'interface',
    'package', 'private', 'protected', 'public'
];

// Pre-compiled regex patterns for syntax highlighting (performance optimization)
const SYNTAX_PATTERNS = {
    string: /^["'`]/,
    number: /^[0-9]/,
    comment: /^\/\//
};
const CANVAS_SIZE_STEP = 500;
const MIN_CANVAS_SIZE = 1000;
const MAX_CANVAS_SIZE = 20000;
const DEFAULT_CANVAS_WIDTH = 2000;
const DEFAULT_CANVAS_HEIGHT = 2000;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
