
import { GeneratedImage, GenerationSettings } from "../types";

export const extractImageFromResponse = (
    response: any, 
    prompt: string, 
    settings: GenerationSettings,
    duration?: number
): GeneratedImage | null => {
  let imageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) return null;

  const candidate = response.candidates?.[0];
  const metadata = candidate?.groundingMetadata || candidate?.grounding_metadata;
  const groundingChunks = metadata?.groundingChunks || metadata?.grounding_chunks;
  
  const sources: { title: string; uri: string }[] = [];
  
  if (groundingChunks && Array.isArray(groundingChunks)) {
    groundingChunks.forEach((chunk: any) => {
      const web = chunk.web;
      if (web) {
        sources.push({ 
          title: web.title || "Web Source", 
          uri: web.uri || "#" 
        });
      }
    });
  }

  return {
    id: crypto.randomUUID(),
    url: imageUrl,
    prompt: prompt,
    timestamp: Date.now(),
    settings: settings,
    sources: sources.length > 0 ? sources : undefined,
    generationTime: duration
  } as GeneratedImage;
};
