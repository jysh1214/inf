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
import logging
import os
import sys
from pathlib import Path
from typing import List

# Import our modules
try:
    from converter import convert_yaml_to_inf
    from graphviz import apply_layout
except ImportError:
    # Try relative import if running as script
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from converter import convert_yaml_to_inf
    from graphviz import apply_layout

# Setup logger
logger = logging.getLogger(__name__)


def find_yaml_files(folder: str) -> List[str]:
    """Find all YAML files in folder recursively."""
    yaml_files = []
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.yaml'):
                yaml_files.append(os.path.join(root, file))
    return sorted(yaml_files)


def process_yaml_file(yaml_path: str, args: argparse.Namespace) -> bool:
    """
    Process a single YAML file: convert and apply layout.

    Args:
        yaml_path: Path to YAML file
        args: Command-line arguments

    Returns:
        True if successful, False otherwise
    """
    if args.verbose:
        print(f"  Converting: {yaml_path}")

    # Step 1: Convert YAML to Inf structure (without layout)
    result = convert_yaml_to_inf(yaml_path, validate_only=args.validate)

    if result is None:
        print(f"  ERROR: Failed to convert {yaml_path}")
        return False

    inf_json = result['inf_json']
    yaml_data = result['yaml_data']

    if args.verbose:
        nodes_count = len(inf_json['nodes'])
        conns_count = len(inf_json['connections'])
        groups_count = len(inf_json['groups'])
        print(f"    Nodes: {nodes_count}, Connections: {conns_count}, Groups: {groups_count}")

    # If validation only, skip layout and file writing
    if args.validate:
        if args.verbose:
            print(f"    ✓ Validated: {yaml_path}")
        return True

    # Step 2: Build layout configuration
    layout_config = yaml_data.get('layout', {})

    # Override with command-line arguments
    if args.engine:
        layout_config['engine'] = args.engine
    if args.rankdir:
        layout_config['rankdir'] = args.rankdir
    if args.ranksep:
        layout_config['ranksep'] = args.ranksep
    if args.nodesep:
        layout_config['nodesep'] = args.nodesep

    if args.verbose:
        engine = layout_config.get('engine', 'dot')
        rankdir = layout_config.get('rankdir', 'TB')
        print(f"    Layout: {engine} ({rankdir})")

    # Step 3: Apply layout (compute positions and sizes)
    try:
        inf_json = apply_layout(inf_json, yaml_data, layout_config)
    except Exception as e:
        print(f"  ERROR: Layout failed for {yaml_path}: {e}")
        return False

    # Step 4: Write JSON file
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


def main():
    parser = argparse.ArgumentParser(
        description='Convert YAML diagram descriptions to Inf JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 tools/yaml2inf.py diagrams/
  python3 tools/yaml2inf.py project/ --engine neato --verbose
  python3 tools/yaml2inf.py docs/ --rankdir LR --ranksep 2.0
  python3 tools/yaml2inf.py project/ --validate --verbose
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
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging (very detailed output)')
    parser.add_argument('--strict', action='store_true',
                        help='Treat warnings as errors (exit on first warning)')
    parser.add_argument('--validate', action='store_true',
                        help='Validate YAML files without generating JSON')

    args = parser.parse_args()

    # Configure logging
    if args.debug:
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%H:%M:%S'
        )
        logger.info("Debug logging enabled")
    elif args.verbose:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
    else:
        # Only show warnings and errors
        logging.basicConfig(
            level=logging.WARNING,
            format='%(levelname)s: %(message)s'
        )

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

    # Process each file
    success_count = 0
    for yaml_file in yaml_files:
        if process_yaml_file(yaml_file, args):
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
