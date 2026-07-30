
export enum AspectRatio {
  AUTO = "auto",
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
  FLASH = "gemini-3.1-flash-image",
  PRO = "gemini-3-pro-image"
}

// ─── Bedrock / Stability AI Image Services ───────────────────────────────────
// Verified live against bedrock-runtime us-east-1. All ids require the `us.`
// cross-region inference prefix; the bare `stability.*` id is NOT invocable.
export enum BedrockModel {
  // Upscale
  UPSCALE_FAST = "us.stability.stable-fast-upscale-v1:0",
  UPSCALE_CONSERVATIVE = "us.stability.stable-conservative-upscale-v1:0",
  UPSCALE_CREATIVE = "us.stability.stable-creative-upscale-v1:0",
  // Edit
  INPAINT = "us.stability.stable-image-inpaint-v1:0",
  OUTPAINT = "us.stability.stable-outpaint-v1:0",
  ERASE = "us.stability.stable-image-erase-object-v1:0",
  REMOVE_BACKGROUND = "us.stability.stable-image-remove-background-v1:0",
  SEARCH_REPLACE = "us.stability.stable-image-search-replace-v1:0",
  SEARCH_RECOLOR = "us.stability.stable-image-search-recolor-v1:0",
  // Control
  CONTROL_SKETCH = "us.stability.stable-image-control-sketch-v1:0",
  CONTROL_STRUCTURE = "us.stability.stable-image-control-structure-v1:0",
  STYLE_GUIDE = "us.stability.stable-image-style-guide-v1:0",
  STYLE_TRANSFER = "us.stability.stable-style-transfer-v1:0"
}

export type BedrockCategory = 'upscale' | 'edit' | 'control';

/** A single tunable field a Bedrock service exposes in the UI. */
export interface BedrockParam {
  key: string;
  label: string;
  type: 'text' | 'number' | 'slider' | 'select' | 'image' | 'mask' | 'directions';
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  default?: string | number;
  options?: string[];
  hint?: string;
}

export interface BedrockService {
  id: BedrockModel;
  label: string;
  category: BedrockCategory;
  description: string;
  /** Field name the source image is sent under. Style transfer uses init_image. */
  imageField: 'image' | 'init_image';
  params: BedrockParam[];
  /** Upscalers return huge payloads; PNG can exceed the Bedrock response cap. */
  forceJpeg?: boolean;
  /** Max input pixels enforced client-side before the call to avoid 400s. */
  maxInputPixels?: number;
  minInputPixels?: number;
}

/** Values collected from the UI for one Bedrock invocation. */
export type BedrockParamValues = Record<string, string | number | undefined>;

export type OutputFormat = 'png' | 'jpeg' | 'webp';

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
  LEICA = "Leica M11",
  ARRI = "ARRI Alexa (Cinema)",
  HASSELBLAD = "Hasselblad (Medium Format)",
  FILM_16MM = "Classic 16mm Film",
  FILM_70MM = "Grand Format 70mm Film"
}

export enum Aperture {
  NONE = "Auto Aperture",
  WIDE = "f/1.4 (Shallow DoF)",
  BALANCED = "f/4 (Balanced)",
  DEEP = "f/11 (Deep Focus)"
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
  aperture: Aperture; // Depth-of-field control
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
  consistencyLock: boolean;
  /** When true, send only the user's typed prompt — no cinematic / quality appends. */
  rawPromptOnly: boolean;
  cinematic: CinematicSettings;
}

export type ImageStatus = 'completed' | 'generating' | 'error';

export interface GeneratedImage {
  id: string;
  /**
   * Full-resolution image source.
   *
   * Legacy records hold a base64 data URL here. From storage v4 onward the
   * heavy pixels live in the `imageBlobs` store and this is left EMPTY on the
   * records returned by `loadImagesFromStorage`, so the gallery never pulls
   * megabytes into memory. Use `resolveFullImage(image)` to obtain a usable
   * src on demand (detail view, edit, export).
   */
  url: string;
  /** Small WebP data URL rendered by the gallery grid. Cheap to keep in state. */
  thumbnail?: string;
  /** True when the full-resolution pixels live in the `imageBlobs` store. */
  hasBlob?: boolean;
  /** Byte size of the full-resolution image, for UI display. */
  byteSize?: number;
  /** Natural pixel dimensions of the full-resolution image. */
  width?: number;
  height?: number;
  prompt: string;
  timestamp: number;
  settings: GenerationSettings;
  sources?: { title: string; uri: string }[];
  generationTime?: number;
  status?: ImageStatus; // Added to track active generation state
  error?: string;
  favorite?: boolean; // Starred / favorited by the user
  /** Folder this image is filed under. `undefined` = Unsorted. */
  folderId?: string;
  /** Which engine produced it — Gemini generation or a Bedrock service. */
  provider?: 'gemini' | 'bedrock';
  /** Bedrock service id when provider === 'bedrock'. */
  bedrockModel?: BedrockModel;
}

/** A user-created gallery folder. */
export interface Folder {
  id: string;
  name: string;
  color?: string;
  collapsed?: boolean;
  timestamp: number;
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
