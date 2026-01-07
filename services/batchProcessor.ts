
import { GeneratedImage } from "../types";
import { delay } from "./retryStrategy";

/**
 * Optimized batch processor using a concurrency pool.
 * Processes 'count' items with a maximum of 'maxConcurrent' active requests.
 */
export const batchProcess = async (
  count: number, 
  fn: (index: number) => Promise<GeneratedImage | null>,
  signal?: AbortSignal,
  onImageGenerated?: (image: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
    
    const results: (GeneratedImage | null)[] = new Array(count).fill(null);
    let nextIndex = 0;
    
    // Concurrency limit: 3 is a safe sweet spot
    const maxConcurrent = 3;

    const worker = async () => {
        while (nextIndex < count) {
            if (signal?.aborted) return;
            const index = nextIndex++;
            
            // Tiny jitter to prevent exact timestamp collisions on the API side
            await delay(Math.random() * 200);

            try {
                if (signal?.aborted) return;
                const result = await fn(index);
                results[index] = result;
                
                // Progressive Loading Callback
                if (result && onImageGenerated && !signal?.aborted) {
                    onImageGenerated(result);
                }
            } catch (e) {
                console.error(`Batch worker error at index ${index}`, e);
            }
        }
    };

    const threads = Array.from({ length: Math.min(count, maxConcurrent) }, () => worker());
    await Promise.all(threads);

    const validImages = results.filter((img): img is GeneratedImage => img !== null);

    if (validImages.length === 0 && count > 0 && !signal?.aborted) {
        throw new Error("Failed to generate any images. Your quota may be exhausted or the prompt was blocked.");
    }

    return validImages;
};
