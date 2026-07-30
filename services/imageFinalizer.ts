import { GeneratedImage } from '../types';
import { buildThumbnail, measureDataUrl, dataUrlByteSize } from './thumbnailService';

/**
 * Prepares a freshly generated image for React state.
 *
 * The full-resolution data URL is intentionally DROPPED from the in-state
 * record: it is handed to storage, and the grid renders `thumbnail` instead.
 * Keeping 4K base64 strings in state is what made the gallery slow, so the
 * only copy of the heavy pixels lives in IndexedDB (`imageBlobs`).
 *
 * Callers that need the full pixels immediately (export, chained edit) should
 * use the returned `full` value, or later call `resolveFullImage()`.
 */
export const finalizeImage = async (
  image: GeneratedImage
): Promise<{ record: GeneratedImage; full: string }> => {
  const full = image.url;

  if (!full) {
    return { record: image, full: '' };
  }

  const [thumbnail, dims] = await Promise.all([
    image.thumbnail ? Promise.resolve(image.thumbnail) : buildThumbnail(full),
    image.width && image.height
      ? Promise.resolve({ width: image.width, height: image.height })
      : measureDataUrl(full),
  ]);

  const record: GeneratedImage = {
    ...image,
    url: '',
    hasBlob: true,
    thumbnail,
    width: dims.width,
    height: dims.height,
    byteSize: image.byteSize || dataUrlByteSize(full),
  };

  return { record, full };
};
