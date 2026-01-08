
/**
 * Simple delay utility for batch processing jitter
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
