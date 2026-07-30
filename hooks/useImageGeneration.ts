
import { useState, useRef, useEffect, useCallback } from 'react';
import { GeneratedImage, GenerationSettings, GenerationError, BedrockModel, BedrockParamValues } from '../types';
import { generateImages, editImage } from '../services/imageService';
import { runBedrockService } from '../services/bedrockService';
import { playSound } from '../services/soundService';
import { parseError } from '../services/errorService';
import { uuid } from '../services/uuid';
import { finalizeImage } from '../services/imageFinalizer';
import {
  loadImagesFromStorage,
  saveImageToStorage,
  patchImageMeta,
  clearImagesFromStorage,
  deleteImagesFromStorage,
  migrateLegacyImages,
  resolveFullImage,
  setImagesFolder,
} from '../services/storageService';

interface UseImageGenerationProps {
  settings: GenerationSettings;
}

export const useImageGeneration = ({ settings }: UseImageGenerationProps) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeCount, setActiveCount] = useState(0); 
  const [error, setError] = useState<GenerationError | null>(null);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  
  // Map of ID -> AbortController to manage individual cancellations
  const activeControllers = useRef<Map<string, AbortController>>(new Map());

  // Load persisted images from local storage (IndexedDB) on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const persistedImages = await loadImagesFromStorage();
        if (persistedImages && persistedImages.length > 0) {
          setImages(persistedImages);
        }
        // Migrate any legacy v3 records (full data URL embedded in the metadata
        // row) in the background, then refresh so the grid picks up thumbnails.
        const migrated = await migrateLegacyImages();
        if (migrated > 0) {
          const refreshed = await loadImagesFromStorage();
          setImages(refreshed);
          console.info(`Migrated ${migrated} legacy image record(s) to storage v4.`);
        }
      } catch (e) {
        console.error("Failed to load image history:", e);
      }
    };
    loadImages();
  }, []);

  const stopImage = useCallback((id: string) => {
      const controller = activeControllers.current.get(id);
      if (controller) {
          controller.abort();
          activeControllers.current.delete(id);
          setActiveCount(prev => Math.max(0, prev - 1));
          
          // Remove the placeholder immediately on stop
          setImages(prev => prev.filter(img => img.id !== id));
      }
  }, []);

  const stopAll = useCallback(() => {
      activeControllers.current.forEach((controller) => {
          controller.abort();
      });
      activeControllers.current.clear();
      setActiveCount(0);
      // Remove all generating placeholders
      setImages(prev => prev.filter(img => img.status !== 'generating'));
      setError({ message: "All generations stopped.", code: "ABORTED" });
  }, []);

  const generate = async (
    prompt: string, 
    referenceImages: string[] | null,
    editingImage: GeneratedImage | null,
    onSuccess: (newImages: GeneratedImage[]) => void,
    overrideSettings?: GenerationSettings,
    targetFolderId?: string
  ) => {
    
    const activeSettings = overrideSettings || settings;
    // Force batch size 1 for the loop to manage individual controllers, 
    // unless the underlying service creates variations in one go. 
    // For this UI requirement (individual stop buttons), we treat the batch as N individual requests.
    const count = activeSettings.batchSize;
    
    playSound('start', activeSettings.enableSounds);
    setError(null);

    // Create Placeholders
    const newPlaceholders: GeneratedImage[] = [];
    for (let i = 0; i < count; i++) {
        const tempId = uuid();
        const placeholder: GeneratedImage = {
            id: tempId,
            url: '', // Empty URL for loading state
            prompt: prompt,
            timestamp: Date.now(),
            settings: activeSettings,
            status: 'generating',
            folderId: targetFolderId,
        };
        newPlaceholders.push(placeholder);
        
        // Register Controller
        const controller = new AbortController();
        activeControllers.current.set(tempId, controller);
    }

    // Add placeholders to state (prepend)
    setImages(prev => [...newPlaceholders, ...prev]);
    setActiveCount(prev => prev + count);

    // Process Requests in "Parallel" (Fire and Forget style managed by promises)
    const promises = newPlaceholders.map(async (placeholder) => {
        const controller = activeControllers.current.get(placeholder.id);
        if (!controller) return; // Already stopped

        try {
            // We use batchSize: 1 for the service call to map 1-to-1 with our placeholder
            const singleShotSettings = { ...activeSettings, batchSize: 1 };
            
            let resultImages: GeneratedImage[] = [];

            if (editingImage) {
                // Records loaded from storage carry no inline pixels, so the
                // full-resolution source must be resolved before editing.
                const editSource = await resolveFullImage(editingImage);
                resultImages = await editImage(editSource, prompt, singleShotSettings, controller.signal);
            } else if (activeSettings.isImageToImage && referenceImages && referenceImages.length > 0) {
                resultImages = await editImage(referenceImages, prompt, singleShotSettings, controller.signal);
            } else {
                resultImages = await generateImages(prompt, singleShotSettings, controller.signal);
            }

            if (controller.signal.aborted) return;

            if (resultImages && resultImages.length > 0) {
                const completedImage = resultImages[0];
                // Split the heavy pixels out before they ever reach React state.
                const { record } = await finalizeImage({
                    ...completedImage,
                    id: placeholder.id, // keep grid position stable
                    status: 'completed',
                    folderId: targetFolderId,
                });
                setImages(prev => prev.map(img => {
                    if (img.id === placeholder.id) {
                        saveImageToStorage({ ...record, url: completedImage.url }).catch(console.warn);
                        return record;
                    }
                    return img;
                }));
                
                playSound('success', activeSettings.enableSounds);
                setShowSuccessFlash(true);
                setTimeout(() => setShowSuccessFlash(false), 1000);
            } else {
                throw new Error("No image data returned");
            }

        } catch (err: any) {
            if (controller.signal.aborted) return;
            
            console.error(`Generation failed for ${placeholder.id}`, err);
            const parsed = parseError(err);
            
            if (parsed.code === 'ABORTED') {
                // User aborted: remove the placeholder cleanly.
                setImages(prev => prev.filter(img => img.id !== placeholder.id));
            } else {
                // Keep the placeholder as an error card so the user can retry.
                setImages(prev => prev.map(img => img.id === placeholder.id
                    ? { ...img, status: 'error' as const, error: parsed.message }
                    : img
                ));
                setError(parsed);
                playSound('error', activeSettings.enableSounds);
            }
            if (parsed.code === 'API_KEY_EXPIRED') throw new Error('API_KEY_EXPIRED');
        } finally {
            if (activeControllers.current.has(placeholder.id)) {
                activeControllers.current.delete(placeholder.id);
                setActiveCount(prev => Math.max(0, prev - 1));
            }
        }
    });

    // We don't await the entire batch here because we want non-blocking UI.
    // The promises run in background.
    Promise.all(promises).then(() => {
        // Optional: Batch completion logic if needed
    });
  };

  const removeImages = useCallback((ids: string[]) => {
      setImages(currentImages => {
          const remaining = currentImages.filter(img => !ids.includes(img.id));
          return [...remaining];
      });
      deleteImagesFromStorage(ids).catch(e => console.warn("Delete storage failed", e));
  }, []);

  const clearAll = useCallback(() => {
    stopAll();
    setImages([]);
    clearImagesFromStorage().catch(e => console.error("Clear storage failed", e));
  }, [stopAll]);

  const clearError = () => setError(null);
  const updateImages = (newImageList: GeneratedImage[]) => setImages(newImageList);

  // Run an arbitrary edit producer with a visible generating placeholder + error card.
  const runEdit = useCallback(async (
    seed: GeneratedImage,
    producer: (signal: AbortSignal) => Promise<GeneratedImage[]>
  ) => {
    const tempId = uuid();
    const controller = new AbortController();
    activeControllers.current.set(tempId, controller);
    setActiveCount(prev => prev + 1);
    setError(null);

    const placeholder: GeneratedImage = {
      id: tempId,
      url: '',
      prompt: seed.prompt,
      timestamp: Date.now(),
      settings: seed.settings,
      status: 'generating',
    };
    setImages(prev => [placeholder, ...prev]);

    try {
      const results = await producer(controller.signal);
      if (controller.signal.aborted) return;
      if (results && results.length > 0) {
        const { record } = await finalizeImage({
          ...results[0],
          id: tempId,
          status: 'completed',
          folderId: seed.folderId,
        });
        setImages(prev => prev.map(img => {
          if (img.id !== tempId) return img;
          saveImageToStorage({ ...record, url: results[0].url }).catch(console.warn);
          return record;
        }));
        playSound('success', seed.settings.enableSounds);
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 1000);
      } else {
        throw new Error('No image data returned');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const parsed = parseError(err);
      setImages(prev => prev.map(img => img.id === tempId
        ? { ...img, status: 'error' as const, error: parsed.message }
        : img));
      setError(parsed);
      playSound('error', seed.settings.enableSounds);
    } finally {
      if (activeControllers.current.has(tempId)) {
        activeControllers.current.delete(tempId);
        setActiveCount(prev => Math.max(0, prev - 1));
      }
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      const updated = { ...img, favorite: !img.favorite };
      // Metadata-only write: never re-save `url` here or the blob store entry
      // would be overwritten with an empty string.
      patchImageMeta(updated).catch(console.warn);
      return updated;
    }));
  }, []);

  /**
   * Runs a Bedrock Stability service against an existing image and files the
   * result next to it. Reuses the same placeholder / error-card lifecycle as
   * Gemini edits so the UI behaves identically for both providers.
   */
  const runBedrock = useCallback(async (
    seed: GeneratedImage,
    modelId: BedrockModel,
    values: BedrockParamValues
  ) => {
    const source = await resolveFullImage(seed);
    if (!source) {
      setError({ message: 'Source image could not be loaded.', code: 'SOURCE_MISSING' });
      return;
    }
    await runEdit(seed, (signal) =>
      runBedrockService(modelId, source, values, seed.settings, signal)
    );
  }, []);

  /** Moves images into a folder (or to Unsorted when folderId is null). */
  const assignFolder = useCallback((ids: string[], folderId: string | null) => {
    setImages(prev => prev.map(img => {
      if (!ids.includes(img.id)) return img;
      const next = { ...img };
      if (folderId) next.folderId = folderId;
      else delete next.folderId;
      return next;
    }));
    setImagesFolder(ids, folderId).catch(console.warn);
  }, []);

  // Retry an errored image: re-run with its stored prompt + settings in place.
  const retryImage = useCallback(async (id: string) => {
    let target: GeneratedImage | undefined;
    setImages(prev => {
      target = prev.find(img => img.id === id);
      if (!target) return prev;
      return prev.map(img => img.id === id ? { ...img, status: 'generating' as const, error: undefined } : img);
    });
    if (!target) return;

    const controller = new AbortController();
    activeControllers.current.set(id, controller);
    setActiveCount(prev => prev + 1);

    try {
      const single = { ...target.settings, batchSize: 1 };
      const results = await generateImages(target.prompt, single, controller.signal);
      if (controller.signal.aborted) return;
      if (results && results.length > 0) {
        const { record } = await finalizeImage({
          ...results[0],
          id,
          status: 'completed',
          folderId: target.folderId,
        });
        setImages(prev => prev.map(img => {
          if (img.id !== id) return img;
          saveImageToStorage({ ...record, url: results[0].url }).catch(console.warn);
          return record;
        }));
        playSound('success', target.settings.enableSounds);
      } else {
        throw new Error('No image data returned');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const parsed = parseError(err);
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'error' as const, error: parsed.message } : img));
      setError(parsed);
    } finally {
      if (activeControllers.current.has(id)) {
        activeControllers.current.delete(id);
        setActiveCount(prev => Math.max(0, prev - 1));
      }
    }
  }, []);
  
  const prependImage = async (image: GeneratedImage) => {
    const { record } = await finalizeImage(image);
    saveImageToStorage(image).catch(e => console.warn("Save failed", e));
    setImages(prev => [record, ...prev]);
  };

  return {
    images, 
    isGenerating: activeCount > 0, // Computed property for UI elements that need to know if ANYthing is happening
    activeCount,
    error, 
    showSuccessFlash,
    generate, 
    stopImage,
    stopAll,
    removeImages, 
    clearAll, 
    clearError, 
    updateImages, 
    prependImage,
    toggleFavorite,
    retryImage,
    runEdit,
    runBedrock,
    assignFolder
  };
};
