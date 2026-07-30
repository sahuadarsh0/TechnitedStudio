
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GeneratedImage } from '../../types';
import { useFullImage } from '../../hooks/useFullImage';
import { EraserIcon, BoltIcon } from '../Icons';

interface InpaintModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onApply: (maskOverlay: string, instruction: string) => void;
  isLoading: boolean;
}

/**
 * Brush-mask region editor. The user paints over the area to change, types an
 * instruction, and we composite the original image + painted highlight into a
 * single overlay data URL passed to the region-aware edit pipeline.
 */
export const InpaintModal: React.FC<InpaintModalProps> = ({ image, onClose, onApply, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { src: fullSrc } = useFullImage(image);
  const [brushSize, setBrushSize] = useState(48);
  const [instruction, setInstruction] = useState('');
  const [hasMask, setHasMask] = useState(false);
  const drawing = useRef(false);

  // Load the source image into the canvas at natural resolution.
  // `fullSrc` resolves the real pixels from storage — masking against a
  // thumbnail would produce a mask at the wrong scale.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fullSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = fullSrc;
  }, [fullSrc]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const paint = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.fillStyle = 'rgba(255, 0, 200, 0.55)';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize / 2) * (canvas.width / canvas.getBoundingClientRect().width), 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
  }, [brushSize]);

  const handleDown = (e: React.PointerEvent) => { drawing.current = true; paint(e); };
  const handleMove = (e: React.PointerEvent) => { if (drawing.current) paint(e); };
  const handleUp = () => { drawing.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); }
    setHasMask(false);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasMask || !instruction.trim()) return;
    const overlay = canvas.toDataURL('image/png');
    onApply(overlay, instruction);
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#050505]/95 backdrop-blur-md animate-fadeIn">
      <div className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/10 shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-laserPurple animate-pulse"></span>
          Region Edit
        </h3>
        <button onClick={onClose} aria-label="Close region editor" className="text-gray-400 hover:text-white text-sm px-2 py-1">Close ✕</button>
      </div>

      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          className="max-w-full max-h-full object-contain rounded-lg border border-white/10 cursor-crosshair touch-none shadow-2xl"
        />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-black/60 backdrop-blur-2xl p-3 md:p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 flex items-center gap-2 shrink-0">
              Brush
              <input
                type="range" min={12} max={120} value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                aria-label="Brush size"
                className="w-28"
              />
            </label>
            <button
              onClick={handleClear}
              disabled={!hasMask}
              className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-white disabled:opacity-40 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
            >
              <EraserIcon className="w-3.5 h-3.5" /> Clear Mask
            </button>
            <span className="text-[10px] text-gray-600 ml-auto hidden sm:block">Paint the area you want to change.</span>
          </div>

          <div className="flex items-end gap-2 bg-black/50 border border-white/10 rounded-2xl p-2">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe the change for the painted region…"
              aria-label="Region edit instruction"
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm px-3 py-2 focus:outline-none resize-none custom-scrollbar"
            />
            <button
              onClick={handleApply}
              disabled={!hasMask || !instruction.trim() || isLoading}
              className="h-10 px-5 rounded-lg bg-laserPurple text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 shadow-neon-purple disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
            >
              {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BoltIcon className="w-4 h-4" />}
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
