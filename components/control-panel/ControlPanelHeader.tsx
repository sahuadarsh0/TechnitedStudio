
import React from 'react';
import { KeyIcon, SoundOnIcon, SoundOffIcon, CloseIcon } from '../Icons';

interface ControlPanelHeaderProps {
  enableSounds: boolean;
  onToggleSounds: () => void;
  onOpenKeySettings: () => void;
  onClose: () => void;
}

export const ControlPanelHeader: React.FC<ControlPanelHeaderProps> = ({
  enableSounds,
  onToggleSounds,
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
      </div>
    </div>
  );
};
