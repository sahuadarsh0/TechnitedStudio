
import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import ImageGrid from './components/ImageGrid';
import PreviewOverlay from './components/PreviewOverlay';
import WorkspaceControls from './components/WorkspaceControls';
import ApiKeySettingsModal from './components/ApiKeySettingsModal';
import BedrockKeyModal from './components/BedrockKeyModal';
import BedrockPanel from './components/BedrockPanel';
import CleanDownloadModal from './components/CleanDownloadModal';
import ErrorBoundary from './components/ErrorBoundary';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useEditHistory } from './hooks/useEditHistory';
import { usePromptOptimization } from './hooks/usePromptOptimization';
import { usePresets } from './hooks/usePresets';
import { useFolders } from './hooks/useFolders';
import { useFullImage } from './hooks/useFullImage';
import { HoverPreviewProvider } from './contexts/HoverPreviewContext';
import { StudioProvider, useStudio } from './contexts/StudioContext';

import { transcribeAudio } from './services/geminiService';
import { playSound } from './services/soundService';
import { getEffectiveApiKey } from './services/apiKeyService';
import { hasBedrockAccess } from './services/bedrockKeyService';
import { constructCinematicPrompt } from './services/promptComposer';
import { editImage, editImageWithMask } from './services/imageService';
import { resolveFullImage } from './services/storageService';
import { uuid } from './services/uuid';
import { GenerationSettings, GeneratedImage, BedrockModel, BedrockParamValues } from './types';

