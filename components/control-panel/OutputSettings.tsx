
import React, { useState } from 'react';
import { GenerationSettings, AspectRatio, Resolution } from '../../types';
import { estimateCost, getAspectRatiosForModel } from '../../constants';
import { AspectRatioSelector } from './AspectRatioSelector';
import { ResolutionSelector } from './ResolutionSelector';
import { BatchSizeSelector } from './BatchSizeSelector';
import { SettingsIcon, ChevronDownIcon } from '../Icons';

interface OutputSettingsProps {
  settings: GenerationSettings;
  isGenerating: boolean;
  onAspectChange: (ratio: AspectRatio) => void;
  onResolutionChange: (res: Resolution) => void;
  onBatchChange: (size: number) => void;
}

/**
 * Tertiary "Output" group: collapses Frame Ratio, Resolution, and Batch into a
 * single compact section to reduce the monotony of identical stacked cards.
 */
export const OutputSettings: React.FC<OutputSettingsProps> = ({
  settings,
  isGenerating,
  onAspectChange,
  onResolutionChange,
  onBatchChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="relative z-10 rounded-xl border border-white/5 bg-white/[0.02]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-laserBlue/40 rounded-xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-white transition-colors">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Output</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-gray-600">{settings.aspectRatio} · {settings.resolution} · {settings.batchSize}x</span>
          <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 pb-4 pt-1 space-y-5">
          <AspectRatioSelector
            selectedRatio={settings.aspectRatio}
            isGenerating={isGenerating}
            onChange={onAspectChange}
            ratios={getAspectRatiosForModel(settings.model)}
          />
          <ResolutionSelector
            selectedResolution={settings.resolution}
            isGenerating={isGenerating}
            onChange={onResolutionChange}
            selectedModel={settings.model}
          />
          <BatchSizeSelector
            batchSize={settings.batchSize}
            isGenerating={isGenerating}
            onChange={onBatchChange}
          />

          {/* Estimated cost indicator */}
          <div className="flex items-center justify-between px-1 pt-1 border-t border-white/5">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600">Est. cost</span>
            <span className="text-[10px] font-mono text-laserBlue">
              ~${estimateCost(settings.model, settings.resolution, settings.batchSize).toFixed(2)}
              <span className="text-gray-600"> / batch</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
