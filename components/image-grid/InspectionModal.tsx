
import React, { useEffect, useState } from 'react';
import { GeneratedImage } from '../../types';
import { InspectionHeader } from '../inspection/InspectionHeader';
import { InspectionViewer } from '../inspection/InspectionViewer';
import { InspectionSidebar } from '../inspection/InspectionSidebar';
import { InpaintModal } from '../inspection/InpaintModal';

interface InspectionModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, image: GeneratedImage) => void;
  onRegenerate: (image: GeneratedImage, newSettings: Partial<GeneratedImage['settings']>) => void;
  onCreateVariations: (image: GeneratedImage) => void;
  onEdit: (e: React.MouseEvent, image: GeneratedImage) => void;
  isLoading: boolean;
  onInpaint?: (image: GeneratedImage, maskOverlay: string, instruction: string) => void;
  onApplyTool?: (image: GeneratedImage, tool: 'removeBg' | 'upscale') => void;
  onUsePrompt?: (image: GeneratedImage) => void;
  onToggleFavorite?: (id: string) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onDelete,
  onDownload,
  onRegenerate,
  onCreateVariations,
  onEdit,
  isLoading,
  onInpaint,
  onApplyTool,
  onUsePrompt,
  onToggleFavorite
}) => {
  const [isInpainting, setIsInpainting] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInpainting) return; // don't navigate while painting
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose, isInpainting]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] animate-fadeIn">
      <InspectionHeader onClose={onClose} />

      <div className="flex flex-col md:flex-row w-full h-full max-w-[1920px] mx-auto overflow-hidden">
        <InspectionViewer 
          image={image}
          onPrev={onPrev}
          onNext={onNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onClose={onClose}
          onCreateVariations={onCreateVariations}
          onDownload={onDownload}
          onDelete={onDelete}
          onEdit={onEdit}
          onInpaint={onInpaint ? () => setIsInpainting(true) : undefined}
        />
        
        <InspectionSidebar 
          image={image}
          isLoading={isLoading}
          onRegenerate={onRegenerate}
          onClose={onClose}
          onApplyTool={onApplyTool}
          onUsePrompt={onUsePrompt}
          onToggleFavorite={onToggleFavorite}
        />
      </div>

      {isInpainting && onInpaint && (
        <InpaintModal
          image={image}
          isLoading={isLoading}
          onClose={() => setIsInpainting(false)}
          onApply={(maskOverlay, instruction) => {
            onInpaint(image, maskOverlay, instruction);
            setIsInpainting(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
