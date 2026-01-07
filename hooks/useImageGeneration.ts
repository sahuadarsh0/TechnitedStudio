
import { useState, useRef, useEffect, useCallback } from 'react';
import { GeneratedImage, GenerationSettings, GenerationError } from '../types';
import { generateImages, editImage } from '../services/imageService';
import { playSound } from '../services/soundService';
import { loadImagesFromStorage, saveImageToStorage, clearImagesFromStorage, deleteImagesFromStorage } from '../services/storageService';

interface UseImageGenerationProps {
  settings: GenerationSettings;
}

export const useImageGeneration = ({ settings }: UseImageGenerationProps) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingCount, setPendingCount] = useState(0); // Track images pending for skeleton display
  const [error, setError] = useState<GenerationError | null>(null);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load persisted images from local storage (IndexedDB) on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const persistedImages = await loadImagesFromStorage();
        if (persistedImages && persistedImages.length > 0) {
          setImages(persistedImages);
        }
      } catch (e) {
        console.error("Failed to load image history:", e);
      }
    };
    loadImages();
  }, []);

  const parseError = (err: any): GenerationError => {
    let message = "An unexpected error occurred.";
    let code = "UNKNOWN";
    const errString = err.message || err.toString();

    if (errString.includes('Requested entity was not found') || errString.includes('404')) {
       message = "API Key not found or expired. Please reconnect.";
       code = "API_KEY_EXPIRED";
    } else if (errString.includes('403') || errString.includes('permission')) {
       message = "Access denied. Check your API Key permissions or billing.";
       code = "PERMISSION_DENIED";
    } else if (errString.includes('429') || errString.includes('quota') || errString.includes('exhausted')) {
       message = "Service quota exceeded. Please try again later.";
       code = "QUOTA_EXCEEDED";
    } else if (errString.includes('500') || errString.includes('internal')) {
       message = "Google AI service internal error. Please try again.";
       code = "SERVER_ERROR";
    } else if (errString.includes('SAFETY_BLOCK') || errString.includes('safety')) {
       message = "Generation blocked by safety filters. Please adjust your prompt.";
       code = "SAFETY_BLOCK";
    }

    return { message, code };
  };

  const stop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsGenerating(false);
        setPendingCount(0);
        setError({ message: "Generation stopped by user.", code: "ABORTED" });
    }
  };

  const generate = async (
    prompt: string, 
    referenceImages: string[] | null,
    editingImage: GeneratedImage | null,
    onSuccess: (newImages: GeneratedImage[]) => void,
    overrideSettings?: GenerationSettings
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const activeSettings = overrideSettings || settings;

    setIsGenerating(true);
    setPendingCount(activeSettings.batchSize); // Initialize pending skeletons
    playSound('start', activeSettings.enableSounds);
    setError(null);

    // Callback to process images as soon as they are generated
    const onImageGenerated = (image: GeneratedImage) => {
        saveImageToStorage(image).catch(e => console.warn("Save failed", e));
        setImages(prev => [image, ...prev]);
        setPendingCount(prev => Math.max(0, prev - 1));
    };

    try {
      let newImages: GeneratedImage[] = [];

      if (editingImage) {
        newImages = await editImage(editingImage.url, prompt, activeSettings, abortController.signal, onImageGenerated);
      } else if (activeSettings.isImageToImage && referenceImages && referenceImages.length > 0) {
        newImages = await editImage(referenceImages, prompt, activeSettings, abortController.signal, onImageGenerated);
      } else {
        newImages = await generateImages(prompt, activeSettings, abortController.signal, onImageGenerated);
      }
      
      if (abortController.signal.aborted) return;

      if (newImages.length > 0) {
        if (newImages.length < activeSettings.batchSize && !abortController.signal.aborted) {
            setError({
                message: `Generated ${newImages.length} of ${activeSettings.batchSize} requested images.`,
                code: "PARTIAL_SUCCESS"
            });
        }
        setShowSuccessFlash(true);
        playSound('success', activeSettings.enableSounds);
        setTimeout(() => setShowSuccessFlash(false), 1000);
        onSuccess(newImages);
      }
    } catch (err: any) {
      if (abortController.signal.aborted) return;
      console.error("Generation failed", err);
      const parsed = parseError(err);
      setError(parsed);
      if (parsed.code === 'API_KEY_EXPIRED') throw new Error('API_KEY_EXPIRED');
    } finally {
      if (abortControllerRef.current === abortController) {
          setIsGenerating(false);
          setPendingCount(0); // Ensure skeletons are cleared
          abortControllerRef.current = null;
      }
    }
  };

  const removeImages = useCallback((ids: string[]) => {
      // Optimistic state update with strict filtering
      setImages(currentImages => {
          const remaining = currentImages.filter(img => !ids.includes(img.id));
          return [...remaining]; // Return new array reference
      });
      // Background storage update
      deleteImagesFromStorage(ids).catch(e => console.warn("Delete storage failed", e));
  }, []);

  const clearAll = useCallback(() => {
    // Clear both state and persistent storage
    setImages([]);
    clearImagesFromStorage().catch(e => console.error("Clear storage failed", e));
  }, []);

  const clearError = () => setError(null);
  const updateImages = (newImageList: GeneratedImage[]) => setImages(newImageList);
  
  const prependImage = (image: GeneratedImage) => {
    // Persist edits added via this method
    saveImageToStorage(image).catch(e => console.warn("Save failed", e));
    setImages(prev => [image, ...prev]);
  };

  return {
    images, isGenerating, pendingCount, error, showSuccessFlash,
    generate, stop, removeImages, clearAll, clearError, updateImages, prependImage
  };
};
