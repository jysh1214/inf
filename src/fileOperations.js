async function saveToJSON() {
    // Generate default filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `inf-diagram-${timestamp}`;

    // Create save data object
    const saveData = {
        version: VERSION,
        nodes: nodes,
        connections: connections,
        nextId: nextId,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        zoom: zoom
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(saveData, null, 2);

    // Use File System Access API if available (Chrome/Edge)
    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `${defaultFilename}.json`,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();

            setStatus(`Diagram saved to ${fileHandle.name}`);
        } catch (error) {
            // Handle different error types
            if (error.name === 'AbortError') {
                setStatus('Save cancelled');
            } else if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
                setStatus('⚠️ Permission denied. Please try again.');
                console.error('Save error:', error);
            } else {
                console.error('Save error:', error);
                setStatus(`⚠️ Error saving file: ${error.message}`);
            }
        }
    } else {
        // Fallback for browsers without File System Access API
        const userFilename = prompt('Enter filename (without .json extension):', defaultFilename);

        // If user cancels, don't save
        if (userFilename === null) {
            setStatus('Save cancelled');
            return;
        }

        // Sanitize filename - remove invalid characters
        const sanitized = userFilename.trim().replace(/[<>:"/\\|?*]/g, '-');
        const filename = sanitized || defaultFilename;

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
}

// Validation helper functions
function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function isValidId(value) {
    return isValidNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * Validate complete diagram data structure
 * @param {object} data - The diagram data to validate
 * @throws {Error} If validation fails
 */
function validateDiagramData(data) {
    // Validate top-level structure
    if (data === null || data === undefined || typeof data !== 'object') {
        throw new Error('Invalid file format: root must be an object');
    }
    if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid file format: missing or invalid "nodes" array');
    }
    if (!data.connections || !Array.isArray(data.connections)) {
        throw new Error('Invalid file format: missing or invalid "connections" array');
    }

    // Check for null/undefined elements in arrays
    if (data.nodes.some((node, i) => node === null || node === undefined)) {
        throw new Error('Invalid file format: nodes array contains null or undefined elements');
    }
    if (data.connections.some((conn, i) => conn === null || conn === undefined)) {
        throw new Error('Invalid file format: connections array contains null or undefined elements');
    }

    // Validate each node
    const nodeIds = new Set();
    data.nodes.forEach((node, index) => {
        validateNode(node, index);
        nodeIds.add(node.id);
    });

    // Check for duplicate node IDs
    if (nodeIds.size !== data.nodes.length) {
        throw new Error('Invalid file format: duplicate node IDs found');
    }

    // Validate each connection
    const connectionIds = new Set();
    data.connections.forEach((conn, index) => {
        validateConnection(conn, index, nodeIds);
        connectionIds.add(conn.id);
    });

    // Check for duplicate connection IDs
    if (connectionIds.size !== data.connections.length) {
        throw new Error('Invalid file format: duplicate connection IDs found');
    }

    // Validate optional canvas size
    if (data.canvasWidth !== undefined && data.canvasWidth !== null) {
        if (!isValidNumber(data.canvasWidth)) {
            throw new Error(`Invalid canvasWidth: must be a valid number (got ${data.canvasWidth})`);
        }
        if (data.canvasWidth < MIN_CANVAS_SIZE || data.canvasWidth > MAX_CANVAS_SIZE) {
            throw new Error(`Invalid canvasWidth: must be between ${MIN_CANVAS_SIZE} and ${MAX_CANVAS_SIZE} (got ${data.canvasWidth})`);
        }
    }
    if (data.canvasHeight !== undefined && data.canvasHeight !== null) {
        if (!isValidNumber(data.canvasHeight)) {
            throw new Error(`Invalid canvasHeight: must be a valid number (got ${data.canvasHeight})`);
        }
        if (data.canvasHeight < MIN_CANVAS_SIZE || data.canvasHeight > MAX_CANVAS_SIZE) {
            throw new Error(`Invalid canvasHeight: must be between ${MIN_CANVAS_SIZE} and ${MAX_CANVAS_SIZE} (got ${data.canvasHeight})`);
        }
    }

    // Validate optional zoom
    if (data.zoom !== undefined && data.zoom !== null) {
        if (!isValidNumber(data.zoom)) {
            throw new Error(`Invalid zoom: must be a valid number (got ${data.zoom})`);
        }
        if (data.zoom < MIN_ZOOM || data.zoom > MAX_ZOOM) {
            throw new Error(`Invalid zoom: must be between ${MIN_ZOOM} and ${MAX_ZOOM} (got ${data.zoom})`);
        }
    }

    // Validate optional nextId
    if (data.nextId !== undefined && data.nextId !== null) {
        if (!isValidId(data.nextId)) {
            throw new Error(`Invalid nextId: must be a positive integer (got ${data.nextId})`);
        }
    }
}

function validateNode(node, index) {
    // Constants for validation
    const MAX_NODE_SIZE = 10000;
    const MIN_NODE_SIZE = 1;

    // Check if node is null or not an object
    if (node === null || node === undefined || typeof node !== 'object') {
        throw new Error(`Node ${index}: must be an object (got ${node === null ? 'null' : typeof node})`);
    }

    // Check required fields with robust null/undefined checks
    if (node.id === null || node.id === undefined) {
        throw new Error(`Node ${index}: missing 'id' field`);
    }
    if (!isValidId(node.id)) {
        throw new Error(`Node ${index}: 'id' must be a positive integer (got ${node.id})`);
    }

    if (node.type === null || node.type === undefined || typeof node.type !== 'string') {
        throw new Error(`Node ${index} (id: ${node.id}): missing or invalid 'type' field`);
    }

    if (!isValidNumber(node.x)) {
        throw new Error(`Node ${index} (id: ${node.id}): 'x' must be a valid number (got ${node.x})`);
    }
    if (!isValidNumber(node.y)) {
        throw new Error(`Node ${index} (id: ${node.id}): 'y' must be a valid number (got ${node.y})`);
    }

    // Validate node type
    const validTypes = ['rectangle', 'circle', 'diamond', 'text'];
    if (!validTypes.includes(node.type)) {
        throw new Error(`Node ${index} (id: ${node.id}): invalid type '${node.type}'. Must be one of: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (node.type === 'circle') {
        if (!isValidNumber(node.radius)) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' must be a valid number (got ${node.radius})`);
        }
        if (node.radius <= MIN_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' must be greater than ${MIN_NODE_SIZE}`);
        }
        if (node.radius > MAX_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' too large (max: ${MAX_NODE_SIZE})`);
        }
    } else if (node.type === 'rectangle' || node.type === 'diamond' || node.type === 'text') {
        if (!isValidNumber(node.width)) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'width' must be a valid number (got ${node.width})`);
        }
        if (node.width <= MIN_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'width' must be greater than ${MIN_NODE_SIZE}`);
        }
        if (node.width > MAX_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'width' too large (max: ${MAX_NODE_SIZE})`);
        }

        if (!isValidNumber(node.height)) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'height' must be a valid number (got ${node.height})`);
        }
        if (node.height <= MIN_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'height' must be greater than ${MIN_NODE_SIZE}`);
        }
        if (node.height > MAX_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): '${node.type}' 'height' too large (max: ${MAX_NODE_SIZE})`);
        }
    }

    // Validate text field (optional but if present must be string)
    if (node.text !== undefined && node.text !== null && typeof node.text !== 'string') {
        throw new Error(`Node ${index} (id: ${node.id}): 'text' must be a string (got ${typeof node.text})`);
    }

    // Validate textAlign field (optional but if present must be valid)
    if (node.textAlign !== undefined && node.textAlign !== null) {
        const validAlignments = ['left', 'center', 'right'];
        if (!validAlignments.includes(node.textAlign)) {
            throw new Error(`Node ${index} (id: ${node.id}): 'textAlign' must be one of: ${validAlignments.join(', ')} (got '${node.textAlign}')`);
        }
    }

    // Validate subgraph field (optional)
    if (node.subgraph !== undefined && node.subgraph !== null) {
        validateSubgraph(node.subgraph, node.id, index);
    }
}

