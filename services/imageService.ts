
import { GoogleGenAI } from "@google/genai";
import { MODEL_EDITING } from "../constants";
import { GenerationSettings, GeneratedImage, AIModel } from "../types";
import { getEffectiveApiKey } from "./apiKeyService";
import { callWithRetry } from "./retryStrategy";
import { batchProcess } from "./batchProcessor";
import { extractImageFromResponse } from "./responseMapper";

// --- API Call Helper ---

const createApiCaller = (
    ai: GoogleGenAI, 
    model: string, 
    contents: any, 
    config: any, 
    signal?: AbortSignal
) => {
    return async () => {
        // RCA FIX: Reduced timeout from 45s to 35s.
        // This ensures that if the Pro model hangs, we fail fast enough to switch 
        // to the fallback model and still complete within the user's 50s total limit.
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), 35000)
        );

        const generationPromise = ai.models.generateContent({
            model,
            contents,
            config,
        });
        
        const response = await Promise.race([generationPromise, timeoutPromise]) as any;
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error('SAFETY_BLOCK');
        }
        return response;
    };
};

const executeWithFallback = async (
    ai: GoogleGenAI,
    mainModel: string,
    mainPrompt: string,
    settings: GenerationSettings,
    mainConfig: any,
    contents: any,
    signal?: AbortSignal
) => {
    try {
        const mainApiCall = createApiCaller(ai, mainModel, contents, mainConfig, signal);
        return await callWithRetry(mainApiCall, 1, signal);
    } catch (err: any) {
        // Fallback logic specifically for Pro -> Flash downgrades
        const shouldFallback = mainModel === AIModel.PRO && (
            err.status === 403 || 
            err.status === 429 || 
            (err.message && err.message.includes("permission")) || 
            err.message === 'REQUEST_TIMEOUT'
        );

        if (shouldFallback) {
            if (signal?.aborted) throw new Error("ABORTED");
            console.warn(`Pro model failed or timed out. Falling back to Flash.`);
            
            const fallbackApiCall = createApiCaller(
                ai, 
                AIModel.FLASH, 
                { parts: [{ text: mainPrompt }] }, // Simplified contents for fallback
                { imageConfig: { aspectRatio: settings.aspectRatio } },
                signal
            );
            
            // Retry fallback once if it's a transient error (not timeout)
            return await callWithRetry(fallbackApiCall, 1, signal);
        }
        throw err;
    }
};

// --- Public Methods ---

export const generateImages = async (
  prompt: string,
  settings: GenerationSettings,
  signal?: AbortSignal,
  onImageGenerated?: (image: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
  const fullPrompt = prompt.trim();
  const count = Math.max(1, Math.floor(settings.batchSize));

  return batchProcess(count, async (index) => {
      if (signal?.aborted) return null;

      try {
        const modelToUse = settings.model;
        const imageConfig: any = { aspectRatio: settings.aspectRatio };

        if (modelToUse === AIModel.PRO) {
          imageConfig.imageSize = settings.resolution;
        }

        const config: any = { imageConfig: imageConfig };
        
        if (modelToUse === AIModel.PRO && settings.googleSearch) {
             config.tools = [{ googleSearch: {} }];
        }

        const contents = { parts: [{ text: fullPrompt }] };

        const startTime = Date.now();
        const response = await executeWithFallback(
            ai, modelToUse, fullPrompt, settings, config, contents, signal
        );
        const endTime = Date.now();
        
        if (signal?.aborted) return null;

        return extractImageFromResponse(response, fullPrompt, settings, (endTime - startTime) / 1000);
      } catch (err: any) {
        if (err.message === 'ABORTED' || signal?.aborted) return null;
        console.error(`Generation failed for item ${index}:`, err);
        return null;
      }
  }, signal, onImageGenerated);
};

export const editImage = async (
  base64Images: string | string[],
  instruction: string,
  settings: GenerationSettings,
  signal?: AbortSignal,
  onImageGenerated?: (image: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
  const count = Math.max(1, Math.floor(settings.batchSize));
  
  const inputs = Array.isArray(base64Images) ? base64Images : [base64Images];
  const parts: any[] = [];
  
  inputs.forEach(imgStr => {
      const base64Data = imgStr.replace(new RegExp("^data:image\\/(png|jpeg|webp);base64,"), "");
      const mimeMatch = imgStr.match(new RegExp("^data:(image\\/[a-zA-Z+]+);base64,"));
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
  });

  parts.push({ text: instruction });

  return batchProcess(count, async (index) => {
    if (signal?.aborted) return null;
    try {
      const modelToUse: string = settings.model || MODEL_EDITING;
      const imageConfig: any = { aspectRatio: settings.aspectRatio };
      
      if (modelToUse === AIModel.PRO) {
          imageConfig.imageSize = settings.resolution;
      }

      const config: any = { imageConfig: imageConfig };

      if (modelToUse === AIModel.PRO && settings.googleSearch) {
          config.tools = [{ googleSearch: {} }];
      }

      const contents = { parts: parts };

      const startTime = Date.now();
      const response = await executeWithFallback(
          ai, modelToUse, instruction, settings, config, contents, signal
      );
      const endTime = Date.now();
      
      if (signal?.aborted) return null;

      return extractImageFromResponse(response, instruction, settings, (endTime - startTime) / 1000);
    } catch (error: any) {
      if (error.message === 'ABORTED' || signal?.aborted) return null;
      console.error(`Edit error for item ${index}:`, error);
      return null;
    }
  }, signal, onImageGenerated);
};
