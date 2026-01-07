
import React from 'react';

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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </button>
                {/* Sound Toggle */}
                <button 
                    onClick={onToggleSounds} 
                    className={`p-1.5 rounded-full transition-colors ${enableSounds ? 'text-laserBlue bg-laserBlue/10' : 'text-gray-600 hover:text-gray-400'}`}
                    title={enableSounds ? "Mute Sounds" : "Enable Sounds"}
                >
                    {enableSounds ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    )}
                </button>
                {/* Mobile Close Button - Moved inside this row for perfect alignment */}
                <button 
                  onClick={onClose} 
                  className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors rounded-full border border-transparent hover:border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Studio Settings</h1>
      </div>
    </div>
  );
};
