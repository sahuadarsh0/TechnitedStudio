import {
  BedrockModel,
  BedrockParamValues,
  GeneratedImage,
  GenerationSettings,
} from '../types';
import { getBedrockService } from '../bedrockCatalog';
import { buildBedrockBody } from './bedrockBodyBuilder';
import {
  bedrockEndpoint,
  getBedrockRegion,
  getEffectiveBedrockKey,
} from './bedrockKeyService';
import { uuid } from './uuid';
import { buildThumbnail, measureDataUrl, dataUrlByteSize } from './thumbnailService';

/**
 * Bedrock Stability AI Image Services client.
 *
 * Design notes:
 *  - Uses the bearer-token API-key auth path, so no SigV4 signing (and no AWS
 *    SDK) is needed in the browser. bedrock-runtime sends
 *    `access-control-allow-origin: *`, so no proxy is required either.
 *  - Retry/backoff mirrors imageService.ts so behaviour is consistent across
 *    providers. ServiceUnavailableException ("Too many connections") is common
 *    under parallel load and is retried.
 *  - A non-null entry in `finish_reasons` means the request was content
 *    filtered; that is surfaced as a SAFETY_BLOCK and never retried.
 */

const HARD_TIMEOUT_MS = 240000;
const MAX_RETRIES = 5;

interface BedrockResponse {
  seeds?: number[];
  finish_reasons?: (string | null)[];
  images?: string[];
}

/** Strips the `data:...;base64,` prefix Bedrock does not want. */
const toBareBase64 = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return match ? match[2] : dataUrl;
};

/**
 * Re-encodes an image so it satisfies a service's pixel-count window.
 *
 * Several services reject inputs outside a documented range (Fast Upscale caps
 * at 1 MP, Creative Upscale at 1 MP, most others at ~9.4 MP). Since the studio
 * generates up to 4K, downscaling client-side is required or the call 400s.
 */const fitToPixelBudget = async (
  dataUrl: string,
  maxPixels?: number,
  minPixels?: number
): Promise<string> => {
  if (!maxPixels && !minPixels) return dataUrl;

  const img = await loadImage(dataUrl);
  const pixels = img.naturalWidth * img.naturalHeight;

  let scale = 1;
  if (maxPixels && pixels > maxPixels) scale = Math.sqrt(maxPixels / pixels);
  if (minPixels && pixels < minPixels) scale = Math.sqrt(minPixels / pixels);
  if (scale === 1) return dataUrl;

  // Leave 1% headroom so rounding never pushes us back over the cap.
  const safeScale = scale < 1 ? scale * 0.99 : scale * 1.01;
  const w = Math.max(64, Math.round(img.naturalWidth * safeScale));
  const h = Math.max(64, Math.round(img.naturalHeight * safeScale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode source image.'));
    img.src = src;
  });

/**
 * Builds the JSON body for a given service, first fitting the source image to
 * that service's documented pixel budget. Request-shaping itself lives in the
 * pure `buildBedrockBody` so it can be unit tested.
 */
const buildBody = async (
  modelId: BedrockModel,
  sourceImage: string,
  values: BedrockParamValues
): Promise<Record<string, unknown>> => {
  const svc = getBedrockService(modelId);
  if (!svc) throw new Error(`Unknown Bedrock service: ${modelId}`);

  const fitted = await fitToPixelBudget(sourceImage, svc.maxInputPixels, svc.minInputPixels);
  return buildBedrockBody(modelId, fitted, values);
};

const invokeOnce = async (
  modelId: BedrockModel,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<BedrockResponse> => {
  const key = getEffectiveBedrockKey();
  if (!key) throw new Error('BEDROCK_KEY_MISSING');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetch(bedrockEndpoint(modelId, getBedrockRegion()), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const parsed = await res.json();
        detail = parsed?.message || parsed?.detail || JSON.stringify(parsed).slice(0, 300);
      } catch {
        detail = await res.text().catch(() => '');
      }
      const err: any = new Error(detail || `Bedrock HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    return (await res.json()) as BedrockResponse;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
};

const executeWithRetry = async (
  modelId: BedrockModel,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<BedrockResponse> => {
  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error('ABORTED');

    try {
      const response = await invokeOnce(modelId, body, signal);

      const reason = response.finish_reasons?.find((r) => r);
      if (reason) {
        throw new Error(`SAFETY_BLOCK: ${reason}`);
      }
      if (!response.images?.[0]) {
        throw new Error('Bedrock returned no image data.');
      }
      return response;
    } catch (err: any) {
      lastError = err;

      if (signal?.aborted) throw new Error('ABORTED');
      if (err.name === 'AbortError') throw new Error('ABORTED');
      if (String(err.message).startsWith('SAFETY_BLOCK')) throw err;
      if (err.message === 'BEDROCK_KEY_MISSING') throw err;

      const status = err.status;
      const retryable =
        status === 429 ||
        status === 500 ||
        status === 503 ||
        /Too many connections|ServiceUnavailable|Throttl/i.test(String(err.message));

      if (retryable && attempt < MAX_RETRIES - 1) {
        const backoff = 3000 * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(
          `Bedrock attempt ${attempt + 1} failed (${err.message}). Retrying in ${Math.round(backoff)}ms.`
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

/**
 * Runs a Bedrock image service against a source image and returns a fully
 * formed GeneratedImage (thumbnail + dimensions included) ready for the grid.
 */
export const runBedrockService = async (
  modelId: BedrockModel,
  sourceImage: string,
  values: BedrockParamValues,
  settings: GenerationSettings,
  signal?: AbortSignal
): Promise<GeneratedImage[]> => {
  const svc = getBedrockService(modelId);
  if (!svc) throw new Error(`Unknown Bedrock service: ${modelId}`);

  const body = await buildBody(modelId, sourceImage, values);

  const started = Date.now();
  const response = await executeWithRetry(modelId, body, signal);
  const elapsed = (Date.now() - started) / 1000;

  const mime = svc.forceJpeg
    ? 'image/jpeg'
    : `image/${(values.output_format as string) || 'png'}`;
  const url = `data:${mime};base64,${response.images![0]}`;

  const [thumbnail, dims] = await Promise.all([
    buildThumbnail(url),
    measureDataUrl(url),
  ]);

  const promptText =
    (values.prompt as string) ||
    (values.search_prompt as string) ||
    (values.select_prompt as string) ||
    svc.label;

  return [
    {
      id: uuid(),
      url,
      thumbnail,
      prompt: promptText,
      timestamp: Date.now(),
      settings,
      generationTime: elapsed,
      status: 'completed',
      provider: 'bedrock',
      bedrockModel: modelId,
      byteSize: dataUrlByteSize(url),
      width: dims.width,
      height: dims.height,
    },
  ];
};
