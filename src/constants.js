// Constants
const VERSION = '2.1';
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
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLS = 3;
const DEFAULT_TABLE_CELL_WIDTH = 100;
const DEFAULT_TABLE_CELL_HEIGHT = 40;
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

// Multi-language keywords (JavaScript/TypeScript, C/C++, Python)
const SYNTAX_KEYWORDS = [
    // Shared keywords (common across multiple languages)
    'if', 'else', 'for', 'while', 'return', 'switch', 'case', 'break', 'continue',
    'default', 'true', 'false', 'null', 'do', 'void', 'static', 'const',
    'class', 'new', 'delete', 'this', 'try', 'catch', 'throw', 'enum',
    'private', 'protected', 'public',
    // JavaScript/TypeScript specific
    'function', 'let', 'var', 'import', 'export', 'from', 'async', 'await',
    'undefined', 'typeof', 'instanceof', 'in', 'of', 'extends', 'super', 'get', 'set',
    'yield', 'with', 'debugger', 'finally', 'implements', 'interface', 'package',
    // C/C++ specific
    'int', 'float', 'double', 'char', 'bool', 'long', 'short', 'unsigned', 'signed',
    'struct', 'union', 'typedef', 'sizeof', 'extern', 'register', 'volatile',
    'auto', 'goto', 'inline', 'restrict',
    'namespace', 'template', 'virtual', 'operator', 'friend', 'explicit',
    'mutable', 'typename', 'using', 'constexpr', 'nullptr',
    // Python specific
    'def', 'lambda', 'pass', 'elif', 'as', 'assert', 'global', 'nonlocal',
    'is', 'not', 'and', 'or', 'raise', 'except', 'with',
    'True', 'False', 'None', 'self', '__init__', '__name__', '__main__'
];

// Pre-compiled regex patterns for syntax highlighting (performance optimization)
const SYNTAX_PATTERNS = {
    string: /^["'`]/,
    number: /^[0-9]/,
    comment: /^(\/\/|#)/  // Support // (JS/C++) and # (Python) comments
};
const CANVAS_SIZE_STEP = 100;
const MIN_CANVAS_SIZE = 500;
const MAX_CANVAS_SIZE = 20000;
const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 1000;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
