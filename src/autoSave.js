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

// Auto-save removed - use manual save (Ctrl+S)
function triggerAutoSave() {
    // No-op: Auto-save functionality removed
}

// Initialize canvas size (scales with zoom to maintain full visible area)
function resizeCanvas() {
    canvas.width = canvasWidth * zoom;
    canvas.height = canvasHeight * zoom;
    render();
}
