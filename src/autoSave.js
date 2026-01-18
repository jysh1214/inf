// Start cursor blinking
function startCursorBlink() {
    cursorVisible = true;
    if (cursorBlinkInterval) {
        clearInterval(cursorBlinkInterval);
    }
    cursorBlinkInterval = setInterval(() => {
        cursorVisible = !cursorVisible;
        if (editingNode) {
            render();
        }
    }, CURSOR_BLINK_RATE);
}

// Stop cursor blinking
function stopCursorBlink() {
    if (cursorBlinkInterval) {
        clearInterval(cursorBlinkInterval);
        cursorBlinkInterval = null;
    }
    cursorVisible = true;
}

// Auto-save to localStorage (debounced)
function triggerAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(autoSave, AUTO_SAVE_DELAY);
}

function autoSave() {
    try {
        const saveData = {
            version: VERSION,
            nodes: nodes,
            connections: connections,
            nextId: nextId,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            zoom: zoom,
            timestamp: new Date().toISOString(),
            // Subgraph navigation state
            subgraphStack: subgraphStack,
            currentDepth: currentDepth,
            currentPath: currentPath,
            // Multi-select state
            selectedNodeIds: Array.from(selectedNodeIds)
        };
        localStorage.setItem('inf-autosave', JSON.stringify(saveData));
        console.log('Auto-saved at', saveData.timestamp);

        // Brief visual feedback (2 seconds)
        const currentStatus = document.getElementById('status').textContent;
        setStatus('✓ Auto-saved');
        if (autoSaveStatusTimer) {
            clearTimeout(autoSaveStatusTimer);
        }
        autoSaveStatusTimer = setTimeout(() => {
            // Only restore if status hasn't been changed by user action
            if (document.getElementById('status').textContent === '✓ Auto-saved') {
                setStatus('Ready');
            }
        }, 2000);
    } catch (error) {
        console.error('Auto-save failed:', error);
        if (error.name === 'QuotaExceededError') {
            setStatus('⚠️ Auto-save failed: Storage full. Please save manually.');
        } else {
            setStatus('⚠️ Auto-save failed. Please save manually.');
        }
    }
}

// Load from localStorage on startup
function autoLoad() {
    try {
        const saved = localStorage.getItem('inf-autosave');
        if (!saved) {
            console.log('No auto-save found');
            return false;
        }

        const saveData = JSON.parse(saved);

        // Validate the data structure
        if (!saveData.nodes || !Array.isArray(saveData.nodes)) {
            console.warn('Invalid auto-save data: missing nodes array');
            return false;
        }

        // Validate each node has required properties
        for (let node of saveData.nodes) {
            if (!node.id || !node.type) {
                console.warn('Invalid auto-save data: node missing required properties', node);
                return false;
            }
            // Check type-specific required properties
            if (node.type === 'circle' && node.radius === undefined) {
                console.warn('Invalid auto-save data: circle node missing radius', node);
                return false;
            }
            if ((node.type === 'rectangle' || node.type === 'diamond' || node.type === 'text' || node.type === 'code') &&
                (node.width === undefined || node.height === undefined)) {
                console.warn('Invalid auto-save data: node missing dimensions', node);
                return false;
            }
            if (node.type === 'table' &&
                (node.rows === undefined || node.cols === undefined ||
                 node.cellWidth === undefined || node.cellHeight === undefined ||
                 node.cells === undefined)) {
                console.warn('Invalid auto-save data: table node missing required properties', node);
                return false;
            }
        }

        // Load the data
        nodes = saveData.nodes;
        connections = saveData.connections || [];
        nextId = saveData.nextId || 1;

        // Restore canvas size and zoom if saved
        if (saveData.canvasWidth && saveData.canvasHeight) {
            canvasWidth = saveData.canvasWidth;
            canvasHeight = saveData.canvasHeight;
            resizeCanvas();
        }
        if (saveData.zoom !== undefined) {
            zoom = saveData.zoom;
        }

        // Rebuild nodeMap
        nodeMap.clear();
        nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });

        // Restore subgraph navigation state
        if (saveData.subgraphStack !== undefined) {
            subgraphStack = saveData.subgraphStack;
        }
        if (saveData.currentDepth !== undefined) {
            currentDepth = saveData.currentDepth;
        }
        if (saveData.currentPath !== undefined) {
            currentPath = saveData.currentPath;
        }

        // Restore multi-select state
        if (saveData.selectedNodeIds !== undefined) {
            selectedNodeIds = new Set(saveData.selectedNodeIds);
        }

        render();
        console.log('Auto-loaded from', saveData.timestamp);

        // Update status with breadcrumb if we're in a subgraph
        if (currentDepth > 0) {
            updateBreadcrumb();
        } else {
            setStatus(`Restored ${nodes.length} nodes from auto-save`);
        }

        return true;
    } catch (error) {
        console.error('Auto-load failed:', error);
        return false;
    }
}

// Initialize canvas size
function resizeCanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    render();
}
