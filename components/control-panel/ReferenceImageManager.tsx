
import React from 'react';
import { useHoverPreview } from '../../hooks/useHoverPreview';
import { CloseIcon, PlusIcon, BedrockIcon } from '../Icons';
import { UploadEntry } from '../../services/uploadHistoryService';

interface ReferenceImageManagerProps {
  images: string[];
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  maxImages: number;
  consistencyLock?: boolean;
  onToggleConsistency?: (val: boolean) => void;
  uploadHistory?: UploadEntry[];
  onPickFromHistory?: (dataUrl: string) => void;
  onForgetHistory?: (id: string) => void;
  /**
   * Pushes a reference image into the gallery as a real record, which is the
   * only route by which Bedrock / Stability services can operate on it.
   */
  onSendToGrid?: (dataUrl: string) => void;
}

// Sub-component for Reference Images to allow hook usage
const ReferenceThumbnail: React.FC<{
    img: string,
    index: number,
    onRemove: (idx: number) => void,
    onSendToGrid?: (dataUrl: string) => void
}> = ({
    img,
    index,
    onRemove,
    onSendToGrid
}) => {
    const { handleMouseEnter, handleMouseLeave } = useHoverPreview({ url: img, prompt: "Source Material" });

    return (
        <div 
            className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-lg hover:border-laserPurple/50 hover:shadow-neon-purple transition-all duration-300"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img src={img} alt={`Source ${index + 1}`} className="w-full h-full object-cover" />
            {/* Order badge — references are sent to the model in this order */}
            <div className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-laserPurple/90 text-black text-[10px] font-black flex items-center justify-center shadow">
              {index + 1}
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                aria-label={`Remove reference ${index + 1}`}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            >
                <CloseIcon className="w-3 h-3" />
            </button>
            {/* Send to gallery — the entry point for Bedrock / Stability services */}
            {onSendToGrid && (
                <button
                    onClick={(e) => { e.stopPropagation(); onSendToGrid(img); }}
                    aria-label={`Send reference ${index + 1} to gallery for Bedrock editing`}
                    title="Send to gallery → then open it and hit Bedrock to upscale / inpaint / erase"
                    className="absolute bottom-1 right-1 p-1 bg-black/70 rounded-full text-[#ff9900] hover:bg-[#ff9900] hover:text-black opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                    <BedrockIcon className="w-3 h-3" strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export const ReferenceImageManager: React.FC<ReferenceImageManagerProps> = ({ images, onUpload, onRemove, maxImages, consistencyLock, onToggleConsistency, uploadHistory = [], onPickFromHistory, onForgetHistory, onSendToGrid }) => {
  const canAddMore = images.length < maxImages;
  const recent = uploadHistory.filter((e) => !images.includes(e.dataUrl)).slice(0, 6);

  return (
    <section className="animate-fadeIn relative z-10">
      <div className="flex justify-between items-baseline mb-3">
         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source Material</label>
         <span className="text-[10px] font-mono text-gray-500">{images.length}/{maxImages}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
            <ReferenceThumbnail 
                key={idx} 
                img={img} 
                index={idx} 
                onRemove={onRemove}
                onSendToGrid={onSendToGrid}
            />
        ))}
        {images.length < maxImages && (
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

      {/* Consistency lock — preserve subject/character identity across generations */}
      {onToggleConsistency && images.length > 0 && (
        <button
          onClick={() => onToggleConsistency(!consistencyLock)}
          aria-pressed={!!consistencyLock}
          className={`mt-3 w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
            consistencyLock
              ? 'bg-laserPurple/10 border-laserPurple/40 shadow-[0_0_10px_rgba(112,0,255,0.15)]'
              : 'bg-black/30 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex flex-col">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${consistencyLock ? 'text-laserPurple' : 'text-gray-400'}`}>Consistency Lock</span>
            <span className="text-[9px] font-mono text-gray-600">Keep the same face / product across outputs</span>
          </div>
          <div className={`w-3 h-3 rounded-full border ${consistencyLock ? 'bg-laserPurple border-laserPurple' : 'border-gray-600'}`}></div>
        </button>
      )}

      {/* Recent References — reuse uploads from previous sessions */}
      {recent.length > 0 && onPickFromHistory && (
        <div className="mt-3">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600 mb-2 block">Recent</span>
          <div className="grid grid-cols-6 gap-1.5">
            {recent.map((entry) => (
              <div key={entry.id} className="relative group aspect-square">
                <button
                  onClick={() => canAddMore && onPickFromHistory(entry.dataUrl)}
                  disabled={!canAddMore}
                  aria-label={`Reuse reference ${entry.name}`}
                  className="w-full h-full rounded-md overflow-hidden border border-white/10 hover:border-laserPurple/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <img src={entry.thumbnail} alt={entry.name} className="w-full h-full object-cover" />
                </button>
                {onForgetHistory && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onForgetHistory(entry.id); }}
                    aria-label="Remove from history"
                    className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 rounded-full text-white/70 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseIcon className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
