
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to extract retry delay from error object or message
export const getRetryDelay = (error: any): number => {
  if (error.details) {
      const retryInfo = error.details.find((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
      if (retryInfo && retryInfo.retryDelay) {
          const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
          if (!isNaN(seconds)) return (seconds * 1000) + 1000; // +1s buffer
      }
  }
  if (error.message) {
      const match = error.message.match(/retry in ([\d\.]+)s/);
      if (match && match[1]) {
           return (parseFloat(match[1]) * 1000) + 1000;
      }
  }
  return 0;
};

// Robust retry wrapper with backoff and signal racing
export const callWithRetry = async <T>(
    fn: () => Promise<T>,
    retries: number = 1,
    signal?: AbortSignal,
    backoffBase: number = 1000
): Promise<T> => {
    try {
        if (signal?.aborted) throw new Error("ABORTED");

        // Race the function execution against the abort signal
        const result = await new Promise<T>((resolve, reject) => {
            const abortHandler = () => {
                reject(new Error("ABORTED"));
            };
            
            if (signal?.aborted) {
                abortHandler();
                return;
            }

            signal?.addEventListener('abort', abortHandler);

            fn()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    signal?.removeEventListener('abort', abortHandler);
                });
        });

        return result;
    } catch (error: any) {
        if (signal?.aborted || error.message === 'ABORTED') {
            throw new Error("ABORTED");
        }

        // RCA FIX: Removed 'REQUEST_TIMEOUT' from isTransient.
        // A timeout implies the model is hanging/slow. Retrying immediately usually results in another timeout.
        // Failing fast allows the fallback logic (Pro -> Flash) to trigger within the acceptable time window.
        const isTransient = 
            error.status === 429 || 
            error.code === 429 || 
            (error.message && (error.message.includes("quota") || error.message.includes("overloaded"))) ||
            error.status === 503;
        
        if (isTransient && retries > 0) {
            let waitTime = getRetryDelay(error);
            if (!waitTime) {
                // Exponential backoff
                waitTime = backoffBase * Math.pow(2, 1 - retries);
            }
            
            // Cap max wait to 15s to prevent excessive delays
            waitTime = Math.min(waitTime, 15000);
            
            console.warn(`API Limit hit. Retrying in ${Math.ceil(waitTime/1000)}s...`);
            
            // Wait with signal check
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, waitTime);
                const abortHandler = () => {
                    clearTimeout(timeout);
                    reject(new Error("ABORTED"));
                };
                if (signal?.aborted) {
                    abortHandler();
                    return;
                }
                signal?.addEventListener('abort', abortHandler);
            }).catch(e => { throw e; });

            return callWithRetry(fn, retries - 1, signal, backoffBase);
        }
        
        throw error;
    }
};