function validateConnection(conn, index, nodeIds) {
    // Check if connection is null or not an object
    if (conn === null || conn === undefined || typeof conn !== 'object') {
        throw new Error(`Connection ${index}: must be an object (got ${conn === null ? 'null' : typeof conn})`);
    }

    // Check required fields with robust null/undefined checks
    if (conn.id === null || conn.id === undefined) {
        throw new Error(`Connection ${index}: missing 'id' field`);
    }
    if (!isValidId(conn.id)) {
        throw new Error(`Connection ${index}: 'id' must be a positive integer (got ${conn.id})`);
    }

    if (conn.fromId === null || conn.fromId === undefined) {
        throw new Error(`Connection ${index} (id: ${conn.id}): missing 'fromId' field`);
    }
    if (!isValidId(conn.fromId)) {
        throw new Error(`Connection ${index} (id: ${conn.id}): 'fromId' must be a positive integer (got ${conn.fromId})`);
    }

    if (conn.toId === null || conn.toId === undefined) {
        throw new Error(`Connection ${index} (id: ${conn.id}): missing 'toId' field`);
    }
    if (!isValidId(conn.toId)) {
        throw new Error(`Connection ${index} (id: ${conn.id}): 'toId' must be a positive integer (got ${conn.toId})`);
    }

    if (typeof conn.directed !== 'boolean') {
        throw new Error(`Connection ${index} (id: ${conn.id}): 'directed' must be a boolean (got ${typeof conn.directed})`);
    }

    // Validate node references
    if (!nodeIds.has(conn.fromId)) {
        throw new Error(`Connection ${index} (id: ${conn.id}): 'fromId' ${conn.fromId} references non-existent node`);
    }
    if (!nodeIds.has(conn.toId)) {
        throw new Error(`Connection ${index} (id: ${conn.id}): 'toId' ${conn.toId} references non-existent node`);
    }
}

