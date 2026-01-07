
import React from 'react';
import { GeneratedImage } from '../../types';
import { useHoverPreview } from '../../hooks/useHoverPreview';

interface ImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  onToggleSelection: (id: string, e: React.MouseEvent) => void;
  onClick: (image: GeneratedImage) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  isSelected, 
  onToggleSelection, 
  onClick, 
  onDelete 
}) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverPreview({
    url: image.url,
    prompt: image.prompt,
    resolution: image.settings.resolution,
    aspectRatio: image.settings.aspectRatio,
    model: image.settings.model
  });

  return (
    <div 
      onClick={() => onClick(image)} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 ${isSelected ? 'border-laserBlue shadow-neon ring-1 ring-laserBlue/30' : 'border-white/5 hover:border-laserBlue/50 hover:shadow-neon'}`}
    >
      {/* Checkbox Overlay - Explicit z-index to stay above image */}
      <div 
        className={`absolute top-2 left-2 z-30 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100'}`}
        onClick={(e) => onToggleSelection(image.id, e)}
      >
        <div className={`w-6 h-6 rounded-md border backdrop-blur-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-laserBlue border-laserBlue text-black' : 'bg-black/50 border-white/30 hover:border-white text-transparent'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      </div>

      {/* Top Right: Individual Delete - z-30 ensures clickability */}
      <button 
        onClick={(e) => onDelete(e, image.id)}
        className="absolute top-2 right-2 z-30 p-1.5 bg-black/60 hover:bg-red-500 rounded-md text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-lg border border-white/10 hover:border-red-500/50"
        title="Delete Image"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>

      <img src={image.url} alt="Asset" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-0" loading="lazy"/>
      
      {/* Selected Overlay Highlight */}
      {isSelected && <div className="absolute inset-0 bg-laserBlue/10 pointer-events-none z-10"></div>}
    </div>
  );
};
