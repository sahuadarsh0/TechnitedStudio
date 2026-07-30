import { DEFAULT_AWS_REGION } from '../bedrockCatalog';

/**
 * Bedrock credentials, stored the same way the Gemini key is: strictly in
 * localStorage, never in the bundle or an env var.
 *
 * Bedrock supports long-lived **API keys** (bearer tokens) as of 2025, which is
 * what makes a browser-only integration practical — we can send
 * `Authorization: Bearer <key>` and skip SigV4 request signing entirely.
 * bedrock-runtime also returns `access-control-allow-origin: *`, so the call
 * works directly from the page with no proxy.
 */

const KEY_STORAGE = 'technited_bedrock_api_key';
const REGION_STORAGE = 'technited_bedrock_region';

export const getStoredBedrockKey = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(KEY_STORAGE) || undefined;
};

export const setStoredBedrockKey = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_STORAGE, key.trim());
};

export const clearStoredBedrockKey = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_STORAGE);
};

export const getBedrockRegion = (): string => {
  if (typeof window === 'undefined') return DEFAULT_AWS_REGION;
  return localStorage.getItem(REGION_STORAGE) || DEFAULT_AWS_REGION;
};

export const setBedrockRegion = (region: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REGION_STORAGE, region.trim());
};

export const getEffectiveBedrockKey = (): string => getStoredBedrockKey() || '';

/** True when Bedrock services should be unlocked in the UI. */
export const hasBedrockAccess = (): boolean => !!getEffectiveBedrockKey();

export const bedrockEndpoint = (modelId: string, region = getBedrockRegion()): string =>
  `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;

/**
 * Validates a Bedrock key with the cheapest possible real call: a Fast Upscale
 * of a tiny 64x64 PNG (the smallest size the service accepts).
 *
 * We deliberately probe with a real invoke because Bedrock has no lightweight
 * "whoami" endpoint reachable under CORS. A 200 proves three things at once:
 * the key is valid, the region is right, and the Stability services are
 * subscribed on the account.
 */
export const validateBedrockKey = async (
  key: string,
  region: string = DEFAULT_AWS_REGION
): Promise<{ ok: boolean; reason?: string }> => {
  if (!key.trim()) return { ok: false, reason: 'No key supplied.' };

  const probe = await buildProbePng();

  try {
    const res = await fetch(
      bedrockEndpoint('us.stability.stable-fast-upscale-v1:0', region),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({ image: probe, output_format: 'jpeg' }),
      }
    );

    if (res.ok) return { ok: true };

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'Key rejected. Check the key and its Bedrock permissions.' };
    }
    if (res.status === 404) {
      return { ok: false, reason: `Stability services are not available in ${region}. Try us-east-1.` };
    }

    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message || body?.detail || '';
    } catch {
      /* ignore unparseable error bodies */
    }

    if (/AccessDenied|not authorized|subscri/i.test(detail)) {
      return {
        ok: false,
        reason: 'Key is valid but the account has not subscribed to Stability AI Image Services in the Bedrock console.',
      };
    }

    return { ok: false, reason: detail || `Bedrock returned HTTP ${res.status}.` };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'Network error reaching Bedrock.' };
  }
};

/** A minimal 64x64 canvas PNG used purely to validate credentials. */
const buildProbePng = async (): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3a4a78';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#c8b43c';
    ctx.fillRect(0, 28, 64, 8);
  }
  return canvas.toDataURL('image/png').split(',')[1];
};
