
import React from 'react';
import { AIModel } from '../../types';
import { MODELS } from '../../constants';
import { GoogleIcon } from '../Icons';

interface ModelSelectorProps {
  selectedModel: AIModel;
  isGenerating: boolean;
  onChange: (model: AIModel) => void;
  googleSearchEnabled: boolean;
  onGoogleSearchChange: (enabled: boolean) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  isGenerating, 
  onChange,
  googleSearchEnabled,
  onGoogleSearchChange
}) => {
  return (
    <section className="relative z-10">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Image Model</label>
      <div className="space-y-3">
        {MODELS.map((model) => {
           const isSelected = selectedModel === model.id;
           const isPro = model.id === AIModel.PRO;

           return (
            <div 
              key={model.id}
              className={`w-full text-left rounded-lg border transition-all duration-200 overflow-hidden ${isSelected ? 'bg-laserBlue/10 border-laserBlue shadow-neon' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
            >
               <button
                  onClick={() => onChange(model.id)}
                  // Removed disabled={isGenerating} to allow queue configuration
                  className="w-full p-3 text-left focus:outline-none flex flex-col gap-2"
               >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{model.label}</span>
                    
                    <div className="flex items-center gap-3">
                        {/* Grounding Toggle (Pro Only) - Moved to Top Row */}
                        {isSelected && isPro && (
                           <div 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 onGoogleSearchChange(!googleSearchEnabled);
                             }}
                             className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border ${
                                googleSearchEnabled 
                                ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-100' 
                                : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-white/10 scale-95 grayscale opacity-50 hover:opacity-100'
                             }`}
                             title={googleSearchEnabled ? "Grounding: ON" : "Grounding: OFF"}
                           >
                                <GoogleIcon className="w-4 h-4" />
                           </div>
                        )}
                        
                        {/* Selection Indicator */}
                        {isSelected && <div className="w-2 h-2 rounded-full bg-laserBlue shadow-neon"></div>}
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between w-full gap-2">
                      <p className={`text-[10px] text-gray-500 leading-tight transition-opacity ${isSelected && isPro ? 'opacity-100 max-w-[75%]' : 'opacity-80'}`}>
                          {model.description}
                      </p>
                  </div>
               </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
