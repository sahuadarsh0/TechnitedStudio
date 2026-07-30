import { useState, useEffect, useCallback } from 'react';
import { Folder } from '../types';
import { loadFolders, saveFolder, deleteFolder } from '../services/storageService';
import { uuid } from '../services/uuid';

const FOLDER_COLORS = [
  '#00f0ff', '#7000ff', '#ff2d55', '#ffb300',
  '#00e676', '#ff6d00', '#e91e63', '#3d5afe',
];

/**
 * Gallery folders: create, rename, recolour, collapse and delete.
 *
 * Collapse state is persisted with the folder so the gallery layout survives a
 * reload — the whole point of folders here is to stop the grid rendering
 * hundreds of cards at once.
 */
export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadFolders()
      .then((f) => {
        setFolders(f);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const createFolder = useCallback(async (name: string): Promise<Folder> => {
    const trimmed = name.trim() || 'New Folder';
    const folder: Folder = {
      id: uuid(),
      name: trimmed,
      color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
      collapsed: false,
      timestamp: Date.now(),
    };
    setFolders((prev) => [...prev, folder]);
    await saveFolder(folder);
    return folder;
  }, []);

  const renameFolder = useCallback(async (id: string, name: string) => {
    let updated: Folder | undefined;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        updated = { ...f, name: name.trim() || f.name };
        return updated;
      })
    );
    if (updated) await saveFolder(updated);
  }, []);

  const setFolderColor = useCallback(async (id: string, color: string) => {
    let updated: Folder | undefined;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        updated = { ...f, color };
        return updated;
      })
    );
    if (updated) await saveFolder(updated);
  }, []);

  const toggleCollapse = useCallback(async (id: string) => {
    let updated: Folder | undefined;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        updated = { ...f, collapsed: !f.collapsed };
        return updated;
      })
    );
    if (updated) await saveFolder(updated);
  }, []);

  const collapseAll = useCallback(async (collapsed: boolean) => {
    const next = folders.map((f) => ({ ...f, collapsed }));
    setFolders(next);
    await Promise.all(next.map((f) => saveFolder(f)));
  }, [folders]);

  /** Removes the folder itself. Image reassignment is handled by the caller. */
  const removeFolder = useCallback(async (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    await deleteFolder(id);
  }, []);

  return {
    folders,
    loaded,
    createFolder,
    renameFolder,
    setFolderColor,
    toggleCollapse,
    collapseAll,
    removeFolder,
    FOLDER_COLORS,
  };
};
