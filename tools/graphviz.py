#!/usr/bin/env python3
"""
Graphviz Layout Engine for Inf

Computes node positions and sizes using Graphviz automatic layout.
"""

import sys
from typing import Dict, List, Tuple, Optional

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
DEFAULT_CANVAS_WIDTH = 2000
DEFAULT_CANVAS_HEIGHT = 2000


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
    elif node_type == 'table':
        # Table size is calculated from rows/cols, not text
        # This shouldn't be called for tables, but provide a default
        return (TABLE_CELL_WIDTH * 3, TABLE_CELL_HEIGHT * 3)
    else:  # rectangle and others
        width = max(MIN_NODE_WIDTH, text_width + NODE_PADDING)
        height = max(MIN_NODE_HEIGHT, text_height + NODE_PADDING)

    return (int(width), int(height))


def create_graphviz_layout(nodes_yaml: List[Dict], connections_yaml: List[Dict],
                          layout_config: Dict) -> Dict[str, Tuple[float, float]]:
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
    for node in nodes_yaml:
        text = node.get('text', '')
        node_type = node.get('type', 'rectangle')

        # Set shape based on type
        shape = 'box'
        if node_type == 'circle':
            shape = 'circle'
        elif node_type == 'diamond':
            shape = 'diamond'
        elif node_type in ('text', 'code', 'table'):
            shape = 'box'

        G.add_node(text, shape=shape, label=text)

    # Add edges
    for conn in connections_yaml:
        from_node = conn.get('from', '')
        to_node = conn.get('to', '')
        directed = conn.get('directed', True)

        # Handle numeric indices - look up by index
        if isinstance(from_node, int):
            if 0 <= from_node < len(nodes_yaml):
                from_node = nodes_yaml[from_node].get('text', '')
        if isinstance(to_node, int):
            if 0 <= to_node < len(nodes_yaml):
                to_node = nodes_yaml[to_node].get('text', '')

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


def calculate_canvas_bounds(positions: Dict[str, Tuple[int, int]],
                           nodes_yaml: List[Dict]) -> Tuple[int, int]:
    """Calculate required canvas size based on node positions and sizes."""
    if not positions:
        return (DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT)

    min_x = min_y = float('inf')
    max_x = max_y = float('-inf')

    for text, (x, y) in positions.items():
        # Find corresponding node for size
        node = next((n for n in nodes_yaml if n.get('text') == text), None)
        if node:
            node_type = node.get('type', 'rectangle')

            if node_type == 'table':
                # Calculate table size from rows/cols
                table_data = node.get('table', {})
                rows = table_data.get('rows', 3)
                cols = table_data.get('cols', 3)
                width = cols * TABLE_CELL_WIDTH
                height = rows * TABLE_CELL_HEIGHT
            else:
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


def apply_layout(inf_json: Dict, yaml_data: Dict, layout_config: Dict) -> Dict:
    """
    Apply Graphviz layout to an Inf JSON structure.

    Takes an Inf JSON structure (from converter.py) and adds:
    - Node positions (x, y)
    - Node sizes (width, height, or radius)
    - Canvas dimensions (canvasWidth, canvasHeight)
    - Zoom level

    Args:
        inf_json: Inf JSON structure without layout
        yaml_data: Original YAML data (for layout computation)
        layout_config: Layout configuration (engine, rankdir, etc.)

    Returns:
        Complete Inf JSON structure with layout
    """
    nodes_yaml = yaml_data.get('nodes', [])
    connections_yaml = yaml_data.get('connections', [])

    # Create Graphviz layout
    gv_positions = create_graphviz_layout(nodes_yaml, connections_yaml, layout_config)

    # Calculate canvas size
    canvas_width, canvas_height = calculate_canvas_bounds(gv_positions, nodes_yaml)

    # Adjust positions to fit in canvas with padding
    padding = 100
    adjusted_positions = {}
    for text, (gv_x, gv_y) in gv_positions.items():
        inf_x, inf_y = graphviz_to_inf_coords(gv_x, gv_y, canvas_height)
        adjusted_positions[text] = (inf_x + padding, inf_y + padding)

    # Apply positions and sizes to nodes
    for node in inf_json['nodes']:
        text = node['text']
        node_type = node.get('type', 'rectangle')
        position = adjusted_positions.get(text, (500, 500))  # Default if not found
        x, y = position

        # Calculate size
        if node_type == 'table':
            # Table size from rows/cols
            rows = node.get('rows', 3)
            cols = node.get('cols', 3)
            total_width = cols * TABLE_CELL_WIDTH
            total_height = rows * TABLE_CELL_HEIGHT
            node['x'] = x - total_width // 2
            node['y'] = y - total_height // 2
        elif node_type == 'circle':
            width, height = calculate_text_dimensions(text, node_type)
            node['x'] = x  # Center x
            node['y'] = y  # Center y
            node['radius'] = width  # width is radius for circles
        elif node_type == 'diamond':
            width, height = calculate_text_dimensions(text, node_type)
            node['x'] = x - width // 2  # Top-left x
            node['y'] = y - height // 2  # Top-left y
            node['width'] = width
            node['height'] = height
        else:  # rectangle, text, code
            width, height = calculate_text_dimensions(text, node_type)
            node['x'] = x - width // 2  # Top-left x
            node['y'] = y - height // 2  # Top-left y
            node['width'] = width
            node['height'] = height

    # Add canvas properties
    inf_json['canvasWidth'] = canvas_width
    inf_json['canvasHeight'] = canvas_height
    inf_json['zoom'] = 1.0

    return inf_json
