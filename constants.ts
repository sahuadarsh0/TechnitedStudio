
import { AspectRatio, AIModel, Resolution, LightingStyle, CameraAngle, CameraType, FocusTarget } from './types';

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const RESOLUTIONS = Object.values(Resolution);

export const MODELS = [
  { id: AIModel.FLASH, label: "Nano Banana", description: "High speed, efficient generation" },
  { id: AIModel.PRO, label: "Nano Banana Pro", description: "Top-tier detail and lighting" }
];

export const LIGHTING_STYLES = Object.values(LightingStyle);
export const CAMERA_ANGLES = Object.values(CameraAngle);
export const CAMERA_TYPES = Object.values(CameraType);
export const FOCUS_TARGETS = Object.values(FocusTarget);

export const FOCAL_LENGTHS = [
  "16mm", "24mm", "35mm", "50mm", "85mm", "135mm", "200mm", "700mm"
];

export const DEFAULT_CINEMATIC_SETTINGS = {
  cameraType: CameraType.NONE,
  focalLength: "50mm",
  angle: CameraAngle.EYE_LEVEL,
  lighting: LightingStyle.NONE,
  focus: FocusTarget.NONE,
  zoomDetail: false,
  details: {
    pores: false,
    eyeReflections: false
  }
};

export const DEFAULT_SETTINGS = {
  aspectRatio: AspectRatio.SQUARE,
  resolution: Resolution.RES_4K, // Default to 4K
  batchSize: 1,
  model: AIModel.PRO, // Default to Pro model
  isImageToImage: false, // Default to Text workflow
  enableSounds: true,
  googleSearch: false,
  cinematic: DEFAULT_CINEMATIC_SETTINGS
};

// Internal API Constants
export const MODEL_TRANSCRIPTION = 'gemini-3-flash-preview'; // Updated to working multimodal model for audio
export const MODEL_OPTIMIZATION = 'gemini-3-flash-preview';
export const MODEL_EDITING = 'gemini-2.5-flash-image';
