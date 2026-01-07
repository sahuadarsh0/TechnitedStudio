
import React, { useEffect } from 'react';
import { GeneratedImage } from '../../types';
import { InspectionHeader } from '../inspection/InspectionHeader';
import { InspectionViewer } from '../inspection/InspectionViewer';
import { InspectionSidebar } from '../inspection/InspectionSidebar';

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
  isLoading
}) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);

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
        />
        
        <InspectionSidebar 
          image={image}
          isLoading={isLoading}
          onRegenerate={onRegenerate}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
