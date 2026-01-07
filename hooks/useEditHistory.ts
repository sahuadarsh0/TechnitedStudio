
import { useState } from 'react';
import { GeneratedImage } from '../types';

export const useEditHistory = () => {
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editHistory, setEditHistory] = useState<GeneratedImage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const startEdit = (image: GeneratedImage) => {
    setEditingImage(image);
    setEditHistory([image]);
    setHistoryIndex(0);
  };

  const addHistoryItem = (image: GeneratedImage) => {
    const nextHistory = editHistory.slice(0, historyIndex + 1);
    nextHistory.push(image);
    setEditHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setEditingImage(image);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditingImage(editHistory[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditingImage(editHistory[newIndex]);
    }
  };

  const exitEdit = () => {
    setEditingImage(null);
    setEditHistory([]);
    setHistoryIndex(-1);
  };

  return {
    editingImage,
    editHistory,
    historyIndex,
    startEdit,
    addHistoryItem,
    undo,
    redo,
    exitEdit
  };
};
