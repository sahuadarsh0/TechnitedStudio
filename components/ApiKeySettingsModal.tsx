
import React, { useState, useEffect } from 'react';
import { validateApiKey, setStoredApiKey, getStoredApiKey } from '../services/apiKeyService';
import { playSound } from '../services/soundService';
import { CloseIcon, KeyIcon, EyeIcon, EyeOffIcon } from './Icons';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isMandatory?: boolean;
}

const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({ isOpen, onClose, onSuccess, isMandatory = false }) => {
  const [key, setKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing key when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      if (stored) {
        setKey(stored);
      }
      setIsVisible(false); // Default to masked
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!key.trim()) {
        setError("Please enter a valid API key.");
        return;
    }

    setIsValidating(true);
    setError(null);
    playSound('start', true);

    const isValid = await validateApiKey(key.trim());

    if (isValid) {
        setStoredApiKey(key.trim());
        playSound('success', true);
        onSuccess();
        if (!isMandatory) {
            onClose();
        }
    } else {
        setError("Invalid API Key. Verification failed.");
        playSound('error', true);
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
       <div 
         className="rounded-3xl p-8 w-[90%] max-w-md relative bg-gradient-to-br from-[#1e1e24] to-[#121212] border border-white/5"
         style={{
             boxShadow: '20px 20px 60px #0a0a0a, -20px -20px 60px #26262e' // Neumorphic Outer Shadow
         }}
       >
          {!isMandatory && (
              <button 
                 onClick={onClose} 
                 className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                 <CloseIcon className="w-5 h-5" />
              </button>
          )}

          <div className="flex flex-col items-center mb-6">
              <div 
                 className="w-16 h-16 rounded-full flex items-center justify-center text-laserBlue mb-4"
                 style={{
                     background: 'linear-gradient(145deg, #16161b, #1a1a20)',
                     boxShadow: '5px 5px 10px #0e0e11, -5px -5px 10px #26262f' // Neumorphic Inner on gradient
                 }}
              >
                  <KeyIcon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-200 tracking-tight">Access Configuration</h2>
              <p className="text-xs text-gray-500 mt-2 text-center">Unlock the studio with your Nano Banana key.</p>
          </div>

          <div className="mb-6">
              <div className="relative">
                  <input 
                    type={isVisible ? "text" : "password"} 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Paste API Key here..."
                    className="w-full bg-[#15151a] text-gray-300 text-sm p-4 pr-12 rounded-xl outline-none border-none placeholder-gray-600 transition-all focus:text-white focus:ring-1 focus:ring-laserBlue/50"
                    style={{
                        boxShadow: 'inset 4px 4px 8px #0b0b0e, inset -4px -4px 8px #1f1f26' // Neumorphic Inner
                    }}
                  />
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
                    title={isVisible ? "Hide Key" : "Show Key"}
                  >
                    {isVisible ? (
                        <EyeOffIcon className="w-4 h-4" />
                    ) : (
                        <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-3 text-center animate-pulse">{error}</p>}
          </div>

          <div className="flex flex-col gap-4">
              {/* Simple Button Style matching Generate Button */}
              <button 
                 onClick={handleValidate}
                 disabled={isValidating}
                 className="relative overflow-hidden group w-full py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                 <div className="absolute inset-0 bg-white transition-opacity duration-300 opacity-100 group-hover:bg-laserBlue"></div>
                 <div className="relative z-10 flex items-center justify-center gap-2">
                     <span className="text-black font-bold text-xs tracking-widest uppercase">
                        {isValidating ? 'Verifying...' : 'Validate & Save'}
                     </span>
                 </div>
              </button>
              
              <div className="text-center">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-gray-500 hover:text-white underline transition-colors uppercase tracking-wide"
                  >
                      Get Key from Google AI Studio
                  </a>
              </div>
          </div>
       </div>
    </div>
  );
};

export default ApiKeySettingsModal;
