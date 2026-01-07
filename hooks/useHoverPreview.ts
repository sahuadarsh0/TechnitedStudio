
import { useRef, useCallback } from 'react';
import { useHoverPreviewContext, PreviewData } from '../contexts/HoverPreviewContext';

export const useHoverPreview = (data: Omit<PreviewData, 'sourceRect'>) => {
  const { setPreviewData } = useHoverPreviewContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget;
    // Clear any existing timer to be safe
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setPreviewData({ ...data, sourceRect: rect });
    }, 750); // 750ms delay
  }, [data, setPreviewData]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPreviewData(null);
  }, [setPreviewData]);

  return { handleMouseEnter, handleMouseLeave };
};
