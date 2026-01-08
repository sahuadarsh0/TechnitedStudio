
import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import ImageGrid from './components/ImageGrid';
import PreviewOverlay from './components/PreviewOverlay';
import WorkspaceControls from './components/WorkspaceControls';
import ApiKeySettingsModal from './components/ApiKeySettingsModal';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useEditHistory } from './hooks/useEditHistory';
import { usePromptOptimization } from './hooks/usePromptOptimization';
import { HoverPreviewProvider } from './contexts/HoverPreviewContext';

import { transcribeAudio } from './services/geminiService';
import { playSound } from './services/soundService';
import { getEffectiveApiKey } from './services/apiKeyService';
import { DEFAULT_SETTINGS } from './constants';
import { GenerationSettings, GeneratedImage, Resolution } from './types';

export default function App() {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // API Key State
  const [hasKey, setHasKey] = useState<boolean>(!!getEffectiveApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const { 
    images, isGenerating, error, showSuccessFlash, 
    generate, stopAll, stopImage, removeImages, clearAll, clearError, updateImages, prependImage 
  } = useImageGeneration({ settings });

  const {
    editingImage, editHistory, historyIndex,
    startEdit, addHistoryItem, undo, redo, exitEdit
  } = useEditHistory();

  const {
    isOptimizing, optimizationReason, optimizationSources, 
    optimize, clearOptimization
  } = usePromptOptimization(settings.enableSounds);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

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

  const handleGenerate = async () => {
    setIsSettingsOpen(false);

    try {
      await generate(
        prompt, 
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
      const activeSettings: GenerationSettings = { 
          ...settings, 
          ...newSettings, 
          batchSize: 1, // STRICTLY ENFORCE 1 IMAGE
          isImageToImage: true // ALWAYS USE IMG2IMG TO PRESERVE SUBJECT
      };

      // Always pass the current image as reference to maintain consistency
      const specificRefs = [image.url];

      // AUTO-ENHANCEMENT FOR UPSCALING/RESHAPING
      let activePrompt = image.prompt;
      
      const isUpscale = newSettings.resolution === Resolution.RES_4K || newSettings.resolution === Resolution.RES_2K;
      const isReshape = newSettings.aspectRatio && newSettings.aspectRatio !== image.settings.aspectRatio;
      
      if (isUpscale || isReshape) {
          const generalKeywords = "high resolution, 8k, sharp focus";
          const appendKeywords = (text: string, phrases: string) => {
             const existing = text.toLowerCase();
             const newPhrases = phrases.split(',').map(p => p.trim());
             let result = text;
             
             newPhrases.forEach(phrase => {
                 if (!existing.includes(phrase.toLowerCase())) {
                     result += `, ${phrase}`;
                 }
             });
             return result;
          };

          activePrompt = appendKeywords(activePrompt, generalKeywords);
      }

      try {
        await generate(
            activePrompt, 
            specificRefs, 
            null, 
            () => {}, 
            activeSettings
        );
      } catch (e) {
          console.error(e);
      }
  };

  const handleCreateVariations = async (image: GeneratedImage) => {
    // Variations don't block anymore, but maybe limit if too many active? 
    // Current requirement says queueing is allowed.

    const variationSettings: GenerationSettings = {
        ...settings,
        aspectRatio: image.settings.aspectRatio,
        resolution: image.settings.resolution,
        model: image.settings.model,
        batchSize: 4, // Generate a batch of 4 variations
        isImageToImage: true // Use source image for compositional consistency
    };

    const specificRefs = [image.url];

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

  const handleStartEdit = (image: GeneratedImage) => {
    startEdit(image);
    setPrompt(""); 
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
              setReferenceImages(prev => {
                  if (prev.length >= 10) return prev;
                  return [...prev, e.target!.result as string];
              });
          }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReference = (index: number) => {
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
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
    </div>
    </HoverPreviewProvider>
  );
}
