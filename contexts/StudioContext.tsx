import React, { createContext, useContext, useState, useCallback } from 'react';
import { GenerationSettings } from '../types';
import { DEFAULT_SETTINGS, getModelCapabilities } from '../constants';

/**
 * StudioContext centralizes the shared studio configuration (generation
 * settings + reference images + prompt) so components can read/update it
 * without deep prop drilling from App.tsx.
 */
interface StudioContextValue {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  updateSetting: <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => void;

  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;

  referenceImages: string[];
  addReferenceImages: (urls: string[]) => void;
  removeReferenceImage: (index: number) => void;
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const updateSetting = useCallback(<K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const addReferenceImages = useCallback((urls: string[]) => {
    setReferenceImages(prev => {
      const max = getModelCapabilities(settings.model).maxReferenceImages;
      const next = [...prev];
      for (const url of urls) {
        if (next.length >= max) break;
        next.push(url);
      }
      return next;
    });
  }, [settings.model]);

  const removeReferenceImage = useCallback((index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const value: StudioContextValue = {
    settings,
    setSettings,
    updateSetting,
    prompt,
    setPrompt,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    setReferenceImages,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

export const useStudio = (): StudioContextValue => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within a StudioProvider');
  return ctx;
};
