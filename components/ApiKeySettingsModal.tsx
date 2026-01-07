
import React, { useState, useEffect } from 'react';
import { validateApiKey, setStoredApiKey, getStoredApiKey } from '../services/apiKeyService';
import { playSound } from '../services/soundService';

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
        playSound('click', true);
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
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
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
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
