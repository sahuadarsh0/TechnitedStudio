
import React from 'react';

interface EmptyStateProps {
  isAbsolutelyEmpty: boolean; // No images at all
  onClearFilters: () => void;
  onUseStarter?: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  "Cinematic portrait of a woman in golden hour light, 85mm",
  "Minimalist product shot of a glass perfume bottle on marble",
  "Neon-soaked cyberpunk street at night, rain reflections",
  "Cozy isometric bedroom, soft pastel colors, 3D render",
];

export const EmptyState: React.FC<EmptyStateProps> = ({ isAbsolutelyEmpty, onClearFilters, onUseStarter }) => {
  if (isAbsolutelyEmpty) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-24 md:pb-32 px-4">
            <div className="relative p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col items-center text-center max-w-md overflow-hidden pointer-events-auto">
                {/* Glossy Highlights */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] rounded-[2rem]"></div>
                
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 bg-laserBlue/5 rounded-[2rem] filter blur-3xl animate-pulse-slow"></div>
                
                {/* Icon Container */}
                <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center mb-6 shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.1)]">
                    <div className="w-12 h-12 rounded-full border border-laserBlue/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                        <div className="w-8 h-8 rounded-full border border-laserPurple/30"></div>
                    </div>
                </div>
                
                <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1.5 drop-shadow-md">Welcome to Technited Studio</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      Describe a vision in the prompt bar below, or start from one of these:
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                      {STARTER_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => onUseStarter?.(p)}
                          className="text-left text-[11px] leading-snug px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-laserBlue/40 hover:bg-laserBlue/5 transition-all max-w-[15rem]"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // Filter Match Empty State
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-24 md:pb-32">
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center pointer-events-auto backdrop-blur-xl shadow-2xl relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <p className="text-gray-300 text-sm mb-4 relative z-10">No images match current filters.</p>
            <button 
                onClick={onClearFilters} 
                className="relative z-10 text-laserBlue text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
                Clear Filters
            </button>
        </div>
    </div>
  );
};
