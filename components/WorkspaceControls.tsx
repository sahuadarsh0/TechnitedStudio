
import React from 'react';
import { GeneratedImage, GenerationError } from '../types';
import CommandDock from './CommandDock';
import OptimizationPanel from './OptimizationPanel';
import Toast from './Toast';

interface WorkspaceControlsProps {
  prompt: string;
  setPrompt: (value: string) => void;
  isGenerating: boolean;
  isOptimizing: boolean;
  isRecording: boolean;
  isProcessingAudio: boolean;
  optimizationReason: string | null;
  optimizationSources?: { title: string; uri: string }[];
  editingImage: GeneratedImage | null;
  editHistoryLength: number;
  historyIndex: number;
  error: GenerationError | null;
  hasReference: boolean;
  
  onGenerate: () => void;
  onStop: () => void;
  onOptimize: () => void;
  onMicClick: () => void;
  onEditAction: (action: 'undo' | 'redo' | 'exit') => void;
  onClearError: () => void;
  onClearOptimization: () => void;
}

const WorkspaceControls: React.FC<WorkspaceControlsProps> = ({
  prompt, setPrompt, isGenerating, isOptimizing, isRecording, isProcessingAudio,
  optimizationReason, optimizationSources, editingImage, editHistoryLength, historyIndex, error, hasReference,
  onGenerate, onStop, onOptimize, onMicClick, onEditAction, onClearError, onClearOptimization
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="absolute bottom-0 inset-x-0 h-48 md:h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-0"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-2 pb-4 md:p-6 md:pb-8 pointer-events-auto flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col md:flex-row justify-center items-end md:items-center min-h-[40px] gap-2 px-2">
            {editingImage && (
              <div className="w-full md:w-auto bg-laserPurple/20 border border-laserPurple/50 px-3 py-1.5 rounded-xl text-xs text-laserPurple font-bold uppercase tracking-wider backdrop-blur-md flex items-center justify-between md:justify-start gap-4 shadow-neon-purple animate-fadeIn">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-laserPurple animate-pulse"></span>
                    EDITING ACTIVE
                </span>
                <div className="flex items-center gap-1 border-l border-laserPurple/30 pl-3">
                    <button onClick={() => onEditAction('undo')} disabled={historyIndex <= 0} className="p-1.5 hover:bg-laserPurple/20 rounded disabled:opacity-30 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <span className="text-[10px] font-mono opacity-50">{historyIndex + 1}/{editHistoryLength}</span>
                    <button onClick={() => onEditAction('redo')} disabled={historyIndex >= editHistoryLength - 1} className="p-1.5 hover:bg-laserPurple/20 rounded disabled:opacity-30 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    </button>
                </div>
                <button onClick={() => onEditAction('exit')} className="hover:text-white border-l border-laserPurple/50 pl-3 ml-1 transition-colors">EXIT</button>
              </div>
            )}
            {error && (
              <Toast 
                message={error.message} 
                type={error.code === 'PARTIAL_SUCCESS' || error.code === 'ABORTED' ? 'info' : 'error'} 
                onClose={onClearError} 
              />
            )}
          </div>

          <CommandDock 
            prompt={prompt}
            setPrompt={setPrompt}
            isGenerating={isGenerating}
            isOptimizing={isOptimizing}
            isRecording={isRecording}
            isProcessingAudio={isProcessingAudio}
            optimizationReason={optimizationReason}
            onGenerate={onGenerate}
            onStop={onStop}
            onOptimize={onOptimize}
            onMicClick={onMicClick}
            isEditing={!!editingImage}
            hasReference={hasReference}
          />

          <OptimizationPanel 
            reason={optimizationReason} 
            sources={optimizationSources} 
            onDismiss={onClearOptimization} 
          />
      </div>
    </div>
  );
};

export default WorkspaceControls;
