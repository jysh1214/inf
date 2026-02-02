// Helper functions
function setStatus(text) {
    document.getElementById('status').textContent = text;
}

/**
 * Generate a unique key for file handle storage that includes the full navigation path.
 * This prevents ID collisions when navigating into nested subgraphs.
 *
 * @param {number|string} nodeOrCellId - Node ID or cell ID (e.g., "5-cell-2-3")
 * @returns {string} Path-based key in format: "path/to/node" or "path/to/cellId"
 *
 * Examples:
 *   - Root level node 5: "5"
 *   - Node 5 at path [10]: "10/5"
 *   - Node 5 at path [10, 20]: "10/20/5"
 *   - Table cell "5-cell-2-3" at path [10]: "10/5-cell-2-3"
 */
function getFileHandleKey(nodeOrCellId) {
    // Build path-based key: currentPath + nodeOrCellId
    if (currentPath.length > 0) {
        return currentPath.join('/') + '/' + nodeOrCellId;
    }
    return String(nodeOrCellId);
}

function updateFilePathDisplay() {
    const workspaceFolderElement = document.getElementById('workspace-folder');
    const filePathElement = document.getElementById('current-file-path');
    if (!filePathElement) return;

    // Update workspace folder display
    if (workspaceFolderElement) {
        if (workspaceFolderName) {
            workspaceFolderElement.textContent = `📁 ${workspaceFolderName}`;
        } else {
            workspaceFolderElement.textContent = '';
        }
    }

    // Update file path display
    if (currentFileName) {
        filePathElement.textContent = currentFileName;
    } else {
        filePathElement.textContent = '(unsaved)';
    }

    // Enable/disable the copy button based on whether we have a filename
    const copyButton = document.getElementById('copy-inf-focus-btn');
    if (copyButton) {
        const hasValidFile = currentFileName && currentFileName !== '(embedded)' && currentFileName !== '(unsaved)';
        copyButton.disabled = !hasValidFile;
        copyButton.style.opacity = hasValidFile ? '1' : '0.5';
        copyButton.style.cursor = hasValidFile ? 'pointer' : 'not-allowed';
    }
}

async function copyInfFocusCommand() {
    if (!currentFileName || currentFileName === '(embedded)') {
        setStatus('⚠️ No file to focus on');
        return;
    }

    // Remove .json extension if present
    const fileNameWithoutExt = currentFileName.replace(/\.json$/, '');
    const command = `/inf --focus ${fileNameWithoutExt}`;

    try {
        await navigator.clipboard.writeText(command);
        setStatus(`✓ Copied to clipboard: ${command}`);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        setStatus('⚠️ Failed to copy to clipboard');
    }
}

function updateSubgraphButton() {
    const removeButton = document.getElementById('btn-remove-subgraph');
    if (!removeButton) return;

    // Check if any selected node has a subgraph (node-level or cell-level)
    const selectedNodes = Array.from(selectedNodeIds).map(id => nodeMap.get(id)).filter(n => n);
    let hasSubgraph = false;

    for (const node of selectedNodes) {
        // Check node-level subgraph
        if (node.subgraph) {
            hasSubgraph = true;
            break;
        }

        // Check cell-level subgraphs for table nodes
        if (node.type === 'table' && node.cells) {
            for (let row = 0; row < node.rows; row++) {
                for (let col = 0; col < node.cols; col++) {
                    const cell = node.cells[row][col];
                    if (cell && cell.subgraph) {
                        hasSubgraph = true;
                        break;
                    }
                }
                if (hasSubgraph) break;
            }
        }

        if (hasSubgraph) break;
    }

    // Enable/disable button
    removeButton.disabled = !hasSubgraph;
}

