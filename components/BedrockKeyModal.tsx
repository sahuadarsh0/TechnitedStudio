import React, { useState, useEffect } from 'react';
import {
  validateBedrockKey,
  setStoredBedrockKey,
  getStoredBedrockKey,
  clearStoredBedrockKey,
  getBedrockRegion,
  setBedrockRegion,
} from '../services/bedrockKeyService';
import { AWS_REGIONS, BEDROCK_SERVICES } from '../bedrockCatalog';
import { playSound } from '../services/soundService';
import { CloseIcon, KeyIcon, EyeIcon, EyeOffIcon } from './Icons';

interface BedrockKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Bedrock credential modal, deliberately mirroring ApiKeySettingsModal so the
 * two providers feel identical.
 *
 * Bedrock long-lived API keys are bearer tokens, so no AWS SDK or SigV4
 * signing is needed — and bedrock-runtime sends `access-control-allow-origin: *`,
 * so no proxy is needed either. Validation performs one real (tiny) Fast
 * Upscale call, which simultaneously proves the key works, the region is right,
 * and the Stability services are subscribed on the account.
 */
const BedrockKeyModal: React.FC<BedrockKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [key, setKey] = useState('');
  const [region, setRegion] = useState(getBedrockRegion());
  const [isVisible, setIsVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKey(getStoredBedrockKey() || '');
      setRegion(getBedrockRegion());
      setIsVisible(false);
      setError(null);
      setOk(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!key.trim()) {
      setError('Please enter a Bedrock API key.');
      return;
    }

    setIsValidating(true);
    setError(null);
    setOk(false);
    playSound('start', true);

    const result = await validateBedrockKey(key.trim(), region);

    if (result.ok) {
      setStoredBedrockKey(key.trim());
      setBedrockRegion(region);
      setOk(true);
      playSound('success', true);
      onSuccess();
      setTimeout(() => onClose(), 900);
    } else {
      setError(result.reason || 'Verification failed.');
      playSound('error', true);
    }
    setIsValidating(false);
  };

  const handleDisconnect = () => {
    clearStoredBedrockKey();
    setKey('');
    setOk(false);
    setError(null);
    onSuccess();
  };

  const serviceCount = BEDROCK_SERVICES.length;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div
        className="rounded-3xl p-8 w-full max-w-md relative bg-gradient-to-br from-[#1e1e24] to-[#121212] border border-white/5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '20px 20px 60px #0a0a0a, -20px -20px 60px #26262e' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[#ff9900] mb-4"
            style={{
              background: 'linear-gradient(145deg, #16161b, #1a1a20)',
              boxShadow: '5px 5px 10px #0e0e11, -5px -5px 10px #26262f',
            }}
          >
            <KeyIcon className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-200 tracking-tight">Bedrock Access</h2>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Unlock {serviceCount} Stability AI editing &amp; upscaling services.
          </p>
        </div>

        {/* Region */}
        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-[#15151a] text-gray-300 text-sm p-3 rounded-xl outline-none border-none focus:ring-1 focus:ring-[#ff9900]/50"
            style={{ boxShadow: 'inset 4px 4px 8px #0b0b0e, inset -4px -4px 8px #1f1f26' }}
          >
            {AWS_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-600 mt-1.5">
            Stability image services are most widely available in us-east-1.
          </p>
        </div>

        {/* Key */}
        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={isVisible ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste Bedrock API key..."
              className="w-full bg-[#15151a] text-gray-300 text-sm p-4 pr-12 rounded-xl outline-none border-none placeholder-gray-600 transition-all focus:text-white focus:ring-1 focus:ring-[#ff9900]/50"
              style={{ boxShadow: 'inset 4px 4px 8px #0b0b0e, inset -4px -4px 8px #1f1f26' }}
            />
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
              title={isVisible ? 'Hide Key' : 'Show Key'}
            >
              {isVisible ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-3 leading-relaxed">{error}</p>}
          {ok && <p className="text-emerald-400 text-xs mt-3">Connected. Bedrock services unlocked.</p>}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="relative overflow-hidden group w-full py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <div className="absolute inset-0 bg-white transition-opacity duration-300 opacity-100 group-hover:bg-[#ff9900]"></div>
            <div className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-black font-bold text-xs tracking-widest uppercase">
                {isValidating ? 'Verifying...' : 'Validate & Save'}
              </span>
            </div>
          </button>

          {getStoredBedrockKey() && (
            <button
              onClick={handleDisconnect}
              className="w-full py-2.5 rounded-lg text-[10px] uppercase tracking-widest text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors"
            >
              Disconnect Bedrock
            </button>
          )}

          <a
            href="https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started-api-keys.html"
            target="_blank"
            rel="noreferrer"
            className="text-center text-[10px] text-gray-500 hover:text-white underline transition-colors uppercase tracking-wide"
          >
            How to create a Bedrock API key
          </a>
        </div>

        <p className="text-[10px] text-gray-600 mt-5 leading-relaxed border-t border-white/5 pt-4">
          Your key is stored only in this browser's local storage and is sent
          directly to AWS. Requires a one-time subscription to Stability AI
          Image Services in the Bedrock console.
        </p>
      </div>
    </div>
  );
};

export default BedrockKeyModal;
