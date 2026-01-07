
import React, { useState, useEffect } from 'react';

export const LoadingSkeleton: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="aspect-square bg-[#050505]/60 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] order-first group">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-laserBlue/5 to-transparent h-[50%] animate-[scanline_2s_linear_infinite]"></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
        <div className="w-10 h-10 mb-4 relative">
          <div className="absolute inset-0 border-2 border-laserBlue/30 rounded-full animate-ping"></div>
          <div className="absolute inset-2 border-2 border-white/50 rounded-full animate-spin"></div>
        </div>
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-[10px] font-mono text-laserBlue tracking-widest uppercase animate-pulse">Generating</div>
          
          <div className="w-2/3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-laserBlue shadow-[0_0_8px_#00f0ff] animate-progress"></div>
          </div>
          
          {/* Timer Display */}
          <div className="mt-1 font-mono text-[10px] text-gray-400">
             {elapsed.toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  );
};