function validateSubgraph(subgraph, nodeId, nodeIndex) {
    // Check if subgraph is null/undefined (valid - no subgraph)
    if (subgraph === null || subgraph === undefined) {
        return; // No subgraph is valid
    }

    // Check if it's a file path (string)
    if (typeof subgraph === 'string') {
        // Validate it's a non-empty string ending in .json
        if (subgraph.trim() === '') {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): 'subgraph' file path cannot be empty`);
        }
        if (!subgraph.toLowerCase().endsWith('.json')) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): 'subgraph' file path must end with .json (got '${subgraph}')`);
        }
        // Note: We don't validate file existence here, only format
        return;
    }

    // Check if it's an embedded subgraph object
    if (typeof subgraph === 'object') {
        // Validate it has the same structure as a diagram file
        if (!subgraph.nodes || !Array.isArray(subgraph.nodes)) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' missing or invalid "nodes" array`);
        }
        if (!subgraph.connections || !Array.isArray(subgraph.connections)) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' missing or invalid "connections" array`);
        }

        // Check for null/undefined elements
        if (subgraph.nodes.some((n, i) => n === null || n === undefined)) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' nodes array contains null or undefined elements`);
        }
        if (subgraph.connections.some((c, i) => c === null || c === undefined)) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' connections array contains null or undefined elements`);
        }

        // Validate each node in the subgraph
        const subNodeIds = new Set();
        subgraph.nodes.forEach((node, idx) => {
            validateNode(node, idx);
            subNodeIds.add(node.id);
        });

        // Check for duplicate node IDs
        if (subNodeIds.size !== subgraph.nodes.length) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' contains duplicate node IDs`);
        }

        // Validate each connection in the subgraph
        const subConnIds = new Set();
        subgraph.connections.forEach((conn, idx) => {
            validateConnection(conn, idx, subNodeIds);
            subConnIds.add(conn.id);
        });

        // Check for duplicate connection IDs
        if (subConnIds.size !== subgraph.connections.length) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' contains duplicate connection IDs`);
        }

        // Validate optional canvas dimensions
        if (subgraph.canvasWidth !== undefined && subgraph.canvasWidth !== null) {
            if (!isValidNumber(subgraph.canvasWidth)) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' canvasWidth must be a valid number`);
            }
            if (subgraph.canvasWidth < MIN_CANVAS_SIZE || subgraph.canvasWidth > MAX_CANVAS_SIZE) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' canvasWidth must be between ${MIN_CANVAS_SIZE} and ${MAX_CANVAS_SIZE}`);
            }
        }
        if (subgraph.canvasHeight !== undefined && subgraph.canvasHeight !== null) {
            if (!isValidNumber(subgraph.canvasHeight)) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' canvasHeight must be a valid number`);
            }
            if (subgraph.canvasHeight < MIN_CANVAS_SIZE || subgraph.canvasHeight > MAX_CANVAS_SIZE) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' canvasHeight must be between ${MIN_CANVAS_SIZE} and ${MAX_CANVAS_SIZE}`);
            }
        }

        // Validate optional zoom
        if (subgraph.zoom !== undefined && subgraph.zoom !== null) {
            if (!isValidNumber(subgraph.zoom)) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' zoom must be a valid number`);
            }
            if (subgraph.zoom < MIN_ZOOM || subgraph.zoom > MAX_ZOOM) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' zoom must be between ${MIN_ZOOM} and ${MAX_ZOOM}`);
            }
        }

        return;
    }

    // Invalid type
    throw new Error(`Node ${nodeIndex} (id: ${nodeId}): 'subgraph' must be a string (file path) or object (embedded subgraph), got ${typeof subgraph}`);
}

