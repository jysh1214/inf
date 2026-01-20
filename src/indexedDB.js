// IndexedDB for persistent FileSystemFileHandle storage

const DB_NAME = 'InfDB';
const DB_VERSION = 2;  // Incremented for directory handle store
const STORE_NAME = 'fileHandles';
const DIR_STORE_NAME = 'directoryHandle';

let db = null;
let dbPromise = null;
let dbInitFailed = false;
let dbInitFailedTimer = null;

/**
 * Initialize IndexedDB
 * Uses singleton promise to prevent race conditions
 */
async function initDB() {
    // If already initialized, return existing db
    if (db) return db;

    // If initialization failed recently, return null to prevent rapid retries
    if (dbInitFailed) {
        return null;
    }

    // If initialization in progress, wait for it
    if (dbPromise) return dbPromise;

    // Start new initialization
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            dbInitFailed = false; // Clear failure flag on success
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;

            try {
                // Create file handles store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }

                // Create directory handle store if it doesn't exist
                if (!db.objectStoreNames.contains(DIR_STORE_NAME)) {
                    db.createObjectStore(DIR_STORE_NAME);
                }

                // Validate that stores were created successfully
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    throw new Error(`Failed to create object store: ${STORE_NAME}`);
                }
                if (!db.objectStoreNames.contains(DIR_STORE_NAME)) {
                    throw new Error(`Failed to create object store: ${DIR_STORE_NAME}`);
                }
            } catch (error) {
                console.error('IndexedDB upgrade error:', error);
                // Transaction will be aborted automatically on error
                transaction.abort();
            }

            // Add transaction complete handler for validation
            transaction.oncomplete = () => {
                console.log('IndexedDB upgrade completed successfully');
            };

            transaction.onerror = () => {
                console.error('IndexedDB upgrade transaction failed:', transaction.error);
            };

            transaction.onabort = () => {
                console.error('IndexedDB upgrade transaction aborted');
            };
        };
    });

    try {
        db = await dbPromise;
        return db;
    } catch (error) {
        dbPromise = null; // Reset on failure so retry is possible
        dbInitFailed = true; // Set failure flag

        // Clear failure flag after 2 seconds to allow retry
        if (dbInitFailedTimer) clearTimeout(dbInitFailedTimer);
        dbInitFailedTimer = setTimeout(() => {
            dbInitFailed = false;
            dbInitFailedTimer = null;
        }, 2000);

        throw error;
    }
}

/**
 * Store a file handle in IndexedDB
 * @param {number} nodeId - Node ID
 * @param {FileSystemFileHandle} fileHandle - File handle to store
 */
async function storeFileHandle(nodeId, fileHandle) {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(fileHandle, nodeId);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                if (request.error.name === 'QuotaExceededError') {
                    reject(new Error('Storage quota exceeded. Consider clearing old file handles.'));
                } else {
                    reject(request.error);
                }
            };
        });
    } catch (error) {
        console.error('Failed to store file handle:', error);
        throw error;
    }
}

/**
 * Retrieve a file handle from IndexedDB
 * @param {number} nodeId - Node ID
 * @returns {Promise<FileSystemFileHandle|null>} File handle or null if not found
 */
async function getFileHandle(nodeId) {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(nodeId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to retrieve file handle:', error);
        return null; // Return null on error to allow fallback to file picker
    }
}

/**
 * Delete a file handle from IndexedDB
 * @param {number} nodeId - Node ID
 */
async function deleteFileHandle(nodeId) {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(nodeId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`Failed to delete file handle for node ${nodeId}:`, error);
        // Don't throw - deletion failure shouldn't break the app
    }
}

/**
 * Verify file handle still has permission
 * @param {FileSystemFileHandle} fileHandle - File handle to check
 * @returns {Promise<boolean>} True if permission granted
 */
async function verifyPermission(fileHandle) {
    try {
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
    } catch (error) {
        console.error('Permission verification failed:', error);
        return false;
    }
}

/**
 * Store a directory handle in IndexedDB
 * @param {FileSystemDirectoryHandle} dirHandle - Directory handle to store
 */
async function storeDirectoryHandle(dirHandle) {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DIR_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(DIR_STORE_NAME);
            const request = store.put(dirHandle, 'workspace');

            request.onsuccess = () => resolve();
            request.onerror = () => {
                if (request.error.name === 'QuotaExceededError') {
                    reject(new Error('Storage quota exceeded.'));
                } else {
                    reject(request.error);
                }
            };
        });
    } catch (error) {
        console.error('Failed to store directory handle:', error);
        throw error;
    }
}

/**
 * Retrieve the directory handle from IndexedDB
 * @returns {Promise<FileSystemDirectoryHandle|null>} Directory handle or null
 */
async function getDirectoryHandle() {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DIR_STORE_NAME], 'readonly');
            const store = transaction.objectStore(DIR_STORE_NAME);
            const request = store.get('workspace');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to retrieve directory handle:', error);
        return null; // Return null on error to allow fallback
    }
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

/**
 * Clear all file handles from IndexedDB
 * Used when resetting workspace folder
 */
async function clearAllFileHandles() {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('Cleared all file handles from IndexedDB');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to clear file handles:', error);
        // Don't throw - clearing failure shouldn't break the app
    }
}
