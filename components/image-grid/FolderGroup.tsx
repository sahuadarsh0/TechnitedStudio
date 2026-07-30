import React, { useState } from 'react';
import { GeneratedImage, Folder } from '../../types';
import { ImageCard } from './ImageCard';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  FolderIcon,
  FolderPlusIcon,
  CheckIcon,
  CloseIcon,
} from '../Icons';

interface FolderGroupProps {
  folder: Folder | null; // null = the Unsorted pseudo-folder
  images: GeneratedImage[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string, e: React.MouseEvent) => void;
  onImageClick: (image: GeneratedImage) => void;
  onDeleteOne: (e: React.MouseEvent, id: string) => void;
  onStop?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onRetry?: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onDeleteFolderContents: (folderId: string, imageIds: string[]) => void;
  onDeleteFolderOnly: (folderId: string) => void;
  onRename: (id: string, name: string) => void;
  onSelectAllInFolder: (ids: string[]) => void;
}

/**
 * One collapsible folder section in the gallery.
 *
 * Collapsing matters for more than tidiness: a collapsed folder renders no
 * image cards at all, which is the cheapest possible way to keep a large
 * library responsive.
 */
export const FolderGroup: React.FC<FolderGroupProps> = ({
  folder,
  images,
  selectedIds,
  onToggleSelection,
  onImageClick,
  onDeleteOne,
  onStop,
  onToggleFavorite,
  onRetry,
  onToggleCollapse,
  onDeleteFolderContents,
  onDeleteFolderOnly,
  onRename,
  onSelectAllInFolder,
}) => {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(folder?.name || '');
  const [confirming, setConfirming] = useState<null | 'contents' | 'folder'>(null);

  const isUnsorted = folder === null;
  const collapsed = folder?.collapsed ?? false;
  const accent = folder?.color || '#6b7280';
  const ids = images.map((i) => i.id);
  const selectedHere = images.filter((i) => selectedIds.has(i.id)).length;

  const commitRename = () => {
    if (folder && draftName.trim()) onRename(folder.id, draftName.trim());
    setRenaming(false);
  };

  return (
    <section className="mb-6">
      {/* Folder header bar */}
      <div
        className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group/hdr"
        style={!isUnsorted ? { borderLeft: `3px solid ${accent}` } : undefined}
      >
        <button
          onClick={() => folder && onToggleCollapse(folder.id)}
          disabled={isUnsorted}
          className="p-1 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default"
          aria-label={collapsed ? 'Expand folder' : 'Collapse folder'}
          aria-expanded={!collapsed}
        >
          {isUnsorted ? (
            <FolderPlusIcon className="w-4 h-4" strokeWidth={1.8} />
          ) : collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {!isUnsorted && (
          <FolderIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} style={{ color: accent }} />
        )}

        {renaming ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="flex-1 min-w-0 bg-black/40 text-sm text-white px-2 py-1 rounded outline-none border border-white/10 focus:border-laserBlue/50"
            />
            <button onClick={commitRename} className="p-1 text-emerald-400 hover:text-emerald-300" aria-label="Save name">
              <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
            <button onClick={() => setRenaming(false)} className="p-1 text-gray-500 hover:text-white" aria-label="Cancel rename">
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onDoubleClick={() => !isUnsorted && setRenaming(true)}
            onClick={() => folder && onToggleCollapse(folder.id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            title={isUnsorted ? undefined : 'Double-click to rename'}
          >
            <span className="text-sm font-medium text-gray-200 truncate">
              {isUnsorted ? 'Unsorted' : folder!.name}
            </span>
            <span className="text-[10px] font-mono text-gray-600 shrink-0">
              {images.length}
            </span>
            {selectedHere > 0 && (
              <span className="text-[9px] font-mono text-laserBlue shrink-0">
                {selectedHere} selected
              </span>
            )}
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover/hdr:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          {images.length > 0 && (
            <button
              onClick={() => onSelectAllInFolder(ids)}
              className="px-2 py-1 rounded text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              title="Select all in this folder"
            >
              Select
            </button>
          )}
          {images.length > 0 && (
            <button
              onClick={() => setConfirming('contents')}
              className="p-1.5 rounded text-gray-500 hover:text-red-400 transition-colors"
              title="Delete all images in this folder"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {!isUnsorted && (
            <button
              onClick={() => setConfirming('folder')}
              className="px-2 py-1 rounded text-[9px] uppercase tracking-widest text-gray-600 hover:text-amber-400 transition-colors"
              title="Remove folder, keep images"
            >
              Ungroup
            </button>
          )}
        </div>
      </div>

      {/* Inline confirmation */}
      {confirming && (
        <div className="mb-3 mx-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between gap-3 animate-fadeIn">
          <p className="text-xs text-red-200/90">
            {confirming === 'contents'
              ? `Delete all ${images.length} image${images.length === 1 ? '' : 's'} in ${
                  isUnsorted ? 'Unsorted' : folder!.name
                }? This cannot be undone.`
              : `Remove the folder "${folder!.name}"? Its images move to Unsorted.`}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (confirming === 'contents') onDeleteFolderContents(folder?.id || '', ids);
                else onDeleteFolderOnly(folder!.id);
                setConfirming(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 hover:bg-red-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-[10px] uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards — nothing rendered while collapsed. */}
      {!collapsed && (
        images.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-gray-600">Empty.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isSelected={selectedIds.has(image.id)}
                onToggleSelection={onToggleSelection}
                onClick={onImageClick}
                onDelete={onDeleteOne}
                onStop={onStop}
                onToggleFavorite={onToggleFavorite}
                onRetry={onRetry}
              />
            ))}
          </div>
        )
      )}
    </section>
  );
};
