
import React, { useState } from 'react';
import { GeneratedImage, Resolution, AspectRatio, AIModel, CinematicSettings } from '../../types';
import { ASPECT_RATIOS, MODELS } from '../../constants';
import { DirectorsControl } from '../control-panel/DirectorsControl';

interface InspectionSidebarProps {
  image: GeneratedImage;
  isLoading: boolean;
  onRegenerate: (image: GeneratedImage, newSettings: Partial<GeneratedImage['settings']>) => void;
  onClose: () => void;
}

export const InspectionSidebar: React.FC<InspectionSidebarProps> = ({ image, isLoading, onRegenerate, onClose }) => {
  const [copied, setCopied] = useState(false);
  const modelLabel = MODELS.find(m => m.id === image.settings.model)?.label || image.settings.model;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgradeTo4K = () => {
    onRegenerate(image, { 
      resolution: Resolution.RES_4K,
      model: AIModel.PRO
    });
    onClose();
  };

  const handleChangeAspectRatio = (ratio: AspectRatio) => {
    onRegenerate(image, { aspectRatio: ratio });
    onClose();
  };

  const handleCinematicChange = (newCinematic: CinematicSettings) => {
      onRegenerate(image, { cinematic: newCinematic });
      // We don't close immediately here to allow tweaking
  };

  return (
    <div className="w-full md:w-96 bg-[#050505] border-t md:border-t-0 md:border-l border-white/5 p-6 md:p-8 flex flex-col shadow-2xl h-[45%] md:h-full overflow-y-auto relative z-20 order-2 custom-scrollbar">
      <h3 className="text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 sticky top-0 bg-[#050505] pb-2 z-10">
        <span className="w-1 h-6 bg-laserBlue rounded-full shadow-[0_0_8px_#00f0ff]"></span>
        Asset Data
      </h3>
      
      <div className="space-y-6 md:space-y-8 flex-1">
        {image.sources && image.sources.length > 0 && (
          <div className="bg-white/5 rounded-lg border border-white/5 p-4 shadow-inner">
             <h4 className="text-[10px] font-mono text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                Verified Sources
             </h4>
             <div className="flex flex-col gap-2">
                {image.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 rounded hover:bg-white/10 border border-transparent hover:border-green-500/30 transition-all group"
                  >
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-green-400 shrink-0"></div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate group-hover:text-green-300 font-medium">{source.title}</p>
                        <p className="text-[10px] text-gray-600 truncate group-hover:text-gray-500">{new URL(source.uri).hostname}</p>
                     </div>
                     <span className="text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                ))}
             </div>
          </div>
        )}

        <div className="group">
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest group-hover:text-laserBlue transition-colors">Prompt Signature</h4>
            <button onClick={handleCopyPrompt} className={`text-[9px] uppercase font-mono tracking-wider px-2 py-1 rounded border transition-all ${copied ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}>
              {copied ? 'COPIED' : 'COPY TEXT'}
            </button>
          </div>
          <div className="p-3 md:p-4 bg-white/5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-gray-300 text-sm leading-relaxed font-light max-h-32 md:max-h-48 overflow-y-auto custom-scrollbar">{image.prompt}</p>
          </div>
        </div>
        
        {/* NEW: Director's Control for Editing */}
        <DirectorsControl 
            settings={image.settings.cinematic} 
            onChange={handleCinematicChange} 
        />
        
        {/* Only show Generate/Apply button if we are in edit mode context, but for sidebar it's auto-apply or re-gen. 
           We can add a specific button to trigger re-gen if the user changes settings, 
           or assume the `onRegenerate` call inside the control (which we mapped) handles it.
           However, onRegenerate in App.tsx triggers immediately. 
        */}
        <div className="text-center">
             <p className="text-[9px] text-gray-600 italic">
                Modifying Director's settings triggers immediate re-generation.
             </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Resolution</h4>
            <p className="text-white font-medium text-sm flex items-center gap-2">
              {image.settings.resolution}
              {image.settings.resolution !== Resolution.RES_4K && (
                <button onClick={handleUpgradeTo4K} disabled={isLoading} className="text-[8px] bg-laserPurple/10 text-laserPurple border border-laserPurple/30 px-1.5 py-0.5 rounded hover:bg-laserPurple/20 uppercase tracking-wider transition-colors">
                  UPSCALER
                </button>
              )}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Aspect Ratio</h4>
            <p className="text-white font-medium text-sm">{image.settings.aspectRatio}</p>
          </div>
          
          <div className="col-span-2 mt-2">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">AI Architecture</h4>
            <p className="text-laserBlue font-mono text-sm tracking-tight">{modelLabel}</p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Re-Frame Asset</h4>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.slice(0, 6).map(ratio => (
              <button 
                key={ratio} 
                onClick={() => handleChangeAspectRatio(ratio as AspectRatio)} 
                disabled={isLoading || ratio === image.settings.aspectRatio} 
                className={`px-3 py-1.5 text-[10px] rounded border transition-all duration-300 ${ratio === image.settings.aspectRatio ? 'border-laserBlue text-laserBlue bg-laserBlue/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30 hover:bg-white/5'}`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {image.generationTime && (
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-mono uppercase tracking-widest">Generation Time</span>
              <span className="text-xs font-mono text-laserBlue">{image.generationTime.toFixed(2)}s</span>
            </div>
          </div>
        )}
        
        <div className="pb-8"></div>
      </div>
    </div>
  );
};
