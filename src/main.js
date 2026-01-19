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

// Initial render and auto-load
document.title = `Inf - v${VERSION}`;
document.getElementById('app-title').textContent = `Inf - v${VERSION}`;
updateFilePathDisplay(); // Initialize file path display (hidden initially)
const loaded = autoLoad();
if (!loaded) {
    setStatus('Double-click to create nodes');
}
render();

// Restore workspace folder name from IndexedDB (only if not already set by autoLoad)
(async function restoreWorkspaceInfo() {
    try {
        // Only restore from IndexedDB if workspaceFolderName wasn't restored from localStorage
        if (!workspaceFolderName) {
            const dirHandle = await getDirectoryHandle();
            if (dirHandle) {
                workspaceFolderName = dirHandle.name;
                updateFilePathDisplay();
            }
        }
    } catch (error) {
        console.warn('Failed to restore workspace info:', error);
    }
})();
