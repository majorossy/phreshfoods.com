// src/utils/retry.ts

/**
 * Configuration options for retry logic
 */
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors or 5xx server errors
    const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
    const isServerError = error.message.includes('500') || error.message.includes('502') || error.message.includes('503');
    return isNetworkError || isServerError;
  },
};

/**
 * Delays execution for a specified number of milliseconds
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries an async function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function or throws the last error
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError, attempt + 1)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delayTime = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt);

      await delay(delayTime);
    }
  }

  // If we get here, all retries failed
  throw lastError!;
}
