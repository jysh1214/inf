async function saveToJSON(forceNewFile = false) {
    // Generate default filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `inf-diagram-${timestamp}`;

    // Create save data object
    const saveData = {
        version: VERSION,
        nodes: nodes,
        connections: connections,
        groups: groups,
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
            let fileHandle;

            // Quick save to existing file if available and not forcing new file
            if (currentFileHandle && !forceNewFile) {
                fileHandle = currentFileHandle;
            } else {
                // Show save picker for new file
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: currentFileName || `${defaultFilename}.json`,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });

                // Store the file handle and name for future quick saves
                currentFileHandle = fileHandle;
                currentFileName = fileHandle.name;
                updateFilePathDisplay();
            }

            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();

            setStatus(`✓ Saved to ${fileHandle.name}`);
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
 * Safely calculate nextId from nodes, connections, and groups
 * Filters out any items with invalid IDs before calculating
 * @param {Array} nodes - Array of nodes
 * @param {Array} connections - Array of connections
 * @param {Array} groups - Array of groups
 * @returns {number} Safe next ID to use (minimum 1)
 */
function calculateSafeNextId(nodes, connections, groups) {
    const allIds = [];

    // Safely collect node IDs
    if (Array.isArray(nodes)) {
        nodes.forEach(node => {
            if (node && isValidId(node.id)) {
                allIds.push(node.id);
            }
        });
    }

    // Safely collect connection IDs
    if (Array.isArray(connections)) {
        connections.forEach(conn => {
            if (conn && isValidId(conn.id)) {
                allIds.push(conn.id);
            }
        });
    }

    // Safely collect group IDs
    if (Array.isArray(groups)) {
        groups.forEach(group => {
            if (group && isValidId(group.id)) {
                allIds.push(group.id);
            }
        });
    }

    // Return max + 1, or 1 if no valid IDs found
    return allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
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
    // Groups are optional (for backwards compatibility)
    if (data.groups !== undefined && !Array.isArray(data.groups)) {
        throw new Error('Invalid file format: "groups" must be an array');
    }

    // Check for null/undefined elements in arrays
    if (data.nodes.some((node, i) => node === null || node === undefined)) {
        throw new Error('Invalid file format: nodes array contains null or undefined elements');
    }
    if (data.connections.some((conn, i) => conn === null || conn === undefined)) {
        throw new Error('Invalid file format: connections array contains null or undefined elements');
    }
    if (data.groups && data.groups.some((group, i) => group === null || group === undefined)) {
        throw new Error('Invalid file format: groups array contains null or undefined elements');
    }

    // Migrate and validate each node
    const nodeIds = new Set();
    data.nodes.forEach((node, index) => {
        migrateTableNodeFormat(node);  // Migrate old table format to new format
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

    // Validate each group (if present)
    if (data.groups && data.groups.length > 0) {
        const groupIds = new Set();
        data.groups.forEach((group, index) => {
            validateGroup(group, index, nodeIds);
            groupIds.add(group.id);
        });

        // Check for duplicate group IDs
        if (groupIds.size !== data.groups.length) {
            throw new Error('Invalid file format: duplicate group IDs found');
        }
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

// Migrate table nodes from old format (cellWidth/cellHeight) to new format (colWidths/rowHeights arrays)
function migrateTableNodeFormat(node) {
    if (node.type === 'table') {
        // Convert old format to new format
        if (node.cellWidth !== undefined && !node.colWidths) {
            // Old format detected - migrate to new format
            node.colWidths = Array(node.cols).fill(node.cellWidth);
            delete node.cellWidth;  // Remove old property
        }
        if (node.cellHeight !== undefined && !node.rowHeights) {
            // Old format detected - migrate to new format
            node.rowHeights = Array(node.rows).fill(node.cellHeight);
            delete node.cellHeight;  // Remove old property
        }

        // Safety checks - ensure arrays are correct length
        if (!node.colWidths || !Array.isArray(node.colWidths) || node.colWidths.length !== node.cols) {
            console.warn(`Table node ${node.id}: colWidths array missing or incorrect length, resetting to default`);
            node.colWidths = Array(node.cols).fill(DEFAULT_TABLE_CELL_WIDTH);
        }
        if (!node.rowHeights || !Array.isArray(node.rowHeights) || node.rowHeights.length !== node.rows) {
            console.warn(`Table node ${node.id}: rowHeights array missing or incorrect length, resetting to default`);
            node.rowHeights = Array(node.rows).fill(DEFAULT_TABLE_CELL_HEIGHT);
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
    const validTypes = ['rectangle', 'circle', 'diamond', 'text', 'code', 'table'];
    if (!validTypes.includes(node.type)) {
        throw new Error(`Node ${index} (id: ${node.id}): invalid type '${node.type}'. Must be one of: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (node.type === 'table') {
        // Validate table-specific fields
        if (!isValidNumber(node.rows) || node.rows < 1 || node.rows > 20 || node.rows !== Math.floor(node.rows)) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'rows' must be an integer between 1 and 20 (got ${node.rows})`);
        }
        if (!isValidNumber(node.cols) || node.cols < 1 || node.cols > 20 || node.cols !== Math.floor(node.cols)) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'cols' must be an integer between 1 and 20 (got ${node.cols})`);
        }

        // Validate colWidths array
        if (!Array.isArray(node.colWidths)) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'colWidths' must be an array (got ${typeof node.colWidths})`);
        }
        if (node.colWidths.length !== node.cols) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'colWidths' array length (${node.colWidths.length}) must match cols (${node.cols})`);
        }
        node.colWidths.forEach((width, i) => {
            if (!isValidNumber(width) || width < MIN_NODE_SIZE || width > MAX_NODE_SIZE) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'colWidths[${i}]' must be a valid number between ${MIN_NODE_SIZE} and ${MAX_NODE_SIZE} (got ${width})`);
            }
        });

        // Validate rowHeights array
        if (!Array.isArray(node.rowHeights)) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'rowHeights' must be an array (got ${typeof node.rowHeights})`);
        }
        if (node.rowHeights.length !== node.rows) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'rowHeights' array length (${node.rowHeights.length}) must match rows (${node.rows})`);
        }
        node.rowHeights.forEach((height, i) => {
            if (!isValidNumber(height) || height < MIN_NODE_SIZE || height > MAX_NODE_SIZE) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'rowHeights[${i}]' must be a valid number between ${MIN_NODE_SIZE} and ${MAX_NODE_SIZE} (got ${height})`);
            }
        });

        // Validate cells array
        if (!Array.isArray(node.cells)) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'cells' must be an array (got ${typeof node.cells})`);
        }
        if (node.cells.length !== node.rows) {
            throw new Error(`Node ${index} (id: ${node.id}): table 'cells' array length (${node.cells.length}) must match rows (${node.rows})`);
        }
        node.cells.forEach((row, rowIndex) => {
            if (!Array.isArray(row)) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'cells[${rowIndex}]' must be an array (got ${typeof row})`);
            }
            if (row.length !== node.cols) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'cells[${rowIndex}]' length (${row.length}) must match cols (${node.cols})`);
            }
            row.forEach((cell, colIndex) => {
                if (cell === null || cell === undefined || typeof cell !== 'object') {
                    throw new Error(`Node ${index} (id: ${node.id}): table 'cells[${rowIndex}][${colIndex}]' must be an object (got ${typeof cell})`);
                }

                // Validate cell properties (similar to Text nodes)
                if (cell.text !== undefined && cell.text !== null && typeof cell.text !== 'string') {
                    throw new Error(`Node ${index} (id: ${node.id}): table 'cells[${rowIndex}][${colIndex}].text' must be a string (got ${typeof cell.text})`);
                }

                if (cell.textAlign !== undefined && cell.textAlign !== null) {
                    const validAlignments = ['left', 'center', 'right'];
                    if (!validAlignments.includes(cell.textAlign)) {
                        throw new Error(`Node ${index} (id: ${node.id}): table 'cells[${rowIndex}][${colIndex}].textAlign' must be one of: ${validAlignments.join(', ')} (got '${cell.textAlign}')`);
                    }
                }

                // Validate cell subgraph (optional)
                if (cell.subgraph !== undefined && cell.subgraph !== null) {
                    validateSubgraph(cell.subgraph, `${node.id}-cell-${rowIndex}-${colIndex}`, `${index}.cells[${rowIndex}][${colIndex}]`);
                }
            });
        });

        // Validate editingCell (optional)
        if (node.editingCell !== null && node.editingCell !== undefined) {
            if (typeof node.editingCell !== 'object') {
                throw new Error(`Node ${index} (id: ${node.id}): table 'editingCell' must be an object or null (got ${typeof node.editingCell})`);
            }
            if (!isValidNumber(node.editingCell.row) || node.editingCell.row < 0 || node.editingCell.row >= node.rows) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'editingCell.row' must be between 0 and ${node.rows - 1} (got ${node.editingCell.row})`);
            }
            if (!isValidNumber(node.editingCell.col) || node.editingCell.col < 0 || node.editingCell.col >= node.cols) {
                throw new Error(`Node ${index} (id: ${node.id}): table 'editingCell.col' must be between 0 and ${node.cols - 1} (got ${node.editingCell.col})`);
            }
        }
    } else if (node.type === 'circle') {
        if (!isValidNumber(node.radius)) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' must be a valid number (got ${node.radius})`);
        }
        if (node.radius <= MIN_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' must be greater than ${MIN_NODE_SIZE}`);
        }
        if (node.radius > MAX_NODE_SIZE) {
            throw new Error(`Node ${index} (id: ${node.id}): circle 'radius' too large (max: ${MAX_NODE_SIZE})`);
        }
    } else if (node.type === 'rectangle' || node.type === 'diamond' || node.type === 'text' || node.type === 'code') {
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

function validateGroup(group, index, nodeIds) {
    if (group === null || group === undefined || typeof group !== 'object') {
        throw new Error(`Group ${index}: must be an object`);
    }

    // Validate id
    if (!isValidId(group.id)) {
        throw new Error(`Group ${index}: invalid or missing 'id' (got ${group.id})`);
    }

    // Validate name
    if (typeof group.name !== 'string') {
        throw new Error(`Group ${index} (id: ${group.id}): 'name' must be a string (got ${typeof group.name})`);
    }
    if (group.name.trim() === '') {
        throw new Error(`Group ${index} (id: ${group.id}): 'name' cannot be empty`);
    }

    // Validate nodeIds
    if (!Array.isArray(group.nodeIds)) {
        throw new Error(`Group ${index} (id: ${group.id}): 'nodeIds' must be an array (got ${typeof group.nodeIds})`);
    }
    if (group.nodeIds.length < 2) {
        throw new Error(`Group ${index} (id: ${group.id}): 'nodeIds' must contain at least 2 node IDs (got ${group.nodeIds.length})`);
    }

    // Validate each node ID in the group
    group.nodeIds.forEach((nodeId, i) => {
        if (!isValidId(nodeId)) {
            throw new Error(`Group ${index} (id: ${group.id}): nodeIds[${i}] is invalid (got ${nodeId})`);
        }
        if (!nodeIds.has(nodeId)) {
            throw new Error(`Group ${index} (id: ${group.id}): nodeIds[${i}] references non-existent node ${nodeId}`);
        }
    });

    // Check for duplicate node IDs in the group
    const uniqueNodeIds = new Set(group.nodeIds);
    if (uniqueNodeIds.size !== group.nodeIds.length) {
        throw new Error(`Group ${index} (id: ${group.id}): 'nodeIds' contains duplicate node IDs`);
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
        // Prevent path traversal - must be filename only (no directory separators)
        if (subgraph.includes('..') || subgraph.includes('/') || subgraph.includes('\\')) {
            throw new Error(`Node ${nodeIndex} (id: ${nodeId}): 'subgraph' file path must be filename only, no path separators allowed (got '${subgraph}')`);
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

        // Validate groups if present
        if (subgraph.groups !== undefined && subgraph.groups !== null) {
            if (!Array.isArray(subgraph.groups)) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' groups must be an array`);
            }
            if (subgraph.groups.some((g, i) => g === null || g === undefined)) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' groups array contains null or undefined elements`);
            }

            // Validate each group
            const subGroupIds = new Set();
            subgraph.groups.forEach((group, idx) => {
                validateGroup(group, idx, subNodeIds);
                subGroupIds.add(group.id);
            });

            // Check for duplicate group IDs
            if (subGroupIds.size !== subgraph.groups.length) {
                throw new Error(`Node ${nodeIndex} (id: ${nodeId}): embedded 'subgraph' contains duplicate group IDs`);
            }
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

        // Clear all cached file handles (in-memory and IndexedDB)
        fileHandleMap.clear();
        await clearAllFileHandles();

        // Store the directory handle
        await storeDirectoryHandle(dirHandle);

        // Store the workspace folder name
        workspaceFolderName = dirHandle.name;
        updateFilePathDisplay();

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
            triggerAutoSave();

            setStatus(`✓ Workspace set and loaded root.json`);
        } catch (rootError) {
            // root.json doesn't exist or failed to load - that's okay
            if (rootError.name === 'NotFoundError') {
                setStatus(`✓ Workspace folder set: ${dirHandle.name} (no root.json found)`);
            } else {
                console.warn('Failed to load root.json:', rootError);
                const errorMsg = `root.json is invalid: ${rootError.message}`;
                setStatus(`✓ Workspace folder set: ${dirHandle.name} (${errorMsg})`);
                // Show explicit error for invalid root.json
                showErrorModal(`Workspace folder set, but ${errorMsg}`);
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
        // Store the file object to avoid redundant access later
        let file = null;
        if (fileHandle) {
            try {
                file = await fileHandle.getFile();
                // File access successful, handle is valid
            } catch (error) {
                // File handle is stale (file deleted, moved, or permission lost)
                console.warn(`File handle from ${fileHandleSource} is stale:`, error);
                fileHandle = null;
                file = null;
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

        // Get file object if not already obtained from validation
        let contents, subgraphData;

        if (!file) {
            try {
                file = await fileHandle.getFile();
            } catch (error) {
                const err = new Error(`Failed to access file: ${error.message}`);
                err.contextAdded = true; // Mark as having context
                throw err;
            }
        }

        try {
            contents = await file.text();
        } catch (error) {
            const err = new Error(`Failed to read file contents: ${error.message}`);
            err.contextAdded = true; // Mark as having context
            throw err;
        }

        // Parse JSON
        try {
            subgraphData = JSON.parse(contents);
        } catch (error) {
            const err = new Error(`Invalid JSON format: ${error.message}`);
            err.contextAdded = true; // Mark as having context
            throw err;
        }

        // Validate the subgraph data
        try {
            const tempNode = { id: nodeId, subgraph: subgraphData };
            validateSubgraph(tempNode.subgraph, nodeId, -1);
        } catch (error) {
            const err = new Error(`Invalid subgraph structure: ${error.message}`);
            err.contextAdded = true; // Mark as having context
            throw err;
        }

        return subgraphData;
    } catch (error) {
        // If error already has context, rethrow as-is
        if (error.contextAdded) {
            throw error;
        }
        // Otherwise add generic context
        throw new Error(`Failed to load subgraph file: ${error.message}`);
    }
}

/**
 * Recursively check if a subgraph contains circular references
 * @param {object} subgraphData - The subgraph data to check
 * @param {Set} forbiddenIds - Set of node IDs that would create a circular reference
 * @returns {object|null} Returns error info if circular reference found, null otherwise
 */
function checkSubgraphForCircularRefs(subgraphData, forbiddenIds) {
    if (!subgraphData || !subgraphData.nodes) {
        return null;
    }

    // Check each node in this subgraph
    for (let node of subgraphData.nodes) {
        // If this node's ID is forbidden, we have a circular reference
        if (forbiddenIds.has(node.id)) {
            return {
                nodeId: node.id,
                message: `Node #${node.id} would create a circular reference`
            };
        }

        // If this node has an embedded subgraph, recursively check it
        if (node.subgraph && typeof node.subgraph === 'object') {
            const nestedCheck = checkSubgraphForCircularRefs(node.subgraph, forbiddenIds);
            if (nestedCheck) {
                return nestedCheck;
            }
        }

        // Also check table cells for embedded subgraphs
        if (node.type === 'table' && node.cells) {
            for (let row = 0; row < node.rows; row++) {
                for (let col = 0; col < node.cols; col++) {
                    const cell = node.cells[row][col];
                    if (cell && cell.subgraph && typeof cell.subgraph === 'object') {
                        const cellCheck = checkSubgraphForCircularRefs(cell.subgraph, forbiddenIds);
                        if (cellCheck) {
                            return cellCheck;
                        }
                    }
                }
            }
        }
    }

    return null; // No circular references found
}

async function enterSubgraph(node) {
    try {
        let subgraphData = null;

        // Determine if it's a file path or embedded subgraph
        if (typeof node.subgraph === 'string') {
            // File path - check for circular reference
            const fileName = node.subgraph;

            // Normalize filename for comparison (trim, lowercase)
            const normalizedFileName = fileName.trim().toLowerCase();
            const fileAlreadyInStack = subgraphStack.some(entry => {
                if (entry.fileName) {
                    return entry.fileName.trim().toLowerCase() === normalizedFileName;
                }
                return false;
            });

            if (fileAlreadyInStack) {
                throw new Error(`Circular reference detected: "${fileName}" is already in the navigation stack`);
            }

            // Load from file
            setStatus(`Loading subgraph from ${fileName}...`);
            subgraphData = await loadSubgraphFromFile(fileName, node.id);
        } else if (typeof node.subgraph === 'object') {
            // Embedded subgraph - check if we're entering a node that's already in the entire stack
            // Check all node IDs in the subgraphStack, not just currentPath
            const allPathIds = subgraphStack.flatMap(entry => entry.nodePath || []);
            if (allPathIds.includes(node.id) || currentPath.includes(node.id)) {
                throw new Error(`Circular reference detected: Node #${node.id} is already in the navigation stack`);
            }

            subgraphData = node.subgraph;

            // Recursively check if the embedded subgraph contains any forbidden node IDs
            const forbiddenIds = new Set([...allPathIds, ...currentPath, node.id]);
            const circularCheck = checkSubgraphForCircularRefs(subgraphData, forbiddenIds);
            if (circularCheck) {
                throw new Error(`Circular reference detected in embedded subgraph: ${circularCheck.message}`);
            }
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
                groups: JSON.parse(JSON.stringify(groups)),
                nextId: nextId,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                zoom: zoom
            },
            nodeId: node.id,
            nodePath: [...currentPath, node.id],
            isFileBased: typeof node.subgraph === 'string',
            fileName: typeof node.subgraph === 'string' ? node.subgraph : null,
            parentFileName: currentFileName,  // Save parent's filename to restore later
            parentFileHandle: currentFileHandle,  // Save parent's file handle to restore later
            parentWorkspaceFolderName: workspaceFolderName  // Save workspace folder name to restore later
        };
        subgraphStack.push(currentState);

        // Update path
        currentPath.push(node.id);
        currentDepth++;

        // Load subgraph data
        nodes = subgraphData.nodes;
        connections = subgraphData.connections;
        groups = subgraphData.groups || [];

        // Calculate nextId safely
        if (subgraphData.nextId !== undefined && subgraphData.nextId !== null) {
            nextId = subgraphData.nextId;
        } else {
            nextId = calculateSafeNextId(nodes, connections, groups);
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
        selectedNodeIds.clear();
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
        copiedNodes = [];
        clearConnectionButtons();

        // Reset alignment buttons
        updateAlignmentButtons(currentTextAlign);

        // Update current filename and file handle
        if (typeof node.subgraph === 'string') {
            currentFileName = node.subgraph;
            // Get the file handle for this file-based subgraph
            currentFileHandle = fileHandleMap.get(node.id) || null;
        } else {
            currentFileName = '(embedded)';
            currentFileHandle = null; // Embedded subgraphs don't have file handles
        }
        updateFilePathDisplay();

        // Update status with breadcrumb
        updateBreadcrumb();

        render();

        // Trigger auto-save
        triggerAutoSave();

    } catch (error) {
        if (error.name === 'AbortError') {
            setStatus('Subgraph navigation cancelled');
        } else {
            const errorMsg = `Error loading subgraph: ${error.message}`;
            setStatus(`⚠️ ${errorMsg}`);
            console.error('Subgraph load error:', error);
            // Show explicit error dialog
            showErrorModal(errorMsg);
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
            groups: groups,
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
        const parentFileName = stackEntry.parentFileName;
        const parentFileHandle = stackEntry.parentFileHandle;
        const parentWorkspaceFolderName = stackEntry.parentWorkspaceFolderName;

        // Restore parent state
        nodes = parentState.nodes;
        connections = parentState.connections;
        groups = parentState.groups || [];
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
            // Check if this was a cell subgraph
            if (stackEntry.cellPosition) {
                const { row, col } = stackEntry.cellPosition;
                const cell = parentNode.cells[row][col];

                // Update cell's subgraph with current changes
                if (typeof cell.subgraph === 'object') {
                    // Embedded subgraph - update in-place
                    cell.subgraph = currentSubgraphData;
                } else if (isFileBased && fileName) {
                    // File-based subgraph - save to file
                    const cellKey = `${parentNodeId}-cell-${row}-${col}`;
                    let fileHandle = fileHandleMap.get(cellKey);

                    // If not in memory, try IndexedDB and workspace folder before prompting
                    if (!fileHandle) {
                        // Try IndexedDB
                        fileHandle = await getFileHandle(cellKey);
                        if (fileHandle) {
                            const hasPermission = await verifyPermission(fileHandle);
                            if (hasPermission) {
                                fileHandleMap.set(cellKey, fileHandle);
                            } else {
                                fileHandle = null;
                            }
                        }

                        // If still no handle, try workspace folder
                        if (!fileHandle && fileName) {
                            fileHandle = await findFileInDirectory(fileName);
                            if (fileHandle) {
                                fileHandleMap.set(cellKey, fileHandle);
                                await storeFileHandle(cellKey, fileHandle);
                            }
                        }

                        // Last resort: prompt user
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
                                fileHandleMap.set(cellKey, fileHandle);
                                await storeFileHandle(cellKey, fileHandle);
                            } catch (error) {
                                if (error.name === 'AbortError') {
                                    setStatus('⚠️ File selection cancelled - cell subgraph changes not saved to file');
                                } else {
                                    setStatus(`⚠️ Failed to select file: ${error.message}`);
                                }
                                fileHandle = null;
                            }
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
                            console.error('Failed to save cell subgraph file:', error);
                            setStatus(`⚠️ Failed to save changes to ${fileName}: ${error.message}`);
                        }
                    }
                }
            } else {
                // Regular node subgraph
                // Update parent node's subgraph with current changes
                if (typeof parentNode.subgraph === 'object') {
                    // Embedded subgraph - update in-place
                    parentNode.subgraph = currentSubgraphData;
                } else if (isFileBased && fileName) {
                    // File-based subgraph - save to file
                    let fileHandle = fileHandleMap.get(parentNodeId);

                    // If not in memory, try IndexedDB and workspace folder before prompting
                    if (!fileHandle) {
                        // Try IndexedDB
                        fileHandle = await getFileHandle(parentNodeId);
                        if (fileHandle) {
                            const hasPermission = await verifyPermission(fileHandle);
                            if (hasPermission) {
                                fileHandleMap.set(parentNodeId, fileHandle);
                            } else {
                                fileHandle = null;
                            }
                        }

                        // If still no handle, try workspace folder
                        if (!fileHandle && fileName) {
                            fileHandle = await findFileInDirectory(fileName);
                            if (fileHandle) {
                                fileHandleMap.set(parentNodeId, fileHandle);
                                await storeFileHandle(parentNodeId, fileHandle);
                            }
                        }

                        // Last resort: prompt user
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
                                await storeFileHandle(parentNodeId, fileHandle);
                            } catch (error) {
                                if (error.name === 'AbortError') {
                                    setStatus('⚠️ File selection cancelled - subgraph changes not saved to file');
                                } else {
                                    setStatus(`⚠️ Failed to select file: ${error.message}`);
                                }
                                fileHandle = null;
                            }
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
        }

        // Update depth and path
        currentDepth--;
        currentPath.pop();

        // Resize canvas
        resizeCanvas();

        // Reset all selection and interaction state
        selectedNodeIds.clear();
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
        copiedNodes = [];
        clearConnectionButtons();

        // Reset alignment buttons
        updateAlignmentButtons(currentTextAlign);

        // Restore parent filename, file handle, and workspace folder name
        currentFileName = parentFileName || null;
        currentFileHandle = parentFileHandle || null;
        // Use parentWorkspaceFolderName if available, otherwise preserve current workspaceFolderName
        // (fallback for old stack entries created before this field was added)
        if (parentWorkspaceFolderName !== undefined) {
            workspaceFolderName = parentWorkspaceFolderName;
        }
        updateFilePathDisplay();

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
            groups = saveData.groups || [];

            // Calculate nextId safely
            if (saveData.nextId !== undefined && saveData.nextId !== null) {
                if (!isValidId(saveData.nextId)) {
                    throw new Error(`Invalid nextId: must be a positive integer (got ${saveData.nextId})`);
                }
                nextId = saveData.nextId;
            } else {
                nextId = calculateSafeNextId(nodes, connections, groups);
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
            selectedNodeIds.clear();
            selectedConnection = null;
            hoveredNode = null;
            editingNode = null;
            connectionMode = false;
            connectionStart = null;
            clearConnectionButtons();

            // Reset alignment buttons to default
            updateAlignmentButtons(currentTextAlign);

            // Reset subgraph navigation state
            subgraphStack = [];
            currentDepth = 0;
            currentPath = [];

            // Update current filename
            currentFileName = file.name;
            updateFilePathDisplay();

            render();
            setStatus(`Loaded ${nodes.length} nodes and ${connections.length} connections from ${file.name}`);

            // Trigger auto-save after loading
            triggerAutoSave();
        } catch (error) {
            const errorMsg = `Error loading file: ${error.message}`;
            setStatus(`⚠️ ${errorMsg}`);
            console.error('Load error:', error);
            // Show explicit error dialog
            showErrorModal(errorMsg);
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

// Table cell subgraph functions
async function createCellSubgraph(tableNode, row, col) {
    try {
        const cell = tableNode.cells[row][col];

        // Check if workspace folder is set for file-based subgraphs
        const hasWorkspace = await getDirectoryHandle();

        // Prompt user to choose subgraph type using modal
        const choice = await showSubgraphModal(hasWorkspace);

        // User cancelled
        if (!choice) {
            setStatus('Cell subgraph creation cancelled');
            return;
        }

        if (choice === 'embedded') {
            // Create embedded subgraph
            cell.subgraph = {
                version: VERSION,
                nodes: [],
                connections: [],
                nextId: 1,
                canvasWidth: DEFAULT_CANVAS_WIDTH,
                canvasHeight: DEFAULT_CANVAS_HEIGHT,
                zoom: 1.0
            };
            setStatus(`Created embedded subgraph for table #${tableNode.id} cell (${row + 1}, ${col + 1}) - Entering...`);
            render();
            triggerAutoSave();

            // Enter the cell subgraph immediately
            await enterCellSubgraph(tableNode, row, col);
        } else if (choice === 'new-file') {
            // Create new file-based subgraph
            if ('showSaveFilePicker' in window) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `subgraph-table-${tableNode.id}-cell-${row}-${col}-${timestamp}.json`,
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

                // Get relative path
                const fileName = fileHandle.name;
                cell.subgraph = fileName;

                setStatus(`Created file-based subgraph: ${fileName} - Entering...`);
                render();
                triggerAutoSave();

                // Enter the subgraph
                await enterCellSubgraph(tableNode, row, col);
            } else {
                setStatus('⚠️ File System Access API not supported in this browser');
            }
        } else if (choice === 'existing-file') {
            // Link to existing file
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false
                });

                // Validate the file
                const file = await fileHandle.getFile();
                const content = await file.text();
                const data = JSON.parse(content);
                validateSubgraph(data, `table-${tableNode.id}-cell-${row}-${col}`, 0);

                const fileName = fileHandle.name;
                cell.subgraph = fileName;

                setStatus(`Linked cell to existing file: ${fileName}`);
                render();
                triggerAutoSave();
            } else {
                setStatus('⚠️ File System Access API not supported in this browser');
            }
        }
    } catch (error) {
        console.error('Error creating cell subgraph:', error);
        setStatus(`⚠️ Error creating cell subgraph: ${error.message}`);
    }
}

async function enterCellSubgraph(tableNode, row, col) {
    try {
        const cell = tableNode.cells[row][col];
        let subgraphData = null;

        // Determine if it's a file path or embedded subgraph
        if (typeof cell.subgraph === 'string') {
            // File path - check for circular reference
            const fileName = cell.subgraph;

            // Normalize filename for comparison (trim, lowercase)
            const normalizedFileName = fileName.trim().toLowerCase();
            const fileAlreadyInStack = subgraphStack.some(entry => {
                if (entry.fileName) {
                    return entry.fileName.trim().toLowerCase() === normalizedFileName;
                }
                return false;
            });

            if (fileAlreadyInStack) {
                throw new Error(`Circular reference detected: "${fileName}" is already in the navigation stack`);
            }

            // Load from file
            setStatus(`Loading cell subgraph from ${fileName}...`);
            subgraphData = await loadSubgraphFromFile(fileName, `${tableNode.id}-cell-${row}-${col}`);
        } else if (typeof cell.subgraph === 'object') {
            // Embedded subgraph - create a unique identifier for the cell
            const cellId = `${tableNode.id}-cell-${row}-${col}`;
            // Check all node IDs in the subgraphStack, not just currentPath
            const allPathIds = subgraphStack.flatMap(entry => entry.nodePath || []);
            if (allPathIds.includes(cellId) || currentPath.includes(cellId)) {
                throw new Error(`Circular reference detected: Cell (${row + 1}, ${col + 1}) is already in the navigation stack`);
            }

            subgraphData = cell.subgraph;

            // Recursively check if the embedded subgraph contains any forbidden node IDs
            const forbiddenIds = new Set([...allPathIds, ...currentPath, cellId]);
            const circularCheck = checkSubgraphForCircularRefs(subgraphData, forbiddenIds);
            if (circularCheck) {
                throw new Error(`Circular reference detected in cell subgraph: ${circularCheck.message}`);
            }
        } else {
            throw new Error('Invalid cell subgraph format');
        }

        // Stop any ongoing editing
        stopCursorBlink();

        // Create a unique identifier for the cell
        const cellId = `${tableNode.id}-cell-${row}-${col}`;

        // Save current state to stack
        const currentState = {
            parentState: {
                nodes: JSON.parse(JSON.stringify(nodes)),
                connections: JSON.parse(JSON.stringify(connections)),
                groups: JSON.parse(JSON.stringify(groups)),
                nextId: nextId,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                zoom: zoom
            },
            nodeId: tableNode.id,
            cellPosition: { row, col },  // Mark this as a cell subgraph
            nodePath: [...currentPath, cellId],
            isFileBased: typeof cell.subgraph === 'string',
            fileName: typeof cell.subgraph === 'string' ? cell.subgraph : null,
            parentFileName: currentFileName,  // Save parent's filename to restore later
            parentFileHandle: currentFileHandle,  // Save parent's file handle to restore later
            parentWorkspaceFolderName: workspaceFolderName  // Save workspace folder name to restore later
        };
        subgraphStack.push(currentState);

        // Update path
        currentPath.push(cellId);
        currentDepth++;

        // Load subgraph data
        nodes = subgraphData.nodes || [];
        connections = subgraphData.connections || [];
        groups = subgraphData.groups || [];
        nextId = subgraphData.nextId || 1;
        canvasWidth = subgraphData.canvasWidth || DEFAULT_CANVAS_WIDTH;
        canvasHeight = subgraphData.canvasHeight || DEFAULT_CANVAS_HEIGHT;
        zoom = subgraphData.zoom || 1.0;

        // Rebuild nodeMap
        nodeMap.clear();
        nodes.forEach(node => nodeMap.set(node.id, node));

        // Reset selection state
        selectedNodeIds.clear();
        selectedConnection = null;
        editingNode = null;
        connectionMode = false;
        connectionStart = null;

        // Update current filename and file handle
        if (typeof cell.subgraph === 'string') {
            currentFileName = cell.subgraph;
            // Get the file handle for this file-based cell subgraph
            currentFileHandle = fileHandleMap.get(cellId) || null;
        } else {
            currentFileName = '(embedded)';
            currentFileHandle = null; // Embedded subgraphs don't have file handles
        }
        updateFilePathDisplay();

        // Update UI and render
        updateBreadcrumb();
        resizeCanvas();
        render();
        triggerAutoSave();
        setStatus(`Entered subgraph of table #${tableNode.id} cell (${row + 1}, ${col + 1})`);

        // Show navigation controls
        const navSection = document.getElementById('subgraph-navigation');
        if (navSection) {
            navSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error entering cell subgraph:', error);
        setStatus(`⚠️ Error entering cell subgraph: ${error.message}`);
    }
}
