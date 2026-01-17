#!/usr/bin/env python3
"""
Build script for Inf diagram app.
Merges separate source files into single index.html.

Usage:
    python3 build.py           # Build only
    python3 build.py --check   # Build and validate
"""

import os
import sys
from pathlib import Path
from datetime import datetime

def read_file(path):
    """Read file content."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def build():
    """Build single index.html from source files."""
    print("🔨 Building Inf...")

    src_dir = Path('src')

    # Read template
    template = read_file(src_dir / 'template.html')

    # Read CSS
    css = read_file(src_dir / 'styles.css')

    # Read JavaScript files in dependency order
    js_files = [
        'constants.js',
        'state.js',
        'autoSave.js',
        'uiHelpers.js',
        'fileOperations.js',
        'nodeManager.js',
        'connectionManager.js',
        'renderer.js',
        'eventHandlers.js',
        'main.js'
    ]

    js_content = '\n\n'.join(
        f"// ===== {filename} =====\n{read_file(src_dir / filename)}"
        for filename in js_files
    )

    # Replace placeholders
    output = template.replace('<!-- CSS -->', css)
    output = output.replace('<!-- JS -->', js_content)

    # Add build timestamp comment
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    comment = f"<!-- Built: {timestamp} -->\n"
    output = comment + output

    # Write output
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(output)

    # Calculate sizes
    src_size = sum(os.path.getsize(src_dir / f) for f in js_files)
    src_size += os.path.getsize(src_dir / 'template.html')
    src_size += os.path.getsize(src_dir / 'styles.css')
    output_size = os.path.getsize('index.html')

    print(f"✅ Build complete!")
    print(f"   Source files: {src_size:,} bytes")
    print(f"   Output: {output_size:,} bytes")
    print(f"   index.html ready to use")

if __name__ == '__main__':
    build()

    # Run check if --check flag is provided
    if '--check' in sys.argv:
        print()
        import subprocess
        result = subprocess.run([sys.executable, 'check.py'], cwd=os.getcwd())
        sys.exit(result.returncode)
