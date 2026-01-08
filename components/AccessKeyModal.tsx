
import React from 'react';
import { GenerationSettings } from '../types';

interface AccessKeyModalProps {
  onSelectKey: () => Promise<void>;
  settings: GenerationSettings;
}

const AccessKeyModal: React.FC<AccessKeyModalProps> = ({ onSelectKey, settings }) => {
  const handleClick = () => {
    onSelectKey();
  };

  return (
    <div className="h-safe-screen w-full flex items-center justify-center bg-transparent overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-laserBlue/5 via-transparent to-transparent animate-pulse-fast"></div>
      <div className="pro-glass p-8 md:p-12 rounded-2xl max-w-lg w-[90%] text-center relative z-10 border-t border-white/10">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-2 drop-shadow-2xl">
          TECHNITED<span className="text-laserBlue"> STUDIO</span>
        </h1>
        <div className="h-px w-20 bg-laserBlue mx-auto mb-6 shadow-neon"></div>
        <p className="text-gray-400 mb-8 font-light tracking-wide text-sm md:text-base">
          Professional Multimodal Studio <br /> <span className="text-xs text-gray-600 font-mono">POWERED BY TECHNITED MINDS &copy; 2026</span>
        </p>
        <button
          onClick={handleClick}
          className="w-full py-4 bg-white text-black font-bold text-sm tracking-widest hover:bg-laserBlue hover:shadow-neon transition-all duration-300 uppercase rounded"
        >
          Connect API Interface
        </button>
      </div>
    </div>
  );
};

export default AccessKeyModal;
