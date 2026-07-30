import React, { useState, useMemo, useEffect } from 'react';
import {
  BedrockModel,
  BedrockParamValues,
  BedrockParam,
  BedrockService,
  GeneratedImage,
} from '../types';
import {
  BEDROCK_SERVICES,
  BEDROCK_CATEGORY_LABELS,
  BEDROCK_CATEGORY_ORDER,
  getBedrockService,
} from '../bedrockCatalog';
import { hasBedrockAccess } from '../services/bedrockKeyService';
import { CloseIcon, KeyIcon, BoltIcon, UpscaleIcon, EditIcon, MagicIcon } from './Icons';

interface BedrockPanelProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage | null;
  /** Full-resolution src of `image`, resolved by the caller. */
  imageSrc: string;
  onRun: (modelId: BedrockModel, values: BedrockParamValues) => void;
  onRequestKey: () => void;
  isBusy?: boolean;
}

const CATEGORY_ICON: Record<string, React.FC<any>> = {
  upscale: UpscaleIcon,
  edit: EditIcon,
  control: MagicIcon,
};

/**
 * Bedrock Stability AI service launcher.
 *
 * Renders the 13 services grouped by category and builds the parameter form
 * dynamically from the catalog definitions, so adding a service later only
 * requires a catalog entry — no new UI code.
 */
