
import React from 'react';

interface GroundingToggleProps {
  isEnabled: boolean;
  isActive: boolean;
  onChange: (active: boolean) => void;
}

export const GroundingToggle: React.FC<GroundingToggleProps> = ({ isEnabled, isActive, onChange }) => {
  if (!isEnabled) return null;

  return (
    <section className="relative z-10 animate-fadeIn">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">
          Knowledge Grounding
      </label>
      <button
        onClick={() => onChange(!isActive)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 group ${
          isActive 
            ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
            : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
            {/* Google G Logo SVG */}
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-xs font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>Google Search</span>
            <span className="text-[9px] text-gray-600 font-mono">Real-world Data</span>
          </div>
        </div>
        
        {/* Toggle Switch Visual */}
        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-laserBlue/50' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm`} style={{ left: isActive ? '18px' : '2px' }}></div>
        </div>
      </button>
    </section>
  );
};
