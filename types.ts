
export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  WIDE = "16:9",
  TALL = "9:16",
  CINEMATIC = "21:9",
  PHOTO_PORTRAIT = "2:3",
  PHOTO_LANDSCAPE = "3:2"
}

export enum Resolution {
  RES_1K = "1K",
  RES_2K = "2K",
  RES_4K = "4K"
}

export enum AIModel {
  FLASH = "gemini-2.5-flash-image",
  PRO = "gemini-3-pro-image-preview"
}

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  batchSize: number;
  model: AIModel;
  isImageToImage: boolean;
  enableSounds: boolean;
  googleSearch: boolean;
}

export type ImageStatus = 'completed' | 'generating' | 'error';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: GenerationSettings;
  sources?: { title: string; uri: string }[];
  generationTime?: number;
  status?: ImageStatus; // Added to track active generation state
  error?: string;
}

export interface OptimizationResponse {
  optimizedPrompt: string;
  enhancementReasoning: string;
  searchSources?: { title: string; uri: string }[];
}

export interface GenerationError {
  message: string;
  code: string;
}
