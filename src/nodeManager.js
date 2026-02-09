function createNode(x, y, type = 'rectangle') {
    // Input validation
    if (typeof x !== 'number' || !isFinite(x) || isNaN(x)) {
        throw new TypeError(`createNode: x must be a valid number (got ${x})`);
    }
    if (typeof y !== 'number' || !isFinite(y) || isNaN(y)) {
        throw new TypeError(`createNode: y must be a valid number (got ${y})`);
    }

    const validTypes = ['rectangle', 'circle', 'diamond', 'text', 'code', 'table'];
    if (typeof type !== 'string' || !validTypes.includes(type)) {
        throw new TypeError(`createNode: type must be one of [${validTypes.join(', ')}] (got ${type})`);
    }

    const baseNode = {
        id: nextId++,
        type: type,
        text: '',
        textAlign: currentTextAlign
    };

    let node;
    switch (type) {
        case 'circle':
            node = {
                ...baseNode,
                x: x,  // Center x
                y: y,  // Center y
                radius: DEFAULT_CIRCLE_RADIUS
            };
            break;
        case 'diamond':
            node = {
                ...baseNode,
                x: x - DEFAULT_DIAMOND_SIZE / 2,
                y: y - DEFAULT_DIAMOND_SIZE / 2,
                width: DEFAULT_DIAMOND_SIZE,
                height: DEFAULT_DIAMOND_SIZE
            };
            break;
        case 'text':
            node = {
                ...baseNode,
                x: x - DEFAULT_TEXT_WIDTH / 2,
                y: y - DEFAULT_TEXT_HEIGHT / 2,
                width: DEFAULT_TEXT_WIDTH,
                height: DEFAULT_TEXT_HEIGHT
            };
            break;
        case 'code':
            node = {
                ...baseNode,
                x: x - DEFAULT_CODE_WIDTH / 2,
                y: y - DEFAULT_CODE_HEIGHT / 2,
                width: DEFAULT_CODE_WIDTH,
                height: DEFAULT_CODE_HEIGHT
            };
            break;
        case 'table':
            // For tables, rows and cols will be set by createTableWithSize()
            // This creates a default 3x3 table if called directly
            const rows = DEFAULT_TABLE_ROWS;
            const cols = DEFAULT_TABLE_COLS;
            const colWidths = Array(cols).fill(DEFAULT_TABLE_CELL_WIDTH);
            const rowHeights = Array(rows).fill(DEFAULT_TABLE_CELL_HEIGHT);
            const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
            const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

            // Create cell objects (similar to Text nodes but cannot be resized)
            const cells = Array(rows).fill(null).map(() =>
                Array(cols).fill(null).map(() => ({
                    text: '',
                    textAlign: currentTextAlign
                    // subgraph can be added later via Ctrl+Click
                }))
            );

            node = {
                ...baseNode,
                x: x - totalWidth / 2,
                y: y - totalHeight / 2,
                rows: rows,
                cols: cols,
                colWidths: colWidths,
                rowHeights: rowHeights,
                cells: cells,  // Array of cell objects, not just text
                editingCell: null  // {row: number, col: number} when editing a cell
            };
            break;
        case 'rectangle':
        default:
            node = {
                ...baseNode,
                x: x - DEFAULT_RECTANGLE_WIDTH / 2,
                y: y - DEFAULT_RECTANGLE_HEIGHT / 2,
                width: DEFAULT_RECTANGLE_WIDTH,
                height: DEFAULT_RECTANGLE_HEIGHT
            };
            break;
    }

    nodeMap.set(node.id, node);
    return node;
}

function createConnection(fromId, toId) {
    // Input validation
    if (!Number.isInteger(fromId) || fromId <= 0) {
        throw new TypeError(`createConnection: fromId must be a positive integer (got ${fromId})`);
    }
    if (!Number.isInteger(toId) || toId <= 0) {
        throw new TypeError(`createConnection: toId must be a positive integer (got ${toId})`);
    }

    // Validate that nodes exist
    if (!nodeMap.has(fromId)) {
        throw new Error(`createConnection: node with id ${fromId} does not exist`);
    }
    if (!nodeMap.has(toId)) {
        throw new Error(`createConnection: node with id ${toId} does not exist`);
    }

    // Prevent self-connections
    if (fromId === toId) {
        return null;
    }

    // Prevent duplicate connections
    // For directed connections: only exact matches are duplicates (allow A→B and B→A)
    // For undirected connections: both directions are duplicates
    const exists = connections.some(conn => {
        const sameDirection = conn.fromId === fromId && conn.toId === toId;
        const reverseDirection = conn.fromId === toId && conn.toId === fromId;

        // If we're creating an undirected connection, check if any connection exists
        // If we're creating a directed connection, only check for exact match
        if (!directedMode) {
            // Creating undirected: check both directions and existing undirected
            return (sameDirection || reverseDirection) && !conn.directed;
        } else {
            // Creating directed: check exact match only, or undirected in same positions
            return sameDirection || (!conn.directed && reverseDirection);
        }
    });

    if (exists) {
        return null;
    }

    return {
        id: nextId++,
        fromId: fromId,
        toId: toId,
        directed: directedMode
    };
}

// Table helper functions for individual row/column sizing
function getCumulativeColWidth(node, col) {
    let sum = 0;
    for (let i = 0; i < col; i++) {
        sum += node.colWidths[i];
    }
    return sum;
}

function getCumulativeRowHeight(node, row) {
    let sum = 0;
    for (let i = 0; i < row; i++) {
        sum += node.rowHeights[i];
    }
    return sum;
}

function getTotalWidth(node) {
    return node.colWidths.reduce((sum, w) => sum + w, 0);
}

function getTotalHeight(node) {
    return node.rowHeights.reduce((sum, h) => sum + h, 0);
}

function getTableBorderAtPoint(x, y, node) {
    if (node.type !== 'table') return null;

    const tolerance = TABLE_BORDER_RESIZE_TOLERANCE / zoom;

    // Check column borders (vertical lines between columns)
    let currentX = node.x;
    for (let col = 0; col < node.cols - 1; col++) {
        currentX += node.colWidths[col];
        if (Math.abs(x - currentX) <= tolerance &&
            y >= node.y && y <= node.y + getTotalHeight(node)) {
            return { type: 'col', index: col };
        }
    }

    // Check row borders (horizontal lines between rows)
    let currentY = node.y;
    for (let row = 0; row < node.rows - 1; row++) {
        currentY += node.rowHeights[row];
        if (Math.abs(y - currentY) <= tolerance &&
            x >= node.x && x <= node.x + getTotalWidth(node)) {
            return { type: 'row', index: row };
        }
    }

    return null;
}

function getCellAtPoint(x, y, node) {
    // Input validation
    if (typeof x !== 'number' || !isFinite(x)) {
        return null;
    }
    if (typeof y !== 'number' || !isFinite(y)) {
        return null;
    }
    if (!node || typeof node !== 'object') {
        return null;
    }
    if (node.type !== 'table') return null;

    // Find column
    let cellCol = -1;
    let currentX = node.x;
    for (let col = 0; col < node.cols; col++) {
        if (x >= currentX && x < currentX + node.colWidths[col]) {
            cellCol = col;
            break;
        }
        currentX += node.colWidths[col];
    }

    // Find row
    let cellRow = -1;
    let currentY = node.y;
    for (let row = 0; row < node.rows; row++) {
        if (y >= currentY && y < currentY + node.rowHeights[row]) {
            cellRow = row;
            break;
        }
        currentY += node.rowHeights[row];
    }

    return (cellRow >= 0 && cellCol >= 0) ? { row: cellRow, col: cellCol } : null;
}

function isPointOnTableBorder(x, y, node, borderWidth = TABLE_BORDER_DETECT_WIDTH) {
    if (node.type !== 'table') return false;

    const totalWidth = getTotalWidth(node);
    const totalHeight = getTotalHeight(node);

    // Check if point is within the outer rectangle
    if (x < node.x || x > node.x + totalWidth ||
        y < node.y || y > node.y + totalHeight) {
        return false;
    }

    // Check if point is in the border area (outer edge)
    const onLeftBorder = x >= node.x && x <= node.x + borderWidth;
    const onRightBorder = x >= node.x + totalWidth - borderWidth && x <= node.x + totalWidth;
    const onTopBorder = y >= node.y && y <= node.y + borderWidth;
    const onBottomBorder = y >= node.y + totalHeight - borderWidth && y <= node.y + totalHeight;

    return onLeftBorder || onRightBorder || onTopBorder || onBottomBorder;
}

