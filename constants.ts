
import { AspectRatio, AIModel, Resolution, LightingStyle, CameraAngle, CameraType, FocusTarget, Aperture } from './types';

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const RESOLUTIONS = Object.values(Resolution);

export const MODELS = [
  { id: AIModel.FLASH, label: "Nano Banana 2", description: "Gemini 3.1 Flash Image. Fast, world-knowledge generation up to 4K" },
  { id: AIModel.PRO, label: "Nano Banana Pro", description: "Gemini 3 Pro Image. Top-tier detail, lighting, and text fidelity" }
];

export const LIGHTING_STYLES = Object.values(LightingStyle);
export const CAMERA_ANGLES = Object.values(CameraAngle);
export const CAMERA_TYPES = Object.values(CameraType);
export const FOCUS_TARGETS = Object.values(FocusTarget);
export const APERTURES = Object.values(Aperture);

export const FOCAL_LENGTHS = [
  "16mm", "24mm", "35mm", "50mm", "85mm", "135mm", "200mm", "700mm"
];

export const DEFAULT_CINEMATIC_SETTINGS = {
  cameraType: CameraType.NONE,
  focalLength: "50mm",
  angle: CameraAngle.EYE_LEVEL,
  lighting: LightingStyle.NONE,
  focus: FocusTarget.NONE,
  aperture: Aperture.NONE,
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
  consistencyLock: false,
  rawPromptOnly: false,
  cinematic: DEFAULT_CINEMATIC_SETTINGS
};

// Internal API Constants
export const MODEL_TRANSCRIPTION = 'gemini-3-flash-preview'; // Updated to working multimodal model for audio
export const MODEL_OPTIMIZATION = 'gemini-3-flash-preview';
export const MODEL_EDITING = AIModel.FLASH; // Nano Banana 2 (gemini-3.1-flash-image)

// --- Model Capabilities (single source of truth for UI gating) ---
// Both Nano Banana 2 and Nano Banana Pro support 1K/2K/4K resolution and Google Search grounding.
// Max reference images differ per Google's GA docs: Nano Banana 2 up to 14, Pro up to 6.
export interface ModelCapabilities {
  resolutions: boolean;   // supports the 1K/2K/4K imageSize selector
  grounding: boolean;     // supports the Google Search grounding tool
  maxReferenceImages: number;
  editLabel: string;      // label shown when used in Reference / Edit mode
  aspectRatios: AspectRatio[]; // aspect ratios this model accepts
}

const BASE_RATIOS = [
  AspectRatio.SQUARE,
  AspectRatio.PORTRAIT,
  AspectRatio.LANDSCAPE,
  AspectRatio.WIDE,
  AspectRatio.TALL,
  AspectRatio.CINEMATIC,
  AspectRatio.PHOTO_PORTRAIT,
  AspectRatio.PHOTO_LANDSCAPE,
];

export const MODEL_CAPABILITIES: Record<AIModel, ModelCapabilities> = {
  [AIModel.FLASH]: {
    resolutions: true,
    grounding: true,
    maxReferenceImages: 14,
    editLabel: "Nano Banana 2 Edit",
    // Nano Banana 2 supports an `auto` aspect ratio in addition to the fixed set.
    aspectRatios: [AspectRatio.AUTO, ...BASE_RATIOS],
  },
  [AIModel.PRO]: {
    resolutions: true,
    grounding: true,
    maxReferenceImages: 6,
    editLabel: "Nano Banana Pro Edit",
    aspectRatios: BASE_RATIOS,
  }
};

export const getModelCapabilities = (model: AIModel): ModelCapabilities =>
  MODEL_CAPABILITIES[model] ?? MODEL_CAPABILITIES[AIModel.FLASH];

export const getAspectRatiosForModel = (model: AIModel): AspectRatio[] =>
  getModelCapabilities(model).aspectRatios;

// --- Rough per-image cost estimate (USD), for a usage indicator only ---
// Based on publicly listed Gemini image pricing tiers; approximate, not billing-accurate.
const COST_PER_IMAGE: Record<AIModel, { '1K': number; '2K': number; '4K': number }> = {
  [AIModel.FLASH]: { '1K': 0.08, '2K': 0.12, '4K': 0.16 },
  [AIModel.PRO]: { '1K': 0.15, '2K': 0.22, '4K': 0.30 },
};

export const estimateCost = (model: AIModel, resolution: '1K' | '2K' | '4K', batchSize: number): number => {
  const tier = COST_PER_IMAGE[model] ?? COST_PER_IMAGE[AIModel.FLASH];
  const per = tier[resolution] ?? tier['1K'];
  return per * Math.max(1, batchSize);
};
