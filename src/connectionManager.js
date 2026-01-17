function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Line segment is actually a point
        const dpx = px - x1;
        const dpy = py - y1;
        return Math.sqrt(dpx * dpx + dpy * dpy);
    }

    // Calculate projection of point onto line
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Find closest point on line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Calculate distance
    const distX = px - closestX;
    const distY = py - closestY;
    return Math.sqrt(distX * distX + distY * distY);
}

function getConnectionAtPoint(x, y) {
    for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections[i];
        const fromNode = nodeMap.get(conn.fromId);
        const toNode = nodeMap.get(conn.toId);

        if (fromNode && toNode) {
            const fromCenter = getNodeCenter(fromNode);
            const toCenter = getNodeCenter(toNode);

            // Calculate edge points on both nodes
            const startPoint = getNodeEdgePoint(toCenter.x, toCenter.y, fromNode);
            const endPoint = getNodeEdgePoint(fromCenter.x, fromCenter.y, toNode);

            const distance = distanceToLineSegment(x, y, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            if (distance <= CONNECTION_THRESHOLD) {
                return conn;
            }
        }
    }
    return null;
}
