
import { useState } from 'react';
import { optimizePrompt } from '../services/geminiService';
import { playSound } from '../services/soundService';

export const usePromptOptimization = (enableSounds: boolean) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationReason, setOptimizationReason] = useState<string | null>(null);
  const [optimizationSources, setOptimizationSources] = useState<{ title: string; uri: string }[] | undefined>(undefined);

  const optimize = async (prompt: string, onOptimized: (newPrompt: string) => void) => {
    if (!prompt.trim()) return;
    
    setIsOptimizing(true);
    setOptimizationReason(null);
    setOptimizationSources(undefined);
    playSound('start', enableSounds);
    
    try {
      const result = await optimizePrompt(prompt);
      onOptimized(result.optimizedPrompt);
      setOptimizationReason(result.enhancementReasoning);
      setOptimizationSources(result.searchSources);
      playSound('success', enableSounds);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearOptimization = () => {
    setOptimizationReason(null);
    setOptimizationSources(undefined);
  };

  return {
    isOptimizing,
    optimizationReason,
    optimizationSources,
    optimize,
    clearOptimization
  };
};
