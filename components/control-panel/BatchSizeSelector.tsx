
import React from 'react';

interface BatchSizeSelectorProps {
  batchSize: number;
  isGenerating: boolean;
  onChange: (size: number) => void;
}

export const BatchSizeSelector: React.FC<BatchSizeSelectorProps> = ({ batchSize, isGenerating, onChange }) => {
  return (
    <section className="relative z-10">
      <div className="flex justify-between items-end mb-4">
         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Generation Batch</label>
         <div className="flex items-baseline gap-1">
             <span className="text-2xl font-mono text-laserBlue font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">{batchSize.toString().padStart(2, '0')}</span>
             <span className="text-[10px] text-gray-600 font-mono uppercase">UNITS</span>
         </div>
      </div>
      <div className="relative h-6 flex items-center">
         {/* Track Background */}
         <div className="absolute left-0 right-0 h-1 bg-gray-800 rounded-full overflow-hidden">
             {/* Fill */}
             <div 
                className="h-full bg-laserBlue shadow-[0_0_10px_#00f0ff] transition-all duration-100" 
                style={{ width: `${(batchSize / 10) * 100}%` }}
             ></div>
         </div>
         
         {/* Range Input */}
         <input 
           type="range" 
           min="1" 
           max="10" 
           step="1" 
           // Removed disabled={isGenerating}
           value={batchSize} 
           onChange={(e) => onChange(parseInt(e.target.value))} 
           className="relative w-full h-6 opacity-0 cursor-pointer z-10" 
         />
         
         {/* Custom Thumb (Visual Only, tracked by input) */}
         <div 
            className="absolute h-4 w-4 bg-black border-2 border-laserBlue rounded-full shadow-[0_0_10px_#00f0ff] pointer-events-none transition-all duration-100"
            style={{ left: `calc(${((batchSize - 1) / 9) * 100}% - 8px)` }} 
         ></div>
      </div>
      <div className="flex justify-between mt-1 px-1">
          <span className="text-[8px] font-mono text-gray-700">1</span>
          <span className="text-[8px] font-mono text-gray-700">10</span>
      </div>
    </section>
  );
};
