
import React from 'react';
import { Resolution, AIModel } from '../../types';
import { RESOLUTIONS } from '../../constants';

interface ResolutionSelectorProps {
  selectedResolution: Resolution;
  isGenerating: boolean;
  onChange: (resolution: Resolution) => void;
  selectedModel: AIModel;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ selectedResolution, isGenerating, onChange, selectedModel }) => {
  const isSupported = selectedModel === AIModel.PRO;

  return (
    <section className="relative z-20">
      <div className="flex justify-between items-center mb-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Resolution Protocols</label>
        {!isSupported && (
            <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                PRO ONLY
            </span>
        )}
      </div>
      <div className={`flex p-1 bg-black/40 rounded-lg border border-white/5 relative transition-opacity duration-300 ${!isSupported ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
         {/* Background Slider */}
        {RESOLUTIONS.map((res) => (
          <button
            key={res}
            onClick={() => onChange(res)}
            disabled={!isSupported} // Only disabled if model doesn't support it, not isGenerating
            className={`flex-1 py-2.5 rounded-md text-[10px] font-mono tracking-widest transition-all duration-300 disabled:opacity-50 relative overflow-hidden ${
              selectedResolution === res 
                ? 'text-white font-bold shadow-lg' 
                : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {selectedResolution === res && (
               <div className="absolute inset-0 bg-laserBlue/20 border border-laserBlue/50 rounded-md shadow-[inset_0_0_10px_rgba(0,240,255,0.3)]"></div>
            )}
            <span className="relative z-10">{res}</span>
          </button>
        ))}
      </div>
      {!isSupported && (
        <p className="text-[9px] text-gray-600 mt-2 font-mono">
            Nano Banana is optimized for standard resolution. Switch to Pro for 2K/4K.
        </p>
      )}
    </section>
  );
};
