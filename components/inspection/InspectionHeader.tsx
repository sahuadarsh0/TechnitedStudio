
import React from 'react';

interface InspectionHeaderProps {
  onClose: () => void;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({ onClose }) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-start justify-between p-4 pointer-events-none">
      <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Live View</span>
      </div>
      
      <button onClick={onClose} className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/20 group">
        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
