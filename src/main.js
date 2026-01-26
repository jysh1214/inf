// Initial canvas setup
resizeCanvas();

// Clear any existing timers from previous session (prevents memory leaks)
if (typeof autoSaveTimer !== 'undefined' && autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
}
if (typeof autoSaveStatusTimer !== 'undefined' && autoSaveStatusTimer) {
    clearTimeout(autoSaveStatusTimer);
    autoSaveStatusTimer = null;
}
if (typeof cursorBlinkInterval !== 'undefined' && cursorBlinkInterval) {
    clearInterval(cursorBlinkInterval);
    cursorBlinkInterval = null;
}

// Initial render
document.title = `Inf - v${VERSION}`;
document.getElementById('app-title').textContent = `Inf - v${VERSION}`;
updateFilePathDisplay(); // Initialize file path display (hidden initially)

// Populate font selector from AVAILABLE_FONTS constant
const fontSelector = document.getElementById('font-selector');
if (fontSelector) {
    AVAILABLE_FONTS.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        if (font === currentFontFamily) {
            option.selected = true;
        }
        fontSelector.appendChild(option);
    });
}

// Populate code font selector from AVAILABLE_FONTS constant
const codeFontSelector = document.getElementById('code-font-selector');
if (codeFontSelector) {
    AVAILABLE_FONTS.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        if (font === currentCodeFontFamily) {
            option.selected = true;
        }
        codeFontSelector.appendChild(option);
    });
}

setStatus('Loading...');
render();

// Restore workspace folder and auto-load root.json if it exists
(async function restoreWorkspaceInfo() {
    try {
        const dirHandle = await getDirectoryHandle();
        if (dirHandle) {
            workspaceFolderName = dirHandle.name;
            updateFilePathDisplay();

            // Try to auto-load root.json
            try {
                const rootHandle = await dirHandle.getFileHandle('root.json');
                const file = await rootHandle.getFile();
                const contents = await file.text();
                const data = JSON.parse(contents);

                // Validate the diagram data
                validateDiagramData(data);

                // Load the diagram
                nodes = data.nodes;
                connections = data.connections;
                groups = data.groups || [];

                // Calculate nextId safely
                if (data.nextId !== undefined && data.nextId !== null) {
                    nextId = data.nextId;
                } else {
                    nextId = calculateSafeNextId(nodes, connections, groups);
                }

                // Restore canvas size and zoom if saved
                if (data.canvasWidth && data.canvasHeight) {
                    canvasWidth = data.canvasWidth;
                    canvasHeight = data.canvasHeight;
                } else {
                    canvasWidth = DEFAULT_CANVAS_WIDTH;
                    canvasHeight = DEFAULT_CANVAS_HEIGHT;
                }

                if (data.zoom !== undefined) {
                    zoom = data.zoom;
                } else {
                    zoom = 1.0;
                }

                // Rebuild node map
                nodeMap.clear();
                nodes.forEach(node => nodeMap.set(node.id, node));

                // Clear selection state
                selectedNodeIds.clear();
                selectedConnection = null;
                editingNode = null;
                connectionMode = false;
                connectionStart = null;

                // Reset subgraph navigation state
                subgraphStack = [];
                currentDepth = 0;
                currentPath = [];

                // Update current filename and file handle
                currentFileName = 'root.json';
                currentFileHandle = rootHandle;
                updateFilePathDisplay();

                // Update UI
                resizeCanvas();
                updateBreadcrumb();

                setStatus(`✓ Loaded root.json (${nodes.length} nodes, ${connections.length} connections)`);
            } catch (rootError) {
                // root.json doesn't exist or failed to load
                if (rootError.name === 'NotFoundError') {
                    setStatus(`Workspace: ${dirHandle.name} - Double-click to create nodes`);
                } else {
                    console.error('Failed to load root.json:', rootError);
                    setStatus(`⚠️ Failed to load root.json: ${rootError.message}`);
                }
            }
        } else {
            // No workspace folder set
            setStatus('Double-click to create nodes');
        }
    } catch (error) {
        console.warn('Failed to restore workspace info:', error);
        setStatus('Double-click to create nodes');
    }
})();
