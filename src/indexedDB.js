// IndexedDB for persistent FileSystemFileHandle storage

const DB_NAME = 'InfDB';
const DB_VERSION = 2;  // Incremented for directory handle store
const STORE_NAME = 'fileHandles';
const DIR_STORE_NAME = 'directoryHandle';

let db = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            if (!db.objectStoreNames.contains(DIR_STORE_NAME)) {
                db.createObjectStore(DIR_STORE_NAME);
            }
        };
    });
}

/**
 * Store a file handle in IndexedDB
 * @param {number} nodeId - Node ID
 * @param {FileSystemFileHandle} fileHandle - File handle to store
 */
async function storeFileHandle(nodeId, fileHandle) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(fileHandle, nodeId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve a file handle from IndexedDB
 * @param {number} nodeId - Node ID
 * @returns {Promise<FileSystemFileHandle|null>} File handle or null if not found
 */
async function getFileHandle(nodeId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(nodeId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete a file handle from IndexedDB
 * @param {number} nodeId - Node ID
 */
async function deleteFileHandle(nodeId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(nodeId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Verify file handle still has permission
 * @param {FileSystemFileHandle} fileHandle - File handle to check
 * @returns {Promise<boolean>} True if permission granted
 */
async function verifyPermission(fileHandle) {
    const options = { mode: 'read' };

    // Check if permission is already granted
    if ((await fileHandle.queryPermission(options)) === 'granted') {
        return true;
    }

    // Request permission
    if ((await fileHandle.requestPermission(options)) === 'granted') {
        return true;
    }

    return false;
}

/**
 * Store a directory handle in IndexedDB
 * @param {FileSystemDirectoryHandle} dirHandle - Directory handle to store
 */
async function storeDirectoryHandle(dirHandle) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DIR_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(DIR_STORE_NAME);
        const request = store.put(dirHandle, 'workspace');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve the directory handle from IndexedDB
 * @returns {Promise<FileSystemDirectoryHandle|null>} Directory handle or null
 */
async function getDirectoryHandle() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DIR_STORE_NAME], 'readonly');
        const store = transaction.objectStore(DIR_STORE_NAME);
        const request = store.get('workspace');

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Find a file in the authorized directory by filename
 * @param {string} filename - Name of file to find
 * @returns {Promise<FileSystemFileHandle|null>} File handle or null if not found
 */
async function findFileInDirectory(filename) {
    try {
        const dirHandle = await getDirectoryHandle();
        if (!dirHandle) return null;

        // Verify directory permission
        const options = { mode: 'read' };
        if ((await dirHandle.queryPermission(options)) !== 'granted') {
            if ((await dirHandle.requestPermission(options)) !== 'granted') {
                return null;
            }
        }

        // Try to get the file directly
        try {
            const fileHandle = await dirHandle.getFileHandle(filename);
            return fileHandle;
        } catch (e) {
            // File not found in directory
            return null;
        }
    } catch (error) {
        console.error('Error finding file in directory:', error);
        return null;
    }
}
