#!/usr/bin/env python3
"""
YAML to Inf JSON converter with Graphviz layout

Usage:
    # Validate only
    python3 scripts/yaml_convert.py input.yaml --validate

    # Convert to JSON with Graphviz layout
    python3 scripts/yaml_convert.py input.yaml --output output.json

    # Batch-convert
    python3 scripts/yaml_convert.py --dir inf-notes/
"""

import sys
import yaml
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

try:
    import pygraphviz as pgv
except ImportError:
    print("❌ ERROR: pygraphviz not installed")
    print("   Install: pip install pygraphviz")
    print("   Or: apt-get install python3-pygraphviz (Ubuntu)")
    sys.exit(1)


def get_inf_version() -> str:
    """Extract VERSION constant from src/constants.js"""
    constants_path = Path(__file__).parent.parent / 'src' / 'constants.js'

    if not constants_path.exists():
        print(f"❌ ERROR: Could not find {constants_path}")
        print("   The VERSION constant must be read from src/constants.js")
        sys.exit(1)

    try:
        content = constants_path.read_text(encoding='utf-8')
        # Match: const VERSION = '3.1';
        match = re.search(r"const\s+VERSION\s*=\s*['\"]([^'\"]+)['\"]", content)
        if match:
            return match.group(1)
        else:
            print(f"❌ ERROR: Could not parse VERSION constant from {constants_path}")
            print("   Expected format: const VERSION = '3.1';")
            sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to read {constants_path}: {e}")
        sys.exit(1)


