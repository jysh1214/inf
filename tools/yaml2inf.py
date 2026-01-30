#!/usr/bin/env python3
"""
YAML to Inf JSON Converter

Converts abstract YAML diagram descriptions into positioned Inf JSON files
using automatic layout via Graphviz.

Usage:
    python3 tools/yaml2inf.py <folder> [options]

Example:
    python3 tools/yaml2inf.py diagrams/ --engine dot --rankdir LR --verbose
"""

import argparse
import json
import os
import sys
import warnings
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Install with: pip install pyyaml")
    sys.exit(1)

try:
    import pygraphviz as pgv
    GRAPHVIZ_AVAILABLE = True
except ImportError:
    try:
        import networkx as nx
        from networkx.drawing.nx_agraph import graphviz_layout
        GRAPHVIZ_AVAILABLE = True
    except ImportError:
        print("ERROR: Graphviz not available. Install with:")
        print("  pip install pygraphviz")
        print("  or")
        print("  pip install networkx")
        sys.exit(1)

# Constants
INF_VERSION = "2.5"
DEFAULT_CANVAS_WIDTH = 2000
DEFAULT_CANVAS_HEIGHT = 2000

# Size calculation constants
CHAR_WIDTH = 8  # Average character width in pixels
LINE_HEIGHT = 18  # Line height in pixels
MIN_NODE_WIDTH = 120
MIN_NODE_HEIGHT = 80
TEXT_NODE_WIDTH = 150
TEXT_NODE_HEIGHT = 60
CODE_NODE_WIDTH = 200
CODE_NODE_HEIGHT = 100
CIRCLE_MIN_RADIUS = 50
DIAMOND_MIN_SIZE = 100
TABLE_CELL_WIDTH = 100
TABLE_CELL_HEIGHT = 40
NODE_PADDING = 20

# Layout constants
DPI = 72  # Graphviz DPI
SCREEN_DPI = 96  # Screen DPI for conversion
SCALE_FACTOR = SCREEN_DPI / DPI


