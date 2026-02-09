// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawNode(node) {
    const isSelected = selectedNodeIds.has(node.id);

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
        case 'code':
            drawCodeNode(node, isSelected);
            break;
        case 'table':
            drawTableNode(node, isSelected);
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

    // Border - thicker for nodes with subgraphs
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : NODE_BORDER_COLOR);
    ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isEditing ? EDITING_BORDER_WIDTH : (isSelected ? SELECTED_BORDER_WIDTH : 1));
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // Text
    drawNodeText(node, node.x + node.width / 2, node.y + node.height / 2, node.width - 10);

    // Draw resize handles if selected (and only one node is selected)
    if (isSelected && selectedNodeIds.size === 1) {
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

    // Border - thicker for nodes with subgraphs
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : NODE_BORDER_COLOR);
    ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isEditing ? EDITING_BORDER_WIDTH : (isSelected ? SELECTED_BORDER_WIDTH : 1));
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.stroke();

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

    // Border - thicker for nodes with subgraphs
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : NODE_BORDER_COLOR);
    ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isEditing ? EDITING_BORDER_WIDTH : (isSelected ? SELECTED_BORDER_WIDTH : 1));
    ctx.beginPath();
    ctx.moveTo(centerX, node.y);
    ctx.lineTo(node.x + node.width, centerY);
    ctx.lineTo(centerX, node.y + node.height);
    ctx.lineTo(node.x, centerY);
    ctx.closePath();
    ctx.stroke();

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

    // Thick border for text nodes with subgraphs (always show)
    if (node.subgraph && !isSelected && !isEditing) {
        ctx.strokeStyle = NODE_BORDER_COLOR;
        ctx.lineWidth = SUBGRAPH_BORDER_WIDTH;
        ctx.strokeRect(node.x, node.y, node.width, node.height);
    }

    // Draw resize handles if selected or editing (show bounds even though no border)
    if (isSelected || isEditing) {
        // Draw faint selection rectangle
        ctx.strokeStyle = isEditing ? '#ffa000' : '#2196f3';
        ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isEditing ? SELECTED_BORDER_WIDTH : 1);
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

function drawCodeNode(node, isSelected) {
    const isEditing = node === editingNode;

    // Background - light gray like code editor
    ctx.fillStyle = isEditing ? '#fff9c4' : (isSelected ? '#e3f2fd' : '#f5f5f5');
    ctx.fillRect(node.x, node.y, node.width, node.height);

    // Border
    ctx.strokeStyle = isEditing ? '#ffa000' : (isSelected ? '#2196f3' : NODE_BORDER_COLOR);
    ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isEditing ? EDITING_BORDER_WIDTH : (isSelected ? SELECTED_BORDER_WIDTH : 1));
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // Text with monospace font
    drawCodeText(node, node.x + node.width / 2, node.y + node.height / 2, node.width - 16);

    // Draw resize handles if selected (and only one node is selected)
    if (isSelected && selectedNodeIds.size === 1) {
        const corners = [
            { x: node.x, y: node.y },
            { x: node.x + node.width, y: node.y },
            { x: node.x, y: node.y + node.height },
            { x: node.x + node.width, y: node.y + node.height }
        ];
        drawResizeHandles(corners);
    }
}

