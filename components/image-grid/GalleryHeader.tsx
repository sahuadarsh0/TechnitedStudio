
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, Resolution, AspectRatio } from '../../types';
import { RESOLUTIONS, ASPECT_RATIOS } from '../../constants';

interface GalleryHeaderProps {
  images: GeneratedImage[];
  allImagesCount: number;
  selectedIds: Set<string>;
  isLoading: boolean;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onDeleteSelected: () => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  activeResolution: Resolution | null;
  activeAspectRatio: AspectRatio | null;
  onFilterChange: (type: 'resolution' | 'aspectRatio', value: string | null) => void;
  onOpenSettings: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  images,
  allImagesCount,
  selectedIds,
  isLoading,
  onSelectAll,
  onDownloadSelected,
  onDeleteSelected,
  onDownloadAll,
  onClearAll,
  activeResolution,
  activeAspectRatio,
  onFilterChange,
  onOpenSettings
}) => {
  const isSelectionActive = selectedIds.size > 0;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount = (activeResolution ? 1 : 0) + (activeAspectRatio ? 1 : 0);

  return (
    <div className={`h-14 border-b flex justify-between items-center px-3 md:px-6 backdrop-blur-md z-20 shrink-0 transition-colors duration-300 relative ${isSelectionActive ? 'bg-laserBlue/10 border-laserBlue/30' : 'bg-charcoal/50 border-white/5'}`}>
      {isSelectionActive ? (
        // SELECTION MODE HEADER
        <div className="flex items-center w-full justify-between gap-2">
          <button 
            onClick={onSelectAll}
            className="flex items-center gap-2 text-laserBlue hover:text-white transition-colors mr-auto"
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.size === images.length ? 'bg-laserBlue border-laserBlue' : 'border-laserBlue'}`}>
              {selectedIds.size === images.length && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{selectedIds.size} <span className="hidden sm:inline">Selected</span></span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onDownloadSelected} className="flex items-center justify-center w-9 h-9 md:w-auto md:px-3 md:py-1.5 bg-laserBlue/20 text-laserBlue rounded hover:bg-laserBlue hover:text-black transition-all border border-laserBlue/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden md:inline ml-2 text-xs font-bold uppercase tracking-wider">Download</span>
            </button>
            <button onClick={onDeleteSelected} className="flex items-center justify-center w-9 h-9 md:w-auto md:px-3 md:py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all border border-red-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span className="hidden md:inline ml-2 text-xs font-bold uppercase tracking-wider">Delete</span>
            </button>
            
             {/* Integrated Settings Button for Mobile Selection Mode */}
             <button 
                onClick={onOpenSettings}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded border border-white/5 ml-1"
                title="Settings"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             </button>
          </div>
        </div>
      ) : (
        // DEFAULT HEADER
        <>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="flex items-center min-w-0">
                <div className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap truncate">
                <span className="hidden xs:inline">Gallery <span className="text-gray-700 mx-2">|</span></span> 
                <span className="text-white">
                    {images.length}
                    <span className="hidden sm:inline text-gray-500"> / {allImagesCount}</span>
                    <span className="hidden md:inline"> Assets</span>
                </span>
                </div>
            </div>

            {/* Filter Toggle */}
            <div className="relative shrink-0" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold ${isFilterOpen || activeFilterCount > 0 ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                   <span className="hidden sm:inline">Filters</span>
                   {activeFilterCount > 0 && (
                     <span className="flex items-center justify-center w-4 h-4 bg-laserBlue text-black rounded-full text-[9px]">{activeFilterCount}</span>
                   )}
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-fadeIn backdrop-blur-xl">
                      {/* Resolution Filter */}
                      <div className="mb-4">
                        <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Resolution</h4>
                        <div className="flex flex-wrap gap-2">
                           {RESOLUTIONS.map(res => (
                             <button
                               key={res}
                               onClick={() => onFilterChange('resolution', activeResolution === res ? null : res)}
                               className={`px-2 py-1 text-[10px] rounded border transition-all ${activeResolution === res ? 'bg-laserBlue/20 border-laserBlue text-laserBlue' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                             >
                               {res}
                             </button>
                           ))}
                        </div>
                      </div>

                      {/* Aspect Ratio Filter */}
                      <div className="mb-4">
                        <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Aspect Ratio</h4>
                        <div className="grid grid-cols-3 gap-2">
                           {ASPECT_RATIOS.map(ratio => (
                             <button
                               key={ratio}
                               onClick={() => onFilterChange('aspectRatio', activeAspectRatio === ratio ? null : ratio)}
                               className={`px-1 py-1 text-[10px] rounded border transition-all ${activeAspectRatio === ratio ? 'bg-laserBlue/20 border-laserBlue text-laserBlue' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                             >
                               {ratio}
                             </button>
                           ))}
                        </div>
                      </div>
                      
                      {activeFilterCount > 0 && (
                        <button 
                          onClick={() => { onFilterChange('resolution', null); onFilterChange('aspectRatio', null); }}
                          className="w-full py-1.5 text-[10px] uppercase font-bold text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                  </div>
                )}
            </div>

            {images.length > 0 && (
              <button 
                onClick={onSelectAll}
                className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-laserBlue transition-colors uppercase tracking-widest px-2 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/10 whitespace-nowrap"
              >
                Select All
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={onDownloadAll} disabled={isLoading || images.length === 0} className="p-2 text-gray-500 hover:text-laserBlue transition-colors rounded hover:bg-white/5 disabled:opacity-50" title="Download All">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={onClearAll} disabled={isLoading} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-white/5 disabled:opacity-50" title="Delete All">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            
            {/* Integrated Settings Button (Mobile) */}
            <button 
              onClick={onOpenSettings}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded border border-white/5 ml-1"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
