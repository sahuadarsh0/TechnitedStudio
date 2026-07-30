import { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { resolveFullImage } from '../services/storageService';

/**
 * Resolves the full-resolution source for an image on demand.
 *
 * Since storage v4 the gallery only holds thumbnails in memory, so any view
 * that needs real pixels (detail viewer, inpaint canvas, export) must ask for
 * them. The thumbnail is returned immediately as a placeholder so the UI can
 * paint something instantly, then swaps to the full image once IndexedDB
 * returns.
 */
export const useFullImage = (image: GeneratedImage | null) => {
  const [src, setSrc] = useState<string>(image?.url || image?.thumbnail || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!image) {
      setSrc('');
      return;
    }

    // Already have real pixels in hand.
    if (image.url) {
      setSrc(image.url);
      return;
    }

    let cancelled = false;
    // Show the thumbnail immediately to avoid a blank frame.
    setSrc(image.thumbnail || '');
    setIsLoading(true);

    resolveFullImage(image)
      .then((full) => {
        if (!cancelled && full) setSrc(full);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [image?.id, image?.url, image?.thumbnail]);

  return { src, isLoading };
};
