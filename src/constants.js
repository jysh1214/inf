// Constants
const VERSION = '3.2';
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
const FONT_FAMILY = 'Monaco';
const FONT_SIZE = 14;
const CODE_FONT_FAMILY = 'monospace';
const CODE_FONT_SIZE = 13;

// Available font families for font selector
const AVAILABLE_FONTS = [
    'sans-serif',
    'serif',
    'monospace',
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Comic Sans MS',
    'Maple Mono',
    'Monaco',
    'Menlo',
];

// Color constants
const DEFAULT_COLOR = '#666';  // Default grey color for connections
const NODE_BORDER_COLOR = '#999';  // Light grey color for node borders and groups
const TEXT_SELECTION_COLOR = 'rgba(33, 150, 243, 0.3)';  // Semi-transparent blue for selected text

// Syntax highlighting color map
const SYNTAX_COLORS = {
    keyword: '#0000ff',      // Blue
    string: '#008000',       // Green
    number: '#098658',       // Dark green
    comment: '#808080',      // Gray
    default: '#333'          // Default text color
};

// Multi-language keywords (JavaScript/TypeScript, C/C++, Python, Bash)
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
    'True', 'False', 'None', 'self', '__init__', '__name__', '__main__',
    // Bash specific - built-ins and control flow
    'then', 'fi', 'esac', 'done', 'until', 'select', 'time', 'coproc',
    'local', 'declare', 'readonly', 'export', 'unset', 'shift', 'source',
    'alias', 'unalias', 'typeset', 'set', 'shopt', 'enable', 'builtin',
    'command', 'getopts', 'read', 'test', 'eval', 'exec', 'exit', 'trap',
    // Bash - common commands
    'echo', 'printf', 'cd', 'pwd', 'pushd', 'popd', 'dirs',
    'ls', 'cat', 'grep', 'sed', 'awk', 'find', 'sort', 'uniq', 'cut', 'tr',
    'head', 'tail', 'wc', 'tee', 'xargs', 'dirname', 'basename', 'which', 'whereis',
    // Bash - file operations
    'chmod', 'chown', 'chgrp', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'ln', 'touch',
    'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'xz', 'unrar',
    // Bash - network and transfer
    'curl', 'wget', 'ssh', 'scp', 'rsync', 'sftp', 'ftp', 'nc', 'netcat', 'ping',
    'traceroute', 'nslookup', 'dig', 'host', 'ip', 'ifconfig', 'netstat', 'ss',
    // Bash - process management
    'ps', 'kill', 'killall', 'pkill', 'top', 'htop', 'jobs', 'fg', 'bg', 'nohup',
    'screen', 'tmux', 'nice', 'renice', 'pgrep', 'pidof', 'lsof', 'strace',
    // Bash - system administration
    'sudo', 'su', 'chroot', 'systemctl', 'service', 'journalctl', 'dmesg',
    'mount', 'umount', 'df', 'du', 'free', 'uptime', 'uname', 'hostname',
    'useradd', 'userdel', 'usermod', 'groupadd', 'passwd', 'who', 'w', 'last',
    // Bash - development tools
    'git', 'svn', 'hg', 'make', 'cmake', 'autoconf', 'configure',
    'gcc', 'g++', 'clang', 'cc', 'ld', 'ar', 'nm', 'objdump', 'strip',
    'gdb', 'lldb', 'valgrind', 'strace', 'ltrace',
    // Bash - interpreters and package managers
    'python', 'python3', 'pip', 'pip3', 'ruby', 'gem', 'perl', 'node', 'npm', 'yarn',
    'pnpm', 'npx', 'java', 'javac', 'mvn', 'gradle', 'cargo', 'rustc', 'go',
    'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'brew', 'snap', 'flatpak',
    // Bash - container and orchestration tools
    'docker', 'podman', 'buildah', 'skopeo', 'docker-compose', 'podman-compose',
    'kubectl', 'k9s', 'helm', 'minikube', 'kind', 'crictl', 'nerdctl',
    'containerd', 'runc', 'ctr', 'docker-machine', 'docker-swarm',
    // Bash - cloud and infrastructure
    'aws', 'gcloud', 'az', 'terraform', 'ansible', 'vagrant', 'packer',
    // Bash - monitoring and logging
    'tail', 'less', 'more', 'watch', 'journalctl', 'logrotate', 'syslog',
    // Bash - text processing and search
    'vim', 'vi', 'nano', 'emacs', 'diff', 'patch', 'jq', 'yq', 'xmllint',
    'ack', 'ag', 'rg', 'ripgrep', 'fzf', 'fd'
];

// Pre-compiled regex patterns for syntax highlighting (performance optimization)
const SYNTAX_PATTERNS = {
    string: /^["'`]/,
    number: /^[0-9]/,
    comment: /^(\/\/|#)/  // Support // (JS/C++) and # (Python) comments
};
const CANVAS_SIZE_STEP = 100;
const MIN_CANVAS_SIZE = 100;
const MAX_CANVAS_SIZE = 20000;
const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 1000;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;

// UI/Visual constants
const TEXT_PADDING = 8;                      // Horizontal padding for text inside nodes
const CELL_PADDING = 4;                      // Padding inside table cells
const GROUP_PADDING = 15;                    // Padding around nodes in group bounding box
const HOVER_OFFSET = 2;                      // Offset for hover effect border
const PASTE_OFFSET = 20;                     // Offset when pasting nodes to avoid overlap

// Border and line widths
const SUBGRAPH_BORDER_WIDTH = 4;             // Border thickness for nodes with subgraphs
const SELECTED_BORDER_WIDTH = 2;             // Border thickness for selected nodes
const EDITING_BORDER_WIDTH = 3;              // Border thickness for editing nodes
const TABLE_BORDER_DETECT_WIDTH = 10;        // Hit detection area for table borders
const TABLE_BORDER_RESIZE_TOLERANCE = 5;     // Pixels on each side of border for resize hit detection

// Cursor rendering
const CURSOR_HEIGHT = 8;                     // Half-height of cursor (above and below line)
const CURSOR_X_OFFSET_NORMAL = 2;            // Horizontal offset for cursor in normal nodes
const CURSOR_X_OFFSET_TABLE = 1;             // Horizontal offset for cursor in table cells

// Connection rendering
const ARROWHEAD_LENGTH = 15;                 // Length of connection arrowheads

// Text editing
const TEXT_LENGTH_WARNING_THRESHOLD = 50;    // Characters remaining before showing warning

// Code node rendering
const CODE_LINE_HEIGHT_OFFSET = 4;           // Additional spacing for code lines beyond font size

// URL rendering
const URL_UNDERLINE_OFFSET = 8;              // Vertical offset for URL underline below text baseline
