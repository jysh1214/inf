// Helper functions for table cell text editing
function getEditingText(node) {
    if (!node) return '';
    if (node.type === 'table' && node.editingCell) {
        const cell = node.cells[node.editingCell.row][node.editingCell.col];
        return cell.text || '';
    }
    return node.text || '';
}

function setEditingText(node, text) {
    if (!node) return;
    if (node.type === 'table' && node.editingCell) {
        node.cells[node.editingCell.row][node.editingCell.col].text = text;
    } else {
        node.text = text;
    }
}

function getEditingCell(node) {
    if (!node || node.type !== 'table' || !node.editingCell) return null;
    return node.cells[node.editingCell.row][node.editingCell.col];
}

// Mouse event handlers
canvas.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (connectionMode) return;

    const pos = getMousePos(e);
    const x = pos.x;
    const y = pos.y;

    const clickedNode = getNodeAtPoint(x, y);

    if (clickedNode) {
        // Enter edit mode on double-click
        editingNode = clickedNode;
        selectedNode = clickedNode;

        // Update text alignment buttons to show node's alignment
        const nodeAlign = clickedNode.textAlign || 'center';
        updateAlignmentButtons(nodeAlign);

        // Special handling for table nodes - determine which cell was clicked
        if (clickedNode.type === 'table') {
            const cellCol = Math.floor((x - clickedNode.x) / clickedNode.cellWidth);
            const cellRow = Math.floor((y - clickedNode.y) / clickedNode.cellHeight);

            // Validate cell coordinates
            if (cellRow >= 0 && cellRow < clickedNode.rows && cellCol >= 0 && cellCol < clickedNode.cols) {
                clickedNode.editingCell = { row: cellRow, col: cellCol };
                const cellText = clickedNode.cells[cellRow][cellCol].text || '';
                cursorPosition = cellText.length;
                setStatus(`Editing table #${clickedNode.id} cell (${cellRow + 1}, ${cellCol + 1}) - Click outside, press Esc, or Tab to finish`);
            } else {
                cursorPosition = 0;
            }
        } else {
            // Set cursor position to end of text for non-table nodes
            cursorPosition = (clickedNode.text || '').length;
            setStatus(`Editing node #${clickedNode.id} - Click outside, press Esc, or Shift+Enter to finish`);
        }

        startCursorBlink();
        render();
    } else {
        // Create new node on empty space
        // Special handling for table nodes - show size selection modal
        if (currentNodeType === 'table') {
            showTableModal(x, y);
            return;
        }

        const newNode = createNode(x, y, currentNodeType);
        nodes.push(newNode);
        selectedNode = newNode;

        // Update text alignment buttons to show new node's alignment
        updateAlignmentButtons(currentTextAlign);

        // Automatically enter edit mode for new node
        editingNode = newNode;
        cursorPosition = 0; // New node starts with empty text
        startCursorBlink();
        render();
        setStatus(`Created ${currentNodeType} node #${newNode.id} - Click outside, press Esc, or Shift+Enter to finish`);

        // Trigger auto-save
        triggerAutoSave();
    }
});

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    const x = pos.x;
    const y = pos.y;

    const clickedNode = getNodeAtPoint(x, y);

    // Ctrl+Click behavior for subgraphs
    if (clickedNode && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Exit edit mode if active
        if (editingNode) {
            stopCursorBlink();
            // Clear editingCell for table nodes
            if (editingNode.type === 'table' && editingNode.editingCell) {
                editingNode.editingCell = null;
            }
            editingNode = null;
        }

        // Special handling for table nodes - detect which cell was clicked
        if (clickedNode.type === 'table') {
            const cellCol = Math.floor((x - clickedNode.x) / clickedNode.cellWidth);
            const cellRow = Math.floor((y - clickedNode.y) / clickedNode.cellHeight);

            // Validate cell coordinates
            if (cellRow >= 0 && cellRow < clickedNode.rows && cellCol >= 0 && cellCol < clickedNode.cols) {
                const cell = clickedNode.cells[cellRow][cellCol];

                if (cell.subgraph) {
                    // Cell has subgraph - enter it
                    enterCellSubgraph(clickedNode, cellRow, cellCol);
                } else {
                    // Cell has no subgraph - create new one
                    createCellSubgraph(clickedNode, cellRow, cellCol);
                }
            }
        } else {
            // Regular node subgraph handling
            if (clickedNode.subgraph) {
                // Node has subgraph - enter it
                enterSubgraph(clickedNode);
            } else {
                // Node has no subgraph - create new one
                createNewSubgraph(clickedNode);
            }
        }

        return false; // Don't continue with normal click handling
    }

    // Exit edit mode if clicking outside the editing node
    if (editingNode && clickedNode !== editingNode) {
        stopCursorBlink();
        // Clear editingCell for table nodes
        if (editingNode.type === 'table' && editingNode.editingCell) {
            editingNode.editingCell = null;
        }
        editingNode = null;
        setStatus('Finished editing');
        triggerAutoSave();
    }

    if (connectionMode) {
        if (clickedNode && clickedNode !== connectionStart) {
            // Complete connection
            const conn = createConnection(connectionStart.id, clickedNode.id);
            if (conn) {
                connections.push(conn);
                setStatus(`Connected #${connectionStart.id} to #${clickedNode.id}`);
                connectionMode = false;
                connectionStart = null;
                clearConnectionButtons();

                // Trigger auto-save
                triggerAutoSave();
            } else {
                // Connection invalid - provide visual feedback
                setStatus(`⚠️ Connection already exists between these nodes`);
                // Flash the invalid target briefly
                const originalSelection = selectedNode;
                selectedNode = clickedNode;
                render();
                setTimeout(() => {
                    selectedNode = originalSelection;
                    render();
                }, 200);
                return;
            }
        }
        render();
        return;
    }

    if (clickedNode) {
        // If in connection mode and clicking a different node, switch connection start
        if (connectionMode && clickedNode !== connectionStart) {
            connectionStart = clickedNode;
            setStatus(`Connection start changed to node #${clickedNode.id} - Click target node`);
            render();
            return;
        }

        // For tables, distinguish between border and cell clicks
        if (clickedNode.type === 'table') {
            if (!isPointOnTableBorder(x, y, clickedNode)) {
                // Clicking inside a cell - select the cell, not the table
                const cellCol = Math.floor((x - clickedNode.x) / clickedNode.cellWidth);
                const cellRow = Math.floor((y - clickedNode.y) / clickedNode.cellHeight);

                if (cellRow >= 0 && cellRow < clickedNode.rows && cellCol >= 0 && cellCol < clickedNode.cols) {
                    selectedCell = { table: clickedNode, row: cellRow, col: cellCol };
                    selectedNode = null;
                    selectedConnection = null;

                    // Update text alignment buttons to show cell's alignment
                    const cell = clickedNode.cells[cellRow][cellCol];
                    const cellAlign = cell.textAlign || clickedNode.textAlign || 'center';
                    updateAlignmentButtons(cellAlign);

                    render();
                }
                return;
            }
        }

        selectedNode = clickedNode;
        selectedConnection = null; // Deselect connection when selecting node
        selectedCell = null; // Deselect cell when selecting node

        // Update text alignment buttons to show selected node's alignment
        const nodeAlign = clickedNode.textAlign || 'center';
        updateAlignmentButtons(nodeAlign);

        // Bring selected node to front (z-ordering)
        nodes = nodes.filter(n => n !== clickedNode).concat([clickedNode]);

        // Check if clicking on resize handle
        resizeCorner = getResizeCorner(x, y, clickedNode);

        if (resizeCorner) {
            isResizing = true;
            // Set cursor for resize - handle circle and diamond cases
            if (resizeCorner.includes('circle')) {
                canvas.style.cursor = 'nwse-resize';
            } else if (resizeCorner === 'n' || resizeCorner === 's') {
                canvas.style.cursor = 'ns-resize';
            } else if (resizeCorner === 'e' || resizeCorner === 'w') {
                canvas.style.cursor = 'ew-resize';
            } else {
                canvas.style.cursor = resizeCorner.includes('n') && resizeCorner.includes('w') ? 'nwse-resize' :
                                     resizeCorner.includes('n') && resizeCorner.includes('e') ? 'nesw-resize' :
                                     resizeCorner.includes('s') && resizeCorner.includes('e') ? 'nwse-resize' :
                                     'nesw-resize';
            }
        } else {
            // Don't allow dragging the node while editing it (resizing is ok)
            if (editingNode === clickedNode) {
                render();
                return;
            }

            isDragging = true;
            // Calculate drag offset based on node type
            if (clickedNode.type === 'circle') {
                // For circles, x,y is the center
                dragOffset = {
                    x: x - clickedNode.x,
                    y: y - clickedNode.y
                };
            } else {
                // For rectangles, diamonds, and text, x,y is top-left
                dragOffset = {
                    x: x - clickedNode.x,
                    y: y - clickedNode.y
                };
            }
            canvas.style.cursor = 'move';
        }
        render();
    } else {
        // No node clicked, check for connection
        const clickedConnection = getConnectionAtPoint(x, y);
        if (clickedConnection) {
            selectedConnection = clickedConnection;
            selectedNode = null; // Deselect node when selecting connection
            selectedCell = null; // Deselect cell when selecting connection
            setStatus(`Connection selected. Press Delete to remove.`);
            render();
        } else {
            // Nothing clicked - start panning or deselect
            if (!connectionMode && !editingNode) {
                isPanning = true;
                const container = document.getElementById('canvas-container');
                panStart = { x: e.clientX, y: e.clientY };
                scrollStart = {
                    x: container.scrollLeft,
                    y: container.scrollTop
                };
                canvas.style.cursor = 'grabbing';
            }

            // Deselect everything
            selectedNode = null;
            selectedConnection = null;
            selectedCell = null;

            // Reset text alignment buttons to default
            updateAlignmentButtons(currentTextAlign);

            render();
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    // Handle canvas panning
    if (isPanning) {
        const container = document.getElementById('canvas-container');
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;

        container.scrollLeft = scrollStart.x - dx;
        container.scrollTop = scrollStart.y - dy;
        return;
    }

    const pos = getMousePos(e);
    const x = pos.x;
    const y = pos.y;

    const previousHoveredNode = hoveredNode;
    hoveredNode = getNodeAtPoint(x, y);
    const hoveredNodeChanged = previousHoveredNode !== hoveredNode;

    if (isDragging && selectedNode) {
        selectedNode.x = x - dragOffset.x;
        selectedNode.y = y - dragOffset.y;
        render();
    } else if (isResizing && selectedNode) {

        if (selectedNode.type === 'circle') {
            // Resize circle: adjust radius from center
            const dx = x - selectedNode.x;
            const dy = y - selectedNode.y;
            const newRadius = Math.max(MIN_NODE_SIZE / 2, Math.sqrt(dx * dx + dy * dy));
            selectedNode.radius = newRadius;
        } else if (selectedNode.type === 'diamond') {
            // Resize diamond from 4 cardinal points
            const centerX = selectedNode.x + selectedNode.width / 2;
            const centerY = selectedNode.y + selectedNode.height / 2;

            if (resizeCorner === 'n') {
                // Top point
                const newHeight = Math.max(MIN_NODE_SIZE, centerY - y) * 2;
                selectedNode.y = centerY - newHeight / 2;
                selectedNode.height = newHeight;
            } else if (resizeCorner === 's') {
                // Bottom point
                const newHeight = Math.max(MIN_NODE_SIZE, y - centerY) * 2;
                selectedNode.y = centerY - newHeight / 2;
                selectedNode.height = newHeight;
            } else if (resizeCorner === 'e') {
                // Right point
                const newWidth = Math.max(MIN_NODE_SIZE, x - centerX) * 2;
                selectedNode.x = centerX - newWidth / 2;
                selectedNode.width = newWidth;
            } else if (resizeCorner === 'w') {
                // Left point
                const newWidth = Math.max(MIN_NODE_SIZE, centerX - x) * 2;
                selectedNode.x = centerX - newWidth / 2;
                selectedNode.width = newWidth;
            }
        } else if (selectedNode.type === 'table') {
            // Table: resize cells proportionally
            const currentWidth = selectedNode.cols * selectedNode.cellWidth;
            const currentHeight = selectedNode.rows * selectedNode.cellHeight;

            if (resizeCorner === 'se') {
                const newWidth = Math.max(MIN_NODE_SIZE * selectedNode.cols, x - selectedNode.x);
                const newHeight = Math.max(MIN_NODE_SIZE * selectedNode.rows, y - selectedNode.y);
                selectedNode.cellWidth = newWidth / selectedNode.cols;
                selectedNode.cellHeight = newHeight / selectedNode.rows;
            } else if (resizeCorner === 'sw') {
                const newWidth = Math.max(MIN_NODE_SIZE * selectedNode.cols, selectedNode.x + currentWidth - x);
                const newHeight = Math.max(MIN_NODE_SIZE * selectedNode.rows, y - selectedNode.y);
                selectedNode.x = selectedNode.x + currentWidth - newWidth;
                selectedNode.cellWidth = newWidth / selectedNode.cols;
                selectedNode.cellHeight = newHeight / selectedNode.rows;
            } else if (resizeCorner === 'ne') {
                const newWidth = Math.max(MIN_NODE_SIZE * selectedNode.cols, x - selectedNode.x);
                const newHeight = Math.max(MIN_NODE_SIZE * selectedNode.rows, selectedNode.y + currentHeight - y);
                selectedNode.y = selectedNode.y + currentHeight - newHeight;
                selectedNode.cellWidth = newWidth / selectedNode.cols;
                selectedNode.cellHeight = newHeight / selectedNode.rows;
            } else if (resizeCorner === 'nw') {
                const newWidth = Math.max(MIN_NODE_SIZE * selectedNode.cols, selectedNode.x + currentWidth - x);
                const newHeight = Math.max(MIN_NODE_SIZE * selectedNode.rows, selectedNode.y + currentHeight - y);
                selectedNode.x = selectedNode.x + currentWidth - newWidth;
                selectedNode.y = selectedNode.y + currentHeight - newHeight;
                selectedNode.cellWidth = newWidth / selectedNode.cols;
                selectedNode.cellHeight = newHeight / selectedNode.rows;
            }
        } else {
            // Rectangle, text, and code: existing corner-drag logic
            if (resizeCorner === 'se') {
                selectedNode.width = Math.max(MIN_NODE_SIZE, x - selectedNode.x);
                selectedNode.height = Math.max(MIN_NODE_SIZE, y - selectedNode.y);
            } else if (resizeCorner === 'sw') {
                const newWidth = Math.max(MIN_NODE_SIZE, selectedNode.x + selectedNode.width - x);
                selectedNode.x = selectedNode.x + selectedNode.width - newWidth;
                selectedNode.width = newWidth;
                selectedNode.height = Math.max(MIN_NODE_SIZE, y - selectedNode.y);
            } else if (resizeCorner === 'ne') {
                selectedNode.width = Math.max(MIN_NODE_SIZE, x - selectedNode.x);
                const newHeight = Math.max(MIN_NODE_SIZE, selectedNode.y + selectedNode.height - y);
                selectedNode.y = selectedNode.y + selectedNode.height - newHeight;
                selectedNode.height = newHeight;
            } else if (resizeCorner === 'nw') {
                const newWidth = Math.max(MIN_NODE_SIZE, selectedNode.x + selectedNode.width - x);
                const newHeight = Math.max(MIN_NODE_SIZE, selectedNode.y + selectedNode.height - y);
                selectedNode.x = selectedNode.x + selectedNode.width - newWidth;
                selectedNode.y = selectedNode.y + selectedNode.height - newHeight;
                selectedNode.width = newWidth;
                selectedNode.height = newHeight;
            }
        }
        render();
    } else {
        // Update cursor based on hover state
        if (hoveredNode && !connectionMode) {
            const corner = getResizeCorner(x, y, hoveredNode);
            if (corner) {
                // Set cursor for resize - handle different node types
                if (corner.includes('circle')) {
                    canvas.style.cursor = 'nwse-resize';
                } else if (corner === 'n' || corner === 's') {
                    canvas.style.cursor = 'ns-resize';
                } else if (corner === 'e' || corner === 'w') {
                    canvas.style.cursor = 'ew-resize';
                } else {
                    canvas.style.cursor = corner.includes('n') && corner.includes('w') ? 'nwse-resize' :
                                        corner.includes('n') && corner.includes('e') ? 'nesw-resize' :
                                        corner.includes('s') && corner.includes('e') ? 'nwse-resize' :
                                        'nesw-resize';
                }
            } else {
                canvas.style.cursor = 'move';
            }
        } else {
            if (connectionMode) {
                canvas.style.cursor = 'crosshair';
            } else if (isPanning) {
                canvas.style.cursor = 'grabbing';
            } else {
                canvas.style.cursor = 'grab';
            }
        }

        // Only render if hovered node changed or in connection mode
        if (hoveredNodeChanged || connectionMode) {
            render();
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    // End panning
    if (isPanning) {
        isPanning = false;
    }

    // Trigger auto-save if we were dragging or resizing
    if (isDragging || isResizing) {
        triggerAutoSave();
    }

    isDragging = false;
    isResizing = false;
    resizeCorner = null;
    canvas.style.cursor = 'grab';
});

// Keyboard event handlers
document.addEventListener('keydown', (e) => {
    // Only handle keyboard shortcuts if body or canvas has focus
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName !== 'BODY' && activeElement !== canvas && !editingNode) {
        return; // Let other elements handle their own keyboard input
    }

    // Handle text editing mode
    if (editingNode) {
        if (e.key === 'Enter' && e.shiftKey) {
            // Shift+Enter: Finish editing
            stopCursorBlink();
            // Clear editingCell for table nodes
            if (editingNode.type === 'table' && editingNode.editingCell) {
                editingNode.editingCell = null;
            }
            editingNode = null;
            setStatus('Finished editing');
            render();
            triggerAutoSave();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            // Enter: Add new line at cursor position (not for table cells)
            if (editingNode.type === 'table') {
                // For table cells, Enter just finishes editing
                stopCursorBlink();
                if (editingNode.editingCell) {
                    editingNode.editingCell = null;
                }
                editingNode = null;
                setStatus('Finished editing table cell');
                render();
                triggerAutoSave();
                e.preventDefault();
                return;
            }

            if (getEditingText(editingNode).length < MAX_TEXT_LENGTH) {
                const text = getEditingText(editingNode);
                setEditingText(editingNode, text.slice(0, cursorPosition) + '\n' + text.slice(cursorPosition));
                cursorPosition++; // Move cursor past the newline
                // Reset cursor blink on input
                startCursorBlink();
                render(); // Immediate render so user sees the change
                triggerAutoSave();
            } else {
                setStatus(`⚠️ Text limit reached (${MAX_TEXT_LENGTH} characters max)`);
            }
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            // Delete character before cursor
            if (cursorPosition > 0) {
                const text = getEditingText(editingNode);
                setEditingText(editingNode, text.slice(0, cursorPosition - 1) + text.slice(cursorPosition));
                cursorPosition--; // Move cursor back
                // Reset cursor blink on input
                startCursorBlink();
                // Update status to show current length
                const remaining = MAX_TEXT_LENGTH - getEditingText(editingNode).length;
                if (editingNode.type === 'table') {
                    setStatus(`Editing table #${editingNode.id} cell - ${remaining} characters remaining`);
                } else {
                    setStatus(`Editing node #${editingNode.id} - ${remaining} characters remaining`);
                }
                render(); // Immediate render so user sees the change
                triggerAutoSave();
            }
            e.preventDefault();
        } else if (e.key === 'Escape') {
            // Cancel editing
            stopCursorBlink();
            if (editingNode && editingNode.type === 'table' && editingNode.editingCell) {
                editingNode.editingCell = null;
            }
            editingNode = null;
            setStatus('Cancelled editing');
            render();
            triggerAutoSave();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            // Move cursor left
            if (cursorPosition > 0) {
                cursorPosition--;
                startCursorBlink(); // Reset blink
                render();
            }
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            // Move cursor right
            const textLength = getEditingText(editingNode).length;
            if (cursorPosition < textLength) {
                cursorPosition++;
                startCursorBlink(); // Reset blink
                render();
            }
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            // Move cursor up one line (for multiline text)
            const text = getEditingText(editingNode);
            if (!text) {
                e.preventDefault();
                return;
            }

            const lines = text.split('\n');
            let charCount = 0;
            let currentLine = 0;
            let posInLine = 0;

            // Find which line and position in line the cursor is at
            for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length >= cursorPosition) {
                    currentLine = i;
                    posInLine = cursorPosition - charCount;
                    break;
                }
                charCount += lines[i].length + 1; // +1 for newline
            }

            // Move to previous line if possible
            if (currentLine > 0) {
                const prevLineLength = lines[currentLine - 1].length;
                const newPosInLine = Math.min(posInLine, prevLineLength);
                // Calculate start of previous line and add position
                const prevLineStart = charCount - lines[currentLine - 1].length - 1;
                cursorPosition = prevLineStart + newPosInLine;
                // Bounds check
                cursorPosition = Math.max(0, Math.min(cursorPosition, text.length));
                startCursorBlink();
                render();
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            // Move cursor down one line (for multiline text)
            const text = getEditingText(editingNode);
            if (!text) {
                e.preventDefault();
                return;
            }

            const lines = text.split('\n');
            let charCount = 0;
            let currentLine = 0;
            let posInLine = 0;

            // Find which line and position in line the cursor is at
            for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length >= cursorPosition) {
                    currentLine = i;
                    posInLine = cursorPosition - charCount;
                    break;
                }
                charCount += lines[i].length + 1; // +1 for newline
            }

            // Move to next line if possible
            if (currentLine < lines.length - 1) {
                const nextLineLength = lines[currentLine + 1].length;
                const newPosInLine = Math.min(posInLine, nextLineLength);
                // Calculate start of next line and add position
                const nextLineStart = charCount + lines[currentLine].length + 1;
                cursorPosition = nextLineStart + newPosInLine;
                // Bounds check
                cursorPosition = Math.max(0, Math.min(cursorPosition, text.length));
                startCursorBlink();
                render();
            }
            e.preventDefault();
        } else if (e.key === 'Home') {
            // Move cursor to start of line
            const text = getEditingText(editingNode);
            const beforeCursor = text.slice(0, cursorPosition);
            const lastNewline = beforeCursor.lastIndexOf('\n');
            cursorPosition = lastNewline + 1;
            startCursorBlink();
            render();
            e.preventDefault();
        } else if (e.key === 'End') {
            // Move cursor to end of line
            const text = getEditingText(editingNode);
            const afterCursor = text.slice(cursorPosition);
            const nextNewline = afterCursor.indexOf('\n');
            if (nextNewline === -1) {
                cursorPosition = text.length;
            } else {
                cursorPosition += nextNewline;
            }
            startCursorBlink();
            render();
            e.preventDefault();
        } else if (e.key === 'Delete') {
            // Delete character after cursor
            const text = getEditingText(editingNode);
            if (cursorPosition < text.length) {
                setEditingText(editingNode, text.slice(0, cursorPosition) + text.slice(cursorPosition + 1));
                startCursorBlink();
                render();
                triggerAutoSave();
            }
            e.preventDefault();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== '\t') {
            // Add character at cursor position (with max length check)
            if (getEditingText(editingNode).length < MAX_TEXT_LENGTH) {
                const text = getEditingText(editingNode);
                setEditingText(editingNode, text.slice(0, cursorPosition) + e.key + text.slice(cursorPosition));
                cursorPosition++; // Move cursor forward
                // Reset cursor blink on input
                startCursorBlink();
                // Show remaining characters when getting close to limit
                const remaining = MAX_TEXT_LENGTH - getEditingText(editingNode).length;
                if (remaining <= 50) {
                    if (editingNode.type === 'table') {
                        setStatus(`Editing table #${editingNode.id} cell - ${remaining} characters remaining`);
                    } else {
                        setStatus(`Editing node #${editingNode.id} - ${remaining} characters remaining`);
                    }
                }
                render(); // Immediate render so user sees the character
                triggerAutoSave();
            } else {
                setStatus(`⚠️ Text limit reached (${MAX_TEXT_LENGTH} characters max)`);
            }
            e.preventDefault();
        }
        return;
    }

    // Normal keyboard shortcuts (when not editing)
    if (e.key === 'Escape') {
        if (connectionMode) {
            connectionMode = false;
            connectionStart = null;
            clearConnectionButtons();
            canvas.style.cursor = 'grab';
            setStatus('Connection mode cancelled');
            render();
        } else if (currentDepth > 0) {
            // Exit subgraph and return to parent
            exitSubgraph();
        } else if (selectedCell) {
            // Deselect cell
            selectedCell = null;
            setStatus('Cell deselected');
            render();
        } else if (selectedNode) {
            // Deselect node
            selectedNode = null;
            setStatus('Node deselected');
            render();
        }
        e.preventDefault();
    } else if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        // Ctrl+C: Copy selected node
        if (selectedNode) {
            // Store a copy of the selected node
            copiedNode = JSON.parse(JSON.stringify(selectedNode));
            setStatus(`Copied node #${selectedNode.id}`);
        } else {
            setStatus('No node selected to copy');
        }
        e.preventDefault();
    } else if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
        // Ctrl+V: Paste copied node
        if (copiedNode) {
            // Create new node with copied properties
            const newNode = JSON.parse(JSON.stringify(copiedNode));

            // Assign new ID
            newNode.id = nextId++;

            // Offset position so it's not directly on top
            const PASTE_OFFSET = 20;
            newNode.x += PASTE_OFFSET;
            newNode.y += PASTE_OFFSET;

            // Add to nodes array and map
            nodes.push(newNode);
            nodeMap.set(newNode.id, newNode);

            // Note: Don't copy FileHandle for file-based subgraphs - each pasted node
            // should select its own file to prevent accidental data corruption from
            // multiple nodes sharing the same file reference

            // Select the new node
            selectedNode = newNode;
            selectedConnection = null;

            setStatus(`Pasted node #${newNode.id}`);
            render();
            triggerAutoSave();
        } else {
            setStatus('No node copied');
        }
        e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
            // Remove connections to/from this node
            connections = connections.filter(conn =>
                conn.fromId !== selectedNode.id && conn.toId !== selectedNode.id
            );

            // Remove node
            const id = selectedNode.id;
            nodes = nodes.filter(n => n.id !== id);
            nodeMap.delete(id);
            fileHandleMap.delete(id);  // Clean up file handle from memory
            deleteFileHandle(id);  // Clean up file handle from IndexedDB (async, no await needed)

            // Clear editingNode if we're deleting the node being edited
            if (editingNode && editingNode.id === id) {
                stopCursorBlink();
                // Clear editingCell for table nodes
                if (editingNode.type === 'table' && editingNode.editingCell) {
                    editingNode.editingCell = null;
                }
                editingNode = null;
            }

            // Clear selectedCell if we're deleting the table it belongs to
            if (selectedCell && selectedCell.table.id === id) {
                selectedCell = null;
            }

            selectedNode = null;

            setStatus(`Deleted node #${id}`);
            render();
            triggerAutoSave();
        } else if (selectedConnection) {
            // Remove selected connection
            const id = selectedConnection.id;
            connections = connections.filter(conn => conn.id !== id);
            selectedConnection = null;

            setStatus(`Deleted connection #${id}`);
            render();
            triggerAutoSave();
        }
    }
});

// Prevent context menu on Ctrl+Click (which browsers may interpret as "save image")
canvas.addEventListener('contextmenu', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});
