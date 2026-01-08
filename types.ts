
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

export enum LightingStyle {
  NONE = "Natural / Raw",
  CINEMATIC = "Cinematic",
  STUDIO = "Studio (3-Point)",
  HORROR = "Horror / Dark",
  AMBIENCE = "Mood / Ambience",
  NEON = "Neon / Cyberpunk",
  PRODUCT = "Product (Clean)",
  GOLDEN = "Golden Hour"
}

export enum CameraAngle {
  EYE_LEVEL = "Eye Level",
  LOW_ANGLE = "Low Angle (Heroic)",
  HIGH_ANGLE = "High Angle",
  BIRDS_EYE = "Top Shot (Bird's Eye)",
  DUTCH = "Dutch Angle (Dynamic)",
  MACRO = "Macro / Extreme Close-up"
}

export enum CameraType {
  NONE = "AI Default",
  SONY = "Sony Alpha A7R V",
  IPHONE = "iPhone 15 Pro Max",
  FILM = "Analog Film (35mm)",
  LEICA = "Leica M11"
}

export enum FocusTarget {
  NONE = "Auto Focus",
  FACE = "Portrait / Face",
  PRODUCT = "Product Focus",
  MODEL_PRODUCT = "Model & Product",
  HAIR = "Hair Detail",
  COUPLE = "Couple Portrait",
  BACKGROUND = "Background / Landscape"
}

export interface CinematicSettings {
  cameraType: CameraType;
  focalLength: string; // "16mm", "35mm", "50mm", "85mm", "200mm", "700mm"
  angle: CameraAngle;
  lighting: LightingStyle;
  focus: FocusTarget; // Added Focus Target
  zoomDetail: boolean; // "Zoomed In / Hyper Detail"
  details: {
    pores: boolean;
    eyeReflections: boolean;
  };
}

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  batchSize: number;
  model: AIModel;
  isImageToImage: boolean;
  enableSounds: boolean;
  googleSearch: boolean;
  cinematic: CinematicSettings;
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