function setNodeType(type) {
    currentNodeType = type;
    // Update button states for node type buttons only
    document.getElementById('btn-rectangle').classList.remove('active');
    document.getElementById('btn-circle').classList.remove('active');
    document.getElementById('btn-diamond').classList.remove('active');
    document.getElementById('btn-text').classList.remove('active');
    document.getElementById('btn-code').classList.remove('active');
    document.getElementById('btn-table').classList.remove('active');
    document.getElementById(`btn-${type}`).classList.add('active');
    setStatus(`Node type: ${type}`);
}

// Helper function to update alignment button states
function updateAlignmentButtons(align) {
    document.getElementById('btn-align-left').classList.remove('active');
    document.getElementById('btn-align-center').classList.remove('active');
    document.getElementById('btn-align-right').classList.remove('active');
    document.getElementById(`btn-align-${align}`).classList.add('active');
}

function setTextAlign(align) {
    // Input validation
    const validAlignments = ['left', 'center', 'right'];
    if (typeof align !== 'string' || !validAlignments.includes(align)) {
        console.error(`setTextAlign: invalid alignment (got ${align}), must be one of [${validAlignments.join(', ')}]`);
        return;
    }

    currentTextAlign = align;
    updateAlignmentButtons(align);

    // If a cell is selected, update its alignment
    if (selectedCell) {
        const cell = selectedCell.table.cells[selectedCell.row][selectedCell.col];
        cell.textAlign = align;
        render();
        setStatus(`Cell alignment: ${align}`);
        triggerAutoSave();
    } else if (selectedNodeIds.size > 0) {
        // If nodes are selected, update their alignment
        selectedNodeIds.forEach(nodeId => {
            const node = nodeMap.get(nodeId);
            if (node) {
                node.textAlign = align;
            }
        });
        render();
        setStatus(`Text alignment: ${align} (${selectedNodeIds.size} node(s))`);
        triggerAutoSave();
    } else {
        setStatus(`Default text alignment: ${align}`);
    }
}

function setFontFamily(font) {
    // Input validation
    if (typeof font !== 'string' || font.trim().length === 0) {
        console.error(`setFontFamily: invalid font (got ${font}), must be a non-empty string`);
        return;
    }

    currentFontFamily = font;
    render();
    setStatus(`Font family: ${font} (applied to all nodes)`);
}

function setCodeFontFamily(font) {
    // Input validation
    if (typeof font !== 'string' || font.trim().length === 0) {
        console.error(`setCodeFontFamily: invalid font (got ${font}), must be a non-empty string`);
        return;
    }

    currentCodeFontFamily = font;
    render();
    setStatus(`Code font family: ${font} (applied to code nodes only)`);
}

function increaseCanvasSize() {
    const newWidth = Math.min(MAX_CANVAS_SIZE, canvasWidth + CANVAS_SIZE_STEP);
    const newHeight = Math.min(MAX_CANVAS_SIZE, canvasHeight + CANVAS_SIZE_STEP);
    if (newWidth !== canvasWidth || newHeight !== canvasHeight) {
        canvasWidth = newWidth;
        canvasHeight = newHeight;
        resizeCanvas();
        setStatus(`Canvas size: ${canvasWidth}x${canvasHeight}px`);
        triggerAutoSave();
    }
}

function decreaseCanvasSize() {
    const newWidth = Math.max(MIN_CANVAS_SIZE, canvasWidth - CANVAS_SIZE_STEP);
    const newHeight = Math.max(MIN_CANVAS_SIZE, canvasHeight - CANVAS_SIZE_STEP);
    if (newWidth !== canvasWidth || newHeight !== canvasHeight) {
        canvasWidth = newWidth;
        canvasHeight = newHeight;
        resizeCanvas();
        setStatus(`Canvas size: ${canvasWidth}x${canvasHeight}px`);
        triggerAutoSave();
    }
}

function zoomIn() {
    const newZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    if (newZoom !== zoom) {
        zoom = newZoom;
        render();
        setStatus(`Zoom: ${Math.round(zoom * 100)}%`);
        triggerAutoSave();
    }
}