function drawCodeText(node, centerX, centerY, maxWidth) {
    const isEditing = node === editingNode;
    const displayText = node.text || (isEditing ? '' : '');
    const textAlign = node.textAlign || 'left';

    ctx.font = `${CODE_FONT_SIZE}px ${currentCodeFontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    if (!displayText && !isEditing) return;

    // Save context and set up clipping region
    ctx.save();
    ctx.beginPath();
    ctx.rect(node.x, node.y, node.width, node.height);
    ctx.clip();

    // Calculate text x position based on alignment (with padding)
    let textX;
    if (textAlign === 'left') {
        textX = centerX - maxWidth / 2 + TEXT_PADDING;
    } else if (textAlign === 'right') {
        textX = centerX + maxWidth / 2 - TEXT_PADDING;
    } else {
        textX = centerX;
    }

    // Split by newlines - no word wrapping for code
    const lines = displayText.split('\n');

    // Use slightly smaller line height for code
    const codeLineHeight = CODE_FONT_SIZE + CODE_LINE_HEIGHT_OFFSET;
    const startY = centerY - (lines.length - 1) * codeLineHeight / 2;

    // Helper function to get syntax color for a token
    function getSyntaxColor(token) {
        if (SYNTAX_KEYWORDS.includes(token)) {
            return SYNTAX_COLORS.keyword;
        } else if (SYNTAX_PATTERNS.string.test(token)) {
            return SYNTAX_COLORS.string;
        } else if (SYNTAX_PATTERNS.number.test(token)) {
            return SYNTAX_COLORS.number;
        } else if (SYNTAX_PATTERNS.comment.test(token)) {
            return SYNTAX_COLORS.comment;
        }
        return SYNTAX_COLORS.default;
    }

    // Draw selection highlight if text is selected (code nodes)
    if (isEditing && selectionStart !== null && selectionEnd !== null) {
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);

        ctx.fillStyle = TEXT_SELECTION_COLOR;

        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineStart = charCount;
            const lineEnd = charCount + lines[i].length;

            // Check if this line contains any part of the selection
            if (end >= lineStart && start <= lineEnd) {
                const selStart = Math.max(0, start - lineStart);
                const selEnd = Math.min(lines[i].length, end - lineStart);

                const lineY = startY + i * codeLineHeight;
                const line = lines[i];
                const beforeSelection = line.substring(0, selStart);
                const selectedText = line.substring(selStart, selEnd);

                // Calculate selection rectangle dimensions based on alignment
                let selectionX, selectionWidth;
                const beforeWidth = ctx.measureText(beforeSelection).width;
                const selectionTextWidth = ctx.measureText(selectedText).width;

                if (textAlign === 'left') {
                    selectionX = textX + beforeWidth;
                    selectionWidth = selectionTextWidth;
                } else if (textAlign === 'right') {
                    const fullLineWidth = ctx.measureText(line).width;
                    selectionX = textX - fullLineWidth + beforeWidth;
                    selectionWidth = selectionTextWidth;
                } else {
                    // Center alignment
                    const fullLineWidth = ctx.measureText(line).width;
                    selectionX = textX - fullLineWidth / 2 + beforeWidth;
                    selectionWidth = selectionTextWidth;
                }

                // Draw selection background
                ctx.fillRect(selectionX, lineY - CURSOR_HEIGHT, selectionWidth, CURSOR_HEIGHT * 2);
            }

            charCount += lines[i].length + 1; // +1 for newline
        }

        // Reset fill style for text
        ctx.fillStyle = SYNTAX_COLORS.default;
    }

    // Draw each line - use syntax highlighting only when NOT editing
    if (isEditing) {
        // Plain text while editing for accurate cursor positioning
        ctx.fillStyle = SYNTAX_COLORS.default;
        lines.forEach((line, i) => {
            const lineY = startY + i * codeLineHeight;
            ctx.fillText(line, textX, lineY);
        });
    } else {
        // Save current textAlign and set to 'left' for manual positioning
        const savedTextAlign = ctx.textAlign;
        ctx.textAlign = 'left';

        // Syntax highlighting and URL highlighting when viewing
        lines.forEach((line, i) => {
            const lineY = startY + i * codeLineHeight;

            if (line) {
                // Check if line contains URLs
                const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|dev|app|ai|me|us|uk|ca|de|fr|jp|cn|in|au|br)[^\s]*/gi;
                const urlMatches = line.match(urlPattern);

                let currentX = textAlign === 'left' ? textX :
                              (textAlign === 'right' ? textX - ctx.measureText(line).width :
                               textX - ctx.measureText(line).width / 2);

                if (urlMatches && urlMatches.length > 0) {
                    // Line contains URLs - render with URL highlighting
                    let lastIndex = 0;
                    urlPattern.lastIndex = 0;
                    let match;

                    while ((match = urlPattern.exec(line)) !== null) {
                        // Draw text before URL with syntax highlighting
                        if (match.index > lastIndex) {
                            const beforeURL = line.substring(lastIndex, match.index);
                            const tokens = beforeURL.split(/(\s+|[(){}\[\];,.])/);
                            tokens.forEach(token => {
                                if (!token) return;
                                ctx.fillStyle = getSyntaxColor(token);
                                ctx.fillText(token, currentX, lineY);
                                currentX += ctx.measureText(token).width;
                            });
                        }

                        // Draw URL in blue with underline
                        const url = match[0];
                        ctx.fillStyle = '#2196f3';
                        ctx.fillText(url, currentX, lineY);
                        const urlWidth = ctx.measureText(url).width;

                        // Draw underline
                        ctx.strokeStyle = '#2196f3';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(currentX, lineY + URL_UNDERLINE_OFFSET);
                        ctx.lineTo(currentX + urlWidth, lineY + URL_UNDERLINE_OFFSET);
                        ctx.stroke();

                        currentX += urlWidth;
                        lastIndex = match.index + match[0].length;
                    }

                    // Draw remaining text after last URL
                    if (lastIndex < line.length) {
                        const afterURL = line.substring(lastIndex);
                        const tokens = afterURL.split(/(\s+|[(){}\[\];,.])/);
                        tokens.forEach(token => {
                            if (!token) return;
                            ctx.fillStyle = getSyntaxColor(token);
                            ctx.fillText(token, currentX, lineY);
                            currentX += ctx.measureText(token).width;
                        });
                    }
                } else {
                    // No URLs - use regular syntax highlighting
                    const tokens = line.split(/(\s+|[(){}\[\];,.])/);
                    tokens.forEach(token => {
                        if (!token) return;
                        ctx.fillStyle = getSyntaxColor(token);
                        ctx.fillText(token, currentX, lineY);
                        currentX += ctx.measureText(token).width;
                    });
                }
            }
        });

        // Restore original textAlign
        ctx.textAlign = savedTextAlign;
    }

    // Draw cursor if editing
    if (isEditing && cursorVisible) {
        // Find which line and position in line the cursor is at
        let charCount = 0;
        let cursorLine = 0;
        let cursorPosInLine = 0;

        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length >= cursorPosition) {
                cursorLine = i;
                cursorPosInLine = cursorPosition - charCount;
                break;
            }
            charCount += lines[i].length + 1; // +1 for newline character
        }

        // Handle cursor at very end of text
        if (cursorPosition >= displayText.length && lines.length > 0) {
            cursorLine = lines.length - 1;
            cursorPosInLine = lines[cursorLine].length;
        }

        const cursorLineY = startY + cursorLine * codeLineHeight;
        const line = lines[cursorLine] || '';
        const lineUpToCursor = line.substring(0, cursorPosInLine);

        let cursorX;
        if (textAlign === 'left') {
            cursorX = textX + ctx.measureText(lineUpToCursor).width;
        } else if (textAlign === 'right') {
            const fullLineWidth = ctx.measureText(line).width;
            const partialWidth = ctx.measureText(lineUpToCursor).width;
            cursorX = textX - fullLineWidth + partialWidth;
        } else {
            const fullLineWidth = ctx.measureText(line).width;
            const partialWidth = ctx.measureText(lineUpToCursor).width;
            cursorX = textX - fullLineWidth / 2 + partialWidth;
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = SELECTED_BORDER_WIDTH;
        ctx.beginPath();
        ctx.moveTo(cursorX + CURSOR_X_OFFSET_NORMAL, cursorLineY - CURSOR_HEIGHT);
        ctx.lineTo(cursorX + CURSOR_X_OFFSET_NORMAL, cursorLineY + CURSOR_HEIGHT);
        ctx.stroke();
    }

    ctx.restore();
}

function drawTableNode(node, isSelected) {
    const totalWidth = getTotalWidth(node);
    const totalHeight = getTotalHeight(node);

    // Background
    ctx.fillStyle = isSelected ? '#e3f2fd' : '#fff';
    ctx.fillRect(node.x, node.y, totalWidth, totalHeight);

    // Outer border - thicker for nodes with subgraphs
    ctx.strokeStyle = isSelected ? '#2196f3' : NODE_BORDER_COLOR;
    ctx.lineWidth = node.subgraph ? SUBGRAPH_BORDER_WIDTH : (isSelected ? SELECTED_BORDER_WIDTH : 1);
    ctx.strokeRect(node.x, node.y, totalWidth, totalHeight);

    // Draw trapezoid tab on top-left if table has a node-level subgraph
    if (node.subgraph) {
        const labelText = '⬇ Table';
        const labelPadding = 8;
        const labelHeight = 22;
        const trapezoidSlant = 6; // How much the sides slant inward at the top

        // Measure text width
        ctx.font = `bold 11px ${FONT_FAMILY}`;
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + labelPadding * 2;

        // Position tab at top-left of table
        const tabX = node.x + 8;
        const tabY = node.y - labelHeight;

        // Store label position for click detection (use bounding box)
        node._tableLabelBounds = {
            x: tabX,
            y: tabY,
            width: labelWidth,
            height: labelHeight
        };

        // Draw trapezoid tab
        ctx.fillStyle = '#6c757d';
        ctx.strokeStyle = '#6c757d';
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Start from bottom-left
        ctx.moveTo(tabX, tabY + labelHeight);
        // Top-left (slanted inward)
        ctx.lineTo(tabX + trapezoidSlant, tabY);
        // Top-right (slanted inward)
        ctx.lineTo(tabX + labelWidth - trapezoidSlant, tabY);
        // Bottom-right
        ctx.lineTo(tabX + labelWidth, tabY + labelHeight);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Draw label text
        ctx.fillStyle = '#fff';
        ctx.font = `bold 11px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, tabX + labelWidth / 2, tabY + labelHeight / 2);

        // Reset text alignment
        ctx.textAlign = 'left';
    } else {
        // Clear label bounds if no subgraph
        delete node._tableLabelBounds;
    }

    // Draw grid lines and cell content
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';

    for (let row = 0; row < node.rows; row++) {
        for (let col = 0; col < node.cols; col++) {
            const cellX = node.x + getCumulativeColWidth(node, col);
            const cellY = node.y + getCumulativeRowHeight(node, row);
            const cellWidth = node.colWidths[col];
            const cellHeight = node.rowHeights[row];
            const cell = node.cells[row][col];

            // Check if this cell is selected
            const isCellSelected = selectedCell && selectedCell.table === node &&
                                   selectedCell.row === row && selectedCell.col === col;

            // Draw cell border
            ctx.strokeStyle = isCellSelected ? '#2196f3' : '#ccc';
            ctx.lineWidth = isCellSelected ? SELECTED_BORDER_WIDTH : 1;
            ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);

            // Draw dashed border for cells with subgraphs
            if (cell.subgraph) {
                ctx.strokeStyle = DEFAULT_COLOR;
                ctx.lineWidth = SELECTED_BORDER_WIDTH;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(cellX + 1, cellY + 1, cellWidth - (CELL_PADDING / 2), cellHeight - (CELL_PADDING / 2));
                ctx.setLineDash([]); // Reset to solid
            }

            // Highlight editing cell
            const isEditingCell = node.editingCell && node.editingCell.row === row && node.editingCell.col === col;
            if (isEditingCell) {
                ctx.fillStyle = '#fff9c4';
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                ctx.strokeStyle = '#ffa000';
                ctx.lineWidth = SELECTED_BORDER_WIDTH;
                ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
            }

            // Draw cell text
            const cellText = cell.text || '';
            if (cellText || isEditingCell) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(cellX + CELL_PADDING / 2, cellY + CELL_PADDING / 2, cellWidth - CELL_PADDING, cellHeight - CELL_PADDING);
                ctx.clip();

                ctx.fillStyle = '#333';
                const centerX = cellX + cellWidth / 2;
                const centerY = cellY + cellHeight / 2;

                // Use cell's textAlign or fallback to table's default
                const cellAlign = cell.textAlign || node.textAlign || 'center';
                ctx.textAlign = cellAlign;
                ctx.font = `${FONT_SIZE}px ${currentFontFamily}`;

                // Calculate text X position based on alignment
                let textX;
                if (cellAlign === 'left') {
                    textX = cellX + TEXT_PADDING;  // Left edge with padding
                } else if (cellAlign === 'right') {
                    textX = cellX + cellWidth - TEXT_PADDING;  // Right edge with padding
                } else {
                    textX = centerX;  // Center
                }

                // Multi-line text for table cells with URL highlighting
                const lines = cellText.split('\n');
                const startY = centerY - (lines.length - 1) * LINE_HEIGHT / 2;

                // Draw selection highlight if text is selected (table cells)
                if (isEditingCell && selectionStart !== null && selectionEnd !== null) {
                    const start = Math.min(selectionStart, selectionEnd);
                    const end = Math.max(selectionStart, selectionEnd);

                    ctx.fillStyle = TEXT_SELECTION_COLOR;

                    let charCount = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const lineStart = charCount;
                        const lineEnd = charCount + lines[i].length;

                        // Check if this line contains any part of the selection
                        if (end >= lineStart && start <= lineEnd) {
                            const selStart = Math.max(0, start - lineStart);
                            const selEnd = Math.min(lines[i].length, end - lineStart);

                            const lineY = startY + i * LINE_HEIGHT;
                            const beforeSelection = lines[i].substring(0, selStart);
                            const selectedText = lines[i].substring(selStart, selEnd);

                            const beforeWidth = ctx.measureText(beforeSelection).width;
                            const selectionWidth = ctx.measureText(selectedText).width;

                            let selectionX;
                            if (cellAlign === 'left') {
                                selectionX = cellX + TEXT_PADDING + beforeWidth;
                            } else if (cellAlign === 'right') {
                                const fullTextWidth = ctx.measureText(lines[i]).width;
                                selectionX = cellX + cellWidth - TEXT_PADDING - fullTextWidth + beforeWidth;
                            } else {
                                const fullTextWidth = ctx.measureText(lines[i]).width;
                                selectionX = centerX - fullTextWidth / 2 + beforeWidth;
                            }

                            ctx.fillRect(selectionX, lineY - CURSOR_HEIGHT, selectionWidth, CURSOR_HEIGHT * 2);
                        }

                        charCount += lines[i].length + 1; // +1 for newline
                    }

                    // Reset fill style for text
                    ctx.fillStyle = '#333';
                }

                // Draw text lines
                lines.forEach((line, i) => {
                    const lineY = startY + i * LINE_HEIGHT;
                    if (isEditingCell) {
                        // Plain text when editing
                        ctx.fillText(line, textX, lineY);
                    } else {
                        // Highlight URLs when viewing
                        drawTextWithURLHighlight(line, textX, lineY, cellAlign);
                    }
                });

                // Draw cursor if this cell is being edited
                if (isEditingCell && cursorVisible) {
                    // Find which line contains the cursor
                    let charCount = 0;
                    let cursorLine = 0;
                    let cursorPosInLine = 0;

                    for (let i = 0; i < lines.length; i++) {
                        if (charCount + lines[i].length >= cursorPosition) {
                            cursorLine = i;
                            cursorPosInLine = cursorPosition - charCount;
                            break;
                        }
                        charCount += lines[i].length + 1; // +1 for newline
                    }

                    // Handle cursor at very end of text
                    if (cursorPosition >= cellText.length && lines.length > 0) {
                        cursorLine = lines.length - 1;
                        cursorPosInLine = lines[cursorLine].length;
                    }

                    const cursorLineY = startY + cursorLine * LINE_HEIGHT;
                    const lineUpToCursor = lines[cursorLine] ? lines[cursorLine].substring(0, cursorPosInLine) : '';
                    const textWidth = ctx.measureText(lineUpToCursor).width;

                    let cursorX;
                    if (cellAlign === 'left') {
                        cursorX = cellX + TEXT_PADDING + textWidth;
                    } else if (cellAlign === 'right') {
                        const fullTextWidth = ctx.measureText(lines[cursorLine] || '').width;
                        cursorX = cellX + cellWidth - TEXT_PADDING - fullTextWidth + textWidth;
                    } else {
                        const fullTextWidth = ctx.measureText(lines[cursorLine] || '').width;
                        cursorX = centerX - fullTextWidth / 2 + textWidth;
                    }

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = SELECTED_BORDER_WIDTH;
                    ctx.beginPath();
                    ctx.moveTo(cursorX + CURSOR_X_OFFSET_TABLE, cursorLineY - CURSOR_HEIGHT);
                    ctx.lineTo(cursorX + CURSOR_X_OFFSET_TABLE, cursorLineY + CURSOR_HEIGHT);
                    ctx.stroke();
                }

                ctx.restore();
            }
        }
    }

    // Draw resize handles if selected (and only one node is selected)
    if (isSelected && selectedNodeIds.size === 1) {
        const corners = [
            { x: node.x, y: node.y },
            { x: node.x + totalWidth, y: node.y },
            { x: node.x, y: node.y + totalHeight },
            { x: node.x + totalWidth, y: node.y + totalHeight }
        ];
        drawResizeHandles(corners);
    }
}

