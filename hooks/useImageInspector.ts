
import { useState, useRef, useEffect, useCallback } from 'react';
import { GeneratedImage } from '../types';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8.0;

export const useImageInspector = (image: GeneratedImage, onPrev: () => void, onNext: () => void) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const swipeStartRef = useRef<{x: number, y: number} | null>(null);

  // Reset view when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [image.id]);

  const updateZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(Math.max(MIN_ZOOM, newZoom), MAX_ZOOM);
    setZoom(clamped);
    if (clamped <= 1 && zoom > 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    updateZoom(zoom * scaleFactor);
  }, [zoom, updateZoom]);

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateZoom(zoom * 1.25);
  }, [zoom, updateZoom]);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateZoom(zoom / 1.25);
  }, [zoom, updateZoom]);

  const handleToggleFit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (Math.abs(zoom - 1) < 0.1) {
      updateZoom(2.0);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [zoom, updateZoom]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom > 1 || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (e.button === 0) {
      swipeStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [zoom, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.target instanceof Element) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch(err) { /* ignore safety release errors */ }
    }

    if (zoom === 1 && swipeStartRef.current) {
      const dx = e.clientX - swipeStartRef.current.x;
      const dy = e.clientY - swipeStartRef.current.y;
      
      if (Math.abs(dx) > 50 && Math.abs(dy) < 50) {
        if (dx > 0) onPrev();
        else onNext();
      }
      swipeStartRef.current = null;
    }
  }, [zoom, onPrev, onNext]);

  return {
    zoom,
    pan,
    isDragging,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleToggleFit,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
