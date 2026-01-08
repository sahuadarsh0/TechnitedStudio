
import React from 'react';
import { GeneratedImage } from '../../types';
import { useImageInspector } from '../../hooks/useImageInspector';
import { ChevronLeftIcon, ChevronRightIcon, ZoomOutIcon, ZoomInIcon, VariationsIcon, DownloadIcon, TrashIcon, EditIcon } from '../Icons';

interface InspectionViewerProps {
  image: GeneratedImage;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onCreateVariations: (image: GeneratedImage) => void;
  onDownload: (e: React.MouseEvent, image: GeneratedImage) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onEdit: (e: React.MouseEvent, image: GeneratedImage) => void;
}

export const InspectionViewer: React.FC<InspectionViewerProps> = ({
  image, onPrev, onNext, hasPrev, hasNext, onClose,
  onCreateVariations, onDownload, onDelete, onEdit
}) => {
  const {
    zoom, pan, isDragging,
    handleWheel, handleZoomIn, handleZoomOut, handleToggleFit,
    handlePointerDown, handlePointerMove, handlePointerUp
  } = useImageInspector(image, onPrev, onNext);

  return (
    <div 
      className="w-full md:flex-1 h-[55%] md:h-full relative bg-[#080808] overflow-hidden flex items-center justify-center select-none order-1"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleToggleFit}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ 
          backgroundImage: 'radial-gradient(#404040 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }}
      ></div>
      
      {/* Nav Arrows */}
      {hasPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 md:left-4 z-50 p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
        >
          <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}
      
      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 md:right-4 z-50 p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
        >
          <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

      {/* Image Layer */}
      <div 
        className="relative will-change-transform shadow-[0_0_100px_rgba(0,0,0,0.5)]" 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <img 
          src={image.url} 
          className="max-w-none max-h-none pointer-events-none" 
          style={{ 
            imageRendering: zoom > 2 ? 'pixelated' : 'auto',
            maxWidth: zoom === 1 ? '100vw' : 'auto',
            maxHeight: zoom === 1 ? '100vh' : 'auto',
            padding: zoom === 1 ? '20px' : '0'
          }}
          alt="Inspection"
        />
      </div>

      {/* FLOATING GLASS DOCK */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 md:p-2 bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 animate-slideUp scale-90 md:scale-100 origin-bottom">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 pr-2 md:pr-3 border-r border-white/10">
          <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ZoomOutIcon className="w-5 h-5" />
          </button>
          <button onClick={handleToggleFit} className="w-12 font-mono text-[10px] md:text-xs text-center text-laserBlue font-bold hover:bg-white/5 py-1.5 rounded cursor-pointer">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ZoomInIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pl-1">
          <button onClick={(e) => { e.stopPropagation(); onCreateVariations(image); onClose(); }} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-laserPurple transition-colors" title="Variations">
            <VariationsIcon className="w-5 h-5" />
          </button>

          <button onClick={(e) => onDownload(e, image)} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-laserBlue transition-colors" title="Download">
            <DownloadIcon className="w-5 h-5" />
          </button>

          <button onClick={(e) => onDelete(e, image.id)} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Delete">
            <TrashIcon className="w-5 h-5" />
          </button>
          
          <button onClick={(e) => onEdit(e, image)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-laserPurple/20 hover:text-laserPurple hover:border-laserPurple/30 border border-transparent rounded-lg text-xs font-bold tracking-widest uppercase text-gray-300 transition-all ml-1">
            <EditIcon className="w-4 h-4" />
            Edit
          </button>

          <button onClick={(e) => onEdit(e, image)} className="md:hidden p-2.5 hover:bg-laserPurple/20 rounded-lg text-gray-400 hover:text-laserPurple transition-colors">
             <EditIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
