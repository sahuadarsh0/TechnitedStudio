
import React from 'react';
import { GeneratedImage } from '../../types';
import { useImageInspector } from '../../hooks/useImageInspector';

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
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      
      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 md:right-4 z-50 p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
          <button onClick={handleToggleFit} className="w-12 font-mono text-[10px] md:text-xs text-center text-laserBlue font-bold hover:bg-white/5 py-1.5 rounded cursor-pointer">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pl-1">
          <button onClick={(e) => { e.stopPropagation(); onCreateVariations(image); onClose(); }} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-laserPurple transition-colors" title="Variations">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </button>

          <button onClick={(e) => onDownload(e, image)} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-laserBlue transition-colors" title="Download">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>

          <button onClick={(e) => onDelete(e, image.id)} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Delete">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          
          <button onClick={(e) => onEdit(e, image)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-laserPurple/20 hover:text-laserPurple hover:border-laserPurple/30 border border-transparent rounded-lg text-xs font-bold tracking-widest uppercase text-gray-300 transition-all ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
          </button>

          <button onClick={(e) => onEdit(e, image)} className="md:hidden p-2.5 hover:bg-laserPurple/20 rounded-lg text-gray-400 hover:text-laserPurple transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
