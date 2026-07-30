import React, { useState } from 'react';
import { Folder } from '../../types';
import { FolderIcon, FolderPlusIcon, CheckIcon, CloseIcon, ChevronDownIcon, ChevronRightIcon } from '../Icons';

interface FolderBarProps {
  folders: Folder[];
  /** How many images are currently selected (drives the "move to" affordance). */
  selectedCount: number;
  groupByFolder: boolean;
  onToggleGrouping: (grouped: boolean) => void;
  onCreateFolder: (name: string) => void;
  onMoveSelected: (folderId: string | null) => void;
  onCollapseAll: (collapsed: boolean) => void;
}

/**
 * Toolbar strip for folder management: create a folder, toggle grouped view,
 * collapse everything, and file the current selection into a folder.
 */
export const FolderBar: React.FC<FolderBarProps> = ({
  folders,
  selectedCount,
  groupByFolder,
  onToggleGrouping,
  onCreateFolder,
  onMoveSelected,
  onCollapseAll,
}) => {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [movingOpen, setMovingOpen] = useState(false);

  const commit = () => {
    if (name.trim()) onCreateFolder(name.trim());
    setName('');
    setCreating(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap px-2 md:px-8 pt-3 pb-1">
      {/* Grouping toggle */}
      <button
        onClick={() => onToggleGrouping(!groupByFolder)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest border transition-colors ${
          groupByFolder
            ? 'text-laserBlue border-laserBlue/30 bg-laserBlue/10'
            : 'text-gray-500 border-white/5 hover:text-white hover:border-white/20'
        }`}
        title="Group the gallery by folder"
      >
        <FolderIcon className="w-3 h-3" strokeWidth={2} />
        Folders
      </button>

      {/* Create */}
      {creating ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setCreating(false); setName(''); }
            }}
            placeholder="Folder name"
            className="w-36 bg-black/40 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none border border-white/10 focus:border-laserBlue/50 placeholder-gray-600"
          />
          <button onClick={commit} className="p-1.5 text-emerald-400 hover:text-emerald-300" aria-label="Create folder">
            <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
          <button onClick={() => { setCreating(false); setName(''); }} className="p-1.5 text-gray-500 hover:text-white" aria-label="Cancel">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-gray-500 border border-white/5 hover:text-white hover:border-white/20 transition-colors"
        >
          <FolderPlusIcon className="w-3 h-3" strokeWidth={2} />
          New Folder
        </button>
      )}

      {/* Collapse controls, only meaningful when grouped */}
      {groupByFolder && folders.length > 0 && (
        <>
          <button
            onClick={() => onCollapseAll(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-gray-500 border border-white/5 hover:text-white hover:border-white/20 transition-colors"
            title="Collapse all folders"
          >
            <ChevronRightIcon className="w-3 h-3" />
            Collapse
          </button>
          <button
            onClick={() => onCollapseAll(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-gray-500 border border-white/5 hover:text-white hover:border-white/20 transition-colors"
            title="Expand all folders"
          >
            <ChevronDownIcon className="w-3 h-3" />
            Expand
          </button>
        </>
      )}

      {/* Move selection */}
      {selectedCount > 0 && (
        <div className="relative ml-auto">
          <button
            onClick={() => setMovingOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-laserBlue border border-laserBlue/30 bg-laserBlue/10 hover:bg-laserBlue/20 transition-colors"
          >
            <FolderIcon className="w-3 h-3" strokeWidth={2} />
            Move {selectedCount}
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {movingOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 max-h-64 overflow-y-auto rounded-xl bg-[#15151a] border border-white/10 shadow-2xl py-1.5 animate-fadeIn">
              <button
                onClick={() => { onMoveSelected(null); setMovingOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Unsorted
              </button>
              {folders.length > 0 && <div className="my-1 border-t border-white/5" />}
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { onMoveSelected(f.id); setMovingOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color || '#6b7280' }} />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
              {folders.length === 0 && (
                <p className="px-3.5 py-2 text-[10px] text-gray-600">No folders yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
