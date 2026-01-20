# Inf v2.3 Release Notes

**Release Date**: January 20, 2026

## Overview

Version 2.3 is a **stability and code quality release** that fixes critical bugs found during comprehensive codebase review and significantly improves code maintainability by extracting all magic numbers to named constants.

---

## 🔴 Critical Bug Fixes (4 Issues)

### 1. Memory Leak in Cell Subgraph File Handle Cleanup
**Issue**: When deleting table nodes with file-based cell subgraphs, file handles were not properly cleaned up from memory and IndexedDB.

**Impact**: Memory leak that grew with table deletions, eventually degrading performance.

**Fix**: Added comprehensive cleanup loop that iterates through all table cells and removes file handles with key format `${nodeId}-cell-${row}-${col}` from both in-memory cache and IndexedDB.

**Location**: `src/eventHandlers.js:880-905`

---

### 2. Circular Reference Detection for Deep Nesting
**Issue**: Circular reference validation only checked immediate node IDs, missing circular references that appeared multiple levels deep in nested embedded subgraphs.

**Impact**: Could create infinite loops when navigating into complex nested structures, potentially crashing the application.

**Fix**:
- Added recursive `checkSubgraphForCircularRefs()` function that deeply inspects all nesting levels
- Validates both regular node subgraphs and table cell subgraphs
- Applied to both `enterSubgraph()` and `enterCellSubgraph()` functions

**Location**: `src/fileOperations.js:960-1006`, `1741-1760`

**Example**: Now detects Root → Node A → Subgraph → Node B (embedded) → Node A (circular)

---

### 3. ID Generation Safety
**Issue**: nextId calculation used unsafe array mapping that could fail if node/connection/group objects had undefined IDs, causing duplicate ID generation and crashes.

**Impact**: Potential ID collisions and application crashes when loading corrupted or malformed data.

**Fix**:
- Created `calculateSafeNextId()` helper function that validates all IDs before calculating maximum
- Filters out null, undefined, or non-integer IDs
- Returns safe fallback value (1) if no valid IDs exist
- Replaced 3 unsafe calculations across the codebase

**Location**: `src/fileOperations.js:88-128`, plus 3 call sites

---

### 4. IndexedDB Upgrade Handler Race Condition
**Issue**: Database upgrade handler lacked proper error handling, transaction validation, and event listeners, potentially causing silent failures during schema upgrades.

**Impact**: Database upgrades could fail silently, leaving app in inconsistent state.

**Fix**:
- Added try-catch around object store creation
- Validates stores were created successfully after creation
- Explicit transaction abort on error
- Added `oncomplete`, `onerror`, and `onabort` handlers for better debugging
- Improved error logging for troubleshooting

**Location**: `src/indexedDB.js:40-80`

---

## ✨ Code Quality Improvements

### Magic Numbers Extraction (15 New Constants)

All magic numbers throughout the codebase have been extracted to named constants with clear documentation, making the code self-documenting and easier to maintain.

**UI/Visual Constants:**
- `TEXT_PADDING = 8` - Horizontal padding for text inside nodes
- `CELL_PADDING = 4` - Padding inside table cells
- `GROUP_PADDING = 15` - Padding around nodes in group bounding box
- `HOVER_OFFSET = 2` - Offset for hover effect border
- `PASTE_OFFSET = 20` - Offset when pasting nodes to avoid overlap

**Border and Line Widths:**
- `SUBGRAPH_BORDER_WIDTH = 4` - Border thickness for nodes with subgraphs
- `SELECTED_BORDER_WIDTH = 2` - Border thickness for selected nodes
- `EDITING_BORDER_WIDTH = 3` - Border thickness for editing nodes
- `TABLE_BORDER_DETECT_WIDTH = 10` - Hit detection area for table borders

**Cursor Rendering:**
- `CURSOR_HEIGHT = 8` - Half-height of cursor (above and below line)
- `CURSOR_X_OFFSET_NORMAL = 2` - Horizontal offset for cursor in normal nodes
- `CURSOR_X_OFFSET_TABLE = 1` - Horizontal offset for cursor in table cells

**Connection Rendering:**
- `ARROWHEAD_LENGTH = 15` - Length of connection arrowheads

**Text Editing:**
- `TEXT_LENGTH_WARNING_THRESHOLD = 50` - Characters remaining before showing warning

**Code Node Rendering:**
- `CODE_LINE_HEIGHT_OFFSET = 4` - Additional spacing for code lines beyond font size

**Files Modified:**
- `src/constants.js` - Added 15 new named constants with documentation
- `src/eventHandlers.js` - Replaced paste offset and warning threshold
- `src/nodeManager.js` - Replaced table border detection width
- `src/renderer.js` - Replaced 40+ magic numbers across all rendering functions

**Benefits:**
- ✅ Improved code maintainability
- ✅ Self-documenting code with descriptive names
- ✅ Easier customization (change once, affects entire app)
- ✅ Better consistency across different contexts
- ✅ Reduced errors from unclear numeric values

---

## 📊 Technical Details

**Build Info:**
- File size: 228.3 KB
- Total lines: 6,437
- Modules: 12 JavaScript files
- All validation checks passed ✓

**Commits:**
1. Fix 4 critical issues: memory leaks, circular refs, ID safety, IndexedDB
2. Extract all magic numbers to named constants

**Documentation Updates:**
- Updated `INF_NOTE_GUIDE.md` JSON examples to version 2.3
- Updated `CLAUDE.md` version history

---

## 🎯 Upgrade Notes

This release is **backward compatible** with v2.0-2.2 diagram files.

**What's Changed:**
- No user-facing feature changes
- Internal improvements to stability and code quality
- Existing diagrams will continue to work without modification

**Recommended Actions:**
- Update to v2.3 for improved stability and bug fixes
- No migration steps required

---

## 🐛 Known Issues

None specific to this release. See comprehensive codebase review for remaining medium and low priority issues that may be addressed in future releases.

---

## 👥 Contributors

- Claude Sonnet 4.5 (AI Assistant)
- Alex (Project Owner)

---

## 📝 Full Changelog

**Critical Fixes:**
- Fix memory leak in cell subgraph file handle cleanup (#1)
- Add recursive circular reference detection for deep nesting (#2)
- Create calculateSafeNextId() for safe ID generation (#3)
- Improve IndexedDB upgrade handler with transaction validation (#4)

**Code Quality:**
- Extract all magic numbers to 15 named constants
- Improve code documentation and maintainability
- Standardize visual constants across codebase

**Documentation:**
- Update version to 2.3 in all documentation
- Update JSON examples in INF_NOTE_GUIDE.md
- Add v2.3 entry to CLAUDE.md version history

---

## 🔗 Related Links

- [CLAUDE.md](CLAUDE.md) - Architectural documentation
- [INF_NOTE_GUIDE.md](INF_NOTE_GUIDE.md) - JSON format guide
- [AI_PROMPT.md](AI_PROMPT.md) - AI assistant prompt template

---

**Previous Release**: [v2.2](RELEASE_V2.2.md) (if exists) | **Next Release**: TBD
