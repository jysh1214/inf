function saveToJSON() {
    // Prompt for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `inf-diagram-${timestamp}`;
    const userFilename = prompt('Enter filename (without .json extension):', defaultFilename);

    // If user cancels, don't save
    if (userFilename === null) {
        setStatus('Save cancelled');
        return;
    }

    // Sanitize filename - remove invalid characters
    const sanitized = userFilename.trim().replace(/[<>:"/\\|?*]/g, '-');
    const filename = sanitized || defaultFilename;

    // Create save data object
    const saveData = {
        version: '1.0',
        nodes: nodes,
        connections: connections,
        nextId: nextId,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        zoom: zoom
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(saveData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus(`Diagram saved to ${a.download}`);
}

function loadFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const saveData = JSON.parse(e.target.result);

            // Validate the data structure
            if (!saveData.nodes || !Array.isArray(saveData.nodes)) {
                throw new Error('Invalid file format: missing nodes array');
            }
            if (!saveData.connections || !Array.isArray(saveData.connections)) {
                throw new Error('Invalid file format: missing connections array');
            }

            // Stop any ongoing editing
            stopCursorBlink();

            // Load the data
            nodes = saveData.nodes;
            connections = saveData.connections;

            // Calculate nextId safely
            if (saveData.nextId) {
                nextId = saveData.nextId;
            } else {
                const allIds = [...nodes.map(n => n.id), ...connections.map(c => c.id)];
                nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
            }

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

            // Reset state
            selectedNode = null;
            selectedConnection = null;
            hoveredNode = null;
            editingNode = null;
            connectionMode = false;
            connectionStart = null;
            clearConnectionButtons();

            // Reset alignment buttons to default
            updateAlignmentButtons(currentTextAlign);

            render();
            setStatus(`Loaded ${nodes.length} nodes and ${connections.length} connections from ${file.name}`);

            // Trigger auto-save after loading
            triggerAutoSave();
        } catch (error) {
            setStatus(`⚠️ Error loading file: ${error.message}`);
            console.error('Load error:', error);
        }
    };

    reader.onerror = function() {
        setStatus('⚠️ Error reading file');
    };

    reader.readAsText(file);

    // Reset the file input so the same file can be loaded again
    event.target.value = '';
}

function exportToPNG() {
    // Check if canvas is empty
    if (nodes.length === 0 && connections.length === 0) {
        if (!confirm('Canvas is empty. Export anyway?')) {
            setStatus('Export cancelled');
            return;
        }
    }

    // Prompt for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `inf-diagram-${timestamp}`;
    const userFilename = prompt('Enter filename (without .png extension):', defaultFilename);

    // If user cancels, don't export
    if (userFilename === null) {
        setStatus('Export cancelled');
        return;
    }

    // Sanitize filename - remove invalid characters
    const sanitized = userFilename.trim().replace(/[<>:"/\\|?*]/g, '-');
    const filename = sanitized || defaultFilename;

    // Temporarily set zoom to 1.0 for export
    const originalZoom = zoom;
    zoom = 1.0;
    render();

    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        // Restore original zoom
        zoom = originalZoom;
        render();

        if (!blob) {
            setStatus('⚠️ Error exporting image');
            return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.png`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus(`Image exported to ${a.download}`);
    }, 'image/png');
}
