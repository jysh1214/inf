// Initial canvas setup
resizeCanvas();

// Restore workspace folder name from IndexedDB
(async function restoreWorkspaceInfo() {
    try {
        const dirHandle = await getDirectoryHandle();
        if (dirHandle) {
            workspaceFolderName = dirHandle.name;
            updateFilePathDisplay();
        }
    } catch (error) {
        console.warn('Failed to restore workspace info:', error);
    }
})();

// Initial render and auto-load
document.title = `Inf - v${VERSION}`;
document.getElementById('app-title').textContent = `Inf - v${VERSION}`;
updateFilePathDisplay(); // Initialize file path display (hidden initially)
const loaded = autoLoad();
if (!loaded) {
    setStatus('Double-click to create nodes');
}
render();
