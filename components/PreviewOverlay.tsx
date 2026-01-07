
import React, { useEffect, useState } from 'react';
import { useHoverPreviewContext } from '../contexts/HoverPreviewContext';

const PreviewOverlay: React.FC = () => {
  const { previewData } = useHoverPreviewContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (previewData) {
      // Small delay to allow transition in
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [previewData]);

  if (!previewData) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-opacity duration-500 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop Gradient for focus */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-all duration-700"></div>

      {/* Metamorphosed Card - Glassmorphism/Neumorphism Hybrid */}
      <div 
        className={`relative max-w-2xl w-[90vw] max-h-[80vh] 
        bg-charcoal/40 backdrop-blur-2xl rounded-3xl overflow-hidden 
        border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)] 
        transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) 
        ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}`}
      >
        {/* Subtle inner glow/gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

        {/* Header / Status Pill */}
        <div className="absolute top-4 right-4 z-20">
             <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                <div className="w-1.5 h-1.5 bg-laserBlue rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]"></div>
                <span className="text-[10px] font-mono text-gray-200 tracking-widest uppercase text-glow">Preview</span>
             </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-2 md:p-3">
            <div className="relative rounded-2xl overflow-hidden bg-black/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-white/5">
                 <img 
                    src={previewData.url} 
                    alt="Preview" 
                    className="w-full h-full object-contain max-h-[70vh] rounded-xl"
                 />
                 
                 {/* Subtle Scanline Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[15%] animate-[scanline_4s_linear_infinite] pointer-events-none mix-blend-overlay"></div>
            </div>
            
            {/* Metadata Footer */}
            <div className="mt-2 px-2 py-1">
                {/* Tech Specs Badge Row */}
                {(previewData.resolution || previewData.aspectRatio) && (
                  <div className="flex items-center gap-2 mb-2">
                    {previewData.resolution && (
                       <span className="text-[9px] font-mono text-gray-400 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                         {previewData.resolution}
                       </span>
                    )}
                    {previewData.aspectRatio && (
                       <span className="text-[9px] font-mono text-gray-400 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                         {previewData.aspectRatio}
                       </span>
                    )}
                  </div>
                )}

                {/* Prompt Display */}
                {previewData.prompt && (
                    <>
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                             <svg className="w-3 h-3 text-laserBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                             <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Source Prompt</h4>
                        </div>
                        <p className="text-sm text-gray-200 line-clamp-2 font-light tracking-wide text-shadow-sm opacity-90">{previewData.prompt}</p>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewOverlay;