// Helper function to draw text with URL highlighting
function drawTextWithURLHighlight(text, x, y, textAlign) {
    if (!text) return;

    // URL regex pattern (same as in extractURLsFromText)
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|dev|app|ai|me|us|uk|ca|de|fr|jp|cn|in|au|br)[^\s]*/gi;

    // Split text into parts (URLs and non-URLs)
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset lastIndex for global regex
    urlPattern.lastIndex = 0;

    while ((match = urlPattern.exec(text)) !== null) {
        // Add text before URL
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isURL: false });
        }
        // Add URL
        parts.push({ text: match[0], isURL: true });
        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isURL: false });
    }

    // If no URLs found, just draw plain text
    if (parts.length === 0) {
        ctx.fillText(text, x, y);
        return;
    }

    // Save current textAlign and set to 'left' for manual positioning
    const savedTextAlign = ctx.textAlign;
    ctx.textAlign = 'left';

    // Calculate starting X position based on alignment
    let currentX;
    if (textAlign === 'left') {
        currentX = x;
    } else if (textAlign === 'right') {
        const totalWidth = ctx.measureText(text).width;
        currentX = x - totalWidth;
    } else {
        // center
        const totalWidth = ctx.measureText(text).width;
        currentX = x - totalWidth / 2;
    }

    // Draw each part
    parts.forEach(part => {
        if (part.isURL) {
            // Draw URL in blue with underline
            ctx.fillStyle = '#2196f3';
            ctx.fillText(part.text, currentX, y);

            // Draw underline
            const urlWidth = ctx.measureText(part.text).width;
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(currentX, y + URL_UNDERLINE_OFFSET);
            ctx.lineTo(currentX + urlWidth, y + URL_UNDERLINE_OFFSET);
            ctx.stroke();

            currentX += urlWidth;
            ctx.fillStyle = '#333'; // Reset to default color
        } else {
            // Draw normal text
            ctx.fillStyle = '#333';
            ctx.fillText(part.text, currentX, y);
            currentX += ctx.measureText(part.text).width;
        }
    });

    // Restore original textAlign
    ctx.textAlign = savedTextAlign;
}

