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

        const tableModal = document.getElementById('table-modal');
        if (tableModal && tableModal.style.display === 'flex') {
            closeTableModal();
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
});

// Table modal state
let pendingTablePosition = null;

/**
 * Show the table size input modal
 * @param {number} x - X position for the table
 * @param {number} y - Y position for the table
 */
function showTableModal(x, y) {
    const modal = document.getElementById('table-modal');
    if (!modal) {
        console.error('Table modal not found');
        setStatus('⚠️ Error: Modal UI not loaded');
        return;
    }

    // Store the position where the table will be created
    pendingTablePosition = { x, y };

    // Reset input values to defaults
    const rowsInput = document.getElementById('table-rows');
    const colsInput = document.getElementById('table-cols');
    if (rowsInput) rowsInput.value = DEFAULT_TABLE_ROWS;
    if (colsInput) colsInput.value = DEFAULT_TABLE_COLS;

    // Show the modal
    modal.style.display = 'flex';

    // Focus the rows input
    if (rowsInput) {
        setTimeout(() => rowsInput.focus(), 100);
    }
}

/**
 * Close the table modal
 */
function closeTableModal() {
    const modal = document.getElementById('table-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingTablePosition = null;
}

/**
 * Create table with the specified size from modal inputs
 */
function createTableWithSize() {
    if (!pendingTablePosition) {
        console.error('No pending table position');
        closeTableModal();
        return;
    }

    const rowsInput = document.getElementById('table-rows');
    const colsInput = document.getElementById('table-cols');

    const rows = parseInt(rowsInput.value, 10);
    const cols = parseInt(colsInput.value, 10);

    // Validate inputs
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1 || rows > 20 || cols > 20) {
        setStatus('⚠️ Invalid table size. Rows and columns must be between 1 and 20.');
        return;
    }

    // Create the table node
    const cellWidth = DEFAULT_TABLE_CELL_WIDTH;
    const cellHeight = DEFAULT_TABLE_CELL_HEIGHT;
    const totalWidth = cols * cellWidth;
    const totalHeight = rows * cellHeight;

    // Create cell objects (similar to Text nodes but cannot be resized)
    const cells = Array(rows).fill(null).map(() =>
        Array(cols).fill(null).map(() => ({
            text: '',
            textAlign: currentTextAlign
            // subgraph can be added later via Ctrl+Click
        }))
    );

    const node = {
        id: nextId++,
        type: 'table',
        x: pendingTablePosition.x - totalWidth / 2,
        y: pendingTablePosition.y - totalHeight / 2,
        rows: rows,
        cols: cols,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        cells: cells,  // Array of cell objects, not just text
        editingCell: null,
        textAlign: currentTextAlign  // Default for new cells
    };

    nodes.push(node);
    nodeMap.set(node.id, node);
    selectedNodeIds.clear();
    selectedNodeIds.add(node.id);

    // Close modal
    closeTableModal();

    // Render and trigger auto-save
    render();
    triggerAutoSave();
    setStatus(`Created ${rows}×${cols} table`);
}

// Setup table modal overlay click handler
document.addEventListener('DOMContentLoaded', () => {
    const tableModal = document.getElementById('table-modal');
    if (tableModal) {
        const overlay = tableModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeTableModal);
        }
    }

    // Allow Enter key to confirm table creation
    const rowsInput = document.getElementById('table-rows');
    const colsInput = document.getElementById('table-cols');
    if (rowsInput && colsInput) {
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                createTableWithSize();
                e.preventDefault();
            }
        };
        rowsInput.addEventListener('keydown', handleEnter);
        colsInput.addEventListener('keydown', handleEnter);
    }
});
