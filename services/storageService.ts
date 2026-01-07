
import { GeneratedImage } from '../types';

const DB_NAME = 'TechnitedStudioDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error("IndexedDB not supported"));
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveImageToStorage = async (image: GeneratedImage): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(image);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("Storage Save Error:", error);
    }
};

export const loadImagesFromStorage = async (): Promise<GeneratedImage[]> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const results = request.result as GeneratedImage[];
                // Sort descending by timestamp (newest first)
                results.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Storage Load Error:", error);
        return [];
    }
};

export const deleteImagesFromStorage = async (ids: string[]): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        ids.forEach(id => store.delete(id));
        return new Promise((resolve, reject) => {
             tx.oncomplete = () => resolve();
             tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("Storage Delete Error:", error);
    }
};

export const clearImagesFromStorage = async (): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        return new Promise((resolve, reject) => {
             tx.oncomplete = () => resolve();
             tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("Storage Clear Error:", error);
    }
};