function drawNodeText(node, centerX, centerY, maxWidth) {
    const isEditing = node === editingNode;
    const displayText = node.text || (isEditing ? '' : '');
    const textAlign = node.textAlign || 'center';

    ctx.fillStyle = '#333';
    ctx.font = `${FONT_SIZE}px ${currentFontFamily}`;
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
        // Rectangle, text, and code nodes
        ctx.beginPath();
        ctx.rect(node.x, node.y, node.width, node.height);
        ctx.clip();
    }

    // Calculate text x position based on alignment (with padding for left/right)
    let textX;
    if (textAlign === 'left') {
        textX = centerX - maxWidth / 2 + TEXT_PADDING;
    } else if (textAlign === 'right') {
        textX = centerX + maxWidth / 2 - TEXT_PADDING;
    } else {
        textX = centerX;
    }

    // Split by newlines first, then wrap each line
    // Track character positions for cursor placement
    const paragraphs = displayText.split('\n');
    const lines = [];
    const lineCharStarts = []; // Start character index for each wrapped line

    let charIndex = 0; // Current character index in original text

    for (let paragraph of paragraphs) {
        if (paragraph === '') {
            // Empty line (newline)
            lineCharStarts.push(charIndex);
            lines.push('');
            charIndex++; // Account for the newline character
            continue;
        }

        // Word wrapping for this paragraph
        const words = paragraph.split(' ');
        let currentLine = '';
        let currentLineStartChar = charIndex;

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                // Current line is full, push it
                lineCharStarts.push(currentLineStartChar);
                lines.push(currentLine);
                currentLineStartChar = charIndex + currentLine.length + 1; // +1 for space
                currentLine = word;

                // Check if the single word itself is too long
                if (ctx.measureText(word).width > maxWidth) {
                    // Break the word into chunks
                    let tempWord = '';
                    for (let char of word) {
                        const testWord = tempWord + char;
                        if (ctx.measureText(testWord).width > maxWidth && tempWord) {
                            lineCharStarts.push(currentLineStartChar);
                            lines.push(tempWord);
                            currentLineStartChar += tempWord.length;
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
        if (currentLine) {
            lineCharStarts.push(currentLineStartChar);
            lines.push(currentLine);
        }
        charIndex += paragraph.length + 1; // +1 for newline
    }

    const startY = centerY - (lines.length - 1) * LINE_HEIGHT / 2;

    // Draw selection highlight if text is selected
    if (isEditing && selectionStart !== null && selectionEnd !== null) {
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);

        ctx.fillStyle = TEXT_SELECTION_COLOR;

        for (let i = 0; i < lines.length; i++) {
            const lineStart = lineCharStarts[i];
            const lineEnd = lineStart + lines[i].length;

            // Check if this line contains any part of the selection
            if (end >= lineStart && start <= lineEnd) {
                const selStart = Math.max(0, start - lineStart);
                const selEnd = Math.min(lines[i].length, end - lineStart);

                const lineY = startY + i * LINE_HEIGHT;
                const beforeSelection = lines[i].substring(0, selStart);
                const selectedText = lines[i].substring(selStart, selEnd);

                // Calculate selection rectangle dimensions based on alignment
                let selectionX, selectionWidth;
                const beforeWidth = ctx.measureText(beforeSelection).width;
                const selectionTextWidth = ctx.measureText(selectedText).width;

                if (textAlign === 'left') {
                    selectionX = textX + beforeWidth;
                    selectionWidth = selectionTextWidth;
                } else if (textAlign === 'right') {
                    const fullLineWidth = ctx.measureText(lines[i]).width;
                    selectionX = textX - fullLineWidth + beforeWidth;
                    selectionWidth = selectionTextWidth;
                } else {
                    // Center alignment
                    const fullLineWidth = ctx.measureText(lines[i]).width;
                    selectionX = textX - fullLineWidth / 2 + beforeWidth;
                    selectionWidth = selectionTextWidth;
                }

                // Draw selection background
                ctx.fillRect(selectionX, lineY - CURSOR_HEIGHT, selectionWidth, CURSOR_HEIGHT * 2);
            }
        }

        // Reset fill style for text
        ctx.fillStyle = '#333';
    }

    // Draw text with URL highlighting (only when not editing)
    lines.forEach((line, i) => {
        const lineY = startY + i * LINE_HEIGHT;
        if (isEditing) {
            // Plain text when editing
            ctx.fillText(line, textX, lineY);
        } else {
            // Highlight URLs when viewing
            drawTextWithURLHighlight(line, textX, lineY, textAlign);
        }
    });

    // Draw cursor if editing - place at cursor position (with blinking)
    if (isEditing && cursorVisible) {
        // Find which wrapped line contains the cursor
        let cursorLine = 0;
        let cursorPosInLine = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineStart = lineCharStarts[i];
            const lineEnd = lineStart + lines[i].length;

            if (cursorPosition >= lineStart && cursorPosition <= lineEnd) {
                cursorLine = i;
                cursorPosInLine = cursorPosition - lineStart;
                break;
            }
        }

        // Handle cursor at very end of text
        if (cursorPosition >= displayText.length && lines.length > 0) {
            cursorLine = lines.length - 1;
            cursorPosInLine = lines[cursorLine].length;
        }

        const cursorLineY = startY + cursorLine * LINE_HEIGHT;
        const lineUpToCursor = lines[cursorLine] ? lines[cursorLine].substring(0, cursorPosInLine) : '';

        // Calculate cursor position based on alignment
        let cursorX;
        if (textAlign === 'left') {
            cursorX = textX + ctx.measureText(lineUpToCursor).width;
        } else if (textAlign === 'right') {
            const fullLineWidth = ctx.measureText(lines[cursorLine] || '').width;
            cursorX = textX - fullLineWidth + ctx.measureText(lineUpToCursor).width;
        } else {
            const fullLineWidth = ctx.measureText(lines[cursorLine] || '').width;
            cursorX = textX - fullLineWidth / 2 + ctx.measureText(lineUpToCursor).width;
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = SELECTED_BORDER_WIDTH;
        ctx.beginPath();
        ctx.moveTo(cursorX + CURSOR_X_OFFSET_NORMAL, cursorLineY - CURSOR_HEIGHT);
        ctx.lineTo(cursorX + CURSOR_X_OFFSET_NORMAL, cursorLineY + CURSOR_HEIGHT);
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
    ctx.strokeStyle = isSelected ? '#2196f3' : DEFAULT_COLOR;
    ctx.fillStyle = isSelected ? '#2196f3' : DEFAULT_COLOR;
    ctx.lineWidth = isSelected ? 3 : 2;

    // Always draw the full line to the node border
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead on top if directed
    if (directed) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headWidth = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - ARROWHEAD_LENGTH * Math.cos(angle - headWidth),
            y2 - ARROWHEAD_LENGTH * Math.sin(angle - headWidth)
        );
        ctx.lineTo(
            x2 - ARROWHEAD_LENGTH * Math.cos(angle + headWidth),
            y2 - ARROWHEAD_LENGTH * Math.sin(angle + headWidth)
        );
        ctx.closePath();
        ctx.fill();
    }
}

