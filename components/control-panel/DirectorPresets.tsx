
import React, { useState } from 'react';
import { CinematicSettings, GenerationSettings } from '../../types';
import { DirectorPreset } from '../../services/presetService';
import { SaveIcon, TrashIcon, CameraIcon } from '../Icons';

interface DirectorPresetsProps {
  presets: DirectorPreset[];
  currentCinematic: CinematicSettings;
  currentOutput: Pick<GenerationSettings, 'aspectRatio' | 'resolution'>;
  onApply: (preset: DirectorPreset) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

export const DirectorPresets: React.FC<DirectorPresetsProps> = ({
  presets,
  onApply,
  onSave,
  onDelete,
}) => {
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');

  const commitSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
    setIsNaming(false);
  };

  return (
    <section className="relative z-10 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <CameraIcon className="w-3.5 h-3.5" /> Presets
        </span>
        {!isNaming && (
          <button
            onClick={() => setIsNaming(true)}
            aria-label="Save current settings as a preset"
            className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-laserBlue hover:text-white px-2 py-1 rounded hover:bg-laserBlue/10 transition-colors"
          >
            <SaveIcon className="w-3 h-3" /> Save
          </button>
        )}
      </div>

      {isNaming && (
        <div className="flex items-center gap-2 mb-3 animate-fadeIn">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitSave(); if (e.key === 'Escape') { setIsNaming(false); setName(''); } }}
            placeholder="Preset name…"
            aria-label="Preset name"
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-laserBlue/50"
          />
          <button onClick={commitSave} className="text-[9px] uppercase font-bold text-black bg-laserBlue px-2.5 py-1.5 rounded hover:scale-105 transition-transform">Save</button>
          <button onClick={() => { setIsNaming(false); setName(''); }} aria-label="Cancel" className="text-gray-500 hover:text-white text-xs px-1">✕</button>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="text-[10px] text-gray-600 leading-relaxed">No presets yet. Tune the Director's Engine, then Save to reuse it later.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <div key={p.id} className="group flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg pl-2.5 pr-1 py-1 hover:border-laserBlue/40 transition-colors">
              <button onClick={() => onApply(p)} className="text-[10px] text-gray-300 group-hover:text-white" title={`Apply preset: ${p.name}`}>
                {p.name}
              </button>
              <button
                onClick={() => onDelete(p.id)}
                aria-label={`Delete preset ${p.name}`}
                className="p-0.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
