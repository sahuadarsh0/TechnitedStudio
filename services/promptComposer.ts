import {
  GenerationSettings,
  CinematicSettings,
  CameraType,
  LightingStyle,
  CameraAngle,
  FocusTarget,
  Aperture,
} from "../types";

/**
 * Prompt Alchemy: The Cinematic Engine.
 *
 * Pure, side-effect-free composition of a base prompt plus the Director's Engine
 * settings into a single richly-detailed generation prompt. Extracted from App.tsx
 * so generate / regenerate / variations all share one source of truth.
 */
export const constructCinematicPrompt = (
  basePrompt: string,
  settings: GenerationSettings
): string => {
  const trimmed = basePrompt.trim();

  // Raw prompt mode: send exactly what the user typed — no Director / quality appends.
  if (settings.rawPromptOnly) {
    return trimmed;
  }

  const c: CinematicSettings = settings.cinematic;
  const parts: string[] = [trimmed];

  // Camera Tech
  if (c.cameraType !== CameraType.NONE) {
    parts.push(`shot on ${c.cameraType}`);
  }

  // Lens
  parts.push(`${c.focalLength} lens`);

  // Aperture / Depth of Field
  switch (c.aperture) {
    case Aperture.WIDE:
      parts.push("shallow depth of field", "f/1.4 aperture", "creamy bokeh");
      break;
    case Aperture.BALANCED:
      parts.push("balanced depth of field", "f/4 aperture");
      break;
    case Aperture.DEEP:
      parts.push("deep depth of field", "f/11 aperture", "everything in sharp focus");
      break;
    default:
      break;
  }

  // Angles
  if (c.angle !== CameraAngle.EYE_LEVEL) {
    parts.push(c.angle);
  }

  // Focus Target Logic - Refined for accuracy
  switch (c.focus) {
    case FocusTarget.FACE:
      parts.push(
        "sharp focus on face",
        "portrait photography",
        "detailed eyes",
        "shallow depth of field f/1.8",
        "bokeh background"
      );
      break;
    case FocusTarget.PRODUCT:
      parts.push(
        "sharp focus on product",
        "commercial product photography",
        "macro details",
        "isolated subject",
        "blurred background"
      );
      break;
    case FocusTarget.MODEL_PRODUCT:
      parts.push(
        "sharp focus on model and product",
        "deep depth of field f/8",
        "balanced composition",
        "detailed scene"
      );
      break;
    case FocusTarget.HAIR:
      parts.push(
        "focus on hair texture",
        "detailed hair strands",
        "voluminous hair",
        "studio hair lighting",
        "hair model photography"
      );
      break;
    case FocusTarget.COUPLE:
      parts.push(
        "portrait of couple",
        "intimate connection",
        "focus on both faces",
        "relationship photography"
      );
      break;
    case FocusTarget.BACKGROUND:
      parts.push(
        "focus on background",
        "wide angle",
        "deep depth of field f/16",
        "hyper-detailed environment",
        "infinity focus"
      );
      break;
    default:
      // Auto Focus (None)
      break;
  }

  // Lighting Logic
  if (c.lighting === LightingStyle.STUDIO) {
    parts.push("professional 3-point studio lighting", "rim light", "softbox", "perfect exposure");
  } else if (c.lighting === LightingStyle.NONE) {
    parts.push("natural lighting", "available light", "authentic atmosphere");
  } else {
    parts.push(`${c.lighting} lighting style`);
  }

  // Zoom & Details
  if (c.zoomDetail) {
    parts.push("extreme close-up", "macro photography", "100mm macro", "hyper-detailed texture");
  }

  if (c.details.pores) {
    parts.push(
      "visible skin pores",
      "natural skin texture",
      "high frequency skin detail",
      "subsurface scattering"
    );
  }

  if (c.details.eyeReflections) {
    parts.push("highly detailed eyes", "sharp iris texture", "corneal reflections", "catchlights in eyes");
  }

  // General Quality Tags
  parts.push("8k resolution", "masterpiece", "ultra-realistic", "award winning photography");

  // Consistency lock: preserve subject/character identity from reference images.
  if (settings.consistencyLock) {
    parts.push(
      "maintain exact identity and likeness of the reference subject",
      "consistent face and features",
      "same character",
      "preserve product details and branding"
    );
  }

  return parts.join(", ");
};
