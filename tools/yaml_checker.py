#!/usr/bin/env python3
"""
YAML Validator for Inf

Simple wrapper that validates a single YAML file without generating JSON.
Checks structure, node references, and subgraph paths.

Usage:
    python3 tools/yaml_checker.py <file.yaml>

Example:
    python3 tools/yaml_checker.py inf-notes/root.yaml
"""

import argparse
import logging
import os
import sys

# Import converter module
try:
    from converter import convert_yaml_to_inf
except ImportError:
    sys.path.insert(0, os.path.dirname(__file__))
    from converter import convert_yaml_to_inf

# Setup logger
logger = logging.getLogger(__name__)


def validate_yaml_file(yaml_path: str) -> bool:
    """
    Validate a single YAML file.

    Args:
        yaml_path: Path to YAML file

    Returns:
        True if valid, False otherwise
    """
    print(f"Validating: {yaml_path}")

    # Use converter in validation mode
    result = convert_yaml_to_inf(yaml_path, validate_only=True)

    if result is None:
        print("✗ Invalid structure")
        return False

    nodes_count = len(result['inf_json']['nodes'])
    conns_count = len(result['inf_json']['connections'])
    groups_count = len(result['inf_json']['groups'])

    print(f"  Nodes: {nodes_count}")
    print(f"  Connections: {conns_count}")
    print(f"  Groups: {groups_count}")
    print("✓ Valid")

    return True


def main():
    parser = argparse.ArgumentParser(
        description='Validate a single YAML diagram file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 tools/yaml_checker.py inf-notes/root.yaml
  python3 tools/yaml_checker.py diagrams/system.yaml
        """
    )

    parser.add_argument('file', help='YAML file to validate')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging (very detailed output)')

    args = parser.parse_args()

    # Configure logging
    if args.debug:
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%H:%M:%S'
        )
        logger.info("Debug logging enabled")
    else:
        # Only show warnings and errors
        logging.basicConfig(
            level=logging.WARNING,
            format='%(levelname)s: %(message)s'
        )

    # Validate file exists
    if not os.path.isfile(args.file):
        print(f"ERROR: File not found: {args.file}")
        sys.exit(1)

    # Validate it's a YAML file
    if not args.file.endswith('.yaml'):
        print(f"ERROR: Not a YAML file: {args.file}")
        sys.exit(1)

    # Validate the file
    if validate_yaml_file(args.file):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