// Workspace folder selection
async function selectWorkspaceFolder() {
    try {
        if (!('showDirectoryPicker' in window)) {
            setStatus('⚠️ Directory picker not supported in this browser');
            return;
        }

        const dirHandle = await window.showDirectoryPicker({
            mode: 'read'
        });

        // Store the directory handle
        await storeDirectoryHandle(dirHandle);

        setStatus(`✓ Workspace folder set: ${dirHandle.name}`);

        // Try to load root.json if it exists
        try {
            const rootHandle = await dirHandle.getFileHandle('root.json');
            const file = await rootHandle.getFile();
            const contents = await file.text();
            const data = JSON.parse(contents);

            // Validate the diagram data
            validateDiagramData(data);

            // Stop any ongoing editing
            stopCursorBlink();

            // Load the diagram
            nodes = data.nodes;
            connections = data.connections;

            // Calculate nextId safely
            if (data.nextId !== undefined && data.nextId !== null) {
                nextId = data.nextId;
            } else {
                const allIds = [...nodes.map(n => n.id), ...connections.map(c => c.id)];
                nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
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
            selectedNode = null;
            selectedConnection = null;
            editingNode = null;
            connectionMode = false;
            connectionStart = null;

            // Reset subgraph navigation state
            subgraphStack = [];
            currentDepth = 0;
            currentPath = [];

            // Update UI
            resizeCanvas();
            updateSubgraphNavigation();
            triggerAutoSave();

            setStatus(`✓ Workspace set and loaded root.json`);
        } catch (rootError) {
            // root.json doesn't exist or failed to load - that's okay
            if (rootError.name === 'NotFoundError') {
                setStatus(`✓ Workspace folder set: ${dirHandle.name} (no root.json found)`);
            } else {
                console.warn('Failed to load root.json:', rootError);
                setStatus(`✓ Workspace folder set: ${dirHandle.name} (root.json invalid: ${rootError.message})`);
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            setStatus('Workspace folder selection cancelled');
        } else {
            setStatus(`⚠️ Error selecting workspace folder: ${error.message}`);
            console.error('Workspace folder selection error:', error);
        }
    }
}

// Subgraph management functions
async function createNewSubgraph(node) {
    try {
        // Check if workspace folder is set for file-based subgraphs
        const hasWorkspace = await getDirectoryHandle();

        // Prompt user to choose subgraph type using modal
        const choice = await showSubgraphModal(hasWorkspace);

        // User cancelled
        if (!choice) {
            setStatus('Subgraph creation cancelled');
            return;
        }

        if (choice === 'embedded') {
            // Create embedded subgraph
            node.subgraph = {
                version: VERSION,
                nodes: [],
                connections: [],
                nextId: 1,
                canvasWidth: DEFAULT_CANVAS_WIDTH,
                canvasHeight: DEFAULT_CANVAS_HEIGHT,
                zoom: 1.0
            };
            setStatus(`Created embedded subgraph for node #${node.id} - Entering...`);
            render();
            triggerAutoSave();

            // Enter the subgraph immediately
            await enterSubgraph(node);
        } else if (choice === 'new-file') {
            // Create new file-based subgraph
            if ('showSaveFilePicker' in window) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `subgraph-node-${node.id}-${timestamp}.json`,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });

                // Create initial empty subgraph data
                const subgraphData = {
                    version: VERSION,
                    nodes: [],
                    connections: [],
                    nextId: 1,
                    canvasWidth: DEFAULT_CANVAS_WIDTH,
                    canvasHeight: DEFAULT_CANVAS_HEIGHT,
                    zoom: 1.0
                };

                // Write to file
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(subgraphData, null, 2));
                await writable.close();

                // Store file handle in memory and IndexedDB
                fileHandleMap.set(node.id, fileHandle);
                try {
                    await storeFileHandle(node.id, fileHandle);
                } catch (storeError) {
                    console.warn('Failed to persist file handle to IndexedDB:', storeError);
                    // Continue anyway - handle is in memory cache
                }

                // Set node's subgraph to filename
                node.subgraph = fileHandle.name;

                setStatus(`Created file-based subgraph '${fileHandle.name}' for node #${node.id} - Entering...`);
                render();
                triggerAutoSave();

                // Enter the subgraph immediately
                await enterSubgraph(node);
            } else {
                setStatus('⚠️ File System Access API not supported. Creating embedded subgraph instead.');
                node.subgraph = {
                    version: VERSION,
                    nodes: [],
                    connections: [],
                    nextId: 1,
                    canvasWidth: DEFAULT_CANVAS_WIDTH,
                    canvasHeight: DEFAULT_CANVAS_HEIGHT,
                    zoom: 1.0
                };
                render();
                triggerAutoSave();

                // Enter the subgraph immediately
                await enterSubgraph(node);
            }
        } else if (choice === 'existing-file') {
            // Load existing file as subgraph
            if ('showOpenFilePicker' in window) {
                const handles = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false
                });
                const fileHandle = handles[0];

                // Read and validate file contents before linking
                try {
                    const file = await fileHandle.getFile();
                    const contents = await file.text();

                    // Parse JSON
                    let subgraphData;
                    try {
                        subgraphData = JSON.parse(contents);
                    } catch (parseError) {
                        throw new Error(`Invalid JSON in file '${fileHandle.name}': ${parseError.message}`);
                    }

                    // Validate subgraph structure
                    validateSubgraph(subgraphData, node.id, null);

                    // Validation passed - store file handle in memory and IndexedDB
                    fileHandleMap.set(node.id, fileHandle);
                    try {
                        await storeFileHandle(node.id, fileHandle);
                    } catch (storeError) {
                        console.warn('Failed to persist file handle to IndexedDB:', storeError);
                        // Continue anyway - handle is in memory cache
                    }
                    node.subgraph = fileHandle.name;

                    setStatus(`Linked existing file '${fileHandle.name}' as subgraph for node #${node.id} - Entering...`);
                    render();
                    triggerAutoSave();

                    // Enter the subgraph immediately
                    await enterSubgraph(node);
                } catch (validationError) {
                    setStatus(`⚠️ Invalid subgraph file: ${validationError.message}`);
                    console.error('File validation error:', validationError);
                }
            } else {
                setStatus('⚠️ File System Access API not supported. Cannot load existing file.');
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            setStatus('Subgraph creation cancelled');
        } else {
            setStatus(`⚠️ Error creating subgraph: ${error.message}`);
            console.error('Subgraph creation error:', error);
        }
    }
}

