
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PreviewData {
  url: string;
  prompt?: string;
  sourceRect?: DOMRect;
  resolution?: string;
  aspectRatio?: string;
  model?: string;
}

interface HoverPreviewContextType {
  previewData: PreviewData | null;
  setPreviewData: (data: PreviewData | null) => void;
}

const HoverPreviewContext = createContext<HoverPreviewContextType | undefined>(undefined);

export const HoverPreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  return (
    <HoverPreviewContext.Provider value={{ previewData, setPreviewData }}>
      {children}
    </HoverPreviewContext.Provider>
  );
};

export const useHoverPreviewContext = () => {
  const context = useContext(HoverPreviewContext);
  if (!context) {
    throw new Error('useHoverPreviewContext must be used within a HoverPreviewProvider');
  }
  return context;
};
