// Helper functions
function setStatus(text) {
    document.getElementById('status').textContent = text;
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
    currentTextAlign = align;
    updateAlignmentButtons(align);

    // If a cell is selected, update its alignment
    if (selectedCell) {
        const cell = selectedCell.table.cells[selectedCell.row][selectedCell.col];
        cell.textAlign = align;
        render();
        setStatus(`Cell alignment: ${align}`);
        triggerAutoSave();
    } else if (selectedNode) {
        // If a node is selected, update its alignment
        selectedNode.textAlign = align;
        render();
        setStatus(`Text alignment: ${align}`);
        triggerAutoSave();
    } else {
        setStatus(`Default text alignment: ${align}`);
    }
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
        nodeMap.clear();
        selectedNode = null;
        selectedConnection = null;
        selectedCell = null;
        hoveredNode = null;
        editingNode = null;
        connectionMode = false;
        connectionStart = null;

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
            const tableWidth = node.cols * node.cellWidth;
            const tableHeight = node.rows * node.cellHeight;
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

function setNodePosition(node, bounds, alignType, targetValue) {
    // Adjusts node position based on alignment type and target value
    switch (node.type) {
        case 'circle':
            if (alignType === 'left') {
                node.x = targetValue + node.radius;
            } else if (alignType === 'right') {
                node.x = targetValue - node.radius;
            } else if (alignType === 'center-h') {
                node.x = targetValue;
            } else if (alignType === 'top') {
                node.y = targetValue + node.radius;
            } else if (alignType === 'bottom') {
                node.y = targetValue - node.radius;
            } else if (alignType === 'center-v') {
                node.y = targetValue;
            }
            break;

        case 'table':
            const tableWidth = node.cols * node.cellWidth;
            const tableHeight = node.rows * node.cellHeight;
            if (alignType === 'left') {
                node.x = targetValue;
            } else if (alignType === 'right') {
                node.x = targetValue - tableWidth;
            } else if (alignType === 'center-h') {
                node.x = targetValue - tableWidth / 2;
            } else if (alignType === 'top') {
                node.y = targetValue;
            } else if (alignType === 'bottom') {
                node.y = targetValue - tableHeight;
            } else if (alignType === 'center-v') {
                node.y = targetValue - tableHeight / 2;
            }
            break;

        case 'rectangle':
        case 'diamond':
        case 'text':
        case 'code':
        default:
            if (alignType === 'left') {
                node.x = targetValue;
            } else if (alignType === 'right') {
                node.x = targetValue - node.width;
            } else if (alignType === 'center-h') {
                node.x = targetValue - node.width / 2;
            } else if (alignType === 'top') {
                node.y = targetValue;
            } else if (alignType === 'bottom') {
                node.y = targetValue - node.height;
            } else if (alignType === 'center-v') {
                node.y = targetValue - node.height / 2;
            }
            break;
    }
}

function alignNodes(alignType) {
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

    let targetValue;

    if (alignType === 'center-h') {
        // Average of all centerX positions
        targetValue = bounds.reduce((sum, b) => sum + b.centerX, 0) / bounds.length;
    } else if (alignType === 'center-v') {
        // Average of all centerY positions
        targetValue = bounds.reduce((sum, b) => sum + b.centerY, 0) / bounds.length;
    } else {
        setStatus(`Unknown alignment type: ${alignType}`);
        return;
    }

    // Align all selected nodes
    selectedNodes.forEach((node, index) => {
        setNodePosition(node, bounds[index], alignType, targetValue);
    });

    render();
    triggerAutoSave();

    const alignName = alignType === 'center-h' ? 'Horizontal' : 'Vertical';
    setStatus(`Aligned ${selectedNodes.length} nodes: ${alignName}`);
}
