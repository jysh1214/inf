// UI Components and Interactions

// Subgraph modal state
let subgraphModalResolve = null;

/**
 * Show the subgraph type selection modal
 * @param {boolean} hasWorkspace - Whether a workspace folder is set
 * Returns a Promise that resolves with 'embedded', 'new-file', 'existing-file', or null (cancelled)
 */
function showSubgraphModal(hasWorkspace = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('subgraph-modal');
        if (!modal) {
            console.error('Subgraph modal not found');
            setStatus('⚠️ Error: Modal UI not loaded');
            resolve(null);
            return;
        }

        // Show/hide workspace warning based on whether workspace is set
        const warning = document.getElementById('workspace-warning');
        const newFileOption = document.getElementById('new-file-option');
        const existingFileOption = document.getElementById('existing-file-option');

        if (warning) {
            warning.style.display = hasWorkspace ? 'none' : 'block';
        }

        // Disable file-based options if no workspace
        if (newFileOption) {
            if (hasWorkspace) {
                newFileOption.classList.remove('disabled');
            } else {
                newFileOption.classList.add('disabled');
            }
        }

        if (existingFileOption) {
            if (hasWorkspace) {
                existingFileOption.classList.remove('disabled');
            } else {
                existingFileOption.classList.add('disabled');
            }
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
 * @param {string} type - Either 'embedded', 'new-file', or 'existing-file'
 */
function selectSubgraphType(type) {
    // Check if file-based options are disabled
    if (type === 'new-file' || type === 'existing-file') {
        const option = document.getElementById(type === 'new-file' ? 'new-file-option' : 'existing-file-option');
        if (option && option.classList.contains('disabled')) {
            // Don't allow selection of disabled options
            return;
        }
    }

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
            e.stopImmediatePropagation();
        }
    }
});
