/**
 * Thumbnail + metadata-scrubbing pipeline.
 *
 * The gallery used to hold every full-resolution 4K base64 data URL in React
 * state at once, which is what made the home page crawl: a single 4K PNG data
 * URL is ~10–20 MB of string, and thirty of them is enough to stall the main
 * thread and balloon memory.
 *
 * The fix is a strict split:
 *   - a small WebP thumbnail (default 512px, ~30–60 KB) lives in React state
 *     and is the ONLY thing the grid ever renders;
 *   - the full-resolution pixels stay in IndexedDB and are fetched on demand
 *     when the user opens the detail view, edits, or exports.
 *
 * Everything here routes through a canvas, which has a useful side effect:
 * canvas re-encoding cannot carry a source file's container metadata, so the
 * output is inherently free of EXIF, IPTC and C2PA Content Credentials.
 */

export const THUMB_MAX_EDGE = 512;
export const THUMB_QUALITY = 0.72;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });

/** Picks the smallest widely-supported format the browser can actually encode. */
const pickThumbFormat = (): string => {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    if (c.toDataURL('image/webp').startsWith('data:image/webp')) return 'image/webp';
  } catch {
    /* fall through */
  }
  return 'image/jpeg';
};

let cachedThumbFormat: string | null = null;
const thumbFormat = (): string => {
  if (!cachedThumbFormat) cachedThumbFormat = pickThumbFormat();
  return cachedThumbFormat;
};

/**
 * Produces a small data URL preview of an image.
 * Returns an empty string rather than throwing, so a thumbnail failure can
 * never break a generation that otherwise succeeded.
 */
export const buildThumbnail = async (
  src: string,
  maxEdge: number = THUMB_MAX_EDGE
): Promise<string> => {
  if (!src) return '';
  try {
    const img = await loadImage(src);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return '';

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Flatten onto black for lossy formats so transparency does not render white.
    const fmt = thumbFormat();
    if (fmt !== 'image/webp') {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, tw, th);
    }
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, tw, th);

    return canvas.toDataURL(fmt, THUMB_QUALITY);
  } catch (e) {
    console.warn('Thumbnail generation failed', e);
    return '';
  }
};

/** Natural pixel dimensions of a data URL. */
export const measureDataUrl = async (
  src: string
): Promise<{ width: number; height: number }> => {
  try {
    const img = await loadImage(src);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return { width: 0, height: 0 };
  }
};

/** Approximate decoded byte size of a base64 data URL. */
export const dataUrlByteSize = (dataUrl: string): number => {
  if (!dataUrl) return 0;
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
};

export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Re-encodes an image through a canvas at full resolution, which strips ALL
 * container metadata: EXIF, IPTC, XMP and C2PA Content Credentials.
 *
 * This is the "clean" export path. Note the honest limit: it removes the
 * metadata layer only. Pixel-domain watermarks such as Google's SynthID live in
 * the pixel values themselves and survive any re-encode — they are explicitly
 * out of scope here.
 *
 * `format` defaults to png to stay lossless. Choosing jpeg or webp also
 * discards the original quantisation signature, which is a bonus for cleanliness
 * at the cost of some fidelity.
 */
export const stripMetadata = async (
  src: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  if (format === 'jpeg') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      `image/${format}`,
      quality
    );
  });
};

/**
 * Reports whether a data URL still carries recognisable metadata markers.
 * Used by the export UI to tell the user what a clean download will remove.
 */
export const detectMetadata = async (src: string): Promise<string[]> => {
  const found: string[] = [];
  try {
    const comma = src.indexOf(',');
    if (comma === -1) return found;
    const binary = atob(src.slice(comma + 1).slice(0, 65536));

    if (binary.includes('Exif')) found.push('EXIF');
    if (binary.includes('http://ns.adobe.com/xap')) found.push('XMP');
    if (binary.includes('Photoshop 3.0') || binary.includes('8BIM')) found.push('IPTC');
    if (binary.includes('c2pa') || binary.includes('jumb') || binary.includes('urn:uuid:c2pa')) {
      found.push('C2PA Content Credentials');
    }
  } catch {
    /* best effort only */
  }
  return found;
};
