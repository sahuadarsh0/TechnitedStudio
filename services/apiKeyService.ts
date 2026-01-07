
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'technited_gemini_api_key';

export const getStoredApiKey = (): string | undefined => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || undefined;
  }
  return undefined;
};

export const setStoredApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
};

export const getEffectiveApiKey = (): string => {
   // STRICTLY Local Storage. 
   // We explicitly do NOT use process.env.API_KEY to force the user flow as requested.
   const stored = getStoredApiKey();
   if (stored) return stored;
   
   return ''; 
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  if (!key) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    // Use a lightweight model call to verify the key
    await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: 'ping' }] }
    });
    return true;
  } catch (e) {
    console.warn("API Key Validation Failed:", e);
    return false;
  }
};
