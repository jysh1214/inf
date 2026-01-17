// UI Components and Interactions

// Subgraph modal state
let subgraphModalResolve = null;

/**
 * Show the subgraph type selection modal
 * Returns a Promise that resolves with 'embedded', 'file', or null (cancelled)
 */
function showSubgraphModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('subgraph-modal');
        if (!modal) {
            console.error('Subgraph modal not found');
            resolve(null);
            return;
        }

        // Store the resolve function so we can call it when user makes a choice
        subgraphModalResolve = resolve;

        // Show the modal
        modal.style.display = 'flex';
    });
}

/**
 * Close the subgraph modal
 */
function closeSubgraphModal() {
    const modal = document.getElementById('subgraph-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Resolve with null if user cancelled
    if (subgraphModalResolve) {
        subgraphModalResolve(null);
        subgraphModalResolve = null;
    }
}

/**
 * Handle subgraph type selection
 * @param {string} type - Either 'embedded' or 'file'
 */
function selectSubgraphType(type) {
    // Close the modal
    const modal = document.getElementById('subgraph-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Resolve the promise with the selected type
    if (subgraphModalResolve) {
        subgraphModalResolve(type);
        subgraphModalResolve = null;
    }
}

// Close modal when clicking on overlay
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('subgraph-modal');
    if (modal) {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeSubgraphModal);
        }
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('subgraph-modal');
        if (modal && modal.style.display === 'flex') {
            closeSubgraphModal();
            e.preventDefault();
            e.stopPropagation();
        }
    }
});