def parse_yaml_file(file_path: str) -> Dict:
    """Parse a YAML file and return the data structure."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if data is None:
                return {}
            return data
    except yaml.YAMLError as e:
        print(f"ERROR: Invalid YAML in {file_path}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to read {file_path}: {e}")
        sys.exit(1)


def calculate_text_dimensions(text: str, node_type: str = 'rectangle') -> Tuple[int, int]:
    """Calculate required width and height for text content."""
    if not text:
        text = " "  # Minimum size for empty nodes

    lines = text.split('\n')
    max_line_length = max(len(line) for line in lines) if lines else 1
    num_lines = len(lines)

    # Calculate base dimensions
    text_width = max_line_length * CHAR_WIDTH
    text_height = num_lines * LINE_HEIGHT

    # Add padding and enforce minimums based on type
    if node_type == 'text':
        width = max(TEXT_NODE_WIDTH, text_width + NODE_PADDING)
        height = max(TEXT_NODE_HEIGHT, text_height + NODE_PADDING)
    elif node_type == 'code':
        width = max(CODE_NODE_WIDTH, text_width + NODE_PADDING * 2)
        height = max(CODE_NODE_HEIGHT, text_height + NODE_PADDING)
    elif node_type == 'circle':
        size = max(text_width, text_height) + NODE_PADDING
        radius = max(CIRCLE_MIN_RADIUS, size / 2)
        return (radius, radius)  # Return radius for circles
    elif node_type == 'diamond':
        size = max(text_width, text_height) + NODE_PADDING * 2
        size = max(DIAMOND_MIN_SIZE, size)
        return (size, size)
    else:  # rectangle and others
        width = max(MIN_NODE_WIDTH, text_width + NODE_PADDING)
        height = max(MIN_NODE_HEIGHT, text_height + NODE_PADDING)

    return (int(width), int(height))


def resolve_subgraph_path(base_dir: str, node_text: str, subgraph_hint: Optional[str], yaml_path: str = "", node_index: int = -1) -> Optional[str]:
    """
    Resolve subgraph file path.

    Priority:
    1. Explicit subgraph hint if provided
    2. <node_text>.yaml in same directory
    3. <node_text>/<node_text>.yaml subdirectory
    """
    base_path = Path(base_dir)

    if subgraph_hint:
        # Embedded subgraphs (dicts) are not supported in YAML format
        if isinstance(subgraph_hint, dict):
            location = f"{yaml_path}:node[{node_index}]" if yaml_path else f"node[{node_index}]"
            warnings.warn(f"{location}: Node '{node_text}' has embedded subgraph (dict). YAML format only supports file-based subgraphs (strings). Use 'subgraph: \"file.yaml\"' instead.")
            return None

        # Explicit hint provided (string)
        if subgraph_hint.endswith('.yaml'):
            path = base_path / subgraph_hint
        else:
            # Try as directory
            path = base_path / subgraph_hint / f"{subgraph_hint}.yaml"
            if not path.exists():
                path = base_path / f"{subgraph_hint}.yaml"

        if path.exists():
            return str(path)
        else:
            warnings.warn(f"Subgraph file not found: {path}")
            return None

    # No implicit detection - subgraphs must be explicitly specified
    return None


def create_graphviz_layout(nodes: List[Dict], connections: List[Dict], layout_config: Dict) -> Dict[str, Tuple[float, float]]:
    """
    Create graph layout using Graphviz and return node positions.
    Returns dict mapping node text to (x, y) coordinates in points.
    """
    engine = layout_config.get('engine', 'dot')
    rankdir = layout_config.get('rankdir', 'TB')
    ranksep = layout_config.get('ranksep', 1.0)
    nodesep = layout_config.get('nodesep', 0.5)
    splines = layout_config.get('splines', 'spline')

    # Create graph using pygraphviz
    G = pgv.AGraph(directed=True, strict=False)
    G.graph_attr['rankdir'] = rankdir
    G.graph_attr['ranksep'] = str(ranksep)
    G.graph_attr['nodesep'] = str(nodesep)
    G.graph_attr['splines'] = splines
    G.node_attr['shape'] = 'box'
    G.node_attr['fontsize'] = '12'

    # Add nodes
    for node in nodes:
        text = node['text']
        node_type = node.get('type', 'rectangle')

        # Set shape based on type
        shape = 'box'
        if node_type == 'circle':
            shape = 'circle'
        elif node_type == 'diamond':
            shape = 'diamond'
        elif node_type in ('text', 'code'):
            shape = 'box'

        G.add_node(text, shape=shape, label=text)

    # Add edges
    for conn in connections:
        from_node = conn['from']
        to_node = conn['to']
        directed = conn.get('directed', True)

        if directed:
            G.add_edge(from_node, to_node)
        else:
            G.add_edge(from_node, to_node, dir='none')

    # Compute layout
    G.layout(prog=engine)

    # Extract positions
    positions = {}
    for node in G.nodes():
        pos_str = node.attr['pos']
        # Position is in format "x,y" in points
        x, y = map(float, pos_str.split(','))
        positions[str(node)] = (x, y)

    return positions


def graphviz_to_inf_coords(gv_x: float, gv_y: float, canvas_height: int) -> Tuple[int, int]:
    """
    Convert Graphviz coordinates (points, bottom-left origin) to
    Inf coordinates (pixels, top-left origin).
    """
    # Scale from points to pixels
    inf_x = gv_x * SCALE_FACTOR
    inf_y = canvas_height - (gv_y * SCALE_FACTOR)  # Flip Y axis

    return (int(inf_x), int(inf_y))


def create_inf_node(node_id: int, node_yaml: Dict, position: Tuple[int, int], base_dir: str, yaml_path: str = "", node_index: int = -1) -> Dict:
    """Create an Inf JSON node from YAML description and calculated position."""
    text = node_yaml.get('text', '')
    node_type = node_yaml.get('type', 'rectangle')
    align = node_yaml.get('align', 'center')

    # Base node structure
    inf_node = {
        'id': node_id,
        'type': node_type,
        'text': text,
        'textAlign': align
    }

    # Calculate size
    width, height = calculate_text_dimensions(text, node_type)

    # Set position and size based on type
    x, y = position

    if node_type == 'circle':
        inf_node['x'] = x  # Center x
        inf_node['y'] = y  # Center y
        inf_node['radius'] = width  # width is radius for circles
    elif node_type == 'diamond':
        inf_node['x'] = x - width // 2  # Top-left x
        inf_node['y'] = y - height // 2  # Top-left y
        inf_node['width'] = width
        inf_node['height'] = height
    elif node_type == 'table':
        # Handle table structure
        table_data = node_yaml.get('table', {})
        rows = table_data.get('rows', 3)
        cols = table_data.get('cols', 3)
        cells_data = table_data.get('cells', {})

        # Create cell structure
        cells = []
        for row in range(rows):
            row_cells = []
            for col in range(cols):
                cell_key = f"[{row}, {col}]"
                cell_text = cells_data.get(cell_key, '')
                row_cells.append({
                    'text': cell_text,
                    'textAlign': 'center'
                })
            cells.append(row_cells)

        total_width = cols * TABLE_CELL_WIDTH
        total_height = rows * TABLE_CELL_HEIGHT

        inf_node['x'] = x - total_width // 2
        inf_node['y'] = y - total_height // 2
        inf_node['rows'] = rows
        inf_node['cols'] = cols
        inf_node['colWidths'] = [TABLE_CELL_WIDTH] * cols
        inf_node['rowHeights'] = [TABLE_CELL_HEIGHT] * rows
        inf_node['cells'] = cells
        inf_node['editingCell'] = None
    else:  # rectangle, text, code
        inf_node['x'] = x - width // 2  # Top-left x
        inf_node['y'] = y - height // 2  # Top-left y
        inf_node['width'] = width
        inf_node['height'] = height

    # Handle subgraph
    subgraph_hint = node_yaml.get('subgraph')
    subgraph_path = resolve_subgraph_path(base_dir, text, subgraph_hint, yaml_path, node_index)

    if subgraph_path:
        # File-based subgraph - store relative path
        rel_path = os.path.relpath(subgraph_path, base_dir)
        # Convert to JSON filename
        json_path = rel_path.replace('.yaml', '.json')
        inf_node['subgraph'] = json_path
    elif subgraph_hint:
        # Subgraph was specified but not found - already warned in resolve_subgraph_path
        pass

    return inf_node


def create_inf_connection(conn_id: int, conn_yaml: Dict, node_map: Dict[str, int], nodes_yaml: List[Dict]) -> Optional[Dict]:
    """Create an Inf JSON connection from YAML description.

    Supports both numeric indices (0-based) and text-based node references.
    """
    from_ref = conn_yaml.get('from', '')
    to_ref = conn_yaml.get('to', '')
    directed = conn_yaml.get('directed', True)

    # Helper to resolve node reference (numeric index or text)
    def resolve_node_id(ref):
        # If it's an integer, treat as array index
        if isinstance(ref, int):
            if 0 <= ref < len(nodes_yaml):
                node_text = nodes_yaml[ref].get('text', '')
                return node_map.get(node_text)
            else:
                warnings.warn(f"Node index {ref} out of range (0-{len(nodes_yaml)-1})")
                return None
        # Otherwise treat as text lookup
        else:
            if ref in node_map:
                return node_map[ref]
            else:
                warnings.warn(f"Node text '{ref}' not found in nodes")
                return None

    from_id = resolve_node_id(from_ref)
    to_id = resolve_node_id(to_ref)

    if from_id is None or to_id is None:
        return None

    return {
        'id': conn_id,
        'fromId': from_id,
        'toId': to_id,
        'directed': directed
    }


def create_inf_group(group_id: int, group_yaml: Dict, node_map: Dict[str, int], nodes_yaml: List[Dict]) -> Optional[Dict]:
    """Create an Inf JSON group from YAML description.

    Supports both numeric indices (0-based) and text-based node references.
    """
    name = group_yaml.get('name', 'Group')
    node_refs = group_yaml.get('nodes', [])

    # Resolve node IDs
    node_ids = []
    for ref in node_refs:
        # If it's an integer, treat as array index
        if isinstance(ref, int):
            if 0 <= ref < len(nodes_yaml):
                node_text = nodes_yaml[ref].get('text', '')
                node_id = node_map.get(node_text)
                if node_id:
                    node_ids.append(node_id)
            else:
                warnings.warn(f"Group '{name}' references node index {ref} out of range (0-{len(nodes_yaml)-1})")
        # Otherwise treat as text lookup
        else:
            if ref in node_map:
                node_ids.append(node_map[ref])
            else:
                warnings.warn(f"Group '{name}' references unknown node '{ref}'")

    if len(node_ids) < 1:
        warnings.warn(f"Group '{name}' has no valid nodes, skipping")
        return None

    return {
        'id': group_id,
        'name': name,
        'nodeIds': node_ids
    }


def calculate_canvas_bounds(positions: Dict[str, Tuple[int, int]], nodes: List[Dict]) -> Tuple[int, int]:
    """Calculate required canvas size based on node positions and sizes."""
    if not positions:
        return (DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT)

    min_x = min_y = float('inf')
    max_x = max_y = float('-inf')

    for text, (x, y) in positions.items():
        # Find corresponding node for size
        node = next((n for n in nodes if n.get('text') == text), None)
        if node:
            node_type = node.get('type', 'rectangle')
            width, height = calculate_text_dimensions(node.get('text', ''), node_type)

            min_x = min(min_x, x - width // 2)
            max_x = max(max_x, x + width // 2)
            min_y = min(min_y, y - height // 2)
            max_y = max(max_y, y + height // 2)

    # Add padding
    padding = 100
    canvas_width = int(max_x - min_x + padding * 2)
    canvas_height = int(max_y - min_y + padding * 2)

    # Enforce minimums and maximums
    canvas_width = max(1000, min(canvas_width, 20000))
    canvas_height = max(1000, min(canvas_height, 20000))

    return (canvas_width, canvas_height)


def convert_yaml_to_inf(yaml_path: str, args: argparse.Namespace) -> bool:
    """Convert a single YAML file to Inf JSON format."""
    base_dir = os.path.dirname(yaml_path)
    error_count = 0  # Track errors for strict mode

    # Parse YAML
    data = parse_yaml_file(yaml_path)

    nodes_yaml = data.get('nodes', [])
    connections_yaml = data.get('connections', [])
    groups_yaml = data.get('groups', [])
    layout_config = data.get('layout', {})

    # Override layout config with command-line arguments
    if args.engine:
        layout_config['engine'] = args.engine
    if args.rankdir:
        layout_config['rankdir'] = args.rankdir
    if args.ranksep:
        layout_config['ranksep'] = args.ranksep
    if args.nodesep:
        layout_config['nodesep'] = args.nodesep

    if not nodes_yaml:
        if args.verbose:
            print(f"  WARNING: No nodes in {yaml_path}, skipping")
        return False

    if args.verbose:
        print(f"  Converting: {yaml_path}")
        print(f"    Nodes: {len(nodes_yaml)}, Connections: {len(connections_yaml)}, Groups: {len(groups_yaml)}")
        print(f"    Layout: {layout_config.get('engine', 'dot')} ({layout_config.get('rankdir', 'TB')})")

    # Create graph layout
    try:
        gv_positions = create_graphviz_layout(nodes_yaml, connections_yaml, layout_config)
    except Exception as e:
        print(f"  ERROR: Layout failed for {yaml_path}: {e}")
        return False

    # Calculate canvas size
    canvas_width, canvas_height = calculate_canvas_bounds(gv_positions, nodes_yaml)

    # Adjust positions to fit in canvas with padding
    padding = 100
    adjusted_positions = {}
    for text, (gv_x, gv_y) in gv_positions.items():
        inf_x, inf_y = graphviz_to_inf_coords(gv_x, gv_y, canvas_height)
        adjusted_positions[text] = (inf_x + padding, inf_y + padding)

    # Generate Inf JSON
    next_id = 1
    inf_nodes = []
    node_text_to_id = {}

    # Create nodes
    for node_index, node_yaml in enumerate(nodes_yaml):
        text = node_yaml.get('text', '')
        position = adjusted_positions.get(text, (500, 500))  # Default if not in layout

        inf_node = create_inf_node(next_id, node_yaml, position, base_dir, yaml_path, node_index)
        inf_nodes.append(inf_node)
        node_text_to_id[text] = next_id
        next_id += 1

    # Create connections
    inf_connections = []
    for conn_yaml in connections_yaml:
        inf_conn = create_inf_connection(next_id, conn_yaml, node_text_to_id, nodes_yaml)
        if inf_conn:
            inf_connections.append(inf_conn)
            next_id += 1

    # Create groups
    inf_groups = []
    for group_yaml in groups_yaml:
        inf_group = create_inf_group(next_id, group_yaml, node_text_to_id, nodes_yaml)
        if inf_group:
            inf_groups.append(inf_group)
            next_id += 1

    # Create final JSON structure
    inf_json = {
        'version': INF_VERSION,
        'nodes': inf_nodes,
        'connections': inf_connections,
        'groups': inf_groups,
        'nextId': next_id,
        'canvasWidth': canvas_width,
        'canvasHeight': canvas_height,
        'zoom': 1.0
    }

    # Write JSON file
    json_path = yaml_path.replace('.yaml', '.json')
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(inf_json, f, indent=2)

        if args.verbose:
            print(f"    ✓ Written: {json_path}")

        return True
    except Exception as e:
        print(f"  ERROR: Failed to write {json_path}: {e}")
        return False


def find_yaml_files(folder: str) -> List[str]:
    """Find all YAML files in folder recursively."""
    yaml_files = []
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.yaml'):
                yaml_files.append(os.path.join(root, file))
    return sorted(yaml_files)


def main():
    parser = argparse.ArgumentParser(
        description='Convert YAML diagram descriptions to Inf JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 tools/yaml2inf.py diagrams/
  python3 tools/yaml2inf.py project/ --engine neato --verbose
  python3 tools/yaml2inf.py docs/ --rankdir LR --ranksep 2.0
        """
    )

    parser.add_argument('folder', help='Folder containing YAML files')
    parser.add_argument('--engine', choices=['dot', 'neato', 'fdp', 'circo', 'twopi'],
                        help='Graphviz layout engine (default: dot)')
    parser.add_argument('--rankdir', choices=['TB', 'LR', 'BT', 'RL'],
                        help='Rank direction: TB (top-bottom), LR (left-right), etc.')
    parser.add_argument('--ranksep', type=float,
                        help='Vertical separation in inches (default: 1.0)')
    parser.add_argument('--nodesep', type=float,
                        help='Horizontal separation in inches (default: 0.5)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Print detailed conversion information')
    parser.add_argument('--strict', action='store_true',
                        help='Treat warnings as errors (exit on first warning)')
    parser.add_argument('--validate', action='store_true',
                        help='Validate YAML files without generating JSON')

    args = parser.parse_args()

    # Validate folder
    if not os.path.isdir(args.folder):
        print(f"ERROR: Folder not found: {args.folder}")
        sys.exit(1)

    # Find YAML files
    yaml_files = find_yaml_files(args.folder)

    if not yaml_files:
        print(f"No YAML files found in {args.folder}")
        sys.exit(0)

    print(f"Found {len(yaml_files)} YAML file(s) in {args.folder}")
    print()

    # Convert each file
    success_count = 0
    for yaml_file in yaml_files:
        if convert_yaml_to_inf(yaml_file, args):
            success_count += 1
        print()

    # Summary
    print("=" * 60)
    if args.validate:
        print(f"Validation complete: {success_count}/{len(yaml_files)} files valid")
    else:
        print(f"Conversion complete: {success_count}/{len(yaml_files)} files converted successfully")

    if success_count == len(yaml_files):
        if args.validate:
            print("✓ All files validated successfully!")
        else:
            print("✓ All files converted successfully!")
        sys.exit(0)
    else:
        print(f"⚠ {len(yaml_files) - success_count} file(s) failed")
        sys.exit(1)


if __name__ == '__main__':
    main()
