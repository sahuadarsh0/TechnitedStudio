
import React from 'react';
import { TextWorkflowIcon, ImageWorkflowIcon } from '../Icons';

interface WorkflowSelectorProps {
  isImageToImage: boolean;
  isGenerating: boolean;
  onChange: (isImageToImage: boolean) => void;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ isImageToImage, isGenerating, onChange }) => {
  return (
    <section className="relative z-10">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Generation Workflow</label>
      <div className="relative p-1.5 bg-black/40 rounded-xl border border-white/5 flex gap-1">
        
        {/* Text Mode Button */}
        <button
          onClick={() => onChange(false)}
          // Removed disabled={isGenerating}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group overflow-hidden ${
            !isImageToImage 
              ? 'bg-gradient-to-b from-laserBlue/10 to-transparent border border-laserBlue/30 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)]' 
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {!isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserBlue shadow-[0_0_10px_#00f0ff] rounded-b-full"></div>
          )}
          
          <TextWorkflowIcon className={`w-5 h-5 transition-colors duration-300 ${!isImageToImage ? 'text-laserBlue drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${!isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Text</span>
        </button>

        {/* Img2Img Mode Button */}
        <button
          onClick={() => onChange(true)}
          // Removed disabled={isGenerating}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group overflow-hidden ${
            isImageToImage 
              ? 'bg-gradient-to-b from-laserPurple/10 to-transparent border border-laserPurple/30 shadow-[0_0_20px_-5px_rgba(112,0,255,0.3)]' 
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserPurple shadow-[0_0_10px_#7000ff] rounded-b-full"></div>
          )}

          <ImageWorkflowIcon className={`w-5 h-5 transition-colors duration-300 ${isImageToImage ? 'text-laserPurple drop-shadow-[0_0_5px_rgba(112,0,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Img 2 Img</span>
        </button>

      </div>
    </section>
  );
};