function zoomOut() {
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    if (newZoom !== zoom) {
        zoom = newZoom;
        render();
        setStatus(`Zoom: ${Math.round(zoom * 100)}%`);
        triggerAutoSave();
    }
}

function setConnectionType(directed) {
    if (connectionMode) {
        // Already in connection mode, just switch the type
        directedMode = directed;
        // Update button states
        document.getElementById('btn-directed').classList.remove('active');
        document.getElementById('btn-undirected').classList.remove('active');
        document.getElementById(directed ? 'btn-directed' : 'btn-undirected').classList.add('active');
        setStatus(`Connection type changed to ${directed ? 'Directed (arrows)' : 'Undirected (lines)'} - Click target node`);
        // Only render if there's a connection preview to update
        if (hoveredNode) {
            render();
        }
    } else if (selectedNodeIds.size > 0) {
        // Start connection mode from first selected node
        directedMode = directed;
        connectionMode = true;

        const firstNodeId = Array.from(selectedNodeIds)[0];
        connectionStart = nodeMap.get(firstNodeId);

        // Update button states
        document.getElementById('btn-directed').classList.remove('active');
        document.getElementById('btn-undirected').classList.remove('active');
        document.getElementById(directed ? 'btn-directed' : 'btn-undirected').classList.add('active');
        setStatus(`Connection mode: Click target node (press Esc to cancel)`);
        render();
    } else {
        // No node selected, can't start connection - don't activate button
        setStatus(`Select a node first, then click connection type to start connecting`);
    }
}

function clearConnectionButtons() {
    document.getElementById('btn-directed').classList.remove('active');
    document.getElementById('btn-undirected').classList.remove('active');
}

function clearCanvas() {
    if (confirm('Clear all nodes and connections?')) {
        stopCursorBlink();
        nodes = [];
        connections = [];
        groups = [];
        nodeMap.clear();
        selectedNodeIds.clear();
        selectedConnection = null;
        selectedCell = null;
        hoveredNode = null;
        editingNode = null;
        connectionMode = false;
        connectionStart = null;

        // Clear filename and file handle
        currentFileName = null;
        currentFileHandle = null;
        updateFilePathDisplay();

        // Clear auto-save
        localStorage.removeItem('inf-autosave');

        render();
        setStatus('Canvas cleared');
    }
}

// Helper functions for node alignment
function getNodeBounds(node) {
    // Returns {left, right, top, bottom, centerX, centerY} for any node type
    let left, right, top, bottom, centerX, centerY;

    switch (node.type) {
        case 'circle':
            left = node.x - node.radius;
            right = node.x + node.radius;
            top = node.y - node.radius;
            bottom = node.y + node.radius;
            centerX = node.x;
            centerY = node.y;
            break;

        case 'table':
            const tableWidth = getTotalWidth(node);
            const tableHeight = getTotalHeight(node);
            left = node.x;
            right = node.x + tableWidth;
            top = node.y;
            bottom = node.y + tableHeight;
            centerX = node.x + tableWidth / 2;
            centerY = node.y + tableHeight / 2;
            break;

        case 'rectangle':
        case 'diamond':
        case 'text':
        case 'code':
        default:
            left = node.x;
            right = node.x + node.width;
            top = node.y;
            bottom = node.y + node.height;
            centerX = node.x + node.width / 2;
            centerY = node.y + node.height / 2;
            break;
    }

    return { left, right, top, bottom, centerX, centerY };
}

