import React from 'react';
import { KeyIcon, SoundOnIcon, SoundOffIcon, CloseIcon } from '../Icons';

interface ControlPanelHeaderProps {
  enableSounds: boolean;
  onToggleSounds: () => void;
  rawPromptOnly: boolean;
  onToggleRawPromptOnly: () => void;
  onOpenKeySettings: () => void;
  onClose: () => void;
}

export const ControlPanelHeader: React.FC<ControlPanelHeaderProps> = ({
  enableSounds,
  onToggleSounds,
  rawPromptOnly,
  onToggleRawPromptOnly,
  onOpenKeySettings,
  onClose
}) => {
  return (
    <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
             <h2 className="text-xs font-mono text-laserBlue tracking-[0.2em] uppercase">Configuration</h2>
             <div className="flex items-center gap-2">
                {/* API Key Settings Button */}
                <button 
                    onClick={onOpenKeySettings}
                    className="p-1.5 rounded-full text-gray-600 hover:text-white transition-colors"
                    title="Configure API Key"
                >
                    <KeyIcon className="w-4 h-4" />
                </button>
                {/* Sound Toggle */}
                <button 
                    onClick={onToggleSounds} 
                    className={`p-1.5 rounded-full transition-colors ${enableSounds ? 'text-laserBlue bg-laserBlue/10' : 'text-gray-600 hover:text-gray-400'}`}
                    title={enableSounds ? "Mute Sounds" : "Enable Sounds"}
                >
                    {enableSounds ? (
                        <SoundOnIcon className="w-4 h-4" />
                    ) : (
                        <SoundOffIcon className="w-4 h-4" />
                    )}
                </button>
                {/* Mobile Close Button - Moved inside this row for perfect alignment */}
                <button 
                  onClick={onClose} 
                  className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors rounded-full border border-transparent hover:border-white/10"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
             </div>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Studio Settings</h1>

        <label
          className="mt-4 flex items-start gap-3 cursor-pointer group select-none"
          title="When enabled, only your typed prompt is sent — no cinematic or quality text is appended"
        >
          <input
            type="checkbox"
            checked={rawPromptOnly}
            onChange={onToggleRawPromptOnly}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-laserBlue focus:ring-laserBlue focus:ring-offset-0 cursor-pointer accent-cyan-400"
          />
          <span className="min-w-0">
            <span className="block text-sm text-gray-200 group-hover:text-white transition-colors">
              Raw prompt only
            </span>
            <span className="block text-[10px] text-gray-500 leading-snug mt-0.5">
              Skip Director &amp; quality appends — send exactly what you type
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};
