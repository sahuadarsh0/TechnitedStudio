
import React, { useState } from 'react';
import { GenerationSettings } from '../types';
import { getModelCapabilities } from '../constants';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import { ControlPanelHeader } from './control-panel/ControlPanelHeader';
import { ModelSelector } from './control-panel/ModelSelector';
import { WorkflowSelector } from './control-panel/WorkflowSelector';
import { ReferenceImageManager } from './control-panel/ReferenceImageManager';
import { OutputSettings } from './control-panel/OutputSettings';
import { DirectorsControl } from './control-panel/DirectorsControl';
import { DirectorPresets } from './control-panel/DirectorPresets';
import { usePresets } from '../hooks/usePresets';
import { useUploadHistory } from '../hooks/useUploadHistory';
import { DirectorPreset } from '../services/presetService';

interface ControlPanelProps {
  settings: GenerationSettings;
  setSettings: (settings: GenerationSettings) => void;
  isGenerating: boolean;
  onReferenceImageUpload: (files: File[]) => void;
  referenceImages: string[];
  onRemoveReferenceImage: (index: number) => void;
  onAddReferenceUrl?: (dataUrl: string) => void;
  /** Opens the AWS Bedrock credential modal (owned by App). */
  onOpenBedrockKey?: () => void;
  /** Files a reference image into the gallery so Bedrock services can reach it. */
  onSendReferenceToGrid?: (dataUrl: string) => void;
  /** True once a Bedrock key is stored. */
  bedrockUnlocked?: boolean;
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
  onAddReferenceUrl,
  onOpenBedrockKey,
  onSendReferenceToGrid,
  bedrockUnlocked = false,
  isOpen,
  onClose
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const { presets, addPreset, removePreset } = usePresets();
  const { uploadHistory, remember, forget } = useUploadHistory();

  const handleChange = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  // Persist uploads to history (as data URLs) in addition to passing them up.
  const handleReferenceUpload = (files: File[]) => {
    onReferenceImageUpload(files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) remember(e.target.result as string, file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleApplyPreset = (preset: DirectorPreset) => {
    setSettings({
      ...settings,
      cinematic: preset.cinematic,
      ...(preset.aspectRatio ? { aspectRatio: preset.aspectRatio } : {}),
      ...(preset.resolution ? { resolution: preset.resolution } : {}),
    });
  };

  const handleSavePreset = (name: string) => {
    addPreset(name, settings.cinematic, { aspectRatio: settings.aspectRatio, resolution: settings.resolution });
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
          rawPromptOnly={settings.rawPromptOnly}
          onToggleRawPromptOnly={() => handleChange('rawPromptOnly', !settings.rawPromptOnly)}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          onOpenBedrockKey={onOpenBedrockKey}
          bedrockUnlocked={bedrockUnlocked}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* PRIMARY: Model + Mode on a glass surface */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 space-y-6 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
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
              selectedModel={settings.model}
            />

            {settings.isImageToImage && (
              <ReferenceImageManager 
                images={referenceImages}
                onUpload={handleReferenceUpload}
                onRemove={onRemoveReferenceImage}
                maxImages={getModelCapabilities(settings.model).maxReferenceImages}
                consistencyLock={settings.consistencyLock}
                onToggleConsistency={(val) => handleChange('consistencyLock', val)}
                uploadHistory={uploadHistory}
                onPickFromHistory={onAddReferenceUrl}
                onForgetHistory={forget}
                onSendToGrid={onSendReferenceToGrid}
              />
            )}
          </div>

          {/* SECONDARY: Director's Engine (standard card) */}
          <DirectorsControl 
            settings={settings.cinematic} 
            onChange={(cinematic) => handleChange('cinematic', cinematic)}
          />

          {/* Director Presets (save / apply named looks) */}
          <DirectorPresets
            presets={presets}
            currentCinematic={settings.cinematic}
            currentOutput={{ aspectRatio: settings.aspectRatio, resolution: settings.resolution }}
            onApply={handleApplyPreset}
            onSave={handleSavePreset}
            onDelete={removePreset}
          />

          {/* TERTIARY: Output (collapsible, compact) */}
          <OutputSettings
            settings={settings}
            isGenerating={isGenerating}
            onAspectChange={(ratio) => handleChange('aspectRatio', ratio)}
            onResolutionChange={(res) => handleChange('resolution', res)}
            onBatchChange={(size) => handleChange('batchSize', size)}
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
