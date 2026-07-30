
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GeneratedImage, Resolution, AspectRatio, Folder } from '../types';
import { GalleryHeader } from './image-grid/GalleryHeader';
import { InspectionModal } from './image-grid/InspectionModal';
import { DeleteModal } from './image-grid/DeleteModal';
import { EmptyState } from './image-grid/EmptyState';
import { GridContent } from './image-grid/GridContent';
import { FolderGroup } from './image-grid/FolderGroup';
import { FolderBar } from './image-grid/FolderBar';
import { downloadImagesAsZip } from '../services/exportService';
import { resolveFullImage } from '../services/storageService';
import { stripMetadata } from '../services/thumbnailService';

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
  // ─── Folders ───
  folders?: Folder[];
  onCreateFolder?: (name: string) => Promise<Folder>;
  onRenameFolder?: (id: string, name: string) => void;
  onToggleFolderCollapse?: (id: string) => void;
  onCollapseAllFolders?: (collapsed: boolean) => void;
  onRemoveFolder?: (id: string) => void;
  onAssignFolder?: (ids: string[], folderId: string | null) => void;
  // ─── Bedrock ───
  onOpenBedrock?: (image: GeneratedImage) => void;
  onOpenCleanExport?: (image: GeneratedImage) => void;
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
  onRetry,
  folders = [],
  onCreateFolder,
  onRenameFolder,
  onToggleFolderCollapse,
  onCollapseAllFolders,
  onRemoveFolder,
  onAssignFolder,
  onOpenBedrock,
  onOpenCleanExport
}) => {
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupByFolder, setGroupByFolder] = useState(true);
  
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

  /**
   * Buckets the filtered images by folder. Generating placeholders are pulled
   * out and pinned above every group so in-flight work is always visible
   * regardless of which folder it will land in.
   */
  const grouped = useMemo(() => {
    const pending = filteredImages.filter(img => img.status === 'generating' || img.status === 'error');
    const settled = filteredImages.filter(img => img.status !== 'generating' && img.status !== 'error');

    const byFolder = new Map<string, GeneratedImage[]>();
    const unsorted: GeneratedImage[] = [];

    for (const img of settled) {
      if (img.folderId && folders.some(f => f.id === img.folderId)) {
        const list = byFolder.get(img.folderId) || [];
        list.push(img);
        byFolder.set(img.folderId, list);
      } else {
        unsorted.push(img);
      }
    }

    return { pending, byFolder, unsorted };
  }, [filteredImages, folders]);

  const folderNameFor = useCallback((id?: string) => 
    id ? folders.find(f => f.id === id)?.name : undefined, [folders]);

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

  const handleDownload = async (e: React.MouseEvent, image: GeneratedImage) => {
    e.stopPropagation();
    // Gallery records hold only a thumbnail; fetch the real pixels first.
    const src = await resolveFullImage(image);
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
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
        await handleDownload({ stopPropagation: () => {} } as React.MouseEvent, selectedImages[0]);
        return;
    }
    // Multiple: bundle into a single zip
    try {
        await downloadImagesAsZip(selectedImages, 'png');
    } catch (e) {
        console.warn('Zip export failed, falling back to sequential', e);
        for (const image of selectedImages) {
            await handleDownload({ stopPropagation: () => {} } as React.MouseEvent, image);
            await new Promise(r => setTimeout(r, 250));
        }
    }
  };

  const handleDownloadAll = async () => {
    const completed = filteredImages.filter(img => img.status === 'completed');
    if (completed.length === 0) return;
    if (completed.length === 1) {
        await handleDownload({ stopPropagation: () => {} } as React.MouseEvent, completed[0]);
        return;
    }
    try {
        await downloadImagesAsZip(completed, 'png');
    } catch (e) {
        console.warn('Zip export failed, falling back to sequential', e);
        for (const image of completed) {
            await handleDownload({ stopPropagation: () => {} } as React.MouseEvent, image);
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

      {/* Folder toolbar */}
      {onCreateFolder && (
        <FolderBar
          folders={folders}
          selectedCount={selectedIds.size}
          groupByFolder={groupByFolder}
          onToggleGrouping={setGroupByFolder}
          onCreateFolder={(name) => { onCreateFolder(name); }}
          onMoveSelected={(folderId) => {
            onAssignFolder?.(Array.from(selectedIds), folderId);
            setSelectedIds(new Set());
          }}
          onCollapseAll={(c) => onCollapseAllFolders?.(c)}
        />
      )}

      {/* Grid Content with Extended Bottom Padding for Mobile */}
      <div className="flex-1 overflow-y-auto p-2 md:p-8 pb-56 md:pb-72 custom-scrollbar relative">
        {isEmpty ? (
            <EmptyState 
                isAbsolutelyEmpty={images.length === 0} 
                onClearFilters={handleClearFilters} 
                onUseStarter={onUseStarter}
            />
        ) : groupByFolder && folders.length > 0 ? (
            <>
              {/* In-flight and failed work stays pinned at the top. */}
              {grouped.pending.length > 0 && (
                <div className="mb-6">
                  <GridContent
                    images={grouped.pending}
                    isLoading={isLoading}
                    skeletonCount={0}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onImageClick={handleImageClick}
                    onDeleteOne={requestDeleteOne}
                    onStop={onStopImage}
                    onToggleFavorite={onToggleFavorite}
                    onRetry={onRetry}
                  />
                </div>
              )}

              {folders.map((folder) => (
                <FolderGroup
                  key={folder.id}
                  folder={folder}
                  images={grouped.byFolder.get(folder.id) || []}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onImageClick={handleImageClick}
                  onDeleteOne={requestDeleteOne}
                  onStop={onStopImage}
                  onToggleFavorite={onToggleFavorite}
                  onRetry={onRetry}
                  onToggleCollapse={(id) => onToggleFolderCollapse?.(id)}
                  onDeleteFolderContents={(_fid, ids) =>
                    setDeleteConfirmation({ isOpen: true, type: 'selected', ids })
                  }
                  onDeleteFolderOnly={(id) => {
                    const ids = (grouped.byFolder.get(id) || []).map(i => i.id);
                    if (ids.length) onAssignFolder?.(ids, null);
                    onRemoveFolder?.(id);
                  }}
                  onRename={(id, name) => onRenameFolder?.(id, name)}
                  onSelectAllInFolder={(ids) => setSelectedIds(new Set(ids))}
                />
              ))}

              {/* Unsorted always last so folders lead the view. */}
              <FolderGroup
                folder={null}
                images={grouped.unsorted}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onImageClick={handleImageClick}
                onDeleteOne={requestDeleteOne}
                onStop={onStopImage}
                onToggleFavorite={onToggleFavorite}
                onRetry={onRetry}
                onToggleCollapse={() => {}}
                onDeleteFolderContents={(_fid, ids) =>
                  setDeleteConfirmation({ isOpen: true, type: 'selected', ids })
                }
                onDeleteFolderOnly={() => {}}
                onRename={() => {}}
                onSelectAllInFolder={(ids) => setSelectedIds(new Set(ids))}
              />
            </>
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
                folderNameFor={folderNameFor}
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
          onOpenBedrock={onOpenBedrock}
          onOpenCleanExport={onOpenCleanExport}
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