async function loadSubgraphFromFile(filePath, nodeId) {
    try {
        // Check if we already have a file handle for this node (memory cache)
        let fileHandle = fileHandleMap.get(nodeId);
        let fileHandleSource = fileHandle ? 'memory' : null;

        // If not in memory, try IndexedDB (persistent storage)
        if (!fileHandle) {
            fileHandle = await getFileHandle(nodeId);

            // If found in IndexedDB, verify we still have permission
            if (fileHandle) {
                const hasPermission = await verifyPermission(fileHandle);
                if (!hasPermission) {
                    // Permission lost, need to reselect
                    fileHandle = null;
                } else {
                    // Store in memory cache for faster access
                    fileHandleMap.set(nodeId, fileHandle);
                    fileHandleSource = 'indexeddb';
                }
            }
        }

        // Try to access the file to verify the handle is still valid
        if (fileHandle) {
            try {
                await fileHandle.getFile();
                // File access successful, handle is valid
            } catch (error) {
                // File handle is stale (file deleted, moved, or permission lost)
                console.warn(`File handle from ${fileHandleSource} is stale:`, error);
                fileHandle = null;
                fileHandleMap.delete(nodeId);
                await deleteFileHandle(nodeId);
            }
        }

        // If still no valid handle, try to find in authorized directory
        if (!fileHandle && filePath) {
            // Extract filename from path (handles Unix, Windows, UNC, and mixed paths)
            const pathParts = filePath.split(/[\\/]/).filter(Boolean);
            const filename = pathParts.length > 0 ? pathParts[pathParts.length - 1] : filePath;

            fileHandle = await findFileInDirectory(filename);

            if (fileHandle) {
                // Found in directory! Store for future use
                fileHandleMap.set(nodeId, fileHandle);
                try {
                    await storeFileHandle(nodeId, fileHandle);
                } catch (storeError) {
                    console.warn('Failed to persist file handle to IndexedDB:', storeError);
                    // Continue anyway - handle is in memory cache
                }
                setStatus(`Opened ${filename} from workspace`);
            }
        }

        // If still no handle, prompt user to select the file
        if (!fileHandle) {
            if ('showOpenFilePicker' in window) {
                const handles = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false
                });
                fileHandle = handles[0];

                // Store in both memory and IndexedDB
                fileHandleMap.set(nodeId, fileHandle);
                try {
                    await storeFileHandle(nodeId, fileHandle);
                } catch (storeError) {
                    console.warn('Failed to persist file handle to IndexedDB:', storeError);
                    // Continue anyway - handle is in memory cache
                }
            } else {
                throw new Error('File System Access API not supported in this browser');
            }
        }

        // Read file contents
        let file, contents, subgraphData;

        try {
            file = await fileHandle.getFile();
        } catch (error) {
            throw new Error(`Failed to access file: ${error.message}`);
        }

        try {
            contents = await file.text();
        } catch (error) {
            throw new Error(`Failed to read file contents: ${error.message}`);
        }

        // Parse JSON
        try {
            subgraphData = JSON.parse(contents);
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }

        // Validate the subgraph data
        try {
            const tempNode = { id: nodeId, subgraph: subgraphData };
            validateSubgraph(tempNode.subgraph, nodeId, -1);
        } catch (error) {
            throw new Error(`Invalid subgraph structure: ${error.message}`);
        }

        return subgraphData;
    } catch (error) {
        // If error already has context, rethrow as-is
        if (error.message.includes('Failed to') || error.message.includes('Invalid')) {
            throw error;
        }
        // Otherwise add generic context
        throw new Error(`Failed to load subgraph file: ${error.message}`);
    }
}

async function enterSubgraph(node) {
    try {
        let subgraphData = null;

        // Determine if it's a file path or embedded subgraph
        if (typeof node.subgraph === 'string') {
            // File path - check for circular reference
            const fileName = node.subgraph;
            const fileAlreadyInStack = subgraphStack.some(entry => entry.fileName === fileName);
            if (fileAlreadyInStack) {
                throw new Error(`Circular reference detected: "${fileName}" is already in the navigation stack`);
            }

            // Load from file
            setStatus(`Loading subgraph from ${fileName}...`);
            subgraphData = await loadSubgraphFromFile(fileName, node.id);
        } else if (typeof node.subgraph === 'object') {
            // Embedded subgraph - check if we're entering a node that's in our path
            if (currentPath.includes(node.id)) {
                throw new Error(`Circular reference detected: Node #${node.id} is already in the navigation path`);
            }

            subgraphData = node.subgraph;
        } else {
            throw new Error('Invalid subgraph format');
        }

        // Stop any ongoing editing
        stopCursorBlink();

        // Save current state to stack (don't store FileHandle - it's not serializable)
        const currentState = {
            parentState: {
                nodes: JSON.parse(JSON.stringify(nodes)),
                connections: JSON.parse(JSON.stringify(connections)),
                nextId: nextId,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                zoom: zoom
            },
            nodeId: node.id,
            nodePath: [...currentPath, node.id],
            isFileBased: typeof node.subgraph === 'string',
            fileName: typeof node.subgraph === 'string' ? node.subgraph : null
        };
        subgraphStack.push(currentState);

        // Update path
        currentPath.push(node.id);
        currentDepth++;

        // Load subgraph data
        nodes = subgraphData.nodes;
        connections = subgraphData.connections;

        // Calculate nextId safely
        if (subgraphData.nextId !== undefined && subgraphData.nextId !== null) {
            nextId = subgraphData.nextId;
        } else {
            const allIds = [...nodes.map(n => n.id), ...connections.map(c => c.id)];
            nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
        }

        // Restore canvas size and zoom if saved in subgraph
        if (subgraphData.canvasWidth && subgraphData.canvasHeight) {
            canvasWidth = subgraphData.canvasWidth;
            canvasHeight = subgraphData.canvasHeight;
            resizeCanvas();
        }
        if (subgraphData.zoom !== undefined) {
            zoom = subgraphData.zoom;
        }

        // Rebuild nodeMap
        nodeMap.clear();
        nodes.forEach(n => {
            nodeMap.set(n.id, n);
        });

        // Reset all selection and interaction state
        selectedNode = null;
        selectedConnection = null;
        hoveredNode = null;
        editingNode = null;
        connectionMode = false;
        connectionStart = null;
        isDragging = false;
        isResizing = false;
        resizeCorner = null;
        isPanning = false;
        panStart = { x: 0, y: 0 };
        scrollStart = { x: 0, y: 0 };
        copiedNode = null;
        clearConnectionButtons();

        // Reset alignment buttons
        updateAlignmentButtons(currentTextAlign);

        // Update status with breadcrumb
        updateBreadcrumb();

        render();

        // Trigger auto-save
        triggerAutoSave();

    } catch (error) {
        if (error.name === 'AbortError') {
            setStatus('Subgraph navigation cancelled');
        } else {
            setStatus(`⚠️ Error loading subgraph: ${error.message}`);
            console.error('Subgraph load error:', error);
        }
    }
}

