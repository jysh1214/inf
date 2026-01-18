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

    // If a node is selected, update its alignment
    if (selectedNode) {
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
    } else if (selectedNode) {
        // Start connection mode if a node is selected
        directedMode = directed;
        connectionMode = true;
        connectionStart = selectedNode;
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
