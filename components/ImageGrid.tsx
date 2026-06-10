
import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedImage, Resolution, AspectRatio } from '../types';
import { GalleryHeader } from './image-grid/GalleryHeader';
import { InspectionModal } from './image-grid/InspectionModal';
import { DeleteModal } from './image-grid/DeleteModal';
import { EmptyState } from './image-grid/EmptyState';
import { GridContent } from './image-grid/GridContent';
import { downloadImagesAsZip } from '../services/exportService';

export type GallerySort = 'newest' | 'oldest' | 'favorites';

interface ImageGridProps {
  images: GeneratedImage[];
  onImageClick: (image: GeneratedImage) => void;
  isLoading: boolean;
  onRemoveImages: (ids: string[]) => void;
  onClearAll: () => void;
  loadingCount?: number;
  onRegenerate: (image: GeneratedImage, newSettings: Partial<GeneratedImage['settings']>) => void;
  onCreateVariations: (image: GeneratedImage) => void;
  onOpenSettings: () => void;
  onStopImage?: (id: string) => void; // Added prop
  onToggleFavorite?: (id: string) => void;
  onUsePrompt?: (image: GeneratedImage) => void;
  onUseStarter?: (prompt: string) => void;
  onInpaint?: (image: GeneratedImage, maskOverlay: string, instruction: string) => void;
  onApplyTool?: (image: GeneratedImage, tool: 'removeBg' | 'upscale') => void;
  onRetry?: (id: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  images, 
  onImageClick, 
  isLoading, 
  onRemoveImages,
  onClearAll,
  loadingCount = 0,
  onRegenerate,
  onCreateVariations,
  onOpenSettings,
  onStopImage,
  onToggleFavorite,
  onUsePrompt,
  onUseStarter,
  onInpaint,
  onApplyTool,
  onRetry
}) => {
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter State
  const [activeResolution, setActiveResolution] = useState<Resolution | null>(null);
  const [activeAspectRatio, setActiveAspectRatio] = useState<AspectRatio | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<GallerySort>('newest');
  
  // Apply Filters
  const searchLower = searchQuery.trim().toLowerCase();
  const filteredImages = images
    .filter(img => {
      if (activeResolution && img.settings.resolution !== activeResolution) return false;
      if (activeAspectRatio && img.settings.aspectRatio !== activeAspectRatio) return false;
      if (sortOrder === 'favorites' && img.status === 'completed' && !img.favorite) return false;
      if (searchLower && img.status === 'completed' && !img.prompt.toLowerCase().includes(searchLower)) return false;
      return true;
    })
    .sort((a, b) => {
      // Keep generating placeholders pinned at the top regardless of sort
      if (a.status === 'generating' && b.status !== 'generating') return -1;
      if (b.status === 'generating' && a.status !== 'generating') return 1;
      if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
      return b.timestamp - a.timestamp; // newest (and favorites view) default
    });

  const handleFilterChange = (type: 'resolution' | 'aspectRatio', value: string | null) => {
      if (type === 'resolution') setActiveResolution(value as Resolution | null);
      if (type === 'aspectRatio') setActiveAspectRatio(value as AspectRatio | null);
      // Clear selection when filters change to avoid confusion
      setSelectedIds(new Set());
  };

  const handleClearFilters = () => {
      setActiveResolution(null);
      setActiveAspectRatio(null);
      setSearchQuery('');
      setSortOrder('newest');
  };

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'all';
    ids?: string[];
  }>({ isOpen: false, type: 'single' });

  // Selection Logic
  const toggleSelection = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
      setSelectedIds(prev => {
          // Only select items that are completed
          const selectableImages = filteredImages.filter(img => img.status === 'completed');
          
          if (selectableImages.length === 0) return new Set();

          const allSelectableAreSelected = selectableImages.every(img => prev.has(img.id));

          // If all selectable (completed) images are selected, deselect all.
          // Otherwise, select all selectable images.
          if (allSelectableAreSelected) {
              return new Set();
          } else {
              return new Set(selectableImages.map(img => img.id));
          }
      });
  }, [filteredImages]);

  // --- Deletion Handlers ---

  const requestDeleteOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      ids: [id]
    });
  };

  const requestDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmation({
      isOpen: true,
      type: 'selected',
      ids: Array.from(selectedIds)
    });
  }, [selectedIds]);

  const requestClearAll = () => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'all'
    });
  };

  const confirmDelete = useCallback(() => {
    const { type, ids } = deleteConfirmation;

    if (type === 'all') {
      onClearAll();
      setSelectedIds(new Set());
    } else if ((type === 'single' || type === 'selected') && ids && ids.length > 0) {
      onRemoveImages(ids);
      
      // Cleanup UI state
      if (type === 'single') {
         if (viewingImage && ids.includes(viewingImage.id)) {
             setViewingImage(null);
         }
         setSelectedIds(prev => {
             const newSet = new Set(prev);
             ids.forEach(id => newSet.delete(id));
             return newSet;
         });
      } else if (type === 'selected') {
         setSelectedIds(new Set());
      }
    }

    setDeleteConfirmation({ isOpen: false, type: 'single' });
  }, [deleteConfirmation, onClearAll, onRemoveImages, viewingImage]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, type: 'single' });
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      if (e.key === 'Enter' && deleteConfirmation.isOpen) {
        e.preventDefault();
        confirmDelete();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (deleteConfirmation.isOpen) return;

        if (viewingImage) {
          e.preventDefault();
          setDeleteConfirmation({ isOpen: true, type: 'single', ids: [viewingImage.id] });
        } else if (selectedIds.size > 0) {
          e.preventDefault();
          requestDeleteSelected();
        }
      }

      if (e.key === 'Escape') {
        if (deleteConfirmation.isOpen) {
            cancelDelete();
        } else if (selectedIds.size > 0) {
            setSelectedIds(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredImages, deleteConfirmation.isOpen, viewingImage, selectedIds, confirmDelete, cancelDelete, requestDeleteSelected, handleSelectAll]);

  const handleDownload = (e: React.MouseEvent, image: GeneratedImage) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    const date = new Date(image.timestamp);
    const timestamp = date.toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
    link.download = `Technited_Studio_${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSelected = async () => {
    const selectedImages = filteredImages.filter(img => selectedIds.has(img.id) && img.status === 'completed');
    if (selectedImages.length === 0) return;
    if (selectedImages.length === 1) {
        handleDownload({ stopPropagation: () => {} } as React.MouseEvent, selectedImages[0]);
        return;
    }
    // Multiple: bundle into a single zip
    try {
        await downloadImagesAsZip(selectedImages, 'png');
    } catch (e) {
        console.warn('Zip export failed, falling back to sequential', e);
        for (const image of selectedImages) {
            handleDownload({ stopPropagation: () => {} } as React.MouseEvent, image);
            await new Promise(r => setTimeout(r, 250));
        }
    }
  };

  const handleDownloadAll = async () => {
    const completed = filteredImages.filter(img => img.status === 'completed' && img.url);
    if (completed.length === 0) return;
    if (completed.length === 1) {
        handleDownload({ stopPropagation: () => {} } as React.MouseEvent, completed[0]);
        return;
    }
    try {
        await downloadImagesAsZip(completed, 'png');
    } catch (e) {
        console.warn('Zip export failed, falling back to sequential', e);
        for (const image of completed) {
            handleDownload({ stopPropagation: () => {} } as React.MouseEvent, image);
            await new Promise(r => setTimeout(r, 250));
        }
    }
  };

  const handleImageClick = (image: GeneratedImage) => {
      // Prevent opening inspector for generating / errored images
      if (image.status === 'generating' || image.status === 'error') return;
      setViewingImage(image);
  };

  const handleEdit = (e: React.MouseEvent, image: GeneratedImage) => {
    e.stopPropagation();
    onImageClick(image);
    setViewingImage(null);
  };

  // Navigation Logic
  // Filter out generating images for navigation context
  const navigableImages = filteredImages.filter(img => img.status === 'completed');
  const currentIndex = viewingImage ? navigableImages.findIndex(img => img.id === viewingImage.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < navigableImages.length - 1;

  // Keep the open inspector in sync with the live image (so favorite toggles,
  // edits, etc. reflect immediately instead of showing a stale snapshot).
  const liveViewingImage = viewingImage
    ? images.find(img => img.id === viewingImage.id) ?? viewingImage
    : null;

  // Use raw images length for checking emptiness vs filtering
  const isEmpty = images.length === 0 && !isLoading;
  
  // Calculate total completed images for display
  const totalCompletedCount = images.filter(img => img.status === 'completed').length;

  return (
    <div className="flex-1 h-full relative overflow-hidden flex flex-col">
      <GalleryHeader 
        images={filteredImages}
        allImagesCount={totalCompletedCount}
        selectedIds={selectedIds}
        isLoading={isLoading}
        onSelectAll={handleSelectAll}
        onDownloadSelected={handleDownloadSelected}
        onDeleteSelected={requestDeleteSelected}
        onDownloadAll={handleDownloadAll}
        onClearAll={requestClearAll}
        activeResolution={activeResolution}
        activeAspectRatio={activeAspectRatio}
        onFilterChange={handleFilterChange}
        onOpenSettings={onOpenSettings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      {/* Grid Content with Extended Bottom Padding for Mobile */}
      <div className="flex-1 overflow-y-auto p-2 md:p-8 pb-56 md:pb-72 custom-scrollbar relative">
        {isEmpty ? (
            <EmptyState 
                isAbsolutelyEmpty={images.length === 0} 
                onClearFilters={handleClearFilters} 
                onUseStarter={onUseStarter}
            />
        ) : (
            <GridContent 
                images={filteredImages}
                isLoading={isLoading}
                skeletonCount={0} // Logic moved to useImageGeneration placeholders
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onImageClick={handleImageClick}
                onDeleteOne={requestDeleteOne}
                onStop={onStopImage}
                onToggleFavorite={onToggleFavorite}
                onRetry={onRetry}
            />
        )}
      </div>

      {/* INSPECTION VIEWPORT OVERLAY */}
      {liveViewingImage && (
        <InspectionModal
          image={liveViewingImage}
          onClose={() => setViewingImage(null)}
          onPrev={() => hasPrev && setViewingImage(navigableImages[currentIndex - 1])}
          onNext={() => hasNext && setViewingImage(navigableImages[currentIndex + 1])}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onDelete={requestDeleteOne}
          onDownload={handleDownload}
          onRegenerate={onRegenerate}
          onCreateVariations={onCreateVariations}
          onEdit={handleEdit}
          isLoading={isLoading}
          onInpaint={onInpaint}
          onApplyTool={onApplyTool}
          onUsePrompt={onUsePrompt}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteModal 
        isOpen={deleteConfirmation.isOpen}
        type={deleteConfirmation.type}
        count={deleteConfirmation.ids?.length}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ImageGrid;