function isPointInNode(x, y, node) {
    // Input validation
    if (typeof x !== 'number' || !isFinite(x)) {
        return false;
    }
    if (typeof y !== 'number' || !isFinite(y)) {
        return false;
    }
    if (!node || typeof node !== 'object') {
        return false;
    }

    switch (node.type) {
        case 'circle':
            const dx = x - node.x;
            const dy = y - node.y;
            return Math.sqrt(dx * dx + dy * dy) <= node.radius;

        case 'diamond':
            // Point-in-polygon test for diamond
            const centerX = node.x + node.width / 2;
            const centerY = node.y + node.height / 2;

            // Check if point is inside diamond using cross product
            const vertices = [
                { x: centerX, y: node.y },  // Top
                { x: node.x + node.width, y: centerY },  // Right
                { x: centerX, y: node.y + node.height },  // Bottom
                { x: node.x, y: centerY }  // Left
            ];

            let inside = false;
            for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
                const xi = vertices[i].x, yi = vertices[i].y;
                const xj = vertices[j].x, yj = vertices[j].y;

                const intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;

        case 'text':
        case 'code':
        case 'table':
        case 'rectangle':
        default:
            // For table nodes, calculate total dimensions
            if (node.type === 'table') {
                const totalWidth = getTotalWidth(node);
                const totalHeight = getTotalHeight(node);

                // Check table body
                const inTableBody = x >= node.x && x <= node.x + totalWidth &&
                                    y >= node.y && y <= node.y + totalHeight;

                // Check label area if table has a subgraph
                if (node._tableLabelBounds) {
                    const label = node._tableLabelBounds;
                    const inLabel = x >= label.x && x <= label.x + label.width &&
                                    y >= label.y && y <= label.y + label.height;
                    return inTableBody || inLabel;
                }

                return inTableBody;
            }
            return x >= node.x && x <= node.x + node.width &&
                   y >= node.y && y <= node.y + node.height;
    }
}

function getNodeAtPoint(x, y) {
    // Check from top to bottom (last drawn = on top)
    for (let i = nodes.length - 1; i >= 0; i--) {
        if (isPointInNode(x, y, nodes[i])) {
            return nodes[i];
        }
    }
    return null;
}

function getResizeCorner(x, y, node) {
    // Input validation
    if (typeof x !== 'number' || !isFinite(x)) {
        return null;
    }
    if (typeof y !== 'number' || !isFinite(y)) {
        return null;
    }
    if (!node || typeof node !== 'object') {
        return null;
    }

    switch (node.type) {
        case 'circle':
            // 8 handles around circle
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const handleX = node.x + Math.cos(angle) * node.radius;
                const handleY = node.y + Math.sin(angle) * node.radius;
                const dx = x - handleX;
                const dy = y - handleY;
                if (Math.sqrt(dx * dx + dy * dy) <= HANDLE_SIZE) {
                    return `circle-${i}`;
                }
            }
            return null;

        case 'diamond':
            // 4 handles at diamond points
            const centerX = node.x + node.width / 2;
            const centerY = node.y + node.height / 2;
            const corners = [
                { name: 'n', x: centerX, y: node.y },  // Top
                { name: 'e', x: node.x + node.width, y: centerY },  // Right
                { name: 's', x: centerX, y: node.y + node.height },  // Bottom
                { name: 'w', x: node.x, y: centerY }  // Left
            ];

            for (let corner of corners) {
                const dx = x - corner.x;
                const dy = y - corner.y;
                if (Math.sqrt(dx * dx + dy * dy) <= HANDLE_SIZE) {
                    return corner.name;
                }
            }
            return null;

        case 'text':
        case 'code':
        case 'table':
        case 'rectangle':
        default:
            // 4 corner handles
            let width, height;
            if (node.type === 'table') {
                width = getTotalWidth(node);
                height = getTotalHeight(node);
            } else {
                width = node.width;
                height = node.height;
            }

            const rectCorners = [
                { name: 'nw', x: node.x, y: node.y },
                { name: 'ne', x: node.x + width, y: node.y },
                { name: 'sw', x: node.x, y: node.y + height },
                { name: 'se', x: node.x + width, y: node.y + height }
            ];

            for (let corner of rectCorners) {
                const dx = x - corner.x;
                const dy = y - corner.y;
                if (Math.sqrt(dx * dx + dy * dy) <= HANDLE_SIZE) {
                    return corner.name;
                }
            }
            return null;
    }
}

// Group management functions
/**
 * Create a group from currently selected nodes
 * Shows modal to get group name
 */
function createGroupFromSelection() {
    // Validate that we have at least 1 node selected
    if (selectedNodeIds.size < 1) {
        setStatus('⚠️ Please select at least 1 node to create a group');
        return;
    }

    // Show the group name modal
    showGroupModal();
}

/**
 * Confirm group creation with the entered name
 * Called when user clicks "Create" in the modal
 */
