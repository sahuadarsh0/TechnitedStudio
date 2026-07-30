import { BedrockModel, BedrockParamValues } from '../types';
import { getBedrockService } from '../bedrockCatalog';

/** Strips the `data:...;base64,` prefix Bedrock does not accept. */
export const toBareBase64 = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return match ? match[2] : dataUrl;
};

/**
 * Pure translation of UI-collected values into a Bedrock InvokeModel body.
 *
 * Kept separate from bedrockService.ts (which owns fetch/retry/canvas work) so
 * the request-shaping rules can be unit tested without a browser.
 *
 * Rules encoded here, each derived from the AWS schema:
 *  - the source image goes under the service's own field name (`init_image`
 *    for style transfer, `image` for everything else);
 *  - `output_format` is forced to jpeg for the upscalers whose PNG responses
 *    exceed Bedrock's payload cap;
 *  - `style_preset: "none"` is a UI sentinel meaning "omit the field";
 *  - `seed: 0` means random, so it is omitted rather than sent;
 *  - outpaint expands into up to four independent direction fields and must
 *    always carry at least one non-zero direction.
 */
export const buildBedrockBody = (
  modelId: BedrockModel,
  sourceImage: string,
  values: BedrockParamValues
): Record<string, unknown> => {
  const svc = getBedrockService(modelId);
  if (!svc) throw new Error(`Unknown Bedrock service: ${modelId}`);

  const body: Record<string, unknown> = {
    [svc.imageField]: toBareBase64(sourceImage),
    output_format: svc.forceJpeg ? 'jpeg' : (values.output_format as string) || 'png',
  };

  for (const param of svc.params) {
    const raw = values[param.key];

    if (param.type === 'directions') {
      let any = false;
      for (const dir of ['left', 'right', 'up', 'down'] as const) {
        const v = Number(values[dir] ?? 0);
        if (v > 0) {
          body[dir] = Math.min(2000, Math.round(v));
          any = true;
        }
      }
      if (!any) body.left = Number(param.default) || 256;
      continue;
    }

    if (raw === undefined || raw === '' || raw === null) continue;
    if (param.key === 'style_preset' && raw === 'none') continue;
    if (param.key === 'seed' && Number(raw) === 0) continue;

    if (param.type === 'image' || param.type === 'mask') {
      body[param.key] = toBareBase64(String(raw));
      continue;
    }

    body[param.key] =
      param.type === 'number' || param.type === 'slider' ? Number(raw) : raw;
  }

  return body;
};