function StudioApp() {
  const { settings, setSettings, prompt, setPrompt, referenceImages, addReferenceImages, removeReferenceImage } = useStudio();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // API Key State
  const [hasKey, setHasKey] = useState<boolean>(!!getEffectiveApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const { 
    images, isGenerating, error, showSuccessFlash, 
    generate, stopAll, stopImage, removeImages, clearAll, clearError, updateImages, prependImage, toggleFavorite, retryImage, runEdit, runBedrock, assignFolder 
  } = useImageGeneration({ settings });

  const {
    folders, createFolder, renameFolder, toggleCollapse, collapseAll, removeFolder
  } = useFolders();

  // Bedrock + clean-export modal targets
  const [isBedrockKeyOpen, setIsBedrockKeyOpen] = useState(false);
  const [bedrockTarget, setBedrockTarget] = useState<GeneratedImage | null>(null);
  const [exportTarget, setExportTarget] = useState<GeneratedImage | null>(null);
  const [bedrockUnlockedAt, setBedrockUnlockedAt] = useState(0);
  const [bedrockUnlocked, setBedrockUnlocked] = useState<boolean>(hasBedrockAccess());

  // Resolve full-resolution sources for the panels that need real pixels.
  const { src: bedrockSrc } = useFullImage(bedrockTarget);
  const { src: exportSrc } = useFullImage(exportTarget);

  const {
    editingImage, editHistory, historyIndex,
    startEdit, addHistoryItem, undo, redo, exitEdit
  } = useEditHistory();

  const {
    isOptimizing, optimizationReason, optimizationSources, 
    optimize, clearOptimization
  } = usePromptOptimization(settings.enableSounds);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const { promptHistory, recordPrompt, removePrompt } = usePresets();

  // Initial Key Check
  useEffect(() => {
     setHasKey(!!getEffectiveApiKey());
  }, []);

  const handleMicClick = async () => {
    // Keep click sound for mic as requested ("specifically for things like a mic")
    playSound('click', settings.enableSounds);
    if (isRecording) {
      setIsProcessingAudio(true);
      const blob = await stopRecording();
      if (blob) {
        try {
          const text = await transcribeAudio(blob);
          setPrompt((prev) => (prev ? `${prev} ${text}` : text));
          playSound('success', settings.enableSounds);
        } catch (err) {
          console.error("Audio transcription failed");
        }
      }
      setIsProcessingAudio(false);
    } else {
      await startRecording();
    }
  };

  // --- Prompt Alchemy: extracted to services/promptComposer.ts ---

  const handleGenerate = async () => {
    setIsSettingsOpen(false);

    try {
      const enhancedPrompt = constructCinematicPrompt(prompt, settings);

      // Record the raw user prompt (not the enhanced one) to history.
      if (prompt.trim() && !editingImage) {
        recordPrompt(prompt);
      }

      await generate(
        enhancedPrompt, 
        referenceImages.length > 0 ? referenceImages : null, 
        editingImage, 
        (newImages) => {
          if (editingImage) {
            // Only update history state, image is already added to grid by useImageGeneration's incremental update
            addHistoryItem(newImages[0]);
          }
        }
      );
    } catch (e: any) {
      console.error(e);
      if (e.message === 'API_KEY_EXPIRED') {
          setHasKey(false);
      }
    }
  };

  // Immediate regeneration without changing global UI state
  const handleRegenerate = async (image: GeneratedImage, newSettings: Partial<GenerationSettings>) => {
      // Merge Settings carefully to include cinematic updates
      const mergedSettings: GenerationSettings = { 
          ...image.settings, 
          ...newSettings,
          // Handle nested object merge for cinematic if it was passed partially
          cinematic: newSettings.cinematic ? { ...image.settings.cinematic, ...newSettings.cinematic } : image.settings.cinematic,
          batchSize: 1, // STRICTLY ENFORCE 1 IMAGE
          isImageToImage: true // ALWAYS USE IMG2IMG TO PRESERVE SUBJECT
      };

      // Always pass the current image as reference to maintain consistency.
      // Records from storage carry no inline pixels, so resolve them first.
      const fullSrc = await resolveFullImage(image);
      const specificRefs = [fullSrc];

      let activePrompt = image.prompt;
      
      // Re-construct prompt with new cinematic settings
      const enhancedPrompt = constructCinematicPrompt(activePrompt, mergedSettings);

      try {
        await generate(
            enhancedPrompt, 
            specificRefs, 
            null, 
            () => {}, 
            mergedSettings
        );
      } catch (e) {
          console.error(e);
      }
  };

  const handleCreateVariations = async (image: GeneratedImage) => {
    const variationSettings: GenerationSettings = {
        ...settings,
        aspectRatio: image.settings.aspectRatio,
        resolution: image.settings.resolution,
        model: image.settings.model,
        cinematic: image.settings.cinematic, // Inherit cinematic settings
        batchSize: 4, // Generate a batch of 4 variations
        isImageToImage: true // Use source image for compositional consistency
    };

    const specificRefs = [await resolveFullImage(image)];

    try {
        await generate(
            image.prompt,
            specificRefs,
            null,
            () => {},
            variationSettings
        );
    } catch (e) {
        console.error("Variation generation failed", e);
    }
  };

  /**
   * Files a reference image into the gallery as a real record.
   *
   * Bedrock / Stability services only operate on gallery images (they need a
   * stored blob and an id), so an uploaded reference is unreachable until it
   * has been promoted here. This is that bridge.
   */
  const handleSendReferenceToGrid = async (dataUrl: string) => {
    await prependImage({
      id: uuid(),
      url: dataUrl,
      prompt: 'Uploaded reference',
      timestamp: Date.now(),
      settings,
      status: 'completed',
    });
    playSound('success', settings.enableSounds);
  };

  const handleStartEdit = (image: GeneratedImage) => {
    startEdit(image);
    // When editing, we should probably set the global settings to match the image being edited?
    // Or just let the prompt drive it. 
    // UX Decision: Don't overwrite global settings to avoid confusing the user if they cancel.
    // However, the `DirectorsControl` in the Sidebar handles local editing settings.
    setPrompt(""); 
  };

  // Send a past generation's prompt + settings back to the prompt dock for re-use / re-run.
  const handleUsePrompt = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setSettings(prev => ({
      ...prev,
      aspectRatio: image.settings.aspectRatio,
      resolution: image.settings.resolution,
      model: image.settings.model,
      cinematic: image.settings.cinematic,
    }));
  };

  // Region (brush-mask) edit: composite mask overlay + instruction through the edit pipeline.
  const handleInpaint = async (image: GeneratedImage, maskOverlay: string, instruction: string) => {
    const fullSrc = await resolveFullImage(image);
    await runEdit(image, (signal) =>
      editImageWithMask(fullSrc, maskOverlay, instruction, image.settings, signal)
    );
  };

  // One-tap tools (background remover / upscaler) via the edit pipeline.
  const handleApplyTool = async (image: GeneratedImage, tool: 'removeBg' | 'upscale') => {
    const fullSrc = await resolveFullImage(image);
    if (tool === 'removeBg') {
      await runEdit(image, (signal) =>
        editImage(
          [fullSrc],
          'Remove the background completely and make it transparent. Keep the main subject perfectly intact with clean edges. Output a transparent PNG.',
          { ...image.settings, batchSize: 1 },
          signal
        )
      );
    } else {
      // Upscale: re-run image-to-image at the next resolution tier.
      const nextRes = image.settings.resolution === '4K' ? '4K' : image.settings.resolution === '2K' ? '4K' : '2K';
      await runEdit(image, (signal) =>
        editImage(
          [fullSrc],
          'Upscale this image to a higher resolution with enhanced sharpness and fine detail. Keep the composition and content identical.',
          { ...image.settings, resolution: nextRes as GenerationSettings['resolution'], batchSize: 1 },
          signal
        )
      );
    }
  };

  const handleEditAction = (action: 'undo' | 'redo' | 'exit') => {
    if (action === 'undo') undo();
    if (action === 'redo') redo();
    if (action === 'exit') {
      exitEdit();
      setPrompt("");
    }
  };

  const handleReferenceUpload = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
          if (e.target?.result) {
              addReferenceImages([e.target.result as string]);
          }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReference = (index: number) => {
      removeReferenceImage(index);
  };

  if (!hasKey) {
      return (
        <div className="h-safe-screen w-full relative bg-[#050505] flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-laserBlue/5 via-transparent to-transparent animate-pulse-fast"></div>
             
             <div 
               className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ 
                 backgroundImage: 'radial-gradient(#404040 1px, transparent 1px)', 
                 backgroundSize: '32px 32px' 
               }}
             ></div>

             <ApiKeySettingsModal 
                isOpen={true}
                onClose={() => {}} 
                onSuccess={() => {
                    setHasKey(true);
                    setIsKeyModalOpen(false);
                }}
                isMandatory={true}
            />
        </div>
      );
  }

  return (
    <HoverPreviewProvider>
    <div className="h-safe-screen w-full flex bg-transparent text-white font-sans overflow-hidden relative">
      <ControlPanel 
        settings={settings} 
        setSettings={setSettings} 
        isGenerating={isGenerating}
        onReferenceImageUpload={handleReferenceUpload}
        referenceImages={referenceImages}
        onRemoveReferenceImage={handleRemoveReference}
        onAddReferenceUrl={(url) => addReferenceImages([url])}
        onOpenBedrockKey={() => setIsBedrockKeyOpen(true)}
        onSendReferenceToGrid={handleSendReferenceToGrid}
        bedrockUnlocked={bedrockUnlocked}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden">
        {/* Background Animation Layer - Enhanced Visibility */}
        <div className={`absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ${isGenerating ? 'opacity-100' : 'opacity-0'}`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.4)_100%)]"></div>
           <div className="absolute inset-0 bg-gradient-to-br from-laserPurple/20 via-transparent to-laserBlue/10 animate-pulse-fast mix-blend-screen"></div>
           <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent"></div>
        </div>
        
        <div className={`absolute inset-0 pointer-events-none z-50 bg-white/10 mix-blend-overlay transition-opacity duration-500 ${showSuccessFlash ? 'opacity-100' : 'opacity-0'}`}></div>

        <ImageGrid 
          images={images} 
          isLoading={isGenerating}
          onImageClick={handleStartEdit}
          onRemoveImages={removeImages}
          onClearAll={clearAll}
          onRegenerate={handleRegenerate}
          onCreateVariations={handleCreateVariations}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onStopImage={stopImage} // Pass the individual stop handler
          onToggleFavorite={toggleFavorite}
          onUsePrompt={handleUsePrompt}
          onUseStarter={(p) => setPrompt(p)}
          onInpaint={handleInpaint}
          onApplyTool={handleApplyTool}
          onRetry={retryImage}
          folders={folders}
          onCreateFolder={createFolder}
          onRenameFolder={renameFolder}
          onToggleFolderCollapse={toggleCollapse}
          onCollapseAllFolders={collapseAll}
          onRemoveFolder={removeFolder}
          onAssignFolder={assignFolder}
          onOpenBedrock={(img) => setBedrockTarget(img)}
          onOpenCleanExport={(img) => setExportTarget(img)}
        />

        <WorkspaceControls 
          prompt={prompt}
          setPrompt={setPrompt}
          isGenerating={isGenerating}
          isOptimizing={isOptimizing}
          isRecording={isRecording}
          isProcessingAudio={isProcessingAudio}
          optimizationReason={optimizationReason}
          optimizationSources={optimizationSources}
          editingImage={editingImage}
          editHistoryLength={editHistory.length}
          historyIndex={historyIndex}
          error={error}
          hasReference={referenceImages.length > 0}
          promptHistory={promptHistory}
          onSelectHistory={(p) => setPrompt(p)}
          onDeleteHistory={removePrompt}
          onGenerate={handleGenerate}
          onStop={stopAll} // Now maps to Stop All
          onOptimize={() => optimize(prompt, setPrompt)}
          onMicClick={handleMicClick}
          onEditAction={handleEditAction}
          onClearError={clearError}
          onClearOptimization={clearOptimization}
        />
      </div>
      <PreviewOverlay />
      
      <ApiKeySettingsModal 
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSuccess={() => setHasKey(true)}
      />

      {/* Bedrock credentials */}
      <BedrockKeyModal
          isOpen={isBedrockKeyOpen}
          onClose={() => setIsBedrockKeyOpen(false)}
          onSuccess={() => {
            setBedrockUnlockedAt(Date.now());
            setBedrockUnlocked(true);
          }}
      />

      {/* Bedrock Stability AI service launcher */}
      <ErrorBoundary label="Bedrock Panel">
        <BedrockPanel
          key={bedrockUnlockedAt}
          isOpen={!!bedrockTarget}
          onClose={() => setBedrockTarget(null)}
          image={bedrockTarget}
          imageSrc={bedrockSrc}
          isBusy={isGenerating}
          onRequestKey={() => setIsBedrockKeyOpen(true)}
          onRun={(modelId, values) => {
            if (bedrockTarget) runBedrock(bedrockTarget, modelId, values);
            setBedrockTarget(null);
          }}
        />
      </ErrorBoundary>

      {/* Metadata-stripping export */}
      <CleanDownloadModal
          isOpen={!!exportTarget}
          onClose={() => setExportTarget(null)}
          image={exportTarget}
          imageSrc={exportSrc}
      />
    </div>
    </HoverPreviewProvider>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}
