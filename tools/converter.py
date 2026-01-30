#!/usr/bin/env python3
"""
YAML to Inf JSON Converter (Core Module)

Converts YAML diagram descriptions into Inf JSON structure.
Does NOT compute layout or sizes - that's handled by graphviz.py
"""

import json
import logging
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

# Setup logger
logger = logging.getLogger(__name__)

# Add a NullHandler by default (scripts can configure their own handlers)
logger.addHandler(logging.NullHandler())

# Constants
INF_VERSION = "2.5"
TABLE_CELL_WIDTH = 100
TABLE_CELL_HEIGHT = 40


def parse_yaml_file(file_path: str) -> Dict:
    """Parse a YAML file and return the data structure."""
    logger.debug(f"Parsing YAML file: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if data is None:
                logger.warning(f"Empty YAML file: {file_path}")
                return {}
            logger.debug(f"Successfully parsed {file_path}")
            return data
    except yaml.YAMLError as e:
        logger.error(f"YAML parsing error in {file_path}: {e}")
        raise ValueError(f"Invalid YAML in {file_path}: {e}")
    except Exception as e:
        logger.error(f"File reading error for {file_path}: {e}")
        raise IOError(f"Failed to read {file_path}: {e}")


def resolve_subgraph_path(base_dir: str, node_text: str, subgraph_hint: Optional[str],
                         yaml_path: str = "", node_index: int = -1) -> Optional[str]:
    """
    Resolve subgraph file path.

    Priority:
    1. Explicit subgraph hint if provided (must be .yaml file)
    2. No implicit detection
    """
    base_path = Path(base_dir)

    if subgraph_hint:
        logger.debug(f"Resolving subgraph for node '{node_text}': {subgraph_hint}")

        # Embedded subgraphs (dicts) are not supported in YAML format
        if isinstance(subgraph_hint, dict):
            location = f"{yaml_path}:node[{node_index}]" if yaml_path else f"node[{node_index}]"
            msg = f"{location}: Node '{node_text}' has embedded subgraph (dict). " \
                  "YAML format only supports file-based subgraphs (strings). " \
                  "Use 'subgraph: \"file.yaml\"' instead."
            logger.warning(msg)
            warnings.warn(msg)
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
            logger.debug(f"Resolved subgraph path: {path}")
            return str(path)
        else:
            msg = f"Subgraph file not found: {path}"
            logger.warning(msg)
            warnings.warn(msg)
            return None

    # No implicit detection - subgraphs must be explicitly specified
    return None


def create_inf_node(node_id: int, node_yaml: Dict, base_dir: str,
                   yaml_path: str = "", node_index: int = -1) -> Dict:
    """
    Create an Inf JSON node from YAML description.

    Position and size are NOT set here - they're added later by the layout engine.
    """
    text = node_yaml.get('text', '')
    node_type = node_yaml.get('type', 'rectangle')
    align = node_yaml.get('align', 'center')

    logger.debug(f"Creating node {node_id}: type={node_type}, text='{text[:30]}...'")

    # Base node structure
    inf_node = {
        'id': node_id,
        'type': node_type,
        'text': text,
        'textAlign': align
    }

    # Handle table structure
    if node_type == 'table':
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

        inf_node['rows'] = rows
        inf_node['cols'] = cols
        inf_node['colWidths'] = [TABLE_CELL_WIDTH] * cols
        inf_node['rowHeights'] = [TABLE_CELL_HEIGHT] * rows
        inf_node['cells'] = cells
        inf_node['editingCell'] = None

    # Handle subgraph
    subgraph_hint = node_yaml.get('subgraph')
    subgraph_path = resolve_subgraph_path(base_dir, text, subgraph_hint, yaml_path, node_index)

    if subgraph_path:
        # File-based subgraph - store relative path
        rel_path = os.path.relpath(subgraph_path, base_dir)
        # Convert to JSON filename
        json_path = rel_path.replace('.yaml', '.json')
        inf_node['subgraph'] = json_path

    return inf_node


def create_inf_connection(conn_id: int, conn_yaml: Dict, node_map: Dict[str, int],
                         nodes_yaml: List[Dict]) -> Optional[Dict]:
    """
    Create an Inf JSON connection from YAML description.

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


def create_inf_group(group_id: int, group_yaml: Dict, node_map: Dict[str, int],
                    nodes_yaml: List[Dict]) -> Optional[Dict]:
    """
    Create an Inf JSON group from YAML description.

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


def convert_yaml_to_inf(yaml_path: str, validate_only: bool = False) -> Optional[Dict]:
    """
    Convert a single YAML file to Inf JSON structure (without layout).

    Args:
        yaml_path: Path to YAML file
        validate_only: If True, only validate structure without converting

    Returns:
        Dictionary with INF structure and metadata, or None on error
        {
            'inf_json': {...},  # Inf JSON structure (nodes without positions/sizes)
            'yaml_data': {...}, # Original YAML data
            'node_map': {...},  # Mapping from node text to node ID
            'base_dir': str     # Base directory for resolving subgraphs
        }
    """
    logger.info(f"Converting YAML to Inf: {yaml_path} (validate_only={validate_only})")
    base_dir = os.path.dirname(yaml_path) or '.'

    # Parse YAML
    try:
        data = parse_yaml_file(yaml_path)
    except Exception as e:
        logger.error(f"Failed to parse {yaml_path}: {e}")
        print(f"  ERROR: {e}")
        return None

    nodes_yaml = data.get('nodes', [])
    connections_yaml = data.get('connections', [])
    groups_yaml = data.get('groups', [])

    logger.debug(f"Found {len(nodes_yaml)} nodes, {len(connections_yaml)} connections, {len(groups_yaml)} groups")

    if not nodes_yaml:
        msg = f"No nodes in {yaml_path}"
        logger.warning(msg)
        warnings.warn(msg)
        return None

    # Generate Inf JSON structure (without layout)
    next_id = 1
    inf_nodes = []
    node_text_to_id = {}

    # Create nodes (without positions/sizes)
    for node_index, node_yaml in enumerate(nodes_yaml):
        text = node_yaml.get('text', '')
        inf_node = create_inf_node(next_id, node_yaml, base_dir, yaml_path, node_index)
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

    # Create INF structure (without canvas size and zoom - added by layout engine)
    inf_json = {
        'version': INF_VERSION,
        'nodes': inf_nodes,
        'connections': inf_connections,
        'groups': inf_groups,
        'nextId': next_id
    }

    logger.info(f"Successfully converted {yaml_path}: {len(inf_nodes)} nodes, "
                f"{len(inf_connections)} connections, {len(inf_groups)} groups")

    return {
        'inf_json': inf_json,
        'yaml_data': data,
        'node_map': node_text_to_id,
        'base_dir': base_dir
    }