function getNodeEdgePoint(fromX, fromY, toNode) {
    // Defensive check for null/undefined nodes
    if (!toNode) {
        console.warn('getNodeEdgePoint called with null/undefined toNode');
        return { x: fromX, y: fromY };
    }

    const nodeCenter = getNodeCenter(toNode);
    const dx = nodeCenter.x - fromX;
    const dy = nodeCenter.y - fromY;

    // Handle the case where from point is at the node center
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        return nodeCenter;
    }

    switch (toNode.type) {
        case 'circle':
            // Point on circle circumference along the line from fromX,fromY to center
            const angle = Math.atan2(dy, dx);
            return {
                x: nodeCenter.x - Math.cos(angle) * toNode.radius,
                y: nodeCenter.y - Math.sin(angle) * toNode.radius
            };

        case 'diamond':
            // Intersection with diamond edges
            const centerX = nodeCenter.x;
            const centerY = nodeCenter.y;

            // Diamond has 4 edges, find which one the line intersects
            const edges = [
                // Top-right edge
                { x1: centerX, y1: toNode.y, x2: toNode.x + toNode.width, y2: centerY },
                // Bottom-right edge
                { x1: toNode.x + toNode.width, y1: centerY, x2: centerX, y2: toNode.y + toNode.height },
                // Bottom-left edge
                { x1: centerX, y1: toNode.y + toNode.height, x2: toNode.x, y2: centerY },
                // Top-left edge
                { x1: toNode.x, y1: centerY, x2: centerX, y2: toNode.y }
            ];

            // Find intersection with line from (fromX, fromY) to center
            for (let edge of edges) {
                const intersect = lineIntersection(fromX, fromY, centerX, centerY,
                                                  edge.x1, edge.y1, edge.x2, edge.y2);
                if (intersect) return intersect;
            }
            return nodeCenter;

        case 'table':
            // Calculate table dimensions
            const tableWidth = getTotalWidth(toNode);
            const tableHeight = getTotalHeight(toNode);
            const tableLeft = toNode.x;
            const tableRight = toNode.x + tableWidth;
            const tableTop = toNode.y;
            const tableBottom = toNode.y + tableHeight;

            // Calculate intersections with all four edges
            const tableIntersections = [];

            // Left edge
            if (dx !== 0) {
                const t = (tableLeft - fromX) / dx;
                const y = fromY + t * dy;
                if (t > 0 && y >= tableTop && y <= tableBottom) {
                    tableIntersections.push({ x: tableLeft, y: y, t: t });
                }
            }

            // Right edge
            if (dx !== 0) {
                const t = (tableRight - fromX) / dx;
                const y = fromY + t * dy;
                if (t > 0 && y >= tableTop && y <= tableBottom) {
                    tableIntersections.push({ x: tableRight, y: y, t: t });
                }
            }

            // Top edge
            if (dy !== 0) {
                const t = (tableTop - fromY) / dy;
                const x = fromX + t * dx;
                if (t > 0 && x >= tableLeft && x <= tableRight) {
                    tableIntersections.push({ x: x, y: tableTop, t: t });
                }
            }

            // Bottom edge
            if (dy !== 0) {
                const t = (tableBottom - fromY) / dy;
                const x = fromX + t * dx;
                if (t > 0 && x >= tableLeft && x <= tableRight) {
                    tableIntersections.push({ x: x, y: tableBottom, t: t });
                }
            }

            // Return the intersection with the smallest t (closest to fromX,fromY)
            if (tableIntersections.length > 0) {
                tableIntersections.sort((a, b) => a.t - b.t);
                return { x: tableIntersections[0].x, y: tableIntersections[0].y };
            }
            return nodeCenter;

        case 'text':
        case 'code':
        case 'rectangle':
        default:
            // Find intersection of line from (fromX, fromY) to center with rectangle edges
            const left = toNode.x;
            const right = toNode.x + toNode.width;
            const top = toNode.y;
            const bottom = toNode.y + toNode.height;

            // Calculate intersections with all four edges
            const intersections = [];

            // Left edge
            if (dx !== 0) {
                const t = (left - fromX) / dx;
                const y = fromY + t * dy;
                if (t > 0 && y >= top && y <= bottom) {
                    intersections.push({ x: left, y: y, t: t });
                }
            }

            // Right edge
            if (dx !== 0) {
                const t = (right - fromX) / dx;
                const y = fromY + t * dy;
                if (t > 0 && y >= top && y <= bottom) {
                    intersections.push({ x: right, y: y, t: t });
                }
            }

            // Top edge
            if (dy !== 0) {
                const t = (top - fromY) / dy;
                const x = fromX + t * dx;
                if (t > 0 && x >= left && x <= right) {
                    intersections.push({ x: x, y: top, t: t });
                }
            }

            // Bottom edge
            if (dy !== 0) {
                const t = (bottom - fromY) / dy;
                const x = fromX + t * dx;
                if (t > 0 && x >= left && x <= right) {
                    intersections.push({ x: x, y: bottom, t: t });
                }
            }

            // Return the closest intersection to fromX, fromY
            if (intersections.length > 0) {
                intersections.sort((a, b) => a.t - b.t);
                return { x: intersections[0].x, y: intersections[0].y };
            }

            return nodeCenter;
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
    // Defensive check for null/undefined nodes
    if (!node) {
        console.warn('getNodeCenter called with null/undefined node');
        return { x: 0, y: 0 };
    }

    if (node.type === 'circle') {
        return { x: node.x, y: node.y };
    } else if (node.type === 'table') {
        const totalWidth = getTotalWidth(node);
        const totalHeight = getTotalHeight(node);
        return {
            x: node.x + totalWidth / 2,
            y: node.y + totalHeight / 2
        };
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

    // Defensive check: skip if either node is missing (could happen during deletion)
    if (!fromNode || !toNode) {
        console.warn(`Connection ${conn.id} references missing nodes (from: ${conn.fromId}, to: ${conn.toId})`);
        return;
    }

    const fromCenter = getNodeCenter(fromNode);
    const toCenter = getNodeCenter(toNode);

    // Calculate edge points on both nodes
    const startPoint = getNodeEdgePoint(toCenter.x, toCenter.y, fromNode);
    const endPoint = getNodeEdgePoint(fromCenter.x, fromCenter.y, toNode);

    const isSelected = conn === selectedConnection;
    drawArrow(startPoint.x, startPoint.y, endPoint.x, endPoint.y, conn.directed, isSelected);
}

// Group rendering functions
/**
 * Calculate bounding box for a group of nodes
 * @param {Array} nodeIds - Array of node IDs in the group
 * @returns {Object} Bounding box {minX, minY, maxX, maxY} or null if no valid nodes
 */
function getGroupBoundingBox(nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (let nodeId of nodeIds) {
        const node = nodeMap.get(nodeId);
        if (!node) continue; // Skip deleted nodes

        let nodeMinX, nodeMinY, nodeMaxX, nodeMaxY;

        switch (node.type) {
            case 'circle':
                nodeMinX = node.x - node.radius;
                nodeMinY = node.y - node.radius;
                nodeMaxX = node.x + node.radius;
                nodeMaxY = node.y + node.radius;
                break;
            case 'table':
                nodeMinX = node.x;
                nodeMinY = node.y;
                nodeMaxX = node.x + getTotalWidth(node);
                nodeMaxY = node.y + getTotalHeight(node);
                break;
            default:
                // Rectangle, diamond, text, code
                nodeMinX = node.x;
                nodeMinY = node.y;
                nodeMaxX = node.x + node.width;
                nodeMaxY = node.y + node.height;
                break;
        }

        minX = Math.min(minX, nodeMinX);
        minY = Math.min(minY, nodeMinY);
        maxX = Math.max(maxX, nodeMaxX);
        maxY = Math.max(maxY, nodeMaxY);
    }

    // Return null if no valid nodes were found
    if (minX === Infinity) return null;

    return { minX, minY, maxX, maxY };
}

/**
 * Draw a group border and label
 * @param {Object} group - Group object {id, name, nodeIds}
 */
function drawGroup(group) {
    const bbox = getGroupBoundingBox(group.nodeIds);
    if (!bbox) return; // No valid nodes in group

    const x = bbox.minX - GROUP_PADDING;
    const y = bbox.minY - GROUP_PADDING;
    const width = bbox.maxX - bbox.minX + 2 * GROUP_PADDING;
    const height = bbox.maxY - bbox.minY + 2 * GROUP_PADDING;

    // Draw dashed border
    ctx.strokeStyle = NODE_BORDER_COLOR; // Light grey color like node borders
    ctx.lineWidth = SELECTED_BORDER_WIDTH;
    ctx.setLineDash([8, 4]); // Dashed pattern
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]); // Reset dash pattern

    // Draw group name label at top-left corner
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = NODE_BORDER_COLOR;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(group.name, x + TEXT_PADDING, y - CELL_PADDING);
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom transform
    ctx.save();

    try {
        ctx.scale(zoom, zoom);

        // Draw connections first (behind nodes)
        connections.forEach(conn => drawConnection(conn));

        // Draw connection preview
        if (connectionMode && connectionStart && hoveredNode) {
            const startCenter = getNodeCenter(connectionStart);
            const endCenter = getNodeCenter(hoveredNode);

            const startPoint = getNodeEdgePoint(endCenter.x, endCenter.y, connectionStart);
            const endPoint = getNodeEdgePoint(startCenter.x, startCenter.y, hoveredNode);

            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw groups (behind nodes)
        groups.forEach(group => drawGroup(group));

        // Draw nodes
        nodes.forEach(node => drawNode(node));

        // Draw hover effect
        if (hoveredNode && !selectedNodeIds.has(hoveredNode.id) && !isDragging) {
            ctx.strokeStyle = connectionMode ? '#4caf50' : '#2196f3';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            switch (hoveredNode.type) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(hoveredNode.x, hoveredNode.y, hoveredNode.radius + HOVER_OFFSET, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'diamond':
                    const centerX = hoveredNode.x + hoveredNode.width / 2;
                    const centerY = hoveredNode.y + hoveredNode.height / 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, hoveredNode.y - HOVER_OFFSET);
                    ctx.lineTo(hoveredNode.x + hoveredNode.width + HOVER_OFFSET, centerY);
                    ctx.lineTo(centerX, hoveredNode.y + hoveredNode.height + HOVER_OFFSET);
                    ctx.lineTo(hoveredNode.x - HOVER_OFFSET, centerY);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case 'table':
                    // Table nodes use colWidths/rowHeights arrays
                    const totalWidth = getTotalWidth(hoveredNode);
                    const totalHeight = getTotalHeight(hoveredNode);
                    ctx.strokeRect(hoveredNode.x - HOVER_OFFSET, hoveredNode.y - HOVER_OFFSET,
                                  totalWidth + HOVER_OFFSET * 2, totalHeight + HOVER_OFFSET * 2);
                    break;
                default:
                    // Rectangle, text, and code
                    ctx.strokeRect(hoveredNode.x - HOVER_OFFSET, hoveredNode.y - HOVER_OFFSET,
                                  hoveredNode.width + HOVER_OFFSET * 2, hoveredNode.height + HOVER_OFFSET * 2);
                    break;
            }

            ctx.setLineDash([]);
        }
    } catch (error) {
        // Log rendering errors but don't crash the app
        console.error('Render error:', error);
    } finally {
        // Always restore transform, even if rendering fails
        ctx.restore();
    }

    // Update UI button states based on selection
    updateSubgraphButton();
}

// Helper function to get mouse coordinates accounting for zoom and scroll
function getMousePos(e) {
    // Input validation
    if (!e || typeof e !== 'object') {
        console.error('getMousePos: invalid event object');
        return { x: 0, y: 0 };
    }
    if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') {
        console.error('getMousePos: event missing clientX or clientY');
        return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom
    };
}
