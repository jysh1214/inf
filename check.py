#!/usr/bin/env python3
"""
Validation script for generated index.html.
Ensures the build process produced valid, complete output.
"""

import os
import re
from pathlib import Path

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def read_file(path):
    """Read file content."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def check_file_exists():
    """Check if index.html exists."""
    if not os.path.exists('index.html'):
        print(f"{Colors.FAIL}✗ index.html not found{Colors.ENDC}")
        print(f"  Run 'python3 build.py' first")
        return False
    print(f"{Colors.OKGREEN}✓ index.html exists{Colors.ENDC}")
    return True

def check_file_size():
    """Check if file size is reasonable."""
    size = os.path.getsize('index.html')
    size_kb = size / 1024

    # Expected range: 50-100 KB (should be around 65-70 KB)
    if size < 50000:
        print(f"{Colors.FAIL}✗ File too small: {size_kb:.1f} KB (expected ~65-70 KB){Colors.ENDC}")
        return False
    elif size > 100000:
        print(f"{Colors.WARNING}⚠ File larger than expected: {size_kb:.1f} KB{Colors.ENDC}")
        return True  # Warning but not failure
    else:
        print(f"{Colors.OKGREEN}✓ File size: {size_kb:.1f} KB{Colors.ENDC}")
        return True

def check_html_structure(content):
    """Check basic HTML structure."""
    checks = [
        ('<!DOCTYPE html>', 'DOCTYPE declaration'),
        ('<html', 'HTML tag'),
        ('<head>', 'HEAD tag'),
        ('<body>', 'BODY tag'),
        ('<style>', 'STYLE tag'),
        ('<script>', 'SCRIPT tag'),
        ('</html>', 'HTML closing tag'),
    ]

    all_passed = True
    for pattern, description in checks:
        if pattern in content:
            print(f"{Colors.OKGREEN}  ✓ {description}{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}  ✗ Missing {description}{Colors.ENDC}")
            all_passed = False

    return all_passed

def check_no_placeholders(content):
    """Ensure all placeholders were replaced."""
    placeholders = ['<!-- CSS -->', '<!-- JS -->']

    found_placeholders = []
    for placeholder in placeholders:
        if placeholder in content:
            found_placeholders.append(placeholder)

    if found_placeholders:
        print(f"{Colors.FAIL}✗ Unreplaced placeholders found:{Colors.ENDC}")
        for p in found_placeholders:
            print(f"  {p}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All placeholders replaced{Colors.ENDC}")
        return True

def check_modules_included(content):
    """Check that all JavaScript modules are included."""
    expected_modules = [
        'constants.js',
        'state.js',
        'autoSave.js',
        'uiHelpers.js',
        'ui.js',
        'fileOperations.js',
        'nodeManager.js',
        'connectionManager.js',
        'renderer.js',
        'eventHandlers.js',
        'main.js'
    ]

    missing_modules = []
    for module in expected_modules:
        marker = f"// ===== {module} ====="
        if marker not in content:
            missing_modules.append(module)

    if missing_modules:
        print(f"{Colors.FAIL}✗ Missing modules:{Colors.ENDC}")
        for m in missing_modules:
            print(f"  {m}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All 11 modules included{Colors.ENDC}")
        return True

def check_css_included(content):
    """Check that CSS is included."""
    # Look for key CSS rules
    css_patterns = [
        '#app-layout',
        '#sidebar',
        '#canvas-container',
        '#canvas',
        '.node-btn',
        'flex-direction: row'
    ]

    missing_patterns = []
    for pattern in css_patterns:
        if pattern not in content:
            missing_patterns.append(pattern)

    if missing_patterns:
        print(f"{Colors.FAIL}✗ Missing CSS patterns:{Colors.ENDC}")
        for p in missing_patterns:
            print(f"  {p}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ CSS included{Colors.ENDC}")
        return True

def check_constants(content):
    """Check that key constants are defined."""
    constants = [
        'const VERSION',
        'const HANDLE_SIZE',
        'const CONNECTION_THRESHOLD',
        'const MIN_NODE_SIZE',
        'const DEFAULT_CIRCLE_RADIUS',
        'const MAX_TEXT_LENGTH',
        'const CURSOR_BLINK_RATE',
        'const CANVAS_SIZE_STEP',
        'const ZOOM_STEP'
    ]

    missing_constants = []
    for const in constants:
        if const not in content:
            missing_constants.append(const)

    if missing_constants:
        print(f"{Colors.FAIL}✗ Missing constants:{Colors.ENDC}")
        for c in missing_constants:
            print(f"  {c}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All constants defined{Colors.ENDC}")
        return True

def check_key_functions(content):
    """Check that key functions are defined."""
    functions = [
        'function render(',
        'function createNode(',
        'function createConnection(',
        'function drawNode(',
        'function drawRectangleNode(',
        'function drawCircleNode(',
        'function drawDiamondNode(',
        'function drawTextNode(',
        'function saveToJSON(',
        'function loadFromJSON(',
        'function exportToPNG(',
        'function autoSave(',
        'function autoLoad(',
        'function triggerAutoSave(',
        'function getMousePos(',
        'function setStatus(',
        'function setNodeType(',
        'function setTextAlign(',
    ]

    missing_functions = []
    for func in functions:
        if func not in content:
            missing_functions.append(func)

    if missing_functions:
        print(f"{Colors.FAIL}✗ Missing functions:{Colors.ENDC}")
        for f in missing_functions:
            print(f"  {f}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All key functions present{Colors.ENDC}")
        return True

def check_event_listeners(content):
    """Check that event listeners are set up."""
    listeners = [
        "canvas.addEventListener('dblclick'",
        "canvas.addEventListener('mousedown'",
        "canvas.addEventListener('mousemove'",
        "canvas.addEventListener('mouseup'",
        "document.addEventListener('keydown'"
    ]

    missing_listeners = []
    for listener in listeners:
        if listener not in content:
            missing_listeners.append(listener)

    if missing_listeners:
        print(f"{Colors.FAIL}✗ Missing event listeners:{Colors.ENDC}")
        for l in missing_listeners:
            print(f"  {l}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All event listeners present{Colors.ENDC}")
        return True

def check_dom_elements(content):
    """Check that key DOM elements are present in HTML."""
    elements = [
        'id="app-layout"',
        'id="sidebar"',
        'id="controls"',
        'id="status"',
        'id="canvas-container"',
        'id="canvas"',
        'id="btn-rectangle"',
        'id="btn-circle"',
        'id="btn-diamond"',
        'id="btn-text"',
        'id="btn-align-left"',
        'id="btn-align-center"',
        'id="btn-align-right"',
        'id="file-input"',
    ]

    missing_elements = []
    for element in elements:
        if element not in content:
            missing_elements.append(element)

    if missing_elements:
        print(f"{Colors.FAIL}✗ Missing DOM elements:{Colors.ENDC}")
        for e in missing_elements:
            print(f"  {e}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ All DOM elements present{Colors.ENDC}")
        return True

def check_build_timestamp(content):
    """Check for build timestamp comment."""
    pattern = r'<!-- Built: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} -->'
    if re.search(pattern, content):
        match = re.search(r'<!-- Built: (.+?) -->', content)
        timestamp = match.group(1)
        print(f"{Colors.OKGREEN}✓ Build timestamp: {timestamp}{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.WARNING}⚠ No build timestamp found{Colors.ENDC}")
        return True  # Warning but not failure

def count_lines(content):
    """Count lines in the file."""
    lines = content.count('\n') + 1
    print(f"{Colors.OKCYAN}  Lines: {lines:,}{Colors.ENDC}")

    # Expected range: 2000-2200 lines
    if lines < 2000:
        print(f"{Colors.WARNING}  ⚠ Fewer lines than expected{Colors.ENDC}")
    elif lines > 2200:
        print(f"{Colors.WARNING}  ⚠ More lines than expected{Colors.ENDC}")

    return True

def check_syntax_errors(content):
    """Basic syntax error detection."""
    issues = []

    # Check for mismatched tags
    open_script = content.count('<script>')
    close_script = content.count('</script>')
    if open_script != close_script:
        issues.append(f"Mismatched script tags: {open_script} open, {close_script} close")

    open_style = content.count('<style>')
    close_style = content.count('</style>')
    if open_style != close_style:
        issues.append(f"Mismatched style tags: {open_style} open, {close_style} close")

    # Check for common JavaScript syntax errors
    if 'function (' in content:  # Space before parenthesis
        issues.append("Potential syntax error: 'function (' (space before paren)")

    if issues:
        print(f"{Colors.FAIL}✗ Potential syntax issues:{Colors.ENDC}")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print(f"{Colors.OKGREEN}✓ No obvious syntax errors{Colors.ENDC}")
        return True

def main():
    """Run all validation checks."""
    print(f"\n{Colors.BOLD}{Colors.HEADER}=== Validating index.html ==={Colors.ENDC}\n")

    # Track results
    results = []

    # 1. File exists
    if not check_file_exists():
        return 1

    # Read file content
    content = read_file('index.html')

    # 2. File size
    print(f"\n{Colors.BOLD}Checking file size...{Colors.ENDC}")
    results.append(check_file_size())

    # 3. HTML structure
    print(f"\n{Colors.BOLD}Checking HTML structure...{Colors.ENDC}")
    results.append(check_html_structure(content))

    # 4. Placeholders
    print(f"\n{Colors.BOLD}Checking placeholders...{Colors.ENDC}")
    results.append(check_no_placeholders(content))

    # 5. Modules
    print(f"\n{Colors.BOLD}Checking JavaScript modules...{Colors.ENDC}")
    results.append(check_modules_included(content))

    # 6. CSS
    print(f"\n{Colors.BOLD}Checking CSS...{Colors.ENDC}")
    results.append(check_css_included(content))

    # 7. Constants
    print(f"\n{Colors.BOLD}Checking constants...{Colors.ENDC}")
    results.append(check_constants(content))

    # 8. Functions
    print(f"\n{Colors.BOLD}Checking key functions...{Colors.ENDC}")
    results.append(check_key_functions(content))

    # 9. Event listeners
    print(f"\n{Colors.BOLD}Checking event listeners...{Colors.ENDC}")
    results.append(check_event_listeners(content))

    # 10. DOM elements
    print(f"\n{Colors.BOLD}Checking DOM elements...{Colors.ENDC}")
    results.append(check_dom_elements(content))

    # 11. Build timestamp
    print(f"\n{Colors.BOLD}Checking build metadata...{Colors.ENDC}")
    results.append(check_build_timestamp(content))

    # 12. Line count
    print(f"\n{Colors.BOLD}Checking file statistics...{Colors.ENDC}")
    results.append(count_lines(content))

    # 13. Syntax errors
    print(f"\n{Colors.BOLD}Checking syntax...{Colors.ENDC}")
    results.append(check_syntax_errors(content))

    # Summary
    print(f"\n{Colors.BOLD}{Colors.HEADER}=== Summary ==={Colors.ENDC}\n")

    passed = sum(results)
    total = len(results)

    if all(results):
        print(f"{Colors.OKGREEN}{Colors.BOLD}✓ All checks passed ({passed}/{total}){Colors.ENDC}")
        print(f"{Colors.OKGREEN}index.html is valid and ready to use!{Colors.ENDC}\n")
        return 0
    else:
        failed = total - passed
        print(f"{Colors.FAIL}{Colors.BOLD}✗ {failed} check(s) failed ({passed}/{total} passed){Colors.ENDC}")
        print(f"{Colors.FAIL}Please fix the issues and rebuild.{Colors.ENDC}\n")
        return 1

if __name__ == '__main__':
    exit(main())
