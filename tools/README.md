# Inf Tools

Python utilities for working with Inf diagram files.

## Modules

### converter.py

Core conversion module that translates YAML diagram descriptions into Inf JSON structure.

**Responsibilities:**
- Parse YAML files
- Validate node references and structure
- Resolve subgraph paths
- Create Inf JSON nodes, connections, and groups
- **Does NOT** compute layout or sizes

**Key Functions:**
- `parse_yaml_file(file_path)` - Parse YAML file
- `convert_yaml_to_inf(yaml_path, validate_only)` - Convert YAML to Inf structure
- `create_inf_node(...)` - Create node structure
- `create_inf_connection(...)` - Create connection structure
- `create_inf_group(...)` - Create group structure
- `resolve_subgraph_path(...)` - Resolve subgraph file references

### graphviz.py

Graphviz layout engine that computes node positions and sizes.

**Responsibilities:**
- Calculate text dimensions for nodes
- Create Graphviz graph and compute layout
- Transform Graphviz coordinates to Inf coordinates
- Calculate canvas bounds
- Apply positions and sizes to nodes

**Key Functions:**
- `calculate_text_dimensions(text, node_type)` - Calculate node size
- `create_graphviz_layout(nodes, connections, layout_config)` - Compute positions
- `apply_layout(inf_json, yaml_data, layout_config)` - Apply layout to Inf structure
- `calculate_canvas_bounds(positions, nodes)` - Calculate canvas size

## Scripts

### yaml2inf.py

Main conversion script. Orchestrates the conversion process by calling converter.py and graphviz.py.

**Usage:**
```bash
python3 tools/yaml2inf.py <folder> [options]

# Examples
python3 tools/yaml2inf.py diagrams/ --verbose
python3 tools/yaml2inf.py project/ --engine neato --rankdir LR
python3 tools/yaml2inf.py docs/ --validate --verbose
```

**Options:**
- `--engine` - Graphviz layout engine (dot, neato, fdp, circo, twopi)
- `--rankdir` - Rank direction (TB, LR, BT, RL)
- `--ranksep` - Vertical separation in inches
- `--nodesep` - Horizontal separation in inches
- `--verbose` - Print detailed information
- `--debug` - Enable debug logging (very detailed output)
- `--validate` - Validate YAML without generating JSON

**Process:**
1. Find all YAML files in folder
2. For each file:
   - Call `converter.convert_yaml_to_inf()` to get structure
   - Call `graphviz.apply_layout()` to add positions/sizes
   - Write JSON file
3. Print summary

### yaml_checker.py

Validation-only script. Checks a single YAML file without generating JSON.

**Usage:**
```bash
python3 tools/yaml_checker.py <file.yaml> [--debug]

# Examples
python3 tools/yaml_checker.py inf-notes/root.yaml
python3 tools/yaml_checker.py diagrams/system.yaml --debug
```

**Options:**
- `--debug` - Enable debug logging (very detailed output)

**Process:**
1. Call `converter.convert_yaml_to_inf()` in validation mode
2. Report structure (nodes, connections, groups)
3. Exit with status code (0 = valid, 1 = invalid)

## Architecture

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

## Design Principles

**Separation of Concerns:**
- `converter.py` - Pure data transformation (YAML → Inf structure)
- `graphviz.py` - Pure layout computation (positions & sizes)
- `yaml2inf.py` - Orchestration & I/O
- `yaml_checker.py` - Validation-only wrapper

**Modularity:**
- Each module can be imported and used independently
- `converter.py` and `graphviz.py` are libraries, not scripts
- Easy to test and extend

**Single Responsibility:**
- Converter doesn't know about layout
- Graphviz doesn't know about file I/O
- Each function does one thing well

## Dependencies

- **PyYAML** - YAML parsing (`pip install pyyaml`)
- **pygraphviz** - Graphviz layout (`pip install pygraphviz`)
  - Alternative: networkx (`pip install networkx`)
- **Graphviz** - Graph visualization system (system package)

## Logging

All modules use Python's `logging` module for debug output:

**Log Levels:**
- **WARNING** (default) - Only show warnings and errors
- **INFO** (--verbose) - Show conversion progress and summary
- **DEBUG** (--debug) - Show detailed debugging information

**Debug Logging:**
```bash
# Debug logging shows:
# - File parsing details
# - Node/connection/group creation
# - Subgraph resolution
# - Layout computation steps
# - Coordinate transformations
# - Canvas calculations

python3 tools/yaml2inf.py project/ --debug
python3 tools/yaml_checker.py file.yaml --debug
```

**Log Format:**
- `--debug`: `HH:MM:SS [LEVEL] module: message`
- `--verbose`: `HH:MM:SS [LEVEL] message`
- Default: `LEVEL: message`

## Testing

```bash
# Validate a single YAML file
python3 tools/yaml_checker.py test-data/root.yaml

# Validate with debug logging
python3 tools/yaml_checker.py test-data/root.yaml --debug

# Validate all YAML files in a folder
python3 tools/yaml2inf.py test-data/ --validate --verbose

# Convert with verbose output
python3 tools/yaml2inf.py test-data/ --verbose

# Convert with debug logging
python3 tools/yaml2inf.py test-data/ --debug

# Try different layout engines
python3 tools/yaml2inf.py test-data/ --engine neato --verbose
```
