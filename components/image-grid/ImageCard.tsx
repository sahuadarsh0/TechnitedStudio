
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../../types';
import { useHoverPreview } from '../../hooks/useHoverPreview';
import { CheckIcon, TrashIcon, StarIcon, ErrorIcon, FolderIcon, BedrockIcon } from '../Icons';

interface ImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  onToggleSelection: (id: string, e: React.MouseEvent) => void;
  onClick: (image: GeneratedImage) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onStop?: (id: string) => void; // Added for stopping generation
  onToggleFavorite?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Name of the folder this card sits in, shown as a subtle badge. */
  folderName?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  isSelected, 
  onToggleSelection, 
  onClick, 
  onDelete,
  onStop,
  onToggleFavorite,
  onRetry,
  folderName
}) => {
  const isGenerating = image.status === 'generating';
  const [elapsed, setElapsed] = useState(0);

  /**
   * The grid renders the lightweight thumbnail, never the full-resolution
   * image. `image.url` is empty for anything loaded from storage v4 — the full
   * pixels are fetched on demand when the detail view opens. Legacy v3 records
   * that still carry an inline url fall back to it so nothing goes blank
   * before the background migration finishes.
   */
  const previewSrc = image.thumbnail || image.url;

  // Restore Timer Logic
  useEffect(() => {
    if (!isGenerating) return;
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(timer);
  }, [isGenerating]);

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview({
    url: previewSrc,
    prompt: image.prompt,
    resolution: image.settings.resolution,
    aspectRatio: image.settings.aspectRatio,
    model: image.settings.model
  });

  // --- GENERATING STATE (SPECTACULAR REDESIGN) ---
  if (isGenerating) {
      return (
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl group cursor-default">
            {/* 1. Base Grid Background Pattern */}
            <div 
                className="absolute inset-0 opacity-20" 
                style={{ 
                    backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}
            ></div>

            {/* 2. Deep Blue Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_70%)] animate-pulse-slow"></div>

            {/* 3. Scanning Laser Effect */}
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-laserBlue to-transparent shadow-[0_0_15px_#00f0ff] animate-scan-vertical z-10"></div>

            {/* 4. Center HUD Interface */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 border border-laserBlue/20 border-t-laserBlue/60 rounded-full animate-[spin_3s_linear_infinite]"></div>
                    {/* Inner Dashed Ring */}
                    <div className="absolute inset-2 border border-dashed border-laserBlue/20 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
                    
                    {/* Main Interaction Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStop?.(image.id); }}
                        className="relative group/btn w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                        title="Abort Generation"
                    >
                         {/* Button Background & State Glows */}
                         <div className="absolute inset-0 bg-black/80 rounded-full border border-laserBlue/30 group-hover/btn:border-red-500/80 group-hover/btn:bg-red-900/20 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] group-hover/btn:shadow-[0_0_25px_rgba(239,68,68,0.6)]"></div>
                         
                         {/* Central Core Icon */}
                         <div className="relative z-10 w-3 h-3 bg-laserBlue rounded-[1px] shadow-[0_0_10px_currentColor] group-hover/btn:bg-red-500 group-hover/btn:w-4 group-hover/btn:h-4 group-hover/btn:rounded-sm group-hover/btn:rotate-90 transition-all duration-300"></div>
                         
                         {/* Hover Ping Effect */}
                         <div className="absolute inset-0 rounded-full border border-red-500 opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-ping"></div>
                    </button>
                </div>

                {/* Text Data Readout */}
                <div className="mt-3 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-laserBlue rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span>
                        <span className="text-[10px] font-mono font-bold text-laserBlue tracking-[0.2em] text-glow">GENERATING</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest">{elapsed.toFixed(1)}s</span>
                </div>
            </div>

            {/* 5. Tech Corner Brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/20 rounded-tl"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20 rounded-tr"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20 rounded-bl"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/20 rounded-br"></div>

            {/* 6. Bottom Progress Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div className="h-full bg-gradient-to-r from-laserBlue via-white to-laserBlue bg-[length:200%_100%] animate-progress w-full origin-left shadow-[0_0_10px_#00f0ff]"></div>
            </div>
        </div>
      );
  }

  // --- ERROR STATE (retry card) ---
  if (image.status === 'error') {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden border border-red-500/30 bg-red-500/5 flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
          <ErrorIcon className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-[10px] text-red-300/90 font-mono leading-snug mb-3 line-clamp-3">{image.error || 'Generation failed'}</p>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(image.id); }}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-200 hover:bg-red-500/25 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={(e) => onDelete(e, image.id)}
            aria-label="Dismiss failed generation"
            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- COMPLETED STATE ---
  return (
    <div 
      onClick={() => onClick(image)} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Open image: ${image.prompt.slice(0, 80)}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(image); } }}
      className={`group relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 animate-fadeIn focus:outline-none focus-visible:ring-2 focus-visible:ring-laserBlue/70 ${isSelected ? 'border-laserBlue shadow-neon ring-1 ring-laserBlue/30' : 'border-white/5 hover:border-laserBlue/50 hover:shadow-neon'}`}
    >
      {/* Checkbox Overlay */}
      <div 
        className={`absolute top-2 left-2 z-30 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100'}`}
        onClick={(e) => onToggleSelection(image.id, e)}
      >
        <div className={`w-6 h-6 rounded-md border backdrop-blur-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-laserBlue border-laserBlue text-black' : 'bg-black/50 border-white/30 hover:border-white text-transparent'}`}>
          <CheckIcon className="w-4 h-4" strokeWidth={3} />
        </div>
      </div>

      {/* Top Right: Favorite + Delete */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(image.id); }}
            aria-label={image.favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={!!image.favorite}
            className={`p-1.5 rounded-md backdrop-blur-sm shadow-lg border transition-all ${
              image.favorite
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 opacity-100'
                : 'bg-black/60 border-white/10 text-white/70 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:border-amber-400/40'
            }`}
            title={image.favorite ? 'Favorited' : 'Favorite'}
          >
            <StarIcon className="w-4 h-4" filled={!!image.favorite} />
          </button>
        )}
        <button 
          onClick={(e) => onDelete(e, image.id)}
          aria-label="Delete image"
          className="p-1.5 bg-black/60 hover:bg-red-500 rounded-md text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-lg border border-white/10 hover:border-red-500/50"
          title="Delete Image"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <img src={previewSrc} alt={image.prompt.slice(0, 120) || 'Generated asset'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-0" loading="lazy" decoding="async"/>

      {/* Bottom-left badges: provider + folder */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {image.provider === 'bedrock' && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-[#ff9900]/30 text-[8px] font-mono uppercase tracking-wider text-[#ff9900]">
            <BedrockIcon className="w-2.5 h-2.5" strokeWidth={2} />
            Bedrock
          </span>
        )}
        {folderName && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[8px] font-mono uppercase tracking-wider text-gray-300 max-w-[100px] truncate">
            <FolderIcon className="w-2.5 h-2.5" strokeWidth={2} />
            {folderName}
          </span>
        )}
      </div>
      
      {/* Selected Overlay Highlight */}
      {isSelected && <div className="absolute inset-0 bg-laserBlue/10 pointer-events-none z-10"></div>}
    </div>
  );
};
