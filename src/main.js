// Initial canvas setup
resizeCanvas();

// Initial render and auto-load
document.title = `Inf - v${VERSION}`;
document.getElementById('app-title').textContent = `Inf - v${VERSION}`;
updateFilePathDisplay(); // Initialize file path display (hidden initially)
const loaded = autoLoad();
if (!loaded) {
    setStatus('Double-click to create nodes');
}
render();
