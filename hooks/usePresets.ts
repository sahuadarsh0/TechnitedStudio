import { useState, useEffect, useCallback } from 'react';
import {
  PromptHistoryEntry,
  DirectorPreset,
  loadPromptHistory,
  savePromptToHistory,
  deletePromptHistoryEntry,
  loadDirectorPresets,
  saveDirectorPreset,
  deleteDirectorPreset,
} from '../services/presetService';
import { CinematicSettings, GenerationSettings } from '../types';

export const usePresets = () => {
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [presets, setPresets] = useState<DirectorPreset[]>([]);

  useEffect(() => {
    loadPromptHistory().then(setPromptHistory).catch(console.warn);
    loadDirectorPresets().then(setPresets).catch(console.warn);
  }, []);

  const recordPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    await savePromptToHistory(prompt);
    setPromptHistory(await loadPromptHistory());
  }, []);

  const removePrompt = useCallback(async (id: string) => {
    await deletePromptHistoryEntry(id);
    setPromptHistory((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPreset = useCallback(
    async (name: string, cinematic: CinematicSettings, opts?: Pick<GenerationSettings, 'aspectRatio' | 'resolution'>) => {
      const created = await saveDirectorPreset({ name, cinematic, ...opts });
      setPresets((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const removePreset = useCallback(async (id: string) => {
    await deleteDirectorPreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { promptHistory, presets, recordPrompt, removePrompt, addPreset, removePreset };
};
