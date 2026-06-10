import { CinematicSettings, GenerationSettings } from '../types';
import { uuid } from './uuid';

const DB_NAME = 'TechnitedStudioDB';
const DB_VERSION = 3; // keep in lockstep with storageService / uploadHistoryService
const STORE_IMAGES = 'images';
const STORE_PROMPTS = 'promptHistory';
const STORE_PRESETS = 'directorPresets';

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  timestamp: number;
}

export interface DirectorPreset {
  id: string;
  name: string;
  cinematic: CinematicSettings;
  aspectRatio?: GenerationSettings['aspectRatio'];
  resolution?: GenerationSettings['resolution'];
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
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROMPTS)) {
        db.createObjectStore(STORE_PROMPTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PRESETS)) {
        db.createObjectStore(STORE_PRESETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('uploadHistory')) {
        db.createObjectStore('uploadHistory', { keyPath: 'id' });
      }
    };
  });
};

const getAll = async <T>(store: string): Promise<T[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`Storage load error (${store}):`, e);
    return [];
  }
};

const put = async (store: string, value: any): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error(`Storage put error (${store}):`, e);
  }
};

const del = async (store: string, id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error(`Storage delete error (${store}):`, e);
  }
};

// ─── Prompt History ──────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

export const loadPromptHistory = async (): Promise<PromptHistoryEntry[]> => {
  const all = await getAll<PromptHistoryEntry>(STORE_PROMPTS);
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY);
};

export const savePromptToHistory = async (prompt: string): Promise<void> => {
  const trimmed = prompt.trim();
  if (!trimmed) return;
  // De-dupe: drop any existing identical prompt so the new one floats to top.
  const all = await getAll<PromptHistoryEntry>(STORE_PROMPTS);
  const existing = all.find((e) => e.prompt === trimmed);
  if (existing) await del(STORE_PROMPTS, existing.id);
  await put(STORE_PROMPTS, { id: uuid(), prompt: trimmed, timestamp: Date.now() });

  // Trim history beyond the cap.
  const refreshed = await getAll<PromptHistoryEntry>(STORE_PROMPTS);
  if (refreshed.length > MAX_HISTORY) {
    const sorted = refreshed.sort((a, b) => b.timestamp - a.timestamp);
    await Promise.all(sorted.slice(MAX_HISTORY).map((e) => del(STORE_PROMPTS, e.id)));
  }
};

export const deletePromptHistoryEntry = (id: string): Promise<void> => del(STORE_PROMPTS, id);

// ─── Director Presets ────────────────────────────────────────────────────────

export const loadDirectorPresets = async (): Promise<DirectorPreset[]> => {
  const all = await getAll<DirectorPreset>(STORE_PRESETS);
  return all.sort((a, b) => b.timestamp - a.timestamp);
};

export const saveDirectorPreset = async (preset: Omit<DirectorPreset, 'id' | 'timestamp'>): Promise<DirectorPreset> => {
  const entry: DirectorPreset = { ...preset, id: uuid(), timestamp: Date.now() };
  await put(STORE_PRESETS, entry);
  return entry;
};

export const deleteDirectorPreset = (id: string): Promise<void> => del(STORE_PRESETS, id);
