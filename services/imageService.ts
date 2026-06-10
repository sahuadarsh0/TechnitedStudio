
import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, GeneratedImage } from "../types";
import { getEffectiveApiKey } from "./apiKeyService";
import { getModelCapabilities } from "../constants";
import { batchProcess } from "./batchProcessor";
import { extractImageFromResponse } from "./responseMapper";

// --- Constants ---
// Increased to 240s (4 mins) to handle extreme load/queue times on 4K Pro models
const HARD_TIMEOUT_MS = 240000; 
const MAX_RETRIES = 5;

// --- API Call Helper ---

const executeApiCall = async (
    ai: GoogleGenAI,
    model: string,
    contents: any,
    config: any,
    signal?: AbortSignal
): Promise<any> => {
    let lastError: any;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (signal?.aborted) throw new Error("ABORTED");

        try {
            // Hard timeout logic per attempt
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), HARD_TIMEOUT_MS)
            );

            // Create abort handler for signal
            const abortPromise = new Promise((_, reject) => {
                if (signal) {
                    const abortHandler = () => reject(new Error("ABORTED"));
                    signal.addEventListener('abort', abortHandler, { once: true });
                }
            });

            const generationPromise = ai.models.generateContent({
                model,
                contents,
                config,
            });

            // Race between generation, timeout, and abort
            const racers = [generationPromise, timeoutPromise];
            if (signal) racers.push(abortPromise);

            const response = await Promise.race(racers) as any;

            if (response.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error('SAFETY_BLOCK');
            }

            return response;

        } catch (err: any) {
            lastError = err;

            // Don't retry if aborted or safety blocked
            if (err.message === 'ABORTED' || err.message === 'SAFETY_BLOCK' || signal?.aborted) {
                throw err;
            }

            // Identify retryable errors
            const isClientTimeout = err.message === 'REQUEST_TIMEOUT';
            const isServerUnavailable = err.status === 503 || err.code === 503 || (err.message && err.message.includes('Deadline expired'));
            const isQuota = err.status === 429 || err.code === 429;
            const isInternalError = err.status === 500 || err.code === 500;

            const isRetryable = isClientTimeout || isServerUnavailable || isQuota || isInternalError;

            if (isRetryable && attempt < MAX_RETRIES - 1) {
                // Exponential backoff with higher base: 3s, 6s, 12s, 24s, 48s + jitter
                const baseDelay = 3000 * Math.pow(2, attempt);
                const jitter = Math.random() * 1000;
                const backoff = baseDelay + jitter;
                
                console.warn(`Attempt ${attempt + 1} failed: ${err.message || err.statusText}. Retrying in ${Math.round(backoff)}ms...`);
                
                // Wait for backoff period
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }

            // If we've run out of retries or it's not retryable, throw the error
            throw err;
        }
    }
    throw lastError;
};

// --- Config Builders ---

const buildImageConfig = (settings: GenerationSettings): any => {
    const imageConfig: any = {};
    const caps = getModelCapabilities(settings.model);

    // "auto" means let the model decide — omit the field entirely.
    if (settings.aspectRatio && settings.aspectRatio !== 'auto') {
        imageConfig.aspectRatio = settings.aspectRatio;
    }

    // Both Nano Banana 2 and Nano Banana Pro support 1K/2K/4K output.
    if (caps.resolutions) {
        imageConfig.imageSize = settings.resolution;
    }

    return imageConfig;
};

const buildRequestConfig = (settings: GenerationSettings): any => {
    const config: any = {
        imageConfig: buildImageConfig(settings)
    };

    const caps = getModelCapabilities(settings.model);

    // Enable Google Grounding when requested (supported on both tiers).
    if (caps.grounding && settings.googleSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    return config;
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
            const config = buildRequestConfig(settings);
            const contents = { parts: [{ text: fullPrompt }] };

            const startTime = Date.now();
            const response = await executeApiCall(
                ai,
                settings.model,
                contents,
                config,
                signal
            );
            const endTime = Date.now();

            if (signal?.aborted) return null;

            return extractImageFromResponse(response, fullPrompt, settings, (endTime - startTime) / 1000);
        } catch (err: any) {
            if (err.message === 'ABORTED' || signal?.aborted) return null;
            throw err;
        }
    }, signal, onImageGenerated);
};

/**
 * Region-aware edit: sends the original image plus a mask-overlay image (the
 * region the user painted, highlighted in magenta) and instructs the model to
 * only modify the highlighted area. Gemini's edit endpoint has no dedicated
 * mask channel, so the highlighted-overlay technique is used.
 */
export const editImageWithMask = async (
    baseImage: string,
    maskOverlay: string,
    instruction: string,
    settings: GenerationSettings,
    signal?: AbortSignal
): Promise<GeneratedImage[]> => {
    const guided = `Edit only the area highlighted in magenta in the second image. Apply this change to that region: ${instruction.trim()}. Keep everything outside the highlighted region identical to the first image. Do not draw the magenta highlight in the output.`;
    return editImage([baseImage, maskOverlay], guided, { ...settings, batchSize: 1 }, signal);
};

export const editImage = async (
    input: string | string[],
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
            const config = buildRequestConfig(settings);
            
            const parts: any[] = [];
            
            // Handle Inputs (String or Array)
            const inputs = Array.isArray(input) ? input : [input];
            
            for (const dataUrl of inputs) {
                 // Clean data URL to get base64 and mime
                 const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                 if (match) {
                     parts.push({
                         inlineData: {
                             mimeType: match[1],
                             data: match[2]
                         }
                     });
                 }
            }
            
            parts.push({ text: fullPrompt });
            const contents = { parts };

            const startTime = Date.now();
            
            // Use selected model from settings for editing
            const response = await executeApiCall(
                ai,
                settings.model, 
                contents,
                config,
                signal
            );
            const endTime = Date.now();

            if (signal?.aborted) return null;

            return extractImageFromResponse(response, fullPrompt, settings, (endTime - startTime) / 1000);
        } catch (err: any) {
             if (err.message === 'ABORTED' || signal?.aborted) return null;
             throw err; 
        }
    }, signal, onImageGenerated);
};
