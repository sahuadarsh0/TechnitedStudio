import {
  BedrockModel,
  BedrockService,
  BedrockCategory,
  BedrockParam,
} from './types';

/**
 * Bedrock Stability AI Image Services registry.
 *
 * Schemas transcribed from the AWS Bedrock user guide and then VERIFIED with
 * live InvokeModel calls against bedrock-runtime.us-east-1 (all 13 returned
 * images successfully). Notes from that verification:
 *
 *  - Model ids MUST carry the `us.` cross-region inference prefix. The bare
 *    `stability.stable-*` ids appear in ListFoundationModels but are not
 *    invocable and return ValidationException.
 *  - `creative-upscale` and `conservative-upscale` can blow past the Bedrock
 *    response payload cap when asked for PNG (observed 17 MB rejection).
 *    They are marked `forceJpeg` so the studio always requests jpeg.
 *  - Responses are uniform: { seeds: [], finish_reasons: [], images: [b64] }.
 *    A non-null finish_reason means the request was content-filtered.
 */

const STYLE_PRESETS = [
  'none', '3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book',
  'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art',
  'low-poly', 'modeling-compound', 'neon-punk', 'origami', 'photographic',
  'pixel-art', 'tile-texture',
];

const ASPECT_RATIOS_SD = ['1:1', '16:9', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21'];

// Reusable parameter definitions ------------------------------------------------

const P_PROMPT = (required: boolean): BedrockParam => ({
  key: 'prompt',
  label: 'Prompt',
  type: 'text',
  required,
  hint: 'What you want to see. Weight words with (word:1.5).',
});

const P_NEGATIVE: BedrockParam = {
  key: 'negative_prompt',
  label: 'Negative Prompt',
  type: 'text',
  hint: 'What you do NOT want to see.',
};

const P_SEED: BedrockParam = {
  key: 'seed',
  label: 'Seed',
  type: 'number',
  min: 0,
  max: 4294967294,
  default: 0,
  hint: '0 = random.',
};

const P_STYLE_PRESET: BedrockParam = {
  key: 'style_preset',
  label: 'Style Preset',
  type: 'select',
  options: STYLE_PRESETS,
  default: 'none',
};

const P_GROW_MASK: BedrockParam = {
  key: 'grow_mask',
  label: 'Grow Mask',
  type: 'slider',
  min: 0,
  max: 20,
  step: 1,
  default: 5,
  hint: 'Feathers the mask edge to hide seams.',
};

const P_MASK: BedrockParam = {
  key: 'mask',
  label: 'Mask Image',
  type: 'mask',
  hint: 'Optional. White = change, black = keep. Falls back to the alpha channel.',
};

// The 13 services ---------------------------------------------------------------

export const BEDROCK_SERVICES: BedrockService[] = [
  // ─── Upscale ────────────────────────────────────────────────────────────────
  {
    id: BedrockModel.UPSCALE_FAST,
    label: 'Fast Upscale',
    category: 'upscale',
    description: '4x resolution boost. Lightweight and quick — ideal for cleaning up compressed images for social posts.',
    imageField: 'image',
    minInputPixels: 1024,
    maxInputPixels: 1048576,
    params: [],
  },
  {
    id: BedrockModel.UPSCALE_CONSERVATIVE,
    label: 'Conservative Upscale',
    category: 'upscale',
    description: 'Upscales to 4K while preserving every aspect of the original. Does not reimagine.',
    imageField: 'image',
    forceJpeg: true,
    maxInputPixels: 9437184,
    params: [
      P_PROMPT(true),
      { key: 'creativity', label: 'Creativity', type: 'slider', min: 0.1, max: 0.5, step: 0.05, default: 0.35 },
      P_NEGATIVE,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.UPSCALE_CREATIVE,
    label: 'Creative Upscale',
    category: 'upscale',
    description: 'Heavy reimagining up to 4K. Best on badly degraded images under 1 megapixel — not for already-sharp photos.',
    imageField: 'image',
    forceJpeg: true,
    minInputPixels: 4096,
    maxInputPixels: 1048576,
    params: [
      P_PROMPT(true),
      { key: 'creativity', label: 'Creativity', type: 'slider', min: 0.1, max: 0.5, step: 0.05, default: 0.3 },
      P_NEGATIVE,
      P_SEED,
      P_STYLE_PRESET,
    ],
  },

  // ─── Edit ───────────────────────────────────────────────────────────────────
  {
    id: BedrockModel.INPAINT,
    label: 'Inpaint',
    category: 'edit',
    description: 'Generative fill. Replaces a masked region with new content driven by your prompt.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [P_PROMPT(true), P_MASK, P_GROW_MASK, P_NEGATIVE, P_STYLE_PRESET, P_SEED],
  },
  {
    id: BedrockModel.OUTPAINT,
    label: 'Outpaint',
    category: 'edit',
    description: 'Extends the canvas outward in any direction, inventing content that continues the scene.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      { key: 'directions', label: 'Expand By (px)', type: 'directions', required: true, min: 0, max: 2000, default: 256 },
      P_PROMPT(false),
      { key: 'creativity', label: 'Creativity', type: 'slider', min: 0.1, max: 1.0, step: 0.05, default: 0.5 },
      P_STYLE_PRESET,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.ERASE,
    label: 'Erase Object',
    category: 'edit',
    description: 'Removes whatever the mask covers and reconstructs the background behind it.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [P_MASK, P_GROW_MASK, P_SEED],
  },
  {
    id: BedrockModel.REMOVE_BACKGROUND,
    label: 'Remove Background',
    category: 'edit',
    description: 'Cuts the subject out with clean edges and returns a transparent PNG.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [],
  },
  {
    id: BedrockModel.SEARCH_REPLACE,
    label: 'Search & Replace',
    category: 'edit',
    description: 'Describe an object in words and swap it for another — no mask painting required.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      { key: 'search_prompt', label: 'Find', type: 'text', required: true, hint: 'The object to replace, e.g. "the red car".' },
      P_PROMPT(true),
      P_NEGATIVE,
      P_GROW_MASK,
      P_STYLE_PRESET,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.SEARCH_RECOLOR,
    label: 'Search & Recolor',
    category: 'edit',
    description: 'Recolours a described object while leaving its shape and texture intact.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      { key: 'select_prompt', label: 'Find', type: 'text', required: true, hint: 'The object to recolour, e.g. "the jacket".' },
      P_PROMPT(true),
      P_NEGATIVE,
      P_GROW_MASK,
      P_STYLE_PRESET,
      P_SEED,
    ],
  },

  // ─── Control ────────────────────────────────────────────────────────────────
  {
    id: BedrockModel.CONTROL_SKETCH,
    label: 'Control Sketch',
    category: 'control',
    description: 'Turns a rough sketch or line drawing into a finished image that follows your prompt.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      P_PROMPT(true),
      { key: 'control_strength', label: 'Control Strength', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.7 },
      P_NEGATIVE,
      P_STYLE_PRESET,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.CONTROL_STRUCTURE,
    label: 'Control Structure',
    category: 'control',
    description: 'Keeps the composition and depth of the source image but regenerates its content from your prompt.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      P_PROMPT(true),
      { key: 'control_strength', label: 'Control Strength', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.7 },
      P_NEGATIVE,
      P_STYLE_PRESET,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.STYLE_GUIDE,
    label: 'Style Guide',
    category: 'control',
    description: 'Uses the source image purely as a style reference and generates fresh content from your prompt.',
    imageField: 'image',
    maxInputPixels: 9437184,
    params: [
      P_PROMPT(true),
      { key: 'fidelity', label: 'Style Fidelity', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5 },
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ASPECT_RATIOS_SD, default: '1:1' },
      P_NEGATIVE,
      P_STYLE_PRESET,
      P_SEED,
    ],
  },
  {
    id: BedrockModel.STYLE_TRANSFER,
    label: 'Style Transfer',
    category: 'control',
    description: 'Repaints your subject in the visual style of a second reference image.',
    imageField: 'init_image',
    maxInputPixels: 9437184,
    params: [
      { key: 'style_image', label: 'Style Reference', type: 'image', required: true, hint: 'The image whose look you want to borrow.' },
      P_PROMPT(false),
      { key: 'style_strength', label: 'Style Strength', type: 'slider', min: 0, max: 1, step: 0.05, default: 1 },
      { key: 'composition_fidelity', label: 'Composition Fidelity', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.9 },
      { key: 'change_strength', label: 'Change Strength', type: 'slider', min: 0.1, max: 1, step: 0.05, default: 0.9 },
      P_NEGATIVE,
      P_SEED,
    ],
  },
];

