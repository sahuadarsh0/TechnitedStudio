
import { AspectRatio, AIModel, Resolution } from './types';

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const RESOLUTIONS = Object.values(Resolution);

export const MODELS = [
  { id: AIModel.FLASH, label: "Nano Banana", description: "High speed, efficient generation" },
  { id: AIModel.PRO, label: "Nano Banana Pro", description: "Top-tier detail and lighting" }
];

export const DEFAULT_SETTINGS = {
  aspectRatio: AspectRatio.SQUARE,
  resolution: Resolution.RES_1K,
  batchSize: 1,
  model: AIModel.PRO,
  isImageToImage: false,
  enableSounds: true,
  googleSearch: false,
};

// Internal API Constants
export const MODEL_TRANSCRIPTION = 'gemini-3-flash-preview';
export const MODEL_OPTIMIZATION = 'gemini-3-flash-preview';
export const MODEL_EDITING = 'gemini-2.5-flash-image'; // Editing typically uses the faster model or specific editing endpoint logic
