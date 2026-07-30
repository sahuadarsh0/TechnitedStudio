import { uuid } from './uuid';

const DB_NAME = 'TechnitedStudioDB';
const DB_VERSION = 4; // keep in lockstep with storageService / presetService
const STORE_UPLOADS = 'uploadHistory';

export interface UploadEntry {
  id: string;
  dataUrl: string;   // full-resolution reference (base64 data URL)
  thumbnail: string; // small preview (base64 data URL)
  name: string;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('promptHistory')) db.createObjectStore('promptHistory', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('directorPresets')) db.createObjectStore('directorPresets', { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) db.createObjectStore(STORE_UPLOADS, { keyPath: 'id' });
      // v4 stores — every opener must be able to create these, because
      // whichever service opens the DB first runs the upgrade transaction.
      if (!db.objectStoreNames.contains('imageBlobs')) db.createObjectStore('imageBlobs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' });
    };
  });
};

const MAX_UPLOADS = 40;

/** Generate a small JPEG thumbnail data URL from a source image data URL. */
export const generateThumbnail = (dataUrl: string, max = 200): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

export const loadUploadHistory = async (): Promise<UploadEntry[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_UPLOADS, 'readonly');
    const request = tx.objectStore(STORE_UPLOADS).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as UploadEntry[]).sort((a, b) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Upload history load error:', e);
    return [];
  }
};

export const saveUpload = async (dataUrl: string, name = 'reference'): Promise<UploadEntry> => {
  const thumbnail = await generateThumbnail(dataUrl);
  const entry: UploadEntry = { id: uuid(), dataUrl, thumbnail, name, timestamp: Date.now() };
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_UPLOADS, 'readwrite');
    tx.objectStore(STORE_UPLOADS).put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    // Trim
    const all = await loadUploadHistory();
    if (all.length > MAX_UPLOADS) {
      const db2 = await openDB();
      const tx2 = db2.transaction(STORE_UPLOADS, 'readwrite');
      all.slice(MAX_UPLOADS).forEach((e) => tx2.objectStore(STORE_UPLOADS).delete(e.id));
    }
  } catch (e) {
    console.error('Upload save error:', e);
  }
  return entry;
};

export const removeUpload = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_UPLOADS, 'readwrite');
    tx.objectStore(STORE_UPLOADS).delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Upload delete error:', e);
  }
};
