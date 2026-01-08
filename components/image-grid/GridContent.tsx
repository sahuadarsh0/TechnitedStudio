
import React from 'react';
import { GeneratedImage } from '../../types';
import { ImageCard } from './ImageCard';

interface GridContentProps {
  images: GeneratedImage[];
  isLoading: boolean;
  skeletonCount: number; // Deprecated but kept for interface compat if needed, unused logic
  selectedIds: Set<string>;
  onToggleSelection: (id: string, e: React.MouseEvent) => void;
  onImageClick: (image: GeneratedImage) => void;
  onDeleteOne: (e: React.MouseEvent, id: string) => void;
  onStop?: (id: string) => void;
}

export const GridContent: React.FC<GridContentProps> = ({
  images,
  selectedIds,
  onToggleSelection,
  onImageClick,
  onDeleteOne,
  onStop
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
      {images.map((image) => (
        <ImageCard 
          key={image.id}
          image={image}
          isSelected={selectedIds.has(image.id)}
          onToggleSelection={onToggleSelection}
          onClick={onImageClick}
          onDelete={onDeleteOne}
          onStop={onStop}
        />
      ))}
    </div>
  );
};
