function drawNode(node) {
    const isSelected = node === selectedNode;

    switch (node.type) {
        case 'circle':
            drawCircleNode(node, isSelected);
            break;
        case 'diamond':
            drawDiamondNode(node, isSelected);
            break;
        case 'text':
            drawTextNode(node, isSelected);
            break;
        case 'rectangle':
        default:
            drawRectangleNode(node, isSelected);
            break;
    }
}

function drawRectangleNode(node, isSelected) {
    const isEditing = node === editingNode;

    // Fill
    ctx.fillStyle = isEditing ? '#fff9c4' : (isSelected ? '#e3f2fd' : '#fff');
    ctx.fillRect(node.x, node.y, node.width, node.height);

    // Border
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#999');
    ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1);
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // Dashed border for nodes with subgraphs
    if (node.subgraph) {
        ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#666');
        ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1.5);
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        ctx.setLineDash([]); // Reset to solid
    }

    // Text
    drawNodeText(node, node.x + node.width / 2, node.y + node.height / 2, node.width - 10);

    // Draw resize handles if selected
    if (isSelected) {
        const corners = [
            { x: node.x, y: node.y },
            { x: node.x + node.width, y: node.y },
            { x: node.x, y: node.y + node.height },
            { x: node.x + node.width, y: node.y + node.height }
        ];
        drawResizeHandles(corners);
    }
}

function drawCircleNode(node, isSelected) {
    const isEditing = node === editingNode;

    // Fill
    ctx.fillStyle = isEditing ? '#fff9c4' : (isSelected ? '#e3f2fd' : '#fff');
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#999');
    ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1);
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Dashed border for nodes with subgraphs
    if (node.subgraph) {
        ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#666');
        ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1.5);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid
    }

    // Text
    drawNodeText(node, node.x, node.y, node.radius * 1.8);

    // Draw resize handles if selected (8 points around circle)
    if (isSelected) {
        const handles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            handles.push({
                x: node.x + Math.cos(angle) * node.radius,
                y: node.y + Math.sin(angle) * node.radius
            });
        }
        drawResizeHandles(handles);
    }
}

function drawDiamondNode(node, isSelected) {
    const isEditing = node === editingNode;
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;

    // Fill
    ctx.fillStyle = isEditing ? '#fff9c4' : (isSelected ? '#e3f2fd' : '#fff');
    ctx.beginPath();
    ctx.moveTo(centerX, node.y);  // Top
    ctx.lineTo(node.x + node.width, centerY);  // Right
    ctx.lineTo(centerX, node.y + node.height);  // Bottom
    ctx.lineTo(node.x, centerY);  // Left
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#999');
    ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1);
    ctx.beginPath();
    ctx.moveTo(centerX, node.y);
    ctx.lineTo(node.x + node.width, centerY);
    ctx.lineTo(centerX, node.y + node.height);
    ctx.lineTo(node.x, centerY);
    ctx.closePath();
    ctx.stroke();

    // Dashed border for nodes with subgraphs
    if (node.subgraph) {
        ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : '#666');
        ctx.lineWidth = isEditing ? 3 : (isSelected ? 2 : 1.5);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, node.y);
        ctx.lineTo(node.x + node.width, centerY);
        ctx.lineTo(centerX, node.y + node.height);
        ctx.lineTo(node.x, centerY);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid
    }

    // Text
    drawNodeText(node, centerX, centerY, node.width * 0.7);

    // Draw resize handles if selected (4 diamond points)
    if (isSelected) {
        const corners = [
            { x: centerX, y: node.y },  // Top
            { x: node.x + node.width, y: centerY },  // Right
            { x: centerX, y: node.y + node.height },  // Bottom
            { x: node.x, y: centerY }  // Left
        ];
        drawResizeHandles(corners);
    }
}

function drawTextNode(node, isSelected) {
    const isEditing = node === editingNode;

    // NO border - only draw text
    // Text
    drawNodeText(node, node.x + node.width / 2, node.y + node.height / 2, node.width - 10);

    // Dashed border for text nodes with subgraphs (always show)
    if (node.subgraph && !isSelected && !isEditing) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        ctx.setLineDash([]);
    }

    // Draw resize handles if selected or editing (show bounds even though no border)
    if (isSelected || isEditing) {
        // Draw faint selection rectangle
        ctx.strokeStyle = isEditing ? '#ffa000' : '#2196f3';
        ctx.lineWidth = isEditing ? 2 : 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        ctx.setLineDash([]);

        const corners = [
            { x: node.x, y: node.y },
            { x: node.x + node.width, y: node.y },
            { x: node.x, y: node.y + node.height },
            { x: node.x + node.width, y: node.y + node.height }
        ];
        drawResizeHandles(corners);
    }
}

