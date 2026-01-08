
import React, { useState } from 'react';
import { AspectRatio } from '../../types';
import { ASPECT_RATIOS } from '../../constants';
import { ChevronDownIcon } from '../Icons';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  isGenerating: boolean;
  onChange: (ratio: AspectRatio) => void;
}

// Helper to render aspect ratio icon
const AspectRatioIcon = ({ ratio }: { ratio: AspectRatio }) => {
  let width = "w-3";
  let height = "h-3";
  
  switch(ratio) {
    case AspectRatio.WIDE: width = "w-5"; height = "h-3"; break; // 16:9
    case AspectRatio.TALL: width = "w-3"; height = "h-5"; break; // 9:16
    case AspectRatio.LANDSCAPE: width = "w-4"; height = "h-3"; break; // 4:3
    case AspectRatio.PORTRAIT: width = "w-3"; height = "h-4"; break; // 3:4
    case AspectRatio.CINEMATIC: width = "w-6"; height = "h-2.5"; break; // 21:9
    case AspectRatio.SQUARE: width = "w-3"; height = "h-3"; break; // 1:1
    case AspectRatio.PHOTO_LANDSCAPE: width = "w-4"; height = "h-2.5"; break; // 3:2
    case AspectRatio.PHOTO_PORTRAIT: width = "w-2.5"; height = "h-4"; break; // 2:3
  }

  return <div className={`border ${width} ${height} rounded-[1px] border-current opacity-80`}></div>;
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, isGenerating, onChange }) => {
  const [isAspectRatioMenuOpen, setIsAspectRatioMenuOpen] = useState(false);

  return (
    <section className="relative z-30">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Frame Ratio</label>
      <div className="relative">
          <button
            onClick={() => setIsAspectRatioMenuOpen(!isAspectRatioMenuOpen)}
            // Removed disabled={isGenerating}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-300 group bg-black/40 ${isAspectRatioMenuOpen ? 'border-laserBlue/50 shadow-[0_0_10px_rgba(0,240,255,0.15)] ring-1 ring-laserBlue/20' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
          >
              <div className="flex items-center gap-3">
                   <div className={`flex items-center justify-center w-6 h-6 rounded bg-white/5 border ${isAspectRatioMenuOpen ? 'border-laserBlue text-laserBlue' : 'border-white/10 text-gray-500 group-hover:text-gray-300'}`}>
                      <AspectRatioIcon ratio={selectedRatio} />
                   </div>
                   <div className="flex flex-col items-start">
                       <span className={`text-xs font-mono tracking-wider font-bold ${isAspectRatioMenuOpen ? 'text-white' : 'text-gray-300'}`}>{selectedRatio}</span>
                   </div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isAspectRatioMenuOpen ? 'rotate-180 text-white' : ''}`} />
          </button>
          
          {isAspectRatioMenuOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAspectRatioMenuOpen(false)}></div>
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#0F0F0F] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-xl">
                  <div className="p-1.5 grid grid-cols-2 gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {ASPECT_RATIOS.map((ratio) => (
                          <button
                              key={ratio}
                              onClick={() => {
                                  onChange(ratio as AspectRatio);
                                  setIsAspectRatioMenuOpen(false);
                              }}
                              className={`flex items-center gap-2 px-2 py-2 rounded transition-all border ${
                                  selectedRatio === ratio 
                                  ? 'bg-laserBlue/10 border-laserBlue/30 text-white' 
                                  : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/10'
                              }`}
                          >
                              <div className={`flex items-center justify-center w-5 h-5 rounded border bg-black/20 ${selectedRatio === ratio ? 'border-laserBlue text-laserBlue' : 'border-white/10 text-gray-600'}`}>
                                  <div className="scale-75 origin-center">
                                      <AspectRatioIcon ratio={ratio as AspectRatio} />
                                  </div>
                              </div>
                              <span className="text-[10px] font-mono tracking-wide">{ratio}</span>
                          </button>
                      ))}
                  </div>
              </div>
              </>
          )}
      </div>
    </section>
  );
};