function confirmCreateGroup() {
    const nameInput = document.getElementById('group-name');
    const groupName = nameInput ? nameInput.value.trim() : '';

    // Validate group name
    if (!groupName) {
        setStatus('⚠️ Group name cannot be empty');
        return;
    }

    // Create the group object
    const group = {
        id: nextId++,
        name: groupName,
        nodeIds: Array.from(selectedNodeIds)
    };

    // Add to groups array
    groups.push(group);

    // Close modal
    closeGroupModal();

    // Render and trigger auto-save
    render();
    triggerAutoSave();
    setStatus(`✓ Created group "${groupName}" with ${group.nodeIds.length} nodes`);
}

// Subgraph management functions
/**
 * Remove subgraph from selected nodes
 * Works with both node-level and cell-level subgraphs
 */
function removeSubgraphFromSelection() {
    // Get selected nodes
    const selectedNodes = Array.from(selectedNodeIds).map(id => nodeMap.get(id)).filter(n => n);

    if (selectedNodes.length === 0) {
        setStatus('⚠️ No nodes selected');
        return;
    }

    let removedCount = 0;
    let cellCount = 0;

    selectedNodes.forEach(node => {
        // Handle node-level subgraph
        if (node.subgraph) {
            // Clean up file handle if it's a file-based subgraph (using path-based key)
            if (typeof node.subgraph === 'string') {
                const handleKey = getFileHandleKey(node.id);
                fileHandleMap.delete(handleKey);
                deleteFileHandle(handleKey).catch(err =>
                    console.warn(`Failed to delete file handle ${handleKey}:`, err)
                );
            }

            delete node.subgraph;
            removedCount++;
        }

        // Handle cell-level subgraphs for table nodes
        if (node.type === 'table' && node.cells) {
            for (let row = 0; row < node.rows; row++) {
                for (let col = 0; col < node.cols; col++) {
                    const cell = node.cells[row][col];
                    if (cell && cell.subgraph) {
                        // Clean up file handle if it's a file-based subgraph (using path-based key)
                        if (typeof cell.subgraph === 'string') {
                            const cellKey = `${node.id}-cell-${row}-${col}`;
                            const handleKey = getFileHandleKey(cellKey);
                            fileHandleMap.delete(handleKey);
                            deleteFileHandle(handleKey).catch(err =>
                                console.warn(`Failed to delete cell file handle ${handleKey}:`, err)
                            );
                        }

                        delete cell.subgraph;
                        cellCount++;
                    }
                }
            }
        }
    });

    if (removedCount > 0 || cellCount > 0) {
        render();
        triggerAutoSave();

        let statusMsg = '✓ Removed ';
        if (removedCount > 0) {
            statusMsg += `${removedCount} node subgraph${removedCount > 1 ? 's' : ''}`;
        }
        if (cellCount > 0) {
            if (removedCount > 0) statusMsg += ' and ';
            statusMsg += `${cellCount} cell subgraph${cellCount > 1 ? 's' : ''}`;
        }
        setStatus(statusMsg);

        // Update button state
        updateSubgraphButton();
    } else {
        setStatus('⚠️ Selected nodes have no subgraphs to remove');
    }
}

// URL detection and opening
function extractURLsFromText(text) {
    if (!text) return [];

    // Regex pattern to match URLs:
    // - https://... or http://...
    // - www....
    // - domain.com patterns (simple TLDs)
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|dev|app|ai|me|us|uk|ca|de|fr|jp|cn|in|au|br)[^\s]*/gi;

    const matches = text.match(urlPattern);
    return matches || [];
}

function openURLFromNode(node) {
    if (!node) return false;

    let text = '';

    // Get text based on node type
    if (node.type === 'table' && node.editingCell) {
        const cell = node.cells[node.editingCell.row][node.editingCell.col];
        text = cell.text || '';
    } else if (node.type === 'table') {
        // For table without editing cell, collect all cell texts
        let allTexts = [];
        for (let row = 0; row < node.rows; row++) {
            for (let col = 0; col < node.cols; col++) {
                const cellText = node.cells[row][col].text || '';
                if (cellText) allTexts.push(cellText);
            }
        }
        text = allTexts.join(' ');
    } else {
        text = node.text || '';
    }

    const urls = extractURLsFromText(text);

    if (urls.length === 0) {
        return false;
    }

    // If exactly one URL, open it
    if (urls.length === 1) {
        let url = urls[0];
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        setStatus(`✓ Opened URL: ${urls[0]}`);
        return true;
    }

    // If multiple URLs, open the first one (could enhance to show selection modal later)
    let url = urls[0];
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    setStatus(`✓ Opened URL: ${urls[0]} (${urls.length} URLs found)`);
    return true;
}
