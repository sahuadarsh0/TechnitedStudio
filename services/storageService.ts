
import { GeneratedImage, Folder } from '../types';
import { buildThumbnail, measureDataUrl, dataUrlByteSize } from './thumbnailService';

const DB_NAME = 'TechnitedStudioDB';
const STORE_NAME = 'images';
const STORE_BLOBS = 'imageBlobs';
const STORE_FOLDERS = 'folders';

/**
 * DB_VERSION history:
 *   v2 added presets + prompt history
 *   v3 added uploadHistory
 *   v4 splits full-resolution pixels into `imageBlobs` and adds `folders`
 *
 * The v4 split is the core of the load-time fix. Previously every record in
 * `images` embedded a full 4K base64 data URL, so `getAll()` on startup
 * deserialised tens of megabytes before the first paint. Now `images` holds
 * only lightweight metadata plus a small thumbnail, and the heavy pixels sit in
 * a separate store fetched by key only when actually needed.
 */
export const DB_VERSION = 4;

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
            if (!db.objectStoreNames.contains('promptHistory')) {
                db.createObjectStore('promptHistory', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('directorPresets')) {
                db.createObjectStore('directorPresets', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('uploadHistory')) {
                db.createObjectStore('uploadHistory', { keyPath: 'id' });
            }
            // v4 stores
            if (!db.objectStoreNames.contains(STORE_BLOBS)) {
                db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
                db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
            }
        };
    });
};

const txDone = (tx: IDBTransaction): Promise<void> =>
    new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });

const reqDone = <T,>(req: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

// ─── Images ──────────────────────────────────────────────────────────────────

/**
 * Persists an image, splitting the heavy pixels away from the metadata.
 * A thumbnail is generated if the caller has not already supplied one.
 */
export const saveImageToStorage = async (image: GeneratedImage): Promise<void> => {
    try {
        if (!image.url) return; // nothing to persist for placeholders

        const thumbnail = image.thumbnail || (await buildThumbnail(image.url));
        let { width, height } = image;
        if (!width || !height) {
            const dims = await measureDataUrl(image.url);
            width = dims.width;
            height = dims.height;
        }

        const meta: GeneratedImage = {
            ...image,
            url: '',            // full pixels live in STORE_BLOBS
            hasBlob: true,
            thumbnail,
            width,
            height,
            byteSize: image.byteSize || dataUrlByteSize(image.url),
        };

        const db = await openDB();
        const tx = db.transaction([STORE_NAME, STORE_BLOBS], 'readwrite');
        tx.objectStore(STORE_NAME).put(meta);
        tx.objectStore(STORE_BLOBS).put({ id: image.id, url: image.url });
        await txDone(tx);
    } catch (error) {
        console.error("Storage Save Error:", error);
    }
};

/**
 * Metadata-only update. Writes to the `images` store WITHOUT touching the
 * blob store, so flags like `favorite` or `folderId` can be flipped without
 * risking the full-resolution pixels being overwritten by an empty `url`.
 */
export const patchImageMeta = async (image: GeneratedImage): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const existing = await reqDone(store.get(image.id) as IDBRequest<GeneratedImage | undefined>);
        const merged: GeneratedImage = {
            ...(existing || {}),
            ...image,
            // Preserve the storage contract: metadata rows never carry pixels.
            url: '',
            hasBlob: existing?.hasBlob ?? image.hasBlob,
            thumbnail: image.thumbnail || existing?.thumbnail || '',
        };
        store.put(merged);
        await txDone(tx);
    } catch (error) {
        console.warn("Metadata patch failed:", error);
    }
};

/**
 * Loads gallery metadata only — thumbnails included, full pixels excluded.
 * This is what makes startup cheap.
 */
export const loadImagesFromStorage = async (): Promise<GeneratedImage[]> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const results = await reqDone(tx.objectStore(STORE_NAME).getAll() as IDBRequest<GeneratedImage[]>);
        results.sort((a, b) => b.timestamp - a.timestamp);

        // Legacy v3 records still embed the full data URL. Keep them working by
        // deriving a thumbnail on the fly, and note that they need migrating.
        return results.map((img) => {
            if (img.url && !img.thumbnail) {
                return { ...img, thumbnail: '', hasBlob: false };
            }
            return img;
        });
    } catch (error) {
        console.error("Storage Load Error:", error);
        return [];
    }
};

