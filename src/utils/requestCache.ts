// src/utils/requestCache.ts
'use strict';

/**
 * Request Cache Utility
 *
 * Prevents duplicate in-flight requests and provides short-term caching.
 * Useful for preventing React Strict Mode double-renders and concurrent
 * component requests from triggering duplicate API calls.
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
  result?: T;
}

class RequestCache {
  private pendingRequests: Map<string, CacheEntry<any>>;
  private defaultCacheDuration: number;

  constructor(defaultCacheDuration: number = 60000) {
    this.pendingRequests = new Map();
    this.defaultCacheDuration = defaultCacheDuration; // Default: 1 minute
  }

  /**
   * Fetches data with request deduplication and caching
   *
   * @param url - The URL to fetch
   * @param options - Fetch options
   * @param cacheDuration - How long to cache the result (milliseconds)
   * @returns Promise with the fetched data
   */
  async fetch<T>(
    url: string,
    options?: RequestInit,
    cacheDuration: number = this.defaultCacheDuration
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options);

    // Check if we have a cached result
    const existing = this.pendingRequests.get(cacheKey);
    if (existing) {
      const age = Date.now() - existing.timestamp;

      // If result is cached and fresh, return it immediately
      if (existing.result && age < cacheDuration) {
        console.log(`[RequestCache] HIT (${Math.round(age)}ms old):`, url);
        return existing.result;
      }

      // If request is still in flight, return the same promise
      if (!existing.result) {
        console.log(`[RequestCache] In-flight request detected:`, url);
        return existing.promise;
      }
    }

    // Create new request
    console.log(`[RequestCache] MISS - creating new request:`, url);
    const promise = this.executeRequest<T>(url, options);

    // Store the promise immediately to prevent duplicates
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    // When promise resolves, cache the result
    promise
      .then(result => {
        const entry = this.pendingRequests.get(cacheKey);
        if (entry) {
          entry.result = result;
          entry.timestamp = Date.now();
        }

        // Clean up after cache duration expires
        setTimeout(() => {
          this.pendingRequests.delete(cacheKey);
          console.log(`[RequestCache] Expired:`, url);
        }, cacheDuration);
      })
      .catch(() => {
        // Remove failed requests immediately
        this.pendingRequests.delete(cacheKey);
      });

    return promise;
  }

  /**
   * Executes the actual HTTP request
   */
  private async executeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generates a cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const optionsKey = options ? JSON.stringify({
      method: options.method,
      body: options.body,
      headers: options.headers
    }) : '';

    return `${url}|${optionsKey}`;
  }

  /**
   * Clears a specific cache entry
   */
  clear(url: string, options?: RequestInit): void {
    const cacheKey = this.getCacheKey(url, options);
    this.pendingRequests.delete(cacheKey);
    console.log(`[RequestCache] Cleared:`, url);
  }

  /**
   * Clears all cached entries
   */
  clearAll(): void {
    this.pendingRequests.clear();
    console.log(`[RequestCache] All entries cleared`);
  }

  /**
   * Gets cache statistics
   */
  getStats() {
    return {
      size: this.pendingRequests.size,
      entries: Array.from(this.pendingRequests.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        hasResult: !!entry.result
      }))
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Expose on window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAppCache = () => {
    requestCache.clearAll();
    console.log('[DEBUG] App cache cleared! Reload the page to fetch fresh data.');
  };
}

/**
 * Convenience function for cached fetch requests
 *
 * Usage:
 * ```typescript
 * const data = await cachedFetch<Shop[]>('/api/farm-stands', {}, 300000); // 5 min cache
 * ```
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheDuration?: number
): Promise<T> {
  return requestCache.fetch<T>(url, options, cacheDuration);
}

export default requestCache;