function drawNodeText(node, centerX, centerY, maxWidth) {
    const isEditing = node === editingNode;
    const displayText = node.text || (isEditing ? '' : '');
    const textAlign = node.textAlign || 'center';

    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    if (!displayText && !isEditing) return;

    // Save context and set up clipping region for the node
    ctx.save();
    if (node.type === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.clip();
    } else if (node.type === 'diamond') {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        ctx.beginPath();
        ctx.moveTo(cx, node.y);
        ctx.lineTo(node.x + node.width, cy);
        ctx.lineTo(cx, node.y + node.height);
        ctx.lineTo(node.x, cy);
        ctx.closePath();
        ctx.clip();
    } else {
        // Rectangle and text nodes
        ctx.beginPath();
        ctx.rect(node.x, node.y, node.width, node.height);
        ctx.clip();
    }

    // Calculate text x position based on alignment (with padding for left/right)
    const TEXT_PADDING = 8;
    let textX;
    if (textAlign === 'left') {
        textX = centerX - maxWidth / 2 + TEXT_PADDING;
    } else if (textAlign === 'right') {
        textX = centerX + maxWidth / 2 - TEXT_PADDING;
    } else {
        textX = centerX;
    }

    // Split by newlines first, then wrap each line
    const paragraphs = displayText.split('\n');
    const lines = [];

    for (let paragraph of paragraphs) {
        if (paragraph === '') {
            // Empty line (newline)
            lines.push('');
            continue;
        }

        // Word wrapping for this paragraph
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                // Current line is full, push it
                lines.push(currentLine);
                currentLine = word;

                // Check if the single word itself is too long
                if (ctx.measureText(word).width > maxWidth) {
                    // Break the word into chunks
                    let tempWord = '';
                    for (let char of word) {
                        const testWord = tempWord + char;
                        if (ctx.measureText(testWord).width > maxWidth && tempWord) {
                            lines.push(tempWord);
                            tempWord = char;
                        } else {
                            tempWord = testWord;
                        }
                    }
                    currentLine = tempWord;
                }
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
    }

    const startY = centerY - (lines.length - 1) * LINE_HEIGHT / 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, textX, startY + i * LINE_HEIGHT);
    });

    // Draw cursor if editing - place at end of last line (with blinking)
    if (isEditing && cursorVisible) {
        const lastLine = lines[lines.length - 1] || '';
        const lastLineY = startY + (lines.length - 1) * LINE_HEIGHT;

        // Calculate cursor position based on alignment
        let cursorX;
        if (textAlign === 'left') {
            cursorX = textX + ctx.measureText(lastLine).width;
        } else if (textAlign === 'right') {
            cursorX = textX; // Text ends at textX for right alignment
        } else {
            cursorX = textX + ctx.measureText(lastLine).width / 2;
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX + 2, lastLineY - 8);
        ctx.lineTo(cursorX + 2, lastLineY + 8);
        ctx.stroke();
    }

    // Restore context (remove clipping)
    ctx.restore();
}

function drawResizeHandles(corners) {
    ctx.fillStyle = '#2196f3';
    corners.forEach(corner => {
        ctx.fillRect(corner.x - HANDLE_SIZE / 2, corner.y - HANDLE_SIZE / 2,
                    HANDLE_SIZE, HANDLE_SIZE);
    });
}

function drawArrow(x1, y1, x2, y2, directed, isSelected) {
    ctx.strokeStyle = isSelected ? '#2196f3' : '#666';
    ctx.fillStyle = isSelected ? '#2196f3' : '#666';
    ctx.lineWidth = isSelected ? 3 : 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead if directed
    if (directed) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 20;
        const headWidth = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - headLength * Math.cos(angle - headWidth),
            y2 - headLength * Math.sin(angle - headWidth)
        );
        ctx.lineTo(
            x2 - headLength * Math.cos(angle + headWidth),
            y2 - headLength * Math.sin(angle + headWidth)
        );
        ctx.closePath();
        ctx.fill();
    }
}

function getNodeEdgePoint(fromX, fromY, toNode) {
    switch (toNode.type) {
        case 'circle':
            // Point on circle circumference at angle from fromX, fromY
            const angle = Math.atan2(toNode.y - fromY, toNode.x - fromX);
            return {
                x: toNode.x + Math.cos(angle) * toNode.radius,
                y: toNode.y + Math.sin(angle) * toNode.radius
            };

        case 'diamond':
            // Intersection with diamond edges
            const centerX = toNode.x + toNode.width / 2;
            const centerY = toNode.y + toNode.height / 2;
            const dx = centerX - fromX;
            const dy = centerY - fromY;
            const ang = Math.atan2(dy, dx);

            // Diamond has 4 edges, find which one the line intersects
            const edges = [
                // Top edge: from (x, y) to (x+w, cy)
                { x1: centerX, y1: toNode.y, x2: toNode.x + toNode.width, y2: centerY },
                // Right edge: from (x+w, cy) to (cx, y+h)
                { x1: toNode.x + toNode.width, y1: centerY, x2: centerX, y2: toNode.y + toNode.height },
                // Bottom edge: from (cx, y+h) to (x, cy)
                { x1: centerX, y1: toNode.y + toNode.height, x2: toNode.x, y2: centerY },
                // Left edge: from (x, cy) to (cx, y)
                { x1: toNode.x, y1: centerY, x2: centerX, y2: toNode.y }
            ];

            // Find intersection with line from (fromX, fromY) through center
            for (let edge of edges) {
                const intersect = lineIntersection(fromX, fromY, centerX, centerY,
                                                  edge.x1, edge.y1, edge.x2, edge.y2);
                if (intersect) return intersect;
            }
            return { x: centerX, y: centerY };

        case 'text':
        case 'rectangle':
        default:
            // Rectangle edge calculation
            const nodeCenterX = toNode.x + toNode.width / 2;
            const nodeCenterY = toNode.y + toNode.height / 2;

            const dxx = nodeCenterX - fromX;
            const dyy = nodeCenterY - fromY;
            const angle2 = Math.atan2(dyy, dxx);

            const cos = Math.cos(angle2);
            const sin = Math.sin(angle2);

            let x, y;

            if (Math.abs(cos) > Math.abs(sin)) {
                if (cos > 0) {
                    x = toNode.x;
                } else {
                    x = toNode.x + toNode.width;
                }
                y = nodeCenterY - (nodeCenterX - x) * Math.tan(angle2);
            } else {
                if (sin > 0) {
                    y = toNode.y;
                } else {
                    y = toNode.y + toNode.height;
                }
                x = nodeCenterX - (nodeCenterY - y) / Math.tan(angle2);
            }

            return { x, y };
    }
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    return null;
}

function getNodeCenter(node) {
    if (node.type === 'circle') {
        return { x: node.x, y: node.y };
    } else {
        return {
            x: node.x + node.width / 2,
            y: node.y + node.height / 2
        };
    }
}

function drawConnection(conn) {
    const fromNode = nodeMap.get(conn.fromId);
    const toNode = nodeMap.get(conn.toId);

    if (fromNode && toNode) {
        const fromCenter = getNodeCenter(fromNode);
        const toCenter = getNodeCenter(toNode);

        // Calculate edge points on both nodes
        const startPoint = getNodeEdgePoint(toCenter.x, toCenter.y, fromNode);
        const endPoint = getNodeEdgePoint(fromCenter.x, fromCenter.y, toNode);

        // For directed connections, pull back the endpoint slightly so arrowhead is visible
        let adjustedEndPoint = endPoint;
        if (conn.directed) {
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                adjustedEndPoint = {
                    x: endPoint.x - (dx / length) * ARROWHEAD_OFFSET,
                    y: endPoint.y - (dy / length) * ARROWHEAD_OFFSET
                };
            }
        }

        const isSelected = conn === selectedConnection;
        drawArrow(startPoint.x, startPoint.y, adjustedEndPoint.x, adjustedEndPoint.y, conn.directed, isSelected);
    }
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom transform
    ctx.save();
    ctx.scale(zoom, zoom);

    // Draw connections first (behind nodes)
    connections.forEach(conn => drawConnection(conn));

    // Draw connection preview
    if (connectionMode && connectionStart && hoveredNode) {
        const startCenter = getNodeCenter(connectionStart);
        const endCenter = getNodeCenter(hoveredNode);

        const startPoint = getNodeEdgePoint(endCenter.x, endCenter.y, connectionStart);
        const endPoint = getNodeEdgePoint(startCenter.x, startCenter.y, hoveredNode);

        // For directed connections, pull back the endpoint slightly
        let adjustedEndPoint = endPoint;
        if (directedMode) {
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                adjustedEndPoint = {
                    x: endPoint.x - (dx / length) * ARROWHEAD_OFFSET,
                    y: endPoint.y - (dy / length) * ARROWHEAD_OFFSET
                };
            }
        }

        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(adjustedEndPoint.x, adjustedEndPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw nodes
    nodes.forEach(node => drawNode(node));

    // Draw hover effect
    if (hoveredNode && hoveredNode !== selectedNode && !isDragging) {
        ctx.strokeStyle = connectionMode ? '#4caf50' : '#2196f3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        switch (hoveredNode.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(hoveredNode.x, hoveredNode.y, hoveredNode.radius + 2, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'diamond':
                const centerX = hoveredNode.x + hoveredNode.width / 2;
                const centerY = hoveredNode.y + hoveredNode.height / 2;
                const offset = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, hoveredNode.y - offset);
                ctx.lineTo(hoveredNode.x + hoveredNode.width + offset, centerY);
                ctx.lineTo(centerX, hoveredNode.y + hoveredNode.height + offset);
                ctx.lineTo(hoveredNode.x - offset, centerY);
                ctx.closePath();
                ctx.stroke();
                break;
            default:
                // Rectangle and text
                ctx.strokeRect(hoveredNode.x - 2, hoveredNode.y - 2,
                              hoveredNode.width + 4, hoveredNode.height + 4);
                break;
        }

        ctx.setLineDash([]);
    }

    // Restore transform
    ctx.restore();
}

// Helper function to get mouse coordinates accounting for zoom and scroll
function getMousePos(e) {
    const container = document.getElementById('canvas-container');
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left + container.scrollLeft) / zoom,
        y: (e.clientY - rect.top + container.scrollTop) / zoom
    };
}
