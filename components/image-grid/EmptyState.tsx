
import React from 'react';

interface EmptyStateProps {
  isAbsolutelyEmpty: boolean; // No images at all
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isAbsolutelyEmpty, onClearFilters }) => {
  if (isAbsolutelyEmpty) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-24 md:pb-32">
            <div className="relative p-10 md:p-14 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col items-center text-center max-w-sm overflow-hidden">
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
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2 drop-shadow-md">Technited Studio</h3>
                    <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">No Assets Generated</p>
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
