
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_OPTIMIZATION, MODEL_TRANSCRIPTION } from "../constants";
import { OptimizationResponse } from "../types";
import { getEffectiveApiKey } from "./apiKeyService";

// Helper to get array buffer from blob
const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcribes audio using Gemini 3 Flash.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
    const base64Audio = await blobToBase64(audioBlob);

    const response = await ai.models.generateContent({
      model: MODEL_TRANSCRIPTION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the following audio accurately into English. Return only the transcription text.",
          },
        ],
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

/**
 * Helper to process the optimization response
 */
const processOptimizationResponse = (response: any): OptimizationResponse => {
  const text = response.text;
  if (!text) throw new Error("Empty response from optimization");
  
  let parsed: OptimizationResponse;
  try {
    parsed = JSON.parse(text) as OptimizationResponse;
  } catch (e) {
    // Handle potential markdown code block wrapping
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch (innerE) {
        // If regex match fails to parse, try finding the first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
             parsed = JSON.parse(text.substring(start, end + 1));
        } else {
            throw innerE;
        }
      }
    } else {
        // Try finding raw JSON object in text
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
             parsed = JSON.parse(text.substring(start, end + 1));
        } else {
            throw e;
        }
    }
  }

  // Extract grounding chunks if available
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources: { title: string; uri: string }[] = [];
  
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ 
          title: chunk.web.title || "Web Source", 
          uri: chunk.web.uri || "#" 
        });
      }
    });
  }

  return {
    ...parsed,
    searchSources: sources.length > 0 ? sources : undefined
  };
};

/**
 * Optimizes the prompt using Gemini 3 Flash with JSON output.
 * Uses Google Search for grounding if the prompt implies recent events.
 * Implements fallback to Gemini 2.5 if Gemini 3 hits quota limits.
 */
export const optimizePrompt = async (rawPrompt: string): Promise<OptimizationResponse> => {
  const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });

  const createRequestConfig = (model: string) => {
    // Detect if we are using the newer Gemini 3 model which supports native JSON + Tools better
    const isGemini3 = model.includes('gemini-3');

    let promptText = `Enhance the following image generation prompt.
    If the prompt refers to specific real-world events, people, places, or objects, you MUST use Google Search to retrieve accurate, up-to-date visual details (colors, attire, setting, atmosphere).
    Incorporate these factual visual details into the optimized prompt.
    Make the final prompt descriptive, cinematic, and highly detailed for a text-to-image model.
    
    Raw Prompt: "${rawPrompt}"`;

    const config: any = {
      tools: [{ googleSearch: {} }]
    };

    if (isGemini3) {
      // Gemini 3 supports responseSchema with tools usually
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          optimizedPrompt: { type: Type.STRING, description: "The enhanced, detailed prompt." },
          enhancementReasoning: { type: Type.STRING, description: "Brief explanation of changes made and any search data used." },
        },
      };
    } else {
      // Fallback for Gemini 2.5 or others that might error with JSON MIME + Tools
      // Explicitly ask for JSON in the prompt instead of enforcing MIME type
      promptText += `\n\nIMPORTANT: Return the response strictly in valid JSON format with the keys "optimizedPrompt" and "enhancementReasoning". Do not include markdown formatting if possible.`;
    }

    return {
      model: model,
      contents: promptText,
      config: config
    };
  };

  try {
    // Primary attempt
    const response = await ai.models.generateContent(createRequestConfig(MODEL_OPTIMIZATION));
    return processOptimizationResponse(response);
  } catch (error: any) {
    // Check for Resource Exhausted (429) or other API errors
    const isQuotaError = error.status === 429 || error.code === 429 || (error.message && error.message.includes("quota"));
    
    if (isQuotaError) {
      console.warn("Gemini 3 Flash quota exceeded. Attempting fallback to Gemini 2.5 Flash...");
      try {
        // Fallback attempt with Gemini 2.5 Flash
        // Note: Gemini 2.5 Flash may fail if responseMimeType='application/json' is used with tools
        const response = await ai.models.generateContent(createRequestConfig('gemini-2.5-flash'));
        return processOptimizationResponse(response);
      } catch (fallbackError: any) {
        console.error("Fallback optimization failed:", fallbackError);
        // If the fallback specifically failed due to the JSON/Tool issue despite our check, try one last time without tools? 
        // Or just fail gracefully to raw prompt.
      }
    } else {
      console.error("Optimization error:", error);
    }
    
    // Final fallback: return raw prompt
    return { 
      optimizedPrompt: rawPrompt, 
      enhancementReasoning: isQuotaError 
        ? "Optimization skipped (high traffic). Using raw prompt." 
        : "Optimization failed. Using raw prompt." 
    };
  }
};
