
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, Resolution, AspectRatio } from '../../types';
import { RESOLUTIONS, ASPECT_RATIOS } from '../../constants';
import { CheckIcon, DownloadIcon, TrashIcon, SettingsIcon, FilterIcon, SearchIcon, SortIcon, StarIcon } from '../Icons';
import type { GallerySort } from '../ImageGrid';

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
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: GallerySort;
  onSortChange: (s: GallerySort) => void;
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
  onOpenSettings,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange
}) => {
  const isSelectionActive = selectedIds.size > 0;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount = (activeResolution ? 1 : 0) + (activeAspectRatio ? 1 : 0);
  
  // Calculate counts strictly for completed images
  const visibleCompletedCount = images.filter(img => img.status === 'completed').length;

  const SORT_OPTIONS: { id: GallerySort; label: string }[] = [
    { id: 'newest', label: 'Newest first' },
    { id: 'oldest', label: 'Oldest first' },
    { id: 'favorites', label: 'Favorites only' },
  ];

  return (
    <div className={`h-14 border-b flex justify-between items-center px-3 md:px-6 backdrop-blur-md z-50 shrink-0 transition-colors duration-300 relative ${isSelectionActive ? 'bg-laserBlue/10 border-laserBlue/30' : 'bg-charcoal/50 border-white/5'}`}>
      {isSelectionActive ? (
        // SELECTION MODE HEADER
        <div className="flex items-center w-full justify-between gap-2">
          <button 
            onClick={onSelectAll}
            className="flex items-center gap-2 text-laserBlue hover:text-white transition-colors mr-auto"
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.size === visibleCompletedCount && visibleCompletedCount > 0 ? 'bg-laserBlue border-laserBlue' : 'border-laserBlue'}`}>
              {selectedIds.size === visibleCompletedCount && visibleCompletedCount > 0 && <CheckIcon className="w-3 h-3 text-black" strokeWidth={3} />}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{selectedIds.size} <span className="hidden sm:inline">Selected</span></span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onDownloadSelected} className="flex items-center justify-center w-9 h-9 md:w-auto md:px-3 md:py-1.5 bg-laserBlue/20 text-laserBlue rounded hover:bg-laserBlue hover:text-black transition-all border border-laserBlue/30">
              <DownloadIcon className="w-5 h-5" />
              <span className="hidden md:inline ml-2 text-xs font-bold uppercase tracking-wider">Download</span>
            </button>
            <button onClick={onDeleteSelected} className="flex items-center justify-center w-9 h-9 md:w-auto md:px-3 md:py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all border border-red-500/30">
              <TrashIcon className="w-5 h-5" />
              <span className="hidden md:inline ml-2 text-xs font-bold uppercase tracking-wider">Delete</span>
            </button>
            
             {/* Integrated Settings Button for Mobile Selection Mode */}
             <button 
                onClick={onOpenSettings}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded border border-white/5 ml-1"
                title="Settings"
             >
                <SettingsIcon className="w-5 h-5" />
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
                    {visibleCompletedCount}
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
                   <FilterIcon className="w-3.5 h-3.5" />
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

            {/* Search prompts */}
            <div className="relative shrink-0 flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded px-2 py-1.5 animate-fadeIn">
                  <SearchIcon className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                    placeholder="Search prompts..."
                    aria-label="Search prompts"
                    className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none w-28 sm:w-44"
                  />
                  {searchQuery && (
                    <button onClick={() => onSearchChange('')} aria-label="Clear search" className="text-gray-500 hover:text-white text-xs">✕</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search prompts"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold"
                >
                  <SearchIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative shrink-0" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-haspopup="menu"
                aria-expanded={isSortOpen}
                aria-label="Sort gallery"
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold ${isSortOpen || sortOrder !== 'newest' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {sortOrder === 'favorites' ? <StarIcon className="w-3.5 h-3.5" filled /> : <SortIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.id === sortOrder)?.label}</span>
              </button>
              {isSortOpen && (
                <div role="menu" className="absolute top-full left-0 mt-2 w-44 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn backdrop-blur-xl">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      role="menuitemradio"
                      aria-checked={sortOrder === opt.id}
                      onClick={() => { onSortChange(opt.id); setIsSortOpen(false); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-[11px] transition-all ${sortOrder === opt.id ? 'bg-laserBlue/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {opt.id === 'favorites' ? <StarIcon className="w-3.5 h-3.5" filled={sortOrder === 'favorites'} /> : <SortIcon className="w-3.5 h-3.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {visibleCompletedCount > 0 && (
              <button 
                onClick={onSelectAll}
                className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-laserBlue transition-colors uppercase tracking-widest px-2 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/10 whitespace-nowrap"
              >
                Select All
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={onDownloadAll} disabled={isLoading || visibleCompletedCount === 0} className="p-2 text-gray-500 hover:text-laserBlue transition-colors rounded hover:bg-white/5 disabled:opacity-50" title="Download All">
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button onClick={onClearAll} disabled={isLoading} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-white/5 disabled:opacity-50" title="Delete All">
              <TrashIcon className="w-5 h-5" />
            </button>
            
            {/* Integrated Settings Button (Mobile) */}
            <button 
              onClick={onOpenSettings}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded border border-white/5 ml-1"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
        