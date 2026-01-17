// Initial canvas setup
resizeCanvas();

// Initial render and auto-load
document.title = `Inf - v${VERSION}`;
document.getElementById('app-title').textContent = `Inf - v${VERSION}`;
const loaded = autoLoad();
if (!loaded) {
    setStatus('Double-click to create nodes');
}
render();