function setNodePosition(node, alignType, targetValue) {
    // Adjusts node position based on alignment type and target value
    switch (node.type) {
        case 'circle':
            if (alignType === 'center-h') {
                // Align horizontally (same Y) - horizontal line
                node.y = targetValue;
            } else if (alignType === 'center-v') {
                // Align vertically (same X) - vertical line
                node.x = targetValue;
            } else if (alignType === 'top') {
                node.y = targetValue + node.radius;
            } else if (alignType === 'bottom') {
                node.y = targetValue - node.radius;
            } else if (alignType === 'left') {
                node.x = targetValue + node.radius;
            } else if (alignType === 'right') {
                node.x = targetValue - node.radius;
            }
            break;

        case 'table':
            const tableWidth = getTotalWidth(node);
            const tableHeight = getTotalHeight(node);
            if (alignType === 'center-h') {
                // Align horizontally (same Y)
                node.y = targetValue - tableHeight / 2;
            } else if (alignType === 'center-v') {
                // Align vertically (same X)
                node.x = targetValue - tableWidth / 2;
            } else if (alignType === 'top') {
                node.y = targetValue;
            } else if (alignType === 'bottom') {
                node.y = targetValue - tableHeight;
            } else if (alignType === 'left') {
                node.x = targetValue;
            } else if (alignType === 'right') {
                node.x = targetValue - tableWidth;
            }
            break;

        case 'rectangle':
        case 'diamond':
        case 'text':
        case 'code':
        default:
            if (alignType === 'center-h') {
                // Align horizontally (same Y)
                node.y = targetValue - node.height / 2;
            } else if (alignType === 'center-v') {
                // Align vertically (same X)
                node.x = targetValue - node.width / 2;
            } else if (alignType === 'top') {
                node.y = targetValue;
            } else if (alignType === 'bottom') {
                node.y = targetValue - node.height;
            } else if (alignType === 'left') {
                node.x = targetValue;
            } else if (alignType === 'right') {
                node.x = targetValue - node.width;
            }
            break;
    }
}