function updateBreadcrumb() {
    const navSection = document.getElementById('subgraph-navigation');

    if (currentDepth === 0) {
        setStatus('Root - Double-click to create nodes');
        // Hide back button at root level
        if (navSection) navSection.style.display = 'none';
    } else {
        // Show last 2-3 levels to avoid overflow
        const pathToShow = currentPath.slice(-2);
        const breadcrumb = pathToShow.map(id => `Node #${id}`).join(' > ');
        const prefix = currentPath.length > 2 ? '... > ' : '';
        setStatus(`${prefix}${breadcrumb} - Double-click to create nodes, Esc to go back`);
        // Show back button when in subgraph
        if (navSection) navSection.style.display = 'block';
    }
}

async function exitSubgraph() {
    // Can't exit if we're at root level
    if (currentDepth === 0 || subgraphStack.length === 0) {
        setStatus('Already at root level');
        return;
    }

    try {
        // Stop any ongoing editing
        stopCursorBlink();
        editingNode = null;

        // Save current subgraph state
        const currentSubgraphData = {
            version: VERSION,
            nodes: nodes,
            connections: connections,
            nextId: nextId,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            zoom: zoom
        };

        // Pop from stack to get parent state
        const stackEntry = subgraphStack.pop();
        const parentNodeId = stackEntry.nodeId;
        const parentState = stackEntry.parentState;
        const isFileBased = stackEntry.isFileBased;
        const fileName = stackEntry.fileName;

        // Restore parent state
        nodes = parentState.nodes;
        connections = parentState.connections;
        nextId = parentState.nextId;
        canvasWidth = parentState.canvasWidth;
        canvasHeight = parentState.canvasHeight;
        zoom = parentState.zoom;

        // Rebuild nodeMap
        nodeMap.clear();
        nodes.forEach(n => {
            nodeMap.set(n.id, n);
        });

        // Find the parent node we came from
        const parentNode = nodeMap.get(parentNodeId);
        if (parentNode) {
            // Update parent node's subgraph with current changes
            if (typeof parentNode.subgraph === 'object') {
                // Embedded subgraph - update in-place
                parentNode.subgraph = currentSubgraphData;
            } else if (isFileBased && fileName) {
                // File-based subgraph - save to file
                let fileHandle = fileHandleMap.get(parentNodeId);

                // If we don't have the file handle (e.g., after page reload), prompt user
                if (!fileHandle && 'showOpenFilePicker' in window) {
                    try {
                        setStatus(`Saving ${fileName} - please select the file...`);
                        const handles = await window.showOpenFilePicker({
                            types: [{
                                description: 'JSON Files',
                                accept: { 'application/json': ['.json'] }
                            }],
                            multiple: false
                        });
                        fileHandle = handles[0];
                        fileHandleMap.set(parentNodeId, fileHandle);
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            setStatus('⚠️ File selection cancelled - subgraph changes not saved to file');
                        } else {
                            setStatus(`⚠️ Failed to select file: ${error.message}`);
                        }
                        fileHandle = null;
                    }
                }

                // Save to file if we have a handle
                if (fileHandle) {
                    try {
                        const writable = await fileHandle.createWritable();
                        await writable.write(JSON.stringify(currentSubgraphData, null, 2));
                        await writable.close();
                        setStatus(`Saved changes to ${fileName}`);
                    } catch (error) {
                        console.error('Failed to save subgraph file:', error);
                        setStatus(`⚠️ Failed to save changes to ${fileName}: ${error.message}`);
                    }
                }
            }
        }

        // Update depth and path
        currentDepth--;
        currentPath.pop();

        // Resize canvas
        resizeCanvas();

        // Reset all selection and interaction state
        selectedNode = null;
        selectedConnection = null;
        hoveredNode = null;
        editingNode = null;
        connectionMode = false;
        connectionStart = null;
        isDragging = false;
        isResizing = false;
        resizeCorner = null;
        isPanning = false;
        panStart = { x: 0, y: 0 };
        scrollStart = { x: 0, y: 0 };
        copiedNode = null;
        clearConnectionButtons();

        // Reset alignment buttons
        updateAlignmentButtons(currentTextAlign);

        // Update status with breadcrumb
        updateBreadcrumb();

        render();

        // Trigger auto-save
        triggerAutoSave();

    } catch (error) {
        setStatus(`⚠️ Error exiting subgraph: ${error.message}`);
        console.error('Exit subgraph error:', error);
    }
}

function loadFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse JSON
            let saveData;
            try {
                saveData = JSON.parse(e.target.result);
            } catch (parseError) {
                throw new Error('Invalid JSON format: ' + parseError.message);
            }

            // Validate the diagram data
            validateDiagramData(saveData);

            // All validation passed - stop any ongoing editing
            stopCursorBlink();

            // Load the data
            nodes = saveData.nodes;
            connections = saveData.connections;

            // Calculate nextId safely
            if (saveData.nextId !== undefined && saveData.nextId !== null) {
                if (!isValidId(saveData.nextId)) {
                    throw new Error(`Invalid nextId: must be a positive integer (got ${saveData.nextId})`);
                }
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

async function exportToPNG() {
    // Check if canvas is empty
    if (nodes.length === 0 && connections.length === 0) {
        if (!confirm('Canvas is empty. Export anyway?')) {
            setStatus('Export cancelled');
            return;
        }
    }

    // Generate default filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `inf-diagram-${timestamp}`;

    // Temporarily set zoom to 1.0 for export
    const originalZoom = zoom;
    zoom = 1.0;
    render();

    // Convert canvas to blob
    canvas.toBlob(async function(blob) {
        // Restore original zoom
        zoom = originalZoom;
        render();

        if (!blob) {
            setStatus('⚠️ Error exporting image');
            return;
        }

        // Use File System Access API if available (Chrome/Edge)
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${defaultFilename}.png`,
                    types: [{
                        description: 'PNG Images',
                        accept: { 'image/png': ['.png'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();

                setStatus(`Image exported to ${fileHandle.name}`);
            } catch (error) {
                // Handle different error types
                if (error.name === 'AbortError') {
                    setStatus('Export cancelled');
                } else if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
                    setStatus('⚠️ Permission denied. Please try again.');
                    console.error('Export error:', error);
                } else {
                    console.error('Export error:', error);
                    setStatus(`⚠️ Error exporting image: ${error.message}`);
                }
            }
        } else {
            // Fallback for browsers without File System Access API
            const userFilename = prompt('Enter filename (without .png extension):', defaultFilename);

            // If user cancels, don't export
            if (userFilename === null) {
                setStatus('Export cancelled');
                return;
            }

            // Sanitize filename - remove invalid characters
            const sanitized = userFilename.trim().replace(/[<>:"/\\|?*]/g, '-');
            const filename = sanitized || defaultFilename;

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
        }
    }, 'image/png');
}
