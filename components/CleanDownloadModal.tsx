import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { stripMetadata, detectMetadata, formatBytes } from '../services/thumbnailService';
import { CloseIcon, DownloadIcon, ShieldIcon } from './Icons';

interface CleanDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage | null;
  /** Full-resolution src, resolved by the caller. */
  imageSrc: string;
}

type Fmt = 'png' | 'jpeg' | 'webp';

/**
 * Clean-export dialog.
 *
 * Every export here is re-encoded through a canvas, which structurally cannot
 * carry the source file's container metadata. That removes EXIF, IPTC, XMP and
 * C2PA Content Credentials — the C2PA manifest being what causes platforms like
 * Instagram to auto-attach an "AI info" label on upload.
 *
 * The honest limit is stated in the UI: pixel-domain watermarks such as
 * Google's SynthID live in the pixel values themselves and survive any
 * re-encode. This tool does not attempt to remove them.
 */
const CleanDownloadModal: React.FC<CleanDownloadModalProps> = ({
  isOpen,
  onClose,
  image,
  imageSrc,
}) => {
  const [format, setFormat] = useState<Fmt>('png');
  const [quality, setQuality] = useState(0.95);
  const [scrub, setScrub] = useState(true);
  const [found, setFound] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setScanning(true);
    detectMetadata(imageSrc)
      .then(setFound)
      .finally(() => setScanning(false));
  }, [isOpen, imageSrc]);

  if (!isOpen || !image) return null;

  const handleDownload = async () => {
    setWorking(true);
    try {
      let blob: Blob;
      if (scrub) {
        blob = await stripMetadata(imageSrc, format, quality);
      } else {
        const res = await fetch(imageSrc);
        blob = await res.blob();
      }

      const ts = new Date(image.timestamp)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '-')
        .split('.')[0];
      const suffix = scrub ? '_clean' : '';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Technited_${ts}${suffix}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      console.error('Clean download failed', e);
    }
    setWorking(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn p-4">
      <div
        className="rounded-3xl p-7 w-full max-w-md relative bg-gradient-to-br from-[#1a1a20] to-[#101014] border border-white/5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '20px 20px 60px #08080a' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <ShieldIcon className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-gray-200">Export Image</h2>
        </div>

        {/* Metadata scan */}
        <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Detected Metadata
          </p>
          {scanning ? (
            <p className="text-xs text-gray-500">Scanning...</p>
          ) : found.length === 0 ? (
            <p className="text-xs text-emerald-400">None found — already clean.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {found.map((f) => (
                <span
                  key={f}
                  className="text-[9px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrub toggle */}
        <label className="flex items-start gap-3 mb-5 cursor-pointer group">
          <input
            type="checkbox"
            checked={scrub}
            onChange={(e) => setScrub(e.target.checked)}
            className="mt-0.5 accent-emerald-500 w-4 h-4"
          />
          <div>
            <p className="text-xs text-gray-300 group-hover:text-white transition-colors">
              Strip all metadata
            </p>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
              Re-encodes through a canvas, removing EXIF, IPTC, XMP and C2PA
              Content Credentials.
            </p>
          </div>
        </label>

        {/* Format */}
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Format</p>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpeg', 'webp'] as Fmt[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors border ${
                  format === f
                    ? 'bg-white text-black border-white font-bold'
                    : 'text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {format === 'png' && (
            <p className="text-[9px] text-gray-600 mt-2">
              Lossless. Larger file.
            </p>
          )}
          {format !== 'png' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Quality</span>
                <span className="text-[10px] font-mono text-gray-400">{quality.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[9px] text-gray-600 mt-1.5">
                Lossy re-encoding also discards the original compression signature.
              </p>
            </div>
          )}
        </div>

        {/* Info line */}
        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-5 font-mono">
          <span>{image.width && image.height ? `${image.width}x${image.height}` : '—'}</span>
          <span>{formatBytes(image.byteSize)}</span>
        </div>

        <button
          onClick={handleDownload}
          disabled={working}
          className="w-full py-3 rounded-lg bg-white hover:bg-emerald-400 disabled:opacity-40 text-black text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          {working ? 'Preparing...' : scrub ? 'Download Clean' : 'Download Original'}
        </button>

        <p className="text-[9px] text-gray-600 mt-4 leading-relaxed border-t border-white/5 pt-3">
          Note: this removes the metadata layer only. Pixel-domain watermarks
          such as Google SynthID are embedded in the image data itself and
          survive re-encoding.
        </p>
      </div>
    </div>
  );
};

export default CleanDownloadModal;
