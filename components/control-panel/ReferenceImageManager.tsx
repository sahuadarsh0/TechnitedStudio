
import React from 'react';
import { useHoverPreview } from '../../hooks/useHoverPreview';
import { CloseIcon, PlusIcon } from '../Icons';

interface ReferenceImageManagerProps {
  images: string[];
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
}

// Sub-component for Reference Images to allow hook usage
const ReferenceThumbnail = ({ 
    img, 
    index, 
    onRemove 
}: { 
    img: string, 
    index: number, 
    onRemove: (idx: number) => void 
}) => {
    const { handleMouseEnter, handleMouseLeave } = useHoverPreview({ url: img, prompt: "Source Material" });

    return (
        <div 
            className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-lg hover:border-laserPurple/50 hover:shadow-neon-purple transition-all duration-300"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img src={img} alt={`Source ${index}`} className="w-full h-full object-cover" />
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            >
                <CloseIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

export const ReferenceImageManager: React.FC<ReferenceImageManagerProps> = ({ images, onUpload, onRemove }) => {
  return (
    <section className="animate-fadeIn relative z-10">
      <div className="flex justify-between items-baseline mb-3">
         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source Material</label>
         <span className="text-[10px] font-mono text-gray-500">{images.length}/10</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
            <ReferenceThumbnail 
                key={idx} 
                img={img} 
                index={idx} 
                onRemove={onRemove} 
            />
        ))}
        {images.length < 10 && (
          <label className="aspect-square rounded-lg border border-dashed border-gray-700 hover:border-laserPurple hover:bg-laserPurple/5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-laserPurple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-8 h-8 rounded-full border border-gray-600 group-hover:border-laserPurple group-hover:scale-110 flex items-center justify-center mb-2 transition-all relative z-10">
              <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-laserPurple" />
            </div>
            <span className="text-[8px] text-gray-500 group-hover:text-laserPurple font-mono uppercase tracking-widest relative z-10">UPLOAD</span>
            <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={(e) => { 
                    if(e.target.files && e.target.files.length > 0) {
                        onUpload(Array.from(e.target.files));
                    }
                }} 
                className="hidden" 
            />
          </label>
        )}
      </div>
    </section>
  );
};
