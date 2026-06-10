import { useState, useEffect, useCallback } from 'react';
import { UploadEntry, loadUploadHistory, saveUpload, removeUpload } from '../services/uploadHistoryService';

export const useUploadHistory = () => {
  const [history, setHistory] = useState<UploadEntry[]>([]);

  useEffect(() => {
    loadUploadHistory().then(setHistory).catch(console.warn);
  }, []);

  const remember = useCallback(async (dataUrl: string, name?: string) => {
    const entry = await saveUpload(dataUrl, name);
    setHistory((prev) => [entry, ...prev.filter((e) => e.dataUrl !== dataUrl)]);
    return entry;
  }, []);

  const forget = useCallback(async (id: string) => {
    await removeUpload(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { uploadHistory: history, remember, forget };
};
