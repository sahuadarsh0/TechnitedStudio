
import React, { useState } from 'react';
import { GenerationSettings, AspectRatio, Resolution, AIModel } from '../types';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import { ControlPanelHeader } from './control-panel/ControlPanelHeader';
import { ModelSelector } from './control-panel/ModelSelector';
import { WorkflowSelector } from './control-panel/WorkflowSelector';
import { ReferenceImageManager } from './control-panel/ReferenceImageManager';
import { AspectRatioSelector } from './control-panel/AspectRatioSelector';
import { ResolutionSelector } from './control-panel/ResolutionSelector';
import { BatchSizeSelector } from './control-panel/BatchSizeSelector';
import { DirectorsControl } from './control-panel/DirectorsControl';

interface ControlPanelProps {
  settings: GenerationSettings;
  setSettings: (settings: GenerationSettings) => void;
  isGenerating: boolean;
  onReferenceImageUpload: (files: File[]) => void;
  referenceImages: string[];
  onRemoveReferenceImage: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  setSettings,
  isGenerating,
  onReferenceImageUpload,
  referenceImages,
  onRemoveReferenceImage,
  isOpen,
  onClose
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const handleChange = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-full sm:w-96 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:z-0 shadow-2xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  
  const overlay = isOpen ? (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={onClose}></div>
  ) : null;

  return (
    <>
      {overlay}
      <div className={`${mobileClasses} h-full flex flex-col bg-black/80 md:bg-black/40 backdrop-blur-2xl border-r border-white/10`}>
        <ControlPanelHeader 
          enableSounds={settings.enableSounds}
          onToggleSounds={() => handleChange('enableSounds', !settings.enableSounds)}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <ModelSelector 
            selectedModel={settings.model} 
            isGenerating={isGenerating} 
            onChange={(model) => handleChange('model', model)}
            googleSearchEnabled={settings.googleSearch}
            onGoogleSearchChange={(val) => handleChange('googleSearch', val)}
          />

          <WorkflowSelector 
            isImageToImage={settings.isImageToImage} 
            isGenerating={isGenerating} 
            onChange={(val) => handleChange('isImageToImage', val)} 
          />
          
          <DirectorsControl 
            settings={settings.cinematic} 
            onChange={(cinematic) => handleChange('cinematic', cinematic)}
          />

          {settings.isImageToImage && (
            <ReferenceImageManager 
              images={referenceImages}
              onUpload={onReferenceImageUpload}
              onRemove={onRemoveReferenceImage}
            />
          )}

          <AspectRatioSelector 
            selectedRatio={settings.aspectRatio} 
            isGenerating={isGenerating} 
            onChange={(ratio) => handleChange('aspectRatio', ratio)} 
          />

          <ResolutionSelector 
            selectedResolution={settings.resolution} 
            isGenerating={isGenerating} 
            onChange={(res) => handleChange('resolution', res)}
            selectedModel={settings.model}
          />

          <BatchSizeSelector 
            batchSize={settings.batchSize} 
            isGenerating={isGenerating} 
            onChange={(size) => handleChange('batchSize', size)} 
          />
        </div>
        
        <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md text-center">
            <p className="text-[10px] text-gray-600 font-mono leading-relaxed">
             &copy; 2026 TECHNITED MINDS
            </p>
        </div>
      </div>
      
      {/* API Key Modal */}
      <ApiKeySettingsModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        onSuccess={() => {/* Optional: Trigger global refresh if needed */}} 
      />
    </>
  );
};
export default ControlPanel;