export const BEDROCK_CATEGORY_LABELS: Record<BedrockCategory, string> = {
  upscale: 'Upscale',
  edit: 'Edit',
  control: 'Control',
};

export const BEDROCK_CATEGORY_ORDER: BedrockCategory[] = ['upscale', 'edit', 'control'];

export const getBedrockService = (id: BedrockModel): BedrockService | undefined =>
  BEDROCK_SERVICES.find((s) => s.id === id);

export const getBedrockServicesByCategory = (category: BedrockCategory): BedrockService[] =>
  BEDROCK_SERVICES.filter((s) => s.category === category);

/** Services that need no prompt and no mask can run as a single tap. */
export const isOneTapService = (id: BedrockModel): boolean => {
  const svc = getBedrockService(id);
  if (!svc) return false;
  return !svc.params.some((p) => p.required);
};

/** Rough per-call cost estimate in USD. Indicative only, not billing-accurate. */
export const BEDROCK_COST_ESTIMATE: Record<BedrockCategory, number> = {
  upscale: 0.04,
  edit: 0.04,
  control: 0.04,
};

export const AWS_REGIONS = [
  'us-east-1', 'us-west-2', 'eu-central-1', 'eu-west-1',
  'ap-northeast-1', 'ap-south-1', 'ap-southeast-2',
];

export const DEFAULT_AWS_REGION = 'us-east-1';
