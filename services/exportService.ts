import { GeneratedImage } from '../types';
import { resolveFullImage } from './storageService';

export type ExportFormat = 'png' | 'jpeg' | 'webp';

const MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Convert a data/URL image into a Blob of the requested format. */
export const convertImage = async (url: string, format: ExportFormat, quality = 0.92): Promise<Blob> => {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  if (format === 'jpeg') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      MIME[format],
      quality
    );
  });
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadImageAs = async (image: GeneratedImage, format: ExportFormat) => {
  // Resolve real pixels: gallery records only carry a thumbnail.
  const src = await resolveFullImage(image);
  const blob = await convertImage(src, format);
  const ts = new Date(image.timestamp).toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
  triggerDownload(blob, `Technited_${ts}.${format}`);
};

// ─── Minimal store-only (no compression) ZIP writer ──────────────────────────
// Avoids an external dependency. Uses CRC32 + local file headers + central dir.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

interface ZipEntry { name: string; data: Uint8Array; crc: number; offset: number; }

const strToBytes = (s: string) => new TextEncoder().encode(s);

export const buildZip = (files: { name: string; data: Uint8Array }[]): Blob => {
  const chunks: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  const writeUint32 = (view: DataView, pos: number, val: number) => view.setUint32(pos, val, true);
  const writeUint16 = (view: DataView, pos: number, val: number) => view.setUint16(pos, val, true);

  for (const file of files) {
    const nameBytes = strToBytes(file.name);
    const crc = crc32(file.data);
    const header = new Uint8Array(30 + nameBytes.length);
    const hv = new DataView(header.buffer);
    writeUint32(hv, 0, 0x04034b50); // local file header signature
    writeUint16(hv, 4, 20); // version needed
    writeUint16(hv, 6, 0); // flags
    writeUint16(hv, 8, 0); // method = store
    writeUint16(hv, 10, 0); // mod time
    writeUint16(hv, 12, 0); // mod date
    writeUint32(hv, 14, crc);
    writeUint32(hv, 18, file.data.length); // compressed size
    writeUint32(hv, 22, file.data.length); // uncompressed size
    writeUint16(hv, 26, nameBytes.length);
    writeUint16(hv, 28, 0); // extra len
    header.set(nameBytes, 30);

    entries.push({ name: file.name, data: file.data, crc, offset });
    chunks.push(header, file.data);
    offset += header.length + file.data.length;
  }

  // Central directory
  const centralChunks: Uint8Array[] = [];
  let centralSize = 0;
  for (const e of entries) {
    const nameBytes = strToBytes(e.name);
    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    writeUint32(cv, 0, 0x02014b50); // central dir signature
    writeUint16(cv, 4, 20); // version made by
    writeUint16(cv, 6, 20); // version needed
    writeUint16(cv, 8, 0);
    writeUint16(cv, 10, 0); // method store
    writeUint16(cv, 12, 0);
    writeUint16(cv, 14, 0);
    writeUint32(cv, 16, e.crc);
    writeUint32(cv, 20, e.data.length);
    writeUint32(cv, 24, e.data.length);
    writeUint16(cv, 28, nameBytes.length);
    writeUint16(cv, 30, 0);
    writeUint16(cv, 32, 0);
    writeUint16(cv, 34, 0);
    writeUint16(cv, 36, 0);
    writeUint32(cv, 38, 0);
    writeUint32(cv, 42, e.offset);
    cd.set(nameBytes, 46);
    centralChunks.push(cd);
    centralSize += cd.length;
  }

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  writeUint32(ev, 0, 0x06054b50); // end of central dir
  writeUint16(ev, 4, 0);
  writeUint16(ev, 6, 0);
  writeUint16(ev, 8, entries.length);
  writeUint16(ev, 10, entries.length);
  writeUint32(ev, 12, centralSize);
  writeUint32(ev, 16, offset);
  writeUint16(ev, 20, 0);

  return new Blob([...chunks, ...centralChunks, end], { type: 'application/zip' });
};

export const downloadImagesAsZip = async (images: GeneratedImage[], format: ExportFormat = 'png') => {
  const completed = images.filter((i) => i.status === 'completed');
  // Sequential, not Promise.all: resolving many 4K blobs at once is what used
  // to spike memory. One at a time keeps the peak footprint bounded.
  const files: { name: string; data: Uint8Array }[] = [];
  for (let idx = 0; idx < completed.length; idx++) {
    const img = completed[idx];
    const src = await resolveFullImage(img);
    if (!src) continue;
    const blob = await convertImage(src, format);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const ts = new Date(img.timestamp).toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
    files.push({ name: `Technited_${String(idx + 1).padStart(3, '0')}_${ts}.${format}`, data: buf });
  }
  const zip = buildZip(files);
  triggerDownload(zip, `Technited_Studio_${Date.now()}.zip`);
};
