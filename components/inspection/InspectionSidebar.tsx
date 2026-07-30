
import React, { useState } from 'react';
import { GeneratedImage, Resolution, AspectRatio, AIModel, CinematicSettings } from '../../types';
import { ASPECT_RATIOS, MODELS } from '../../constants';
import { DirectorsControl } from '../control-panel/DirectorsControl';
import { downloadImageAs, ExportFormat } from '../../services/exportService';
import { EraserIcon, UpscaleIcon, HistoryIcon, StarIcon, DownloadIcon, BedrockIcon, ShieldIcon } from '../Icons';

interface InspectionSidebarProps {
  image: GeneratedImage;
  isLoading: boolean;
  onRegenerate: (image: GeneratedImage, newSettings: Partial<GeneratedImage['settings']>) => void;
  onClose: () => void;
  onApplyTool?: (image: GeneratedImage, tool: 'removeBg' | 'upscale') => void;
  onUsePrompt?: (image: GeneratedImage) => void;
  onToggleFavorite?: (id: string) => void;
  onOpenBedrock?: (image: GeneratedImage) => void;
  onOpenCleanExport?: (image: GeneratedImage) => void;
}

export const InspectionSidebar: React.FC<InspectionSidebarProps> = ({ image, isLoading, onRegenerate, onClose, onApplyTool, onUsePrompt, onToggleFavorite, onOpenBedrock, onOpenCleanExport }) => {
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

      {/* Quick Tools */}
      <div className="flex flex-wrap gap-2 mb-6">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(image.id)}
            aria-pressed={!!image.favorite}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
              image.favorite ? 'bg-amber-400/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
            }`}
          >
            <StarIcon className="w-3.5 h-3.5" filled={!!image.favorite} /> {image.favorite ? 'Favorited' : 'Favorite'}
          </button>
        )}
        {onUsePrompt && (
          <button
            onClick={() => { onUsePrompt(image); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30 text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Send this prompt and settings back to the dock"
          >
            <HistoryIcon className="w-3.5 h-3.5" /> Use Prompt
          </button>
        )}
        {onApplyTool && (
          <>
            <button
              onClick={() => { onApplyTool(image, 'removeBg'); onClose(); }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-gray-400 hover:text-laserBlue hover:border-laserBlue/30 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
              title="Remove background (transparent PNG)"
            >
              <EraserIcon className="w-3.5 h-3.5" /> Remove BG
            </button>
            <button
              onClick={() => { onApplyTool(image, 'upscale'); onClose(); }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-gray-400 hover:text-laserPurple hover:border-laserPurple/30 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
              title="Upscale to higher resolution"
            >
              <UpscaleIcon className="w-3.5 h-3.5" /> Upscale
            </button>
          </>
        )}
        {onOpenBedrock && (
          <button
            onClick={() => onOpenBedrock(image)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900] hover:bg-[#ff9900]/20 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            title="Bedrock Stability AI services: upscale, inpaint, outpaint, erase, recolor, style transfer"
          >
            <BedrockIcon className="w-3.5 h-3.5" /> Bedrock
          </button>
        )}
        {onOpenCleanExport && (
          <button
            onClick={() => onOpenCleanExport(image)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Export with all metadata stripped (EXIF, IPTC, XMP, C2PA)"
          >
            <ShieldIcon className="w-3.5 h-3.5" /> Clean Export
          </button>
        )}
      </div>
      
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

        {/* Export formats */}
        <div>
          <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <DownloadIcon className="w-3.5 h-3.5" /> Export
          </h4>
          <div className="flex gap-2">
            {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => downloadImageAs(image, fmt).catch(console.warn)}
                className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-laserBlue/40 hover:bg-laserBlue/5 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Re-Frame Asset</h4>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.filter(r => r !== AspectRatio.AUTO).slice(0, 6).map(ratio => (
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

        {/* Provenance: Google embeds SynthID watermark + C2PA Content Credentials */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-laserBlue/60"></span>
            <span className="text-[9px] font-mono uppercase tracking-widest">AI-generated · SynthID + C2PA credentials embedded</span>
          </div>
        </div>
        
        <div className="pb-8"></div>
      </div>
    </div>
  );
};