/** Fetches the full-resolution data URL for one image, on demand. */
export const loadFullImage = async (id: string): Promise<string | undefined> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_BLOBS, 'readonly');
        const rec = await reqDone(
            tx.objectStore(STORE_BLOBS).get(id) as IDBRequest<{ id: string; url: string } | undefined>
        );
        return rec?.url;
    } catch (error) {
        console.warn("Full image load failed:", error);
        return undefined;
    }
};

/**
 * Returns a usable full-resolution src for an image, pulling from IndexedDB
 * only when the in-memory record does not already carry one.
 */
export const resolveFullImage = async (image: GeneratedImage): Promise<string> => {
    if (image.url) return image.url;
    if (image.hasBlob) {
        const full = await loadFullImage(image.id);
        if (full) return full;
    }
    return image.thumbnail || '';
};

/**
 * One-time migration of legacy v3 records: moves any embedded full-resolution
 * data URL into the blob store and backfills thumbnail + dimensions.
 * Runs in small chunks so it never blocks the UI thread for long.
 */
export const migrateLegacyImages = async (
    onProgress?: (done: number, total: number) => void
): Promise<number> => {
    try {
        const db = await openDB();
        const all = await reqDone(
            db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll() as IDBRequest<GeneratedImage[]>
        );
        const legacy = all.filter((img) => img.url && !img.hasBlob);
        if (legacy.length === 0) return 0;

        let done = 0;
        for (const img of legacy) {
            await saveImageToStorage(img);
            done += 1;
            onProgress?.(done, legacy.length);
            // Yield to the event loop between records.
            await new Promise((r) => setTimeout(r, 0));
        }
        return done;
    } catch (error) {
        console.warn("Legacy migration failed:", error);
        return 0;
    }
};

export const deleteImagesFromStorage = async (ids: string[]): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction([STORE_NAME, STORE_BLOBS], 'readwrite');
        const meta = tx.objectStore(STORE_NAME);
        const blobs = tx.objectStore(STORE_BLOBS);
        ids.forEach(id => {
            meta.delete(id);
            blobs.delete(id);
        });
        await txDone(tx);
    } catch (error) {
        console.error("Storage Delete Error:", error);
    }
};

export const clearImagesFromStorage = async (): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction([STORE_NAME, STORE_BLOBS], 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.objectStore(STORE_BLOBS).clear();
        await txDone(tx);
    } catch (error) {
        console.error("Storage Clear Error:", error);
    }
};

/** Reassigns a batch of images to a folder (or to Unsorted when null). */
export const setImagesFolder = async (ids: string[], folderId: string | null): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const id of ids) {
            const rec = await reqDone(store.get(id) as IDBRequest<GeneratedImage | undefined>);
            if (!rec) continue;
            if (folderId) rec.folderId = folderId;
            else delete rec.folderId;
            store.put(rec);
        }
        await txDone(tx);
    } catch (error) {
        console.warn("Folder assign failed:", error);
    }
};

/** Rough storage footprint, for the UI. */
export const getStorageStats = async (): Promise<{ count: number; bytes: number }> => {
    try {
        const db = await openDB();
        const all = await reqDone(
            db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll() as IDBRequest<GeneratedImage[]>
        );
        return {
            count: all.length,
            bytes: all.reduce((sum, img) => sum + (img.byteSize || 0), 0),
        };
    } catch {
        return { count: 0, bytes: 0 };
    }
};

// ─── Folders ─────────────────────────────────────────────────────────────────

export const loadFolders = async (): Promise<Folder[]> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_FOLDERS, 'readonly');
        const all = await reqDone(tx.objectStore(STORE_FOLDERS).getAll() as IDBRequest<Folder[]>);
        return all.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.warn("Folder load failed:", error);
        return [];
    }
};

export const saveFolder = async (folder: Folder): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_FOLDERS, 'readwrite');
        tx.objectStore(STORE_FOLDERS).put(folder);
        await txDone(tx);
    } catch (error) {
        console.warn("Folder save failed:", error);
    }
};

export const deleteFolder = async (id: string): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_FOLDERS, 'readwrite');
        tx.objectStore(STORE_FOLDERS).delete(id);
        await txDone(tx);
    } catch (error) {
        console.warn("Folder delete failed:", error);
    }
};
