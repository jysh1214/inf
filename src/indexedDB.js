// IndexedDB for persistent FileSystemFileHandle storage

const DB_NAME = 'InfDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';

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
