# Inf v2.0 Release Notes

**Release Date:** January 19, 2026

Version 2.0 represents a major quality and stability release with significant UI improvements, comprehensive table node bug fixes, and enhanced developer experience.

---

## 🎨 UI/UX Improvements

### Modern Gradient Design System
- **Purple gradient theme** throughout the application
  - Primary color: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Applied to buttons, active states, app title, and modals
- **Sidebar redesign**
  - Subtle white-to-gray gradient background
  - Enhanced shadow for depth
  - Better visual hierarchy
- **Status bar modernization**
  - Dark gradient background
  - Monospace font for better readability
  - Improved contrast

### Beautiful Error Modal System
- **Custom error modal** replacing browser alert() dialogs
  - Large animated warning icon with pulse effect
  - Red gradient theme matching error severity
  - Scrollable monospace error message display
  - Backdrop blur for focus
  - Smooth slide-in animation
- **JSON validation errors** now display in beautiful modal
  - Invalid subgraph files
  - Invalid diagram files
  - Invalid workspace root.json

### File Path Display
- **Current file indicator** in sidebar
  - Shows filename for loaded files (e.g., "diagram.json")
  - Shows "(embedded)" for embedded subgraphs
  - Shows "(unsaved)" when no file is loaded
  - Purple-tinted background matching theme
  - Auto-updates when navigating subgraphs

---

## 🐛 Critical Bug Fixes

### Table Node Rendering Fixes (4 bugs fixed)

**1. Text Alignment in Table Cells**
- **Bug:** Cell text always rendered at center regardless of textAlign setting
- **Impact:** Left and right alignment didn't work in table cells
- **Fix:** Calculate textX position based on alignment before drawing
- **Commit:** e465a30

**2. Hover Effect Size**
- **Bug:** Hover dashed border was larger than table bounds
- **Impact:** Incorrect visual feedback when hovering tables
- **Fix:** Added table-specific hover case with proper dimension calculation
- **Commit:** 3810703

**3. Connection Center Point**
- **Bug:** `getNodeCenter()` used width/height which don't exist for tables
- **Impact:** Connections had incorrect center point calculations
- **Fix:** Added table-specific center calculation using cols/rows × cell dimensions
- **Commit:** 54b259e

**4. Connection Edge Points**
- **Bug:** `getNodeEdgePoint()` fell into default case using width/height
- **Impact:** Arrow endpoints didn't touch table borders correctly
- **Fix:** Added explicit table case with parametric line intersection
- **Commit:** 54b259e

### Other Critical Fixes

**Hover Effect Persistence After Deletion**
- **Bug:** Hover dashed line remained visible after deleting a node
- **Impact:** Visual artifact showing hover on deleted nodes
- **Fix:** Clear hoveredNode when deleting the hovered node
- **Commit:** 9ac0549

**Undefined Variable Bug**
- **Bug:** Used `copiedNode` instead of `copiedNodes` in subgraph navigation
- **Impact:** Global variable pollution, clipboard not properly reset
- **Fix:** Changed to `copiedNodes = []` in enterSubgraph/exitSubgraph
- **Commit:** e9a0626

---

## 📚 Documentation Updates

### Enhanced CLAUDE.md
- Documented v2.0 features and changes
- Added **Common Bug Patterns to Avoid** section
- Updated table node documentation
- Documented multi-select and copy/paste operations
- Added UI design system documentation
- Updated version history

---

## 🔧 Technical Improvements

### Code Quality
- Fixed all table-related rendering edge cases
- Improved state management consistency
- Better error handling with user-friendly modals
- Comprehensive connection rendering for all node types

### Developer Experience
- Better code review practices
- Comprehensive bug documentation
- Improved architectural guidance in CLAUDE.md

---

## 🎯 What's Coming in Future Releases

While not included in v2.0, these features from v1.5 remain stable:
- Table node type with cell-level subgraph support
- Multi-node selection with Ctrl+Click
- Multi-node alignment (horizontal/vertical)
- Copy/paste for multiple nodes
- Code node with syntax highlighting
- Hierarchical subgraph navigation
- Workspace folder with persistent permissions

---

## 📊 Statistics

- **Bug fixes:** 6 critical bugs resolved
- **UI improvements:** Complete visual redesign with modern gradients
- **Code changes:** 13 commits since v1.5
- **Files modified:** 6+ source files
- **Lines added:** ~150+ lines of new/improved code

---

## 🙏 Acknowledgments

This release focused heavily on stability, polish, and user experience improvements. All table node issues discovered through code review have been resolved.

---

## 📥 Upgrade Instructions

1. Pull the latest code
2. Run `python3 build.py --check`
3. Open `index.html` in your browser
4. Existing diagrams are fully compatible (no breaking changes)

---

**Full Changelog:** v1.5...v2.0
