function createNode(x, y, type = 'rectangle') {
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
    // Prevent self-connections
    if (fromId === toId) {
        return null;
    }

    // Prevent duplicate connections
    const exists = connections.some(conn =>
        (conn.fromId === fromId && conn.toId === toId) ||
        (conn.fromId === toId && conn.toId === fromId)
    );

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

function isPointInNode(x, y, node) {
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
        case 'rectangle':
        default:
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
    if (!node) return null;

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
        case 'rectangle':
        default:
            // 4 corner handles
            const rectCorners = [
                { name: 'nw', x: node.x, y: node.y },
                { name: 'ne', x: node.x + node.width, y: node.y },
                { name: 'sw', x: node.x, y: node.y + node.height },
                { name: 'se', x: node.x + node.width, y: node.y + node.height }
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