class YAMLValidator:
    """Validates YAML format according to SKILL.md specification"""

    VALID_NODE_TYPES = {'rectangle', 'circle', 'diamond', 'text', 'code', 'table'}
    VALID_ALIGNMENTS = {'left', 'center', 'right'}
    VALID_ENGINES = {'dot', 'neato', 'fdp', 'circo', 'twopi'}
    VALID_RANKDIRS = {'TB', 'LR', 'BT', 'RL'}

    VALID_NODE_KEYS = {'text', 'type', 'align', 'subgraph', 'table', 'attr'}
    VALID_CONNECTION_KEYS = {'from', 'to', 'directed'}
    VALID_GROUP_KEYS = {'name', 'nodes'}
    VALID_LAYOUT_KEYS = {'engine', 'rankdir', 'ranksep', 'nodesep'}
    VALID_ROOT_KEYS = {'nodes', 'connections', 'groups', 'layout'}
    VALID_ATTRS = {'title', 'intro'}  # Layout-only attributes

    # Characters that cause Graphviz DOT syntax errors
    PROBLEMATIC_CHARS = ['\\', '"', "'", '<', '>', '{', '}', '..']

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.node_texts: set = set()
        self.connection_pairs: set = set()  # Track (from, to) pairs for duplicate detection

    def error(self, msg: str):
        """Add error message"""
        self.errors.append(f"❌ ERROR: {msg}")

    def warning(self, msg: str):
        """Add warning message"""
        self.warnings.append(f"⚠️  WARNING: {msg}")

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate entire YAML structure"""
        if not isinstance(data, dict):
            self.error("YAML root must be a dictionary")
            return False

        # Check for unknown root keys
        for key in data.keys():
            if key not in self.VALID_ROOT_KEYS:
                self.error(f"Unknown root key '{key}'. Valid keys: {', '.join(sorted(self.VALID_ROOT_KEYS))}")

        # Validate nodes
        if 'nodes' not in data:
            self.error("Missing required 'nodes' key")
            return False

        if not isinstance(data['nodes'], list):
            self.error("'nodes' must be a list")
            return False

        if len(data['nodes']) == 0:
            self.warning("No nodes defined")

        for i, node in enumerate(data['nodes']):
            self.validate_node(node, i)

        # Validate connections
        if 'connections' in data:
            if not isinstance(data['connections'], list):
                self.error("'connections' must be a list")
            else:
                for i, conn in enumerate(data['connections']):
                    self.validate_connection(conn, i)

        # Validate groups
        if 'groups' in data:
            if not isinstance(data['groups'], list):
                self.error("'groups' must be a list")
            else:
                for i, group in enumerate(data['groups']):
                    self.validate_group(group, i)

        # Validate layout
        if 'layout' in data:
            self.validate_layout(data['layout'])

        return len(self.errors) == 0

    def validate_node(self, node: Dict[str, Any], index: int):
        """Validate single node"""
        if not isinstance(node, dict):
            self.error(f"Node {index}: must be a dictionary")
            return

        # Check for unknown keys
        for key in node.keys():
            if key not in self.VALID_NODE_KEYS:
                self.error(f"Node {index}: unknown key '{key}'. Valid keys: {', '.join(sorted(self.VALID_NODE_KEYS))}")

        # Required: text
        if 'text' not in node:
            self.error(f"Node {index}: missing required 'text' field")
            return

        text = node['text']
        if not isinstance(text, str):
            self.error(f"Node {index}: 'text' must be a string, got {type(text).__name__}")
            return

        if not text.strip():
            self.error(f"Node {index}: 'text' cannot be empty")
            return

        # Check for duplicate node text
        if text in self.node_texts:
            self.error(f"Node {index}: duplicate node text '{text}'. All node text must be unique.")
        else:
            self.node_texts.add(text)

        # Check for special characters that cause Graphviz errors
        for char in self.PROBLEMATIC_CHARS:
            # Allow \n for newlines
            if char == '\\':
                # Check for backslashes that are NOT part of \n
                if re.search(r'\\(?!n)', text):
                    self.warning(f"Node {index} ('{text[:30]}...'): contains backslash (not \\n) which may cause Graphviz errors")
                    break
            elif char in text:
                self.warning(f"Node {index} ('{text[:30]}...'): contains '{char}' which may cause Graphviz errors")

        # Optional: type
        if 'type' in node:
            node_type = node['type']
            if not isinstance(node_type, str):
                self.error(f"Node {index} ('{text}'): 'type' must be a string, got {type(node_type).__name__}")
            elif node_type not in self.VALID_NODE_TYPES:
                self.error(f"Node {index} ('{text}'): invalid type '{node_type}'. Valid types: {', '.join(sorted(self.VALID_NODE_TYPES))}")

            # If type is table, require table field
            if node_type == 'table' and 'table' not in node:
                self.error(f"Node {index} ('{text}'): type 'table' requires 'table' field with markdown content")

        # Optional: align
        if 'align' in node:
            align = node['align']
            if not isinstance(align, str):
                self.error(f"Node {index} ('{text}'): 'align' must be a string, got {type(align).__name__}")
            elif align not in self.VALID_ALIGNMENTS:
                self.error(f"Node {index} ('{text}'): invalid align '{align}'. Valid alignments: {', '.join(sorted(self.VALID_ALIGNMENTS))}")

        # Optional: attr (layout-only attribute)
        if 'attr' in node:
            attr = node['attr']
            if not isinstance(attr, str):
                self.error(f"Node {index} ('{text}'): 'attr' must be a string, got {type(attr).__name__}")
            elif attr not in self.VALID_ATTRS:
                self.error(f"Node {index} ('{text}'): invalid attr '{attr}'. Valid attrs: {', '.join(sorted(self.VALID_ATTRS))}")

        # Optional: subgraph
        if 'subgraph' in node:
            subgraph = node['subgraph']
            if not isinstance(subgraph, str):
                self.error(f"Node {index} ('{text}'): 'subgraph' must be a string, got {type(subgraph).__name__}")
            elif not subgraph.endswith('.yaml'):
                self.warning(f"Node {index} ('{text}'): subgraph '{subgraph}' should end with '.yaml' extension")

        # Optional: table
        if 'table' in node:
            self.validate_table(node['table'], index, text)

    def validate_table(self, table: Any, node_index: int, node_text: str):
        """Validate markdown table format"""
        if not isinstance(table, str):
            self.error(f"Node {node_index} ('{node_text}'): 'table' must be a string (markdown table), got {type(table).__name__}")
            return

        lines = [line.strip() for line in table.strip().split('\n') if line.strip()]

        if len(lines) < 2:
            self.error(f"Node {node_index} ('{node_text}'): table must have at least header and separator rows")
            return

        # Find separator line (contains |---|)
        separator_found = False
        for i, line in enumerate(lines):
            if '---' in line and '|' in line:
                separator_found = True
                break

        if not separator_found:
            self.error(f"Node {node_index} ('{node_text}'): table missing separator line (e.g., |---|---|)")

    def validate_connection(self, conn: Dict[str, Any], index: int):
        """Validate single connection"""
        if not isinstance(conn, dict):
            self.error(f"Connection {index}: must be a dictionary")
            return

        # Check for unknown keys
        for key in conn.keys():
            if key not in self.VALID_CONNECTION_KEYS:
                self.error(f"Connection {index}: unknown key '{key}'. Valid keys: {', '.join(sorted(self.VALID_CONNECTION_KEYS))}")

        # Required: from
        if 'from' not in conn:
            self.error(f"Connection {index}: missing required 'from' field")
            return

        from_text = conn['from']
        if not isinstance(from_text, str):
            self.error(f"Connection {index}: 'from' must be a string, got {type(from_text).__name__}")
        elif from_text not in self.node_texts:
            self.error(f"Connection {index}: 'from' node '{from_text}' not found in nodes. Check for exact match (case-sensitive, including \\n)")

        # Required: to
        if 'to' not in conn:
            self.error(f"Connection {index}: missing required 'to' field")
            return

        to_text = conn['to']
        if not isinstance(to_text, str):
            self.error(f"Connection {index}: 'to' must be a string, got {type(to_text).__name__}")
        elif to_text not in self.node_texts:
            self.error(f"Connection {index}: 'to' node '{to_text}' not found in nodes. Check for exact match (case-sensitive, including \\n)")

        # Check for self-connection
        if isinstance(from_text, str) and isinstance(to_text, str) and from_text == to_text:
            self.error(f"Connection {index}: self-connection not allowed (from and to are both '{from_text}')")

        # Check for duplicate connections
        if isinstance(from_text, str) and isinstance(to_text, str):
            conn_pair = (from_text, to_text)
            if conn_pair in self.connection_pairs:
                self.error(f"Connection {index}: duplicate connection from '{from_text}' to '{to_text}'")
            else:
                self.connection_pairs.add(conn_pair)

        # Optional: directed
        if 'directed' in conn:
            directed = conn['directed']
            if not isinstance(directed, bool):
                self.error(f"Connection {index}: 'directed' must be a boolean (true or false), got {type(directed).__name__}")

    def validate_group(self, group: Dict[str, Any], index: int):
        """Validate single group"""
        if not isinstance(group, dict):
            self.error(f"Group {index}: must be a dictionary")
            return

        # Check for unknown keys
        for key in group.keys():
            if key not in self.VALID_GROUP_KEYS:
                self.error(f"Group {index}: unknown key '{key}'. Valid keys: {', '.join(sorted(self.VALID_GROUP_KEYS))}")

        # Required: name
        if 'name' not in group:
            self.error(f"Group {index}: missing required 'name' field")
        elif not isinstance(group['name'], str):
            self.error(f"Group {index}: 'name' must be a string, got {type(group['name']).__name__}")

        # Required: nodes
        if 'nodes' not in group:
            self.error(f"Group {index}: missing required 'nodes' field")
            return

        nodes = group['nodes']
        if not isinstance(nodes, list):
            self.error(f"Group {index}: 'nodes' must be a list, got {type(nodes).__name__}")
            return

        if len(nodes) < 2:
            self.error(f"Group {index}: group must contain at least 2 nodes, got {len(nodes)}")

        for i, node_text in enumerate(nodes):
            if not isinstance(node_text, str):
                self.error(f"Group {index}: node reference {i} must be a string, got {type(node_text).__name__}")
            elif node_text not in self.node_texts:
                self.error(f"Group {index}: node '{node_text}' not found. Check for exact match (case-sensitive, including \\n)")

    def validate_layout(self, layout: Dict[str, Any]):
        """Validate layout configuration"""
        if not isinstance(layout, dict):
            self.error(f"'layout' must be a dictionary, got {type(layout).__name__}")
            return

        # Check for unknown keys
        for key in layout.keys():
            if key not in self.VALID_LAYOUT_KEYS:
                self.error(f"Layout: unknown key '{key}'. Valid keys: {', '.join(sorted(self.VALID_LAYOUT_KEYS))}")

        # Optional: engine
        if 'engine' in layout:
            engine = layout['engine']
            if not isinstance(engine, str):
                self.error(f"Layout: 'engine' must be a string, got {type(engine).__name__}")
            elif engine not in self.VALID_ENGINES:
                self.error(f"Layout: invalid engine '{engine}'. Valid engines: {', '.join(sorted(self.VALID_ENGINES))}")

        # Optional: rankdir
        if 'rankdir' in layout:
            rankdir = layout['rankdir']
            if not isinstance(rankdir, str):
                self.error(f"Layout: 'rankdir' must be a string, got {type(rankdir).__name__}")
            elif rankdir not in self.VALID_RANKDIRS:
                self.error(f"Layout: invalid rankdir '{rankdir}'. Valid directions: {', '.join(sorted(self.VALID_RANKDIRS))}")

        # Optional: ranksep
        if 'ranksep' in layout:
            ranksep = layout['ranksep']
            if not isinstance(ranksep, (int, float)):
                self.error(f"Layout: 'ranksep' must be a number, got {type(ranksep).__name__}")
            elif ranksep <= 0:
                self.error(f"Layout: 'ranksep' must be positive, got {ranksep}")

        # Optional: nodesep
        if 'nodesep' in layout:
            nodesep = layout['nodesep']
            if not isinstance(nodesep, (int, float)):
                self.error(f"Layout: 'nodesep' must be a number, got {type(nodesep).__name__}")
            elif nodesep <= 0:
                self.error(f"Layout: 'nodesep' must be positive, got {nodesep}")

    def print_results(self, filename: str) -> bool:
        """Print validation results"""
        print(f"\n{'='*60}")
        print(f"Validation Report: {filename}")
        print(f"{'='*60}\n")

        if self.warnings:
            for warning in self.warnings:
                print(warning)
            print()

        if self.errors:
            for error in self.errors:
                print(error)
            print(f"\n❌ Validation FAILED with {len(self.errors)} error(s)")
            if self.warnings:
                print(f"   ({len(self.warnings)} warning(s))")
            return False
        else:
            print("✅ Validation PASSED")
            if self.warnings:
                print(f"   ({len(self.warnings)} warning(s))")
            return True


class GraphvizLayoutEngine:
    """Uses Graphviz to compute node positions"""

    def __init__(self, yaml_data: Dict[str, Any]):
        self.yaml_data = yaml_data
        self.layout_config = yaml_data.get('layout', {})
        self.engine = self.layout_config.get('engine', 'dot')
        self.rankdir = self.layout_config.get('rankdir', 'TB')
        self.ranksep = self.layout_config.get('ranksep', 1.0)
        self.nodesep = self.layout_config.get('nodesep', 0.5)
        self.node_positions: Dict[str, Tuple[float, float]] = {}
        self.node_sizes: Dict[str, Tuple[float, float]] = {}

    def calculate_node_size(self, node: Dict[str, Any]) -> Tuple[float, float]:
        """Calculate node dimensions based on text and type"""
        text = node.get('text', '')
        node_type = node.get('type', 'rectangle')

        # Count lines and max line length
        lines = text.split('\n')
        max_line_len = max(len(line) for line in lines) if lines else 0
        num_lines = len(lines)

        # Base character width (approximate)
        char_width = 8  # pixels per character
        line_height = 20  # pixels per line

        if node_type == 'table':
            # Table size based on actual cell content
            table_str = node.get('table', '')
            cells = self.parse_table_cells(table_str)
            col_widths, row_heights = self.calculate_table_dimensions(cells)
            width = sum(col_widths)
            height = sum(row_heights)
        elif node_type == 'circle':
            # Circle needs to fit text
            radius = max(60, max_line_len * char_width / 2, num_lines * line_height / 2)
            width = height = radius * 2
        elif node_type == 'diamond':
            # Diamond needs extra space
            width = max(120, max_line_len * char_width * 1.5)
            height = max(120, num_lines * line_height * 1.5)
        elif node_type == 'code':
            # Code nodes larger by default
            width = max(200, max_line_len * char_width + 40)
            height = max(100, num_lines * line_height + 40)
        else:  # rectangle, text
            width = max(150, max_line_len * char_width + 20)
            height = max(60, num_lines * line_height + 20)

        # Convert to inches for Graphviz (72 DPI)
        return (width / 72.0, height / 72.0)

    def parse_table_dimensions(self, table_str: str) -> Tuple[int, int]:
        """Parse markdown table to get row/col count"""
        lines = [line.strip() for line in table_str.strip().split('\n') if line.strip()]
        if len(lines) < 2:
            return (3, 2)

        # Count columns from first line
        cols = len([c for c in lines[0].split('|') if c.strip()])

        # Count rows (excluding separator)
        rows = sum(1 for line in lines if '---' not in line)

        return (max(1, rows), max(1, cols))

    def parse_table_cells(self, table_str: str) -> List[List[Dict[str, Any]]]:
        """Parse markdown table to get cell data as 2D array"""
        lines = [line.strip() for line in table_str.strip().split('\n') if line.strip()]
        cells = []  # 2D array: cells[row][col]

        # Parse alignment from separator
        alignments = []
        for line in lines:
            if '---' in line:
                sep_cells = [c.strip() for c in line.split('|') if c.strip()]
                for cell in sep_cells:
                    if cell.startswith(':') and cell.endswith(':'):
                        alignments.append('center')
                    elif cell.endswith(':'):
                        alignments.append('right')
                    else:
                        alignments.append('left')
                break

        # Parse data rows
        for line in lines:
            if '---' in line:
                continue

            row_cells = [c.strip() for c in line.split('|')]
            if row_cells and not row_cells[0]:
                row_cells = row_cells[1:]
            if row_cells and not row_cells[-1]:
                row_cells = row_cells[:-1]

            # Create row array
            row = []
            for i, cell_text in enumerate(row_cells):
                align = alignments[i] if i < len(alignments) else 'left'
                row.append({
                    "text": cell_text,
                    "textAlign": align
                })

            cells.append(row)  # Append row to 2D array

        return cells

    def calculate_table_dimensions(self, cells: List[List[Dict[str, Any]]]) -> Tuple[List[int], List[int]]:
        """Calculate optimal column widths and row heights based on cell content"""
        if not cells or not cells[0]:
            return ([100], [40])

        rows = len(cells)
        cols = len(cells[0])

        # Text measurement heuristics (approximations for Monaco 14px)
        AVG_CHAR_WIDTH = 8.4  # Average character width in pixels
        LINE_HEIGHT = 18      # Line height in pixels
        PADDING = 20          # Cell padding (CELL_PADDING * 2 + TEXT_PADDING * 2)
        MIN_WIDTH = 40        # Minimum cell width
        MIN_HEIGHT = 30       # Minimum cell height

        # Calculate column widths (max width in each column)
        col_widths = [MIN_WIDTH] * cols
        for col in range(cols):
            for row in range(rows):
                if col < len(cells[row]):
                    cell_text = cells[row][col].get('text', '')
                    if cell_text:
                        # Find widest line in cell
                        lines = cell_text.split('\n')
                        max_line_width = max(len(line) for line in lines) * AVG_CHAR_WIDTH
                        required_width = int(max_line_width + PADDING)
                        col_widths[col] = max(col_widths[col], required_width)

        # Calculate row heights (max height in each row)
        row_heights = [MIN_HEIGHT] * rows
        for row in range(rows):
            for col in range(cols):
                if col < len(cells[row]):
                    cell_text = cells[row][col].get('text', '')
                    if cell_text:
                        # Count lines in cell
                        line_count = len(cell_text.split('\n'))
                        required_height = int(line_count * LINE_HEIGHT + PADDING)
                        row_heights[row] = max(row_heights[row], required_height)

        return (col_widths, row_heights)

    def compute_layout(self) -> bool:
        """Use Graphviz to compute layout"""
        try:
            # Create pygraphviz graph
            G = pgv.AGraph(directed=True, strict=False)

            # Set graph attributes
            G.graph_attr['rankdir'] = self.rankdir
            G.graph_attr['ranksep'] = str(self.ranksep)
            G.graph_attr['nodesep'] = str(self.nodesep)
            G.node_attr['shape'] = 'box'

            # First pass: calculate sizes and find max width for full-width nodes
            nodes = self.yaml_data.get('nodes', [])
            node_id_map = {}
            title_node = None
            intro_node = None
            regular_nodes = []
            max_width_inches = 0

            for i, node in enumerate(nodes):
                text = node.get('text', '')
                node_id = f'n{i}'
                node_id_map[text] = node_id
                attr = node.get('attr')

                width, height = self.calculate_node_size(node)

                if attr == 'title':
                    title_node = (node_id, text, width, height)
                elif attr == 'intro':
                    intro_node = (node_id, text, width, height)
                else:
                    regular_nodes.append((node_id, text, width, height))
                    max_width_inches = max(max_width_inches, width)

            # Ensure minimum full width (at least 400 pixels = ~5.5 inches)
            full_width_inches = max(max_width_inches, 400 / 72.0)

            # Add title node with full width
            if title_node:
                node_id, text, _, height = title_node
                self.node_sizes[text] = (full_width_inches * 72, height * 72)
                G.add_node(node_id, label=text, width=full_width_inches, height=height, fixedsize=True)

            # Add intro node with full width
            if intro_node:
                node_id, text, _, height = intro_node
                self.node_sizes[text] = (full_width_inches * 72, height * 72)
                G.add_node(node_id, label=text, width=full_width_inches, height=height, fixedsize=True)

            # Add regular nodes
            for node_id, text, width, height in regular_nodes:
                self.node_sizes[text] = (width * 72, height * 72)
                G.add_node(node_id, label=text, width=width, height=height, fixedsize=True)

            # Add invisible edges to enforce ordering: title → intro → regular nodes
            first_regular = regular_nodes[0][0] if regular_nodes else None
            if title_node and intro_node:
                G.add_edge(title_node[0], intro_node[0], style='invis', weight=100)
                if first_regular:
                    G.add_edge(intro_node[0], first_regular, style='invis', weight=100)
            elif title_node and first_regular:
                G.add_edge(title_node[0], first_regular, style='invis', weight=100)
            elif intro_node and first_regular:
                G.add_edge(intro_node[0], first_regular, style='invis', weight=100)

            # Use rank constraints to place title/intro at the top
            if title_node or intro_node:
                top_nodes = []
                if title_node:
                    top_nodes.append(title_node[0])
                if intro_node:
                    top_nodes.append(intro_node[0])
                # Create a subgraph with rank=source to force these to the top
                subgraph = G.add_subgraph(top_nodes, name='cluster_top')
                subgraph.graph_attr['rank'] = 'source'
                subgraph.graph_attr['style'] = 'invis'  # Hide the cluster border

            # Add edges from connections
            for conn in self.yaml_data.get('connections', []):
                from_text = conn.get('from')
                to_text = conn.get('to')
                directed = conn.get('directed', True)

                if from_text in node_id_map and to_text in node_id_map:
                    if directed:
                        G.add_edge(node_id_map[from_text], node_id_map[to_text])
                    else:
                        # Undirected edge: use dir='none' to remove arrowheads
                        G.add_edge(node_id_map[from_text], node_id_map[to_text], dir='none')

            # Compute layout
            G.layout(prog=self.engine)

            # Extract node positions
            for node_id, text in {v: k for k, v in node_id_map.items()}.items():
                node = G.get_node(node_id)
                pos = node.attr['pos'].split(',')
                x = float(pos[0])
                y = float(pos[1])
                self.node_positions[text] = (x, y)

            return True

        except Exception as e:
            print(f"❌ ERROR: Graphviz layout failed: {e}")
            print(f"   Make sure Graphviz is installed and '{self.engine}' is available")
            return False

    def normalize_positions(self):
        """Normalize positions to ensure all nodes are within canvas bounds"""
        if not self.node_positions:
            return

        # Find bounds of all nodes (including their sizes)
        min_x = min_y = float('inf')
        max_x = max_y = float('-inf')

        for text, (x, y) in self.node_positions.items():
            width, height = self.node_sizes.get(text, (150, 60))

            # For circles and diamonds, Graphviz uses center position
            # For rectangles, we'll use center too for consistency
            left = x - width / 2
            right = x + width / 2
            top = y - height / 2
            bottom = y + height / 2

            min_x = min(min_x, left)
            max_x = max(max_x, right)
            min_y = min(min_y, top)
            max_y = max(max_y, bottom)

        # Flip y-axis (Graphviz uses bottom-left origin, canvas uses top-left)
        for text in self.node_positions:
            x, y = self.node_positions[text]
            self.node_positions[text] = (x, max_y + min_y - y)

        # Recalculate min_y after flipping
        min_y = min(y - self.node_sizes.get(text, (150, 60))[1] / 2
                    for text, (x, y) in self.node_positions.items())

        # Calculate offset to move all nodes into positive coordinates
        padding = 100
        offset_x = padding - min_x if min_x < padding else 0
        offset_y = padding - min_y if min_y < padding else 0

        # Apply offset to all positions
        if offset_x != 0 or offset_y != 0:
            for text in self.node_positions:
                x, y = self.node_positions[text]
                self.node_positions[text] = (x + offset_x, y + offset_y)

    def get_canvas_bounds(self) -> Tuple[int, int]:
        """Calculate canvas size from positioned nodes"""
        if not self.node_positions:
            return (2000, 2000)

        # Normalize positions first
        self.normalize_positions()

        # Find max bounds after normalization
        max_x = max_y = 0
        for text, (x, y) in self.node_positions.items():
            width, height = self.node_sizes.get(text, (150, 60))

            # Calculate right and bottom edges
            right = x + width / 2
            bottom = y + height / 2

            max_x = max(max_x, right)
            max_y = max(max_y, bottom)

        # Add padding
        padding = 100
        canvas_width = int(max_x + padding)
        canvas_height = int(max_y + padding)

        # Minimum size
        canvas_width = max(canvas_width, 1000)
        canvas_height = max(canvas_height, 1000)

        # Verify all nodes are within bounds
        for text, (x, y) in self.node_positions.items():
            width, height = self.node_sizes.get(text, (150, 60))
            left = x - width / 2
            top = y - height / 2
            right = x + width / 2
            bottom = y + height / 2

            if left < 0 or top < 0 or right > canvas_width or bottom > canvas_height:
                print(f"⚠️  WARNING: Node '{text[:30]}...' may be clipped")
                print(f"    Position: ({int(x)}, {int(y)}), Size: ({int(width)}, {int(height)})")
                print(f"    Bounds: left={int(left)}, top={int(top)}, right={int(right)}, bottom={int(bottom)}")

        return (canvas_width, canvas_height)


class YAMLToInfConverter:
    """Converts YAML to Inf JSON with Graphviz layout"""

    def __init__(self, layout_engine: GraphvizLayoutEngine):
        self.layout_engine = layout_engine
        self.next_id = 1
        self.node_id_map: Dict[str, int] = {}

    def convert(self, yaml_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert YAML to Inf JSON"""
        canvas_width, canvas_height = self.layout_engine.get_canvas_bounds()

        inf_json = {
            "version": get_inf_version(),
            "nodes": [],
            "connections": [],
            "groups": [],
            "nextId": 1,
            "canvasWidth": canvas_width,
            "canvasHeight": canvas_height,
            "zoom": 1.0
        }

        # Convert nodes
        for node in yaml_data.get('nodes', []):
            inf_node = self.convert_node(node)
            inf_json['nodes'].append(inf_node)

        # Convert connections
        for conn in yaml_data.get('connections', []):
            inf_conn = self.convert_connection(conn)
            if inf_conn:
                inf_json['connections'].append(inf_conn)

        # Convert groups
        for group in yaml_data.get('groups', []):
            inf_group = self.convert_group(group)
            if inf_group:
                inf_json['groups'].append(inf_group)

        inf_json['nextId'] = self.next_id
        return inf_json

    def convert_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Convert YAML node to Inf format"""
        node_id = self.next_id
        self.next_id += 1

        text = node['text']
        self.node_id_map[text] = node_id

        node_type = node.get('type', 'rectangle')
        align = node.get('align', 'center')

        # Get position and size from layout engine
        pos = self.layout_engine.node_positions.get(text, (100, 100))
        size = self.layout_engine.node_sizes.get(text, (150, 60))

        inf_node = {
            "id": node_id,
            "type": node_type,
            "text": text,
            "textAlign": align
        }

        # Add geometry based on type
        if node_type == 'circle':
            radius = size[0] / 2
            inf_node.update({
                "x": int(pos[0]),
                "y": int(pos[1]),
                "radius": int(radius)
            })
        elif node_type == 'diamond':
            inf_node.update({
                "x": int(pos[0]),
                "y": int(pos[1]),
                "width": int(size[0]),
                "height": int(size[1])
            })
        elif node_type == 'table':
            rows, cols = self.parse_table_dimensions(node.get('table', ''))
            cells = self.parse_table_cells(node.get('table', ''))
            col_widths, row_heights = self.calculate_table_dimensions(cells)
            inf_node.update({
                "x": int(pos[0] - size[0] / 2),  # Top-left corner
                "y": int(pos[1] - size[1] / 2),
                "rows": rows,
                "cols": cols,
                "cells": cells,
                "colWidths": col_widths,
                "rowHeights": row_heights
            })
        else:  # rectangle, text, code
            inf_node.update({
                "x": int(pos[0] - size[0] / 2),  # Top-left corner
                "y": int(pos[1] - size[1] / 2),
                "width": int(size[0]),
                "height": int(size[1])
            })

        # Add subgraph if present
        if 'subgraph' in node:
            subgraph_path = node['subgraph']
            # Convert .yaml extension to .json for Inf format
            if subgraph_path.endswith('.yaml'):
                subgraph_path = subgraph_path[:-5] + '.json'
            inf_node['subgraph'] = subgraph_path

        return inf_node

    def parse_table_dimensions(self, table_str: str) -> Tuple[int, int]:
        """Parse table markdown to get row/col count"""
        lines = [line.strip() for line in table_str.strip().split('\n') if line.strip()]
        if len(lines) < 2:
            return (3, 2)

        cols = len([c for c in lines[0].split('|') if c.strip()])
        rows = sum(1 for line in lines if '---' not in line)
        return (max(1, rows), max(1, cols))

    def parse_table_cells(self, table_str: str) -> List[List[Dict[str, Any]]]:
        """Parse markdown table to get cell data as 2D array"""
        lines = [line.strip() for line in table_str.strip().split('\n') if line.strip()]
        cells = []  # 2D array: cells[row][col]

        # Parse alignment from separator
        alignments = []
        for line in lines:
            if '---' in line:
                sep_cells = [c.strip() for c in line.split('|') if c.strip()]
                for cell in sep_cells:
                    if cell.startswith(':') and cell.endswith(':'):
                        alignments.append('center')
                    elif cell.endswith(':'):
                        alignments.append('right')
                    else:
                        alignments.append('left')
                break

        # Parse data rows
        for line in lines:
            if '---' in line:
                continue

            row_cells = [c.strip() for c in line.split('|')]
            if row_cells and not row_cells[0]:
                row_cells = row_cells[1:]
            if row_cells and not row_cells[-1]:
                row_cells = row_cells[:-1]

            # Create row array
            row = []
            for i, cell_text in enumerate(row_cells):
                align = alignments[i] if i < len(alignments) else 'left'
                row.append({
                    "text": cell_text,
                    "textAlign": align
                })

            cells.append(row)  # Append row to 2D array

        return cells

    def calculate_table_dimensions(self, cells: List[List[Dict[str, Any]]]) -> Tuple[List[int], List[int]]:
        """Calculate optimal column widths and row heights based on cell content"""
        if not cells or not cells[0]:
            return ([100], [40])

        rows = len(cells)
        cols = len(cells[0])

        # Text measurement heuristics (approximations for Monaco 14px)
        AVG_CHAR_WIDTH = 8.4  # Average character width in pixels
        LINE_HEIGHT = 18      # Line height in pixels
        PADDING = 20          # Cell padding (CELL_PADDING * 2 + TEXT_PADDING * 2)
        MIN_WIDTH = 40        # Minimum cell width
        MIN_HEIGHT = 30       # Minimum cell height

        # Calculate column widths (max width in each column)
        col_widths = [MIN_WIDTH] * cols
        for col in range(cols):
            for row in range(rows):
                if col < len(cells[row]):
                    cell_text = cells[row][col].get('text', '')
                    if cell_text:
                        # Find widest line in cell
                        lines = cell_text.split('\n')
                        max_line_width = max(len(line) for line in lines) * AVG_CHAR_WIDTH
                        required_width = int(max_line_width + PADDING)
                        col_widths[col] = max(col_widths[col], required_width)

        # Calculate row heights (max height in each row)
        row_heights = [MIN_HEIGHT] * rows
        for row in range(rows):
            for col in range(cols):
                if col < len(cells[row]):
                    cell_text = cells[row][col].get('text', '')
                    if cell_text:
                        # Count lines in cell
                        line_count = len(cell_text.split('\n'))
                        required_height = int(line_count * LINE_HEIGHT + PADDING)
                        row_heights[row] = max(row_heights[row], required_height)

        return (col_widths, row_heights)

    def convert_connection(self, conn: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert YAML connection to Inf format"""
        from_text = conn.get('from')
        to_text = conn.get('to')

        if from_text not in self.node_id_map or to_text not in self.node_id_map:
            return None

        conn_id = self.next_id
        self.next_id += 1

        return {
            "id": conn_id,
            "fromId": self.node_id_map[from_text],
            "toId": self.node_id_map[to_text],
            "directed": conn.get('directed', True)
        }

    def convert_group(self, group: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert YAML group to Inf format"""
        group_id = self.next_id
        self.next_id += 1

        node_ids = []
        for node_text in group.get('nodes', []):
            if node_text in self.node_id_map:
                node_ids.append(self.node_id_map[node_text])

        if not node_ids:
            return None

        return {
            "id": group_id,
            "name": group.get('name', 'Group'),
            "nodeIds": node_ids
        }


def convert_single_file(input_file: str, output_file: str, validate_only: bool = False) -> bool:
    """Convert a single YAML file to Inf JSON"""
    # Load YAML
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            yaml_data = yaml.safe_load(f)
    except FileNotFoundError:
        print(f"❌ ERROR: File not found: {input_file}")
        return False
    except yaml.YAMLError as e:
        print(f"❌ ERROR: Invalid YAML syntax in {input_file}:")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"❌ ERROR: Failed to read {input_file}: {e}")
        return False

    # Validate
    validator = YAMLValidator()
    validator.validate(yaml_data)
    success = validator.print_results(input_file)

    if not success:
        return False

    # If validate-only, stop here
    if validate_only:
        return True

    # Compute layout with Graphviz
    print(f"\n{'='*60}")
    print(f"Computing layout with Graphviz")
    print(f"{'='*60}\n")

    layout_engine = GraphvizLayoutEngine(yaml_data)
    if not layout_engine.compute_layout():
        return False

    print(f"✅ Layout computed successfully")
    print(f"   Engine: {layout_engine.engine}")
    print(f"   Direction: {layout_engine.rankdir}")

    # Convert to Inf JSON
    print(f"\n{'='*60}")
    print(f"Converting to Inf JSON: {output_file}")
    print(f"{'='*60}\n")

    converter = YAMLToInfConverter(layout_engine)
    inf_json = converter.convert(yaml_data)

    # Write output
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(inf_json, f, indent=2, ensure_ascii=False)

        print(f"✅ Conversion complete!")
        print(f"   Output: {output_file}")
        print(f"   Nodes: {len(inf_json['nodes'])}")
        print(f"   Connections: {len(inf_json['connections'])}")
        print(f"   Groups: {len(inf_json['groups'])}")
        print(f"   Canvas: {inf_json['canvasWidth']}x{inf_json['canvasHeight']}")
        return True
    except Exception as e:
        print(f"❌ ERROR: Failed to write output: {e}")
        return False


def convert_directory(directory: str) -> bool:
    """Convert all YAML files in a directory to Inf JSON"""
    dir_path = Path(directory)

    if not dir_path.exists():
        print(f"❌ ERROR: Directory not found: {directory}")
        return False

    if not dir_path.is_dir():
        print(f"❌ ERROR: Not a directory: {directory}")
        return False

    # Find all .yaml files
    yaml_files = sorted(dir_path.glob('*.yaml'))

    if not yaml_files:
        print(f"⚠️  WARNING: No .yaml files found in {directory}")
        return True

    print(f"\n{'='*60}")
    print(f"Batch Conversion: {directory}")
    print(f"{'='*60}")
    print(f"Found {len(yaml_files)} YAML file(s)\n")

    success_count = 0
    failed_files = []

    for yaml_file in yaml_files:
        output_file = yaml_file.with_suffix('.json')

        print(f"\n{'─'*60}")
        print(f"Processing: {yaml_file.name}")
        print(f"{'─'*60}\n")

        if convert_single_file(str(yaml_file), str(output_file), validate_only=False):
            success_count += 1
        else:
            failed_files.append(yaml_file.name)

    # Print summary
    print(f"\n{'='*60}")
    print(f"Batch Conversion Summary")
    print(f"{'='*60}\n")
    print(f"Total files: {len(yaml_files)}")
    print(f"✅ Success: {success_count}")
    print(f"❌ Failed: {len(failed_files)}")

    if failed_files:
        print(f"\nFailed files:")
        for filename in failed_files:
            print(f"  - {filename}")
        return False

    print(f"\n🎉 All files processed successfully!")
    return True


def main():
    parser = argparse.ArgumentParser(
        description='YAML to Inf JSON converter with Graphviz layout',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Validate a single YAML file
  python3 yaml_convert.py input.yaml --validate

  # Convert a single YAML file to JSON
  python3 yaml_convert.py input.yaml --output output.json

  # Convert all YAML files in a directory (batch mode)
  python3 yaml_convert.py --dir inf-notes/

Note: --validate, --dir, and --output are mutually exclusive.
      Use only one mode at a time.
        '''
    )

    parser.add_argument('input', nargs='?', help='Input YAML file (for single-file mode)')
    parser.add_argument('--dir', metavar='DIR', help='Directory containing YAML files (for batch mode)')
    parser.add_argument('--validate', action='store_true', help='Validate YAML format only (no conversion)')
    parser.add_argument('--output', '-o', metavar='FILE', help='Output JSON file (single-file mode only)')

    args = parser.parse_args()

    # Enforce mutual exclusivity: only one of --validate, --dir, or --output
    mode_flags = [args.validate, args.dir is not None, args.output is not None]
    if sum(mode_flags) > 1:
        parser.error('Cannot use more than one of: --validate, --dir, --output')
    if sum(mode_flags) == 0:
        parser.error('Must specify one of: --validate, --dir, or --output')

    # Determine mode based on which flag is set
    if args.dir:
        # Batch directory conversion mode
        if args.input:
            parser.error('Cannot specify input file with --dir')

        success = convert_directory(args.dir)
        sys.exit(0 if success else 1)

    elif args.validate:
        # Single file validation mode
        if not args.input:
            parser.error('--validate requires an input file')

        success = convert_single_file(args.input, None, validate_only=True)
        sys.exit(0 if success else 1)

    elif args.output:
        # Single file conversion mode
        if not args.input:
            parser.error('--output requires an input file')

        success = convert_single_file(args.input, args.output, validate_only=False)
        sys.exit(0 if success else 1)

    else:
        # Should never reach here due to earlier check
        parser.error('Must specify one of: --validate, --dir, or --output')


if __name__ == '__main__':
    main()
