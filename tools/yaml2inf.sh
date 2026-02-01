#!/bin/bash
#
# Batch convert YAML files to Inf JSON format
#
# Usage:
#   ./tools/yaml2inf.sh <directory>
#   ./tools/yaml2inf.sh inf-notes/
#
# Options:
#   --validate-only    Validate YAML files without converting
#   --verbose          Show detailed output
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONVERTER="$SCRIPT_DIR/yaml_convert.py"

# Parse arguments
VALIDATE_ONLY=false
VERBOSE=false
TARGET_DIR=""

for arg in "$@"; do
    case $arg in
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            if [ -z "$TARGET_DIR" ]; then
                TARGET_DIR="$arg"
            fi
            ;;
    esac
done

# Check if directory provided
if [ -z "$TARGET_DIR" ]; then
    echo -e "${RED}❌ ERROR: No directory specified${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <directory> [options]"
    echo ""
    echo "Options:"
    echo "  --validate-only    Validate YAML files without converting"
    echo "  --verbose          Show detailed output"
    echo ""
    echo "Examples:"
    echo "  $0 inf-notes/"
    echo "  $0 inf-notes/ --validate-only"
    echo "  $0 inf-notes/ --verbose"
    exit 1
fi

# Resolve absolute path
if [[ "$TARGET_DIR" != /* ]]; then
    TARGET_DIR="$PROJECT_ROOT/$TARGET_DIR"
fi

# Check if directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ ERROR: Directory not found: $TARGET_DIR${NC}"
    exit 1
fi

# Check if converter exists
if [ ! -f "$CONVERTER" ]; then
    echo -e "${RED}❌ ERROR: Converter not found: $CONVERTER${NC}"
    exit 1
fi

# Find all YAML files
mapfile -t YAML_FILES < <(find "$TARGET_DIR" -name "*.yaml" -type f | sort)

if [ ${#YAML_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: No .yaml files found in $TARGET_DIR${NC}"
    exit 0
fi

# Print summary
echo ""
echo -e "${BLUE}========================================${NC}"
if [ "$VALIDATE_ONLY" = true ]; then
    echo -e "${BLUE}Validating YAML files${NC}"
else
    echo -e "${BLUE}Converting YAML to Inf JSON${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Directory: $TARGET_DIR"
echo "Files found: ${#YAML_FILES[@]}"
echo ""

# Process each file
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_FILES=()

for yaml_file in "${YAML_FILES[@]}"; do
    # Get relative path for display
    rel_path="${yaml_file#$TARGET_DIR/}"

    # Output file (same name, .json extension)
    json_file="${yaml_file%.yaml}.json"

    echo -e "${BLUE}Processing:${NC} $rel_path"

    if [ "$VALIDATE_ONLY" = true ]; then
        # Validate only
        if [ "$VERBOSE" = true ]; then
            if python3 "$CONVERTER" "$yaml_file" --validate; then
                echo -e "${GREEN}✅ Valid${NC}"
                ((SUCCESS_COUNT++))
            else
                echo -e "${RED}❌ Validation failed${NC}"
                ((FAIL_COUNT++))
                FAILED_FILES+=("$rel_path")
            fi
        else
            if python3 "$CONVERTER" "$yaml_file" --validate > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Valid${NC}"
                ((SUCCESS_COUNT++))
            else
                echo -e "${RED}❌ Validation failed${NC}"
                ((FAIL_COUNT++))
                FAILED_FILES+=("$rel_path")
            fi
        fi
    else
        # Convert to JSON
        if [ "$VERBOSE" = true ]; then
            if python3 "$CONVERTER" "$yaml_file" --output "$json_file"; then
                echo -e "${GREEN}✅ Converted:${NC} ${json_file#$TARGET_DIR/}"
                ((SUCCESS_COUNT++))
            else
                echo -e "${RED}❌ Conversion failed${NC}"
                ((FAIL_COUNT++))
                FAILED_FILES+=("$rel_path")
            fi
        else
            if python3 "$CONVERTER" "$yaml_file" --output "$json_file" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Converted:${NC} ${json_file#$TARGET_DIR/}"
                ((SUCCESS_COUNT++))
            else
                echo -e "${RED}❌ Conversion failed${NC}"
                ((FAIL_COUNT++))
                FAILED_FILES+=("$rel_path")
            fi
        fi
    fi

    echo ""
done

# Print summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Success: $SUCCESS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    echo ""
    echo "Failed files:"
    for failed_file in "${FAILED_FILES[@]}"; do
        echo -e "  ${RED}✗${NC} $failed_file"
    done
fi
echo ""

# Exit with error if any failures
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
fi

exit 0
