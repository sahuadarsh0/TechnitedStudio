
import React from 'react';
import { AIModel } from '../../types';
import { getModelCapabilities } from '../../constants';
import { TextWorkflowIcon, ImageWorkflowIcon } from '../Icons';

interface WorkflowSelectorProps {
  isImageToImage: boolean;
  isGenerating: boolean;
  onChange: (isImageToImage: boolean) => void;
  selectedModel: AIModel;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ isImageToImage, isGenerating, onChange, selectedModel }) => {
  const editLabel = getModelCapabilities(selectedModel).editLabel;

  return (
    <section className="relative z-10">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Mode</label>
      <div className="relative p-1.5 bg-black/40 rounded-xl border border-white/5 flex gap-1" role="tablist" aria-label="Generation mode">

        {/* Create (Text-to-Image) */}
        <button
          role="tab"
          aria-selected={!isImageToImage}
          aria-label="Create mode: generate from a text prompt"
          onClick={() => onChange(false)}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-laserBlue/60 ${
            !isImageToImage
              ? 'bg-gradient-to-b from-laserBlue/10 to-transparent border border-laserBlue/30 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)]'
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {!isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserBlue shadow-[0_0_10px_#00f0ff] rounded-b-full"></div>
          )}

          <TextWorkflowIcon className={`w-5 h-5 transition-colors duration-300 ${!isImageToImage ? 'text-laserBlue drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${!isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Create</span>
        </button>

        {/* Reference (Image-to-Image) */}
        <button
          role="tab"
          aria-selected={isImageToImage}
          aria-label="Reference mode: generate from reference images"
          onClick={() => onChange(true)}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-laserPurple/60 ${
            isImageToImage
              ? 'bg-gradient-to-b from-laserPurple/10 to-transparent border border-laserPurple/30 shadow-[0_0_20px_-5px_rgba(112,0,255,0.3)]'
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserPurple shadow-[0_0_10px_#7000ff] rounded-b-full"></div>
          )}

          <ImageWorkflowIcon className={`w-5 h-5 transition-colors duration-300 ${isImageToImage ? 'text-laserPurple drop-shadow-[0_0_5px_rgba(112,0,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Reference</span>
        </button>

      </div>

      {/* Active edit-model hint when in Reference mode */}
      {isImageToImage && (
        <p className="mt-2 text-[9px] font-mono text-laserPurple/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-laserPurple shadow-[0_0_5px_#7000ff]"></span>
          Editing with {editLabel}
        </p>
      )}
    </section>
  );
};
