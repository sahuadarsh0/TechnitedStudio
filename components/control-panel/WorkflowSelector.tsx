
import React from 'react';

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
          disabled={isGenerating}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group disabled:opacity-50 overflow-hidden ${
            !isImageToImage 
              ? 'bg-gradient-to-b from-laserBlue/10 to-transparent border border-laserBlue/30 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)]' 
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {!isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserBlue shadow-[0_0_10px_#00f0ff] rounded-b-full"></div>
          )}
          
          <svg className={`w-5 h-5 transition-colors duration-300 ${!isImageToImage ? 'text-laserBlue drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${!isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Text</span>
        </button>

        {/* Img2Img Mode Button */}
        <button
          onClick={() => onChange(true)}
          disabled={isGenerating}
          className={`relative flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group disabled:opacity-50 overflow-hidden ${
            isImageToImage 
              ? 'bg-gradient-to-b from-laserPurple/10 to-transparent border border-laserPurple/30 shadow-[0_0_20px_-5px_rgba(112,0,255,0.3)]' 
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          {isImageToImage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-laserPurple shadow-[0_0_10px_#7000ff] rounded-b-full"></div>
          )}

          <svg className={`w-5 h-5 transition-colors duration-300 ${isImageToImage ? 'text-laserPurple drop-shadow-[0_0_5px_rgba(112,0,255,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isImageToImage ? 'text-white text-glow' : 'text-gray-600 group-hover:text-gray-400'}`}>Img 2 Img</span>
        </button>

      </div>
    </section>
  );
};