function alignNodes(alignType) {
    // Input validation
    const validAlignTypes = ['top', 'bottom', 'left', 'right', 'center-h', 'center-v'];
    if (typeof alignType !== 'string' || !validAlignTypes.includes(alignType)) {
        console.error(`alignNodes: invalid alignType (got ${alignType}), must be one of [${validAlignTypes.join(', ')}]`);
        setStatus(`⚠️ Invalid alignment type: ${alignType}`);
        return;
    }

    // Only align when 2 or more nodes are selected
    if (selectedNodeIds.size < 2) {
        setStatus('Select 2 or more nodes to align');
        return;
    }

    // Get all selected nodes
    const selectedNodes = Array.from(selectedNodeIds).map(id => nodeMap.get(id)).filter(n => n);

    if (selectedNodes.length < 2) {
        setStatus('Select 2 or more nodes to align');
        return;
    }

    // Calculate bounding box of all selected nodes
    const bounds = selectedNodes.map(node => getNodeBounds(node));

    // Horizontal alignments (top, bottom, center-h) - distribute horizontal spacing
    if (alignType === 'top' || alignType === 'bottom' || alignType === 'center-h') {
        let targetY;

        if (alignType === 'center-h') {
            // Align horizontally (same Y) - creates horizontal line
            targetY = Math.round(bounds.reduce((sum, b) => sum + b.centerY, 0) / bounds.length);
        } else if (alignType === 'top') {
            // Align to topmost edge
            targetY = Math.min(...bounds.map(b => b.top));
        } else if (alignType === 'bottom') {
            // Align to bottommost edge
            targetY = Math.max(...bounds.map(b => b.bottom));
        }

        // Sort nodes by their current X position (left to right)
        const sortedNodes = selectedNodes.map((node, index) => ({
            node,
            bounds: bounds[index]
        })).sort((a, b) => a.bounds.left - b.bounds.left);

        // If 3+ nodes, distribute horizontal spacing evenly
        if (sortedNodes.length >= 3) {
            const leftmost = sortedNodes[0].bounds.left;
            const rightmost = sortedNodes[sortedNodes.length - 1].bounds.right;

            // Calculate total width occupied by all nodes
            const totalNodeWidth = sortedNodes.reduce((sum, item) =>
                sum + (item.bounds.right - item.bounds.left), 0);

            // Calculate total available space for gaps
            const totalSpace = rightmost - leftmost;
            const totalGapSpace = totalSpace - totalNodeWidth;
            const numGaps = sortedNodes.length - 1;
            const averageGap = totalGapSpace / numGaps;

            // Position nodes with even spacing
            let currentX = leftmost;
            sortedNodes.forEach((item) => {
                const nodeWidth = item.bounds.right - item.bounds.left;
                const offsetX = currentX - item.bounds.left;

                // Move node horizontally
                if (item.node.type === 'circle') {
                    item.node.x += offsetX;
                } else {
                    item.node.x += offsetX;
                }

                // Align vertically
                setNodePosition(item.node, alignType, targetY);

                // Move to next position
                currentX += nodeWidth + averageGap;
            });
        } else {
            // Just align Y position for 2 nodes
            selectedNodes.forEach((node) => {
                setNodePosition(node, alignType, targetY);
            });
        }
    }
    // Vertical alignments (left, right, center-v) - distribute vertical spacing
    else if (alignType === 'left' || alignType === 'right' || alignType === 'center-v') {
        let targetX;

        if (alignType === 'center-v') {
            // Align vertically (same X) - creates vertical line
            targetX = Math.round(bounds.reduce((sum, b) => sum + b.centerX, 0) / bounds.length);
        } else if (alignType === 'left') {
            // Align to leftmost edge
            targetX = Math.min(...bounds.map(b => b.left));
        } else if (alignType === 'right') {
            // Align to rightmost edge
            targetX = Math.max(...bounds.map(b => b.right));
        }

        // Sort nodes by their current Y position (top to bottom)
        const sortedNodes = selectedNodes.map((node, index) => ({
            node,
            bounds: bounds[index]
        })).sort((a, b) => a.bounds.top - b.bounds.top);

        // If 3+ nodes, distribute vertical spacing evenly
        if (sortedNodes.length >= 3) {
            const topmost = sortedNodes[0].bounds.top;
            const bottommost = sortedNodes[sortedNodes.length - 1].bounds.bottom;

            // Calculate total height occupied by all nodes
            const totalNodeHeight = sortedNodes.reduce((sum, item) =>
                sum + (item.bounds.bottom - item.bounds.top), 0);

            // Calculate total available space for gaps
            const totalSpace = bottommost - topmost;
            const totalGapSpace = totalSpace - totalNodeHeight;
            const numGaps = sortedNodes.length - 1;
            const averageGap = totalGapSpace / numGaps;

            // Position nodes with even spacing
            let currentY = topmost;
            sortedNodes.forEach((item) => {
                const nodeHeight = item.bounds.bottom - item.bounds.top;
                const offsetY = currentY - item.bounds.top;

                // Move node vertically
                if (item.node.type === 'circle') {
                    item.node.y += offsetY;
                } else {
                    item.node.y += offsetY;
                }

                // Align horizontally
                setNodePosition(item.node, alignType, targetX);

                // Move to next position
                currentY += nodeHeight + averageGap;
            });
        } else {
            // Just align X position for 2 nodes
            selectedNodes.forEach((node) => {
                setNodePosition(node, alignType, targetX);
            });
        }
    } else {
        setStatus(`Unknown alignment type: ${alignType}`);
        return;
    }

    render();
    triggerAutoSave();

    const alignNames = {
        'center-h': 'Horizontal (distributed)',
        'center-v': 'Vertical (distributed)',
        'top': 'Top (distributed)',
        'bottom': 'Bottom (distributed)',
        'left': 'Left (distributed)',
        'right': 'Right (distributed)'
    };
    const alignName = alignNames[alignType] || alignType;
    const spacingNote = selectedNodes.length >= 3 ? ' with even spacing' : '';
    setStatus(`Aligned ${selectedNodes.length} nodes: ${alignName}${spacingNote}`);
}
