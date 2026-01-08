
import React, { useRef, useEffect } from 'react';
import { BoltIcon, MicrophoneIcon } from './Icons';

interface CommandDockProps {
  prompt: string;
  setPrompt: (value: string) => void;
  isGenerating: boolean;
  isOptimizing: boolean;
  isRecording: boolean;
  isProcessingAudio: boolean;
  optimizationReason: string | null;
  onGenerate: () => void;
  onOptimize: () => void;
  onMicClick: () => void;
  onStop?: () => void;
  isEditing: boolean;
  hasReference: boolean;
}

const CommandDock: React.FC<CommandDockProps> = ({
  prompt,
  setPrompt,
  isGenerating,
  isOptimizing,
  isRecording,
  isProcessingAudio,
  optimizationReason,
  onGenerate,
  onOptimize,
  onMicClick,
  onStop,
  isEditing,
  hasReference
}) => {
  const canGenerate = prompt.trim().length > 0 || hasReference || isEditing;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  return (
    <div className={`relative transition-all duration-300 bg-black/70 backdrop-blur-2xl border rounded-2xl p-2 md:p-2 flex flex-col md:flex-row md:items-end shadow-2xl gap-2 md:gap-0 ${isGenerating ? 'border-laserBlue/40 shadow-[0_0_40px_-10px_rgba(0,240,255,0.3)]' : 'border-white/10 hover:border-white/20'}`}>
      
      {/* Text Area - Always enabled now */}
      <div className="flex-1 min-w-0 w-full">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGenerate(); }}}
          placeholder={isEditing ? "Editing..." : "Describe vision..."}
          className="w-full bg-transparent border-none text-white placeholder-gray-500 text-base md:text-lg px-3 py-2 md:py-3 focus:ring-0 focus:outline-none outline-none resize-none custom-scrollbar leading-relaxed font-light max-h-[120px] md:max-h-[200px]"
          rows={1}
          style={{ height: 'auto', minHeight: '44px' }}
        />
      </div>

      {/* Integrated Controls (Bottom/Right Side) */}
      <div className="flex items-center justify-between md:justify-end gap-2 pb-1 pr-1 pl-1 shrink-0 w-full md:w-auto border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
        
        <div className="flex items-center gap-1">
          {/* Optimize Prompt */}
          <div className="relative group">
            <button
              onClick={onOptimize}
              disabled={isOptimizing || !prompt}
              className={`p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${optimizationReason ? 'text-green-400 bg-green-400/10 ring-1 ring-green-400/30' : 'text-gray-400 hover:text-laserBlue hover:bg-white/5'}`}
              title="Optimize Prompt"
            >
              {isOptimizing ? (
                <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
              ) : (
                <BoltIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Voice Input */}
          <button 
            onClick={onMicClick}
            disabled={isProcessingAudio}
            className={`relative p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title="Voice Input"
          >
            {isRecording && <div className="absolute inset-0 rounded-xl ring-2 ring-red-500/30 animate-ping pointer-events-none"></div>}
            
            {isProcessingAudio ? (
              <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : isRecording ? (
              <div className="flex items-end gap-0.5 h-5 w-5 justify-center pb-1">
                <div className="w-1 bg-red-500 animate-[pulse_0.4s_ease-in-out_infinite] h-full rounded-full"></div>
                <div className="w-1 bg-red-500 animate-[pulse_0.6s_ease-in-out_infinite] h-2/3 rounded-full"></div>
                <div className="w-1 bg-red-500 animate-[pulse_0.3s_ease-in-out_infinite] h-full rounded-full"></div>
              </div>
            ) : (
              <MicrophoneIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 md:h-8 bg-white/10 mx-1 hidden md:block"></div>

        {/* Action Button: Glowing Generate Button */}
        <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`relative overflow-hidden group h-10 px-4 md:px-6 rounded-lg transition-all duration-300 flex-1 md:flex-none
                ${!canGenerate 
                    ? 'bg-gray-800 text-gray-500 border border-white/5 opacity-50 cursor-not-allowed' 
                    : 'bg-laserBlue text-black border border-laserBlue shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] hover:scale-105 active:scale-95'
                }
            `}
        >
            {/* Hover Pulse Overlay */}
            {canGenerate && (
                <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
            )}
            
            <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="font-bold text-xs tracking-widest uppercase">
                    {isGenerating ? 'Queue' : 'Generate'}
                </span>
                {canGenerate && !isGenerating && (
                    <BoltIcon className="w-3 h-3 animate-pulse" strokeWidth={3} />
                )}
            </div>
        </button>
      </div>
    </div>
  );
};

export default CommandDock;