const BedrockPanel: React.FC<BedrockPanelProps> = ({
  isOpen,
  onClose,
  image,
  imageSrc,
  onRun,
  onRequestKey,
  isBusy = false,
}) => {
  const [selected, setSelected] = useState<BedrockModel | null>(null);
  const [values, setValues] = useState<BedrockParamValues>({});
  const unlocked = hasBedrockAccess();

  const service: BedrockService | undefined = useMemo(
    () => (selected ? getBedrockService(selected) : undefined),
    [selected]
  );

  // Seed defaults whenever the chosen service changes.
  useEffect(() => {
    if (!service) return;
    const next: BedrockParamValues = {};
    for (const p of service.params) {
      if (p.default !== undefined) next[p.key] = p.default;
      if (p.type === 'directions') {
        next.left = 0;
        next.right = 0;
        next.up = 0;
        next.down = 0;
      }
    }
    // A sensible starting prompt: reuse the image's own prompt.
    if (service.params.some((p) => p.key === 'prompt') && image?.prompt) {
      next.prompt = image.prompt.slice(0, 500);
    }
    setValues(next);
  }, [service, image?.prompt]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setValues({});
    }
  }, [isOpen]);

  const setValue = (key: string, value: string | number | undefined) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const readFileAsDataUrl = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setValue(key, e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const missingRequired = useMemo(() => {
    if (!service) return [];
    return service.params
      .filter((p) => p.required && p.type !== 'directions')
      .filter((p) => {
        const v = values[p.key];
        return v === undefined || v === '' || v === null;
      })
      .map((p) => p.label);
  }, [service, values]);

  const canRun = !!service && missingRequired.length === 0 && !isBusy && unlocked;

  // NOTE: this early return MUST stay below every hook call. React requires an
  // identical hook sequence on every render, and this component stays mounted
  // while `isOpen` toggles — returning before a hook crashed the panel with
  // "Rendered more hooks than during the previous render".
  if (!isOpen) return null;

  const renderParam = (p: BedrockParam) => {
    const v = values[p.key];

    switch (p.type) {
      case 'text':
        return (
          <textarea
            value={(v as string) ?? ''}
            onChange={(e) => setValue(p.key, e.target.value)}
            rows={p.key === 'prompt' ? 3 : 2}
            placeholder={p.hint}
            className="w-full bg-[#15151a] text-gray-300 text-xs p-3 rounded-lg outline-none border-none placeholder-gray-600 resize-none focus:ring-1 focus:ring-[#ff9900]/40"
            style={{ boxShadow: 'inset 3px 3px 6px #0b0b0e, inset -3px -3px 6px #1f1f26' }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(v as number) ?? 0}
            min={p.min}
            max={p.max}
            onChange={(e) => setValue(p.key, Number(e.target.value))}
            className="w-full bg-[#15151a] text-gray-300 text-xs p-3 rounded-lg outline-none border-none focus:ring-1 focus:ring-[#ff9900]/40"
            style={{ boxShadow: 'inset 3px 3px 6px #0b0b0e, inset -3px -3px 6px #1f1f26' }}
          />
        );

      case 'slider':
        return (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={(v as number) ?? p.default ?? 0}
              onChange={(e) => setValue(p.key, Number(e.target.value))}
              className="flex-1 accent-[#ff9900]"
            />
            <span className="text-[10px] font-mono text-[#ff9900] w-10 text-right">
              {Number(v ?? p.default ?? 0).toFixed(2)}
            </span>
          </div>
        );

      case 'select':
        return (
          <select
            value={(v as string) ?? p.default ?? ''}
            onChange={(e) => setValue(p.key, e.target.value)}
            className="w-full bg-[#15151a] text-gray-300 text-xs p-3 rounded-lg outline-none border-none focus:ring-1 focus:ring-[#ff9900]/40"
            style={{ boxShadow: 'inset 3px 3px 6px #0b0b0e, inset -3px -3px 6px #1f1f26' }}
          >
            {p.options?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        );

      case 'image':
      case 'mask':
        return (
          <div className="flex items-center gap-3">
            {v ? (
              <img
                src={v as string}
                alt={p.label}
                className="w-14 h-14 object-cover rounded-lg border border-white/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[9px] text-gray-600 text-center px-1">
                None
              </div>
            )}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="cursor-pointer text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-white/5 text-center">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFileAsDataUrl(f, p.key);
                  }}
                />
              </label>
              {v && (
                <button
                  onClick={() => setValue(p.key, undefined)}
                  className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        );

      case 'directions':
        return (
          <div className="grid grid-cols-4 gap-2">
            {(['left', 'right', 'up', 'down'] as const).map((dir) => (
              <div key={dir} className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wide text-gray-600 text-center">{dir}</span>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={(values[dir] as number) ?? 0}
                  onChange={(e) => setValue(dir, Number(e.target.value))}
                  className="w-full bg-[#15151a] text-gray-300 text-xs p-2 rounded-lg outline-none border-none text-center focus:ring-1 focus:ring-[#ff9900]/40"
                  style={{ boxShadow: 'inset 3px 3px 6px #0b0b0e, inset -3px -3px 6px #1f1f26' }}
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn p-4">
      <div
        className="rounded-3xl w-full max-w-3xl relative bg-gradient-to-br from-[#1a1a20] to-[#101014] border border-white/5 flex flex-col max-h-[88vh]"
        style={{ boxShadow: '20px 20px 60px #08080a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#ff9900] font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-[#ff9900]/10 border border-[#ff9900]/20">
              Bedrock
            </span>
            <h2 className="text-sm font-semibold text-gray-200">Stability AI Image Services</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <KeyIcon className="w-10 h-10 text-[#ff9900]" strokeWidth={1.5} />
            <p className="text-sm text-gray-300 font-medium">Bedrock is locked</p>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Add an AWS Bedrock API key to unlock {BEDROCK_SERVICES.length} Stability AI
              services — three upscalers, six editors and four control models.
            </p>
            <button
              onClick={onRequestKey}
              className="mt-2 px-5 py-2.5 rounded-lg bg-white hover:bg-[#ff9900] text-black text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Add Bedrock Key
            </button>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Service list */}
            <div className="w-56 border-r border-white/5 overflow-y-auto py-3 shrink-0">
              {BEDROCK_CATEGORY_ORDER.map((cat) => {
                const Icon = CATEGORY_ICON[cat];
                return (
                  <div key={cat} className="mb-3">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      {Icon && <Icon className="w-3 h-3 text-gray-600" />}
                      <span className="text-[9px] uppercase tracking-widest text-gray-600 font-semibold">
                        {BEDROCK_CATEGORY_LABELS[cat]}
                      </span>
                    </div>
                    {BEDROCK_SERVICES.filter((s) => s.category === cat).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                          selected === s.id
                            ? 'text-[#ff9900] bg-[#ff9900]/10 border-l-2 border-[#ff9900]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Parameter form */}
            <div className="flex-1 overflow-y-auto p-6 min-w-0">
              {!service ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <BoltIcon className="w-8 h-8 text-gray-700" />
                  <p className="text-xs text-gray-500">Pick a service to begin.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-5">
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt="Source"
                        className="w-20 h-20 object-cover rounded-xl border border-white/10 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-200">{service.label}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                      <p className="text-[9px] font-mono text-gray-700 mt-2 truncate">{service.id}</p>
                    </div>
                  </div>

                  {service.params.length === 0 && (
                    <p className="text-[11px] text-gray-500 mb-5 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      No parameters needed — this runs as a single tap.
                    </p>
                  )}

                  <div className="flex flex-col gap-4">
                    {service.params.map((p) => (
                      <div key={p.key}>
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                          {p.label}
                          {p.required && <span className="text-[#ff9900]">*</span>}
                        </label>
                        {renderParam(p)}
                        {p.hint && p.type !== 'text' && (
                          <p className="text-[9px] text-gray-600 mt-1.5">{p.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {service.forceJpeg && (
                    <p className="text-[9px] text-gray-600 mt-5 leading-relaxed">
                      Output is forced to JPEG: this upscaler's PNG payloads can exceed
                      the Bedrock response size limit.
                    </p>
                  )}

                  {missingRequired.length > 0 && (
                    <p className="text-[10px] text-amber-500/80 mt-4">
                      Required: {missingRequired.join(', ')}
                    </p>
                  )}

                  <button
                    onClick={() => selected && onRun(selected, values)}
                    disabled={!canRun}
                    className="mt-6 w-full py-3 rounded-lg bg-white hover:bg-[#ff9900] disabled:opacity-40 disabled:cursor-not-allowed text-black text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    {isBusy ? 'Running...' : `Run ${service.label}`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BedrockPanel;
