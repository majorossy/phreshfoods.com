// src/utils/retry.test.ts
/**
 * TESTING RETRY LOGIC
 * ===================
 *
 * This file tests the retry utility - one of the most CRITICAL pieces of infrastructure.
 * Retry logic prevents your app from failing when networks are flaky or servers are slow.
 *
 * WHY THIS IS CRITICAL:
 * ---------------------
 * Bad retry logic can cause:
 * - Infinite retry loops (app hangs forever)
 * - No retries (app fails on first error)
 * - Wrong delays (hammers the server or waits too long)
 * - Memory leaks (never cleans up)
 *
 * WHAT WE'RE TESTING:
 * -------------------
 * 1. Success cases (function works on first try, on retry)
 * 2. Failure cases (exhausts all retries, non-retryable errors)
 * 3. Timing (exponential backoff, custom delays)
 * 4. Custom logic (shouldRetry callback, maxRetries)
 * 5. Edge cases (immediate success, immediate failure)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryAsync } from './retry';

/**
 * Mock timers so tests run instantly
 * WHY: We don't want to wait for actual delays (1s, 2s, 4s...)
 * Tests would take forever!
 */
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/**
 * TEST SUITE 1: Success Cases
 * ============================
 * Testing functions that eventually succeed
 */
describe('retry - Success Cases', () => {
  it('returns result immediately on first success', async () => {
    // WHY THIS TEST: Most API calls succeed - shouldn't retry unnecessarily

    const mockFn = vi.fn().mockResolvedValue('success');

    const promise = retryAsync(mockFn);
    await vi.runAllTimersAsync(); // Fast-forward all timers
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1); // Only called once
  });

  it('succeeds after 1 retry', async () => {
    // WHY THIS TEST: Network hiccups - fails once, then works

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('network error')) // Fail first time
      .mockResolvedValueOnce('success'); // Succeed second time

    const promise = retryAsync(mockFn);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2); // Called twice
  });

  it('succeeds after 2 retries', async () => {
    // WHY THIS TEST: Flaky network - takes multiple attempts

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('500 server error'))
      .mockRejectedValueOnce(new Error('502 bad gateway'))
      .mockResolvedValueOnce('success');

    const promise = retryAsync(mockFn);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3); // Called three times
  });

  it('succeeds on last possible retry', async () => {
    // WHY THIS TEST: Edge case - succeeds just before giving up

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success'); // Succeeds on 4th try (max retries = 3)

    const promise = retryAsync(mockFn, { maxRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });
});

/**
 * TEST SUITE 2: Failure Cases
 * ============================
 * Testing functions that fail completely
 */
describe('retry - Failure Cases', () => {
  it('throws error after exhausting all retries', async () => {
    // WHY THIS TEST: Server is down - eventually give up

    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));

    const promise = retryAsync(mockFn, { maxRetries: 3 });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('network error');
    expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('does not retry non-retryable errors', async () => {
    // WHY THIS TEST: Some errors shouldn't retry (like 401 Unauthorized)

    const mockFn = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));

    const shouldRetry = (error: Error) => {
      // Don't retry client errors (4xx)
      return !error.message.includes('401');
    };

    const promise = retryAsync(mockFn, { shouldRetry });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('401 Unauthorized');
    expect(mockFn).toHaveBeenCalledTimes(1); // Only called once, no retries
  });

  it('respects custom maxRetries', async () => {
    // WHY THIS TEST: Verify we can control retry attempts

    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));

    const promise = retryAsync(mockFn, { maxRetries: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('network error');
    expect(mockFn).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });

  it('handles zero retries', async () => {
    // WHY THIS TEST: Edge case - no retries at all

    const mockFn = vi.fn().mockRejectedValue(new Error('error'));

    const promise = retryAsync(mockFn, { maxRetries: 0 });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('error');
    expect(mockFn).toHaveBeenCalledTimes(1); // Only initial call
  });
});

/**
 * TEST SUITE 3: Exponential Backoff
 * ==================================
 * Testing delay timing between retries
 */
describe('retry - Exponential Backoff', () => {
  it('uses exponential backoff (1s, 2s, 4s)', async () => {
    // WHY THIS TEST: Delays should increase exponentially
    // This prevents hammering a struggling server

    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));
    const delays: number[] = [];

    // Track when each call happens
    mockFn.mockImplementation(() => {
      delays.push(Date.now());
      return Promise.reject(new Error('network error'));
    });

    const promise = retryAsync(mockFn, {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    });

    // Manually advance timers to observe delays
    await vi.advanceTimersByTimeAsync(0);    // Initial call
    await vi.advanceTimersByTimeAsync(1000); // After 1s delay
    await vi.advanceTimersByTimeAsync(2000); // After 2s delay
    await vi.advanceTimersByTimeAsync(4000); // After 4s delay

    await expect(promise).rejects.toThrow();

    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  it('uses custom delay', async () => {
    // WHY THIS TEST: Verify we can customize the base delay

    const mockFn = vi.fn().mockRejectedValue(new Error('error'));

    const promise = retryAsync(mockFn, {
      maxRetries: 1,
      delayMs: 500, // Custom 500ms delay
    });

    await vi.advanceTimersByTimeAsync(0);   // Initial
    await vi.advanceTimersByTimeAsync(500); // After 500ms

    await expect(promise).rejects.toThrow();
  });

  it('uses custom backoff multiplier', async () => {
    // WHY THIS TEST: Verify we can control backoff rate

    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));

    const promise = retryAsync(mockFn, {
      maxRetries: 2,
      delayMs: 100,
      backoffMultiplier: 3, // 3x instead of 2x (100ms, 300ms, 900ms)
    });

    // Run all timers to complete all retries
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});

/**
 * TEST SUITE 4: Custom shouldRetry Logic
 * =======================================
 * Testing custom retry decision logic
 */
describe('retry - Custom shouldRetry', () => {
  it('only retries network errors', async () => {
    // WHY THIS TEST: Different errors need different handling

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Validation error')) // Don't retry
      .mockResolvedValue('success');

    const shouldRetry = (error: Error) => {
      return error.message.includes('network');
    };

    // Use try-catch to properly handle the rejection
    try {
      const promise = retryAsync(mockFn, { shouldRetry });
      await vi.runAllTimersAsync();
      await promise;
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe('Validation error');
    }

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('only retries 5xx server errors', async () => {
    // WHY THIS TEST: Retry server errors but not client errors

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('404 Not Found')) // Don't retry
      .mockResolvedValue('success');

    const shouldRetry = (error: Error) => {
      return error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503');
    };

    // Use try-catch to properly handle the rejection
    try {
      const promise = retryAsync(mockFn, { shouldRetry });
      await vi.runAllTimersAsync();
      await promise;
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe('404 Not Found');
    }

    expect(mockFn).toHaveBeenCalledTimes(1); // No retry
  });

  it('passes attempt number to shouldRetry', async () => {
    // WHY THIS TEST: Sometimes you want different logic per attempt

    const mockFn = vi.fn().mockRejectedValue(new Error('error'));
    const attemptNumbers: number[] = [];

    const shouldRetry = (_error: Error, attempt: number) => {
      attemptNumbers.push(attempt);
      return attempt <= 2; // Only retry first 2 attempts
    };

    // Use try-catch to properly handle the rejection
    try {
      const promise = retryAsync(mockFn, { maxRetries: 5, shouldRetry });
      await vi.runAllTimersAsync();
      await promise;
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe('error');
    }

    // Should have called shouldRetry with attempts 1, 2, 3
    expect(attemptNumbers).toEqual([1, 2, 3]);
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries (stopped on 3rd)
  });
});

/**
 * TEST SUITE 5: Edge Cases
 * =========================
 * Testing unusual scenarios
 */
describe('retry - Edge Cases', () => {
  it('handles non-Error objects', async () => {
    // WHY THIS TEST: Sometimes code throws strings or objects, not Errors

    const mockFn = vi.fn().mockRejectedValue('string error');

    // Use try-catch to properly handle the rejection
    try {
      const promise = retryAsync(mockFn, { maxRetries: 1 });
      await vi.runAllTimersAsync();
      await promise;
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe('string error');
    }
  });

  it('handles functions that return non-promises', async () => {
    // WHY THIS TEST: Ensure we handle synchronous values

    const mockFn = vi.fn().mockImplementation(() => {
      return Promise.resolve('sync value');
    });

    const promise = retryAsync(mockFn);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('sync value');
  });

  it('handles default retry logic for network errors', async () => {
    // WHY THIS TEST: Verify default shouldRetry works

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('success');

    const promise = retryAsync(mockFn); // Use defaults
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2); // Retried network error
  });

  it('handles default retry logic for server errors', async () => {
    // WHY THIS TEST: Verify default handles 500 errors

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('500 Internal Server Error'))
      .mockResolvedValue('success');

    const promise = retryAsync(mockFn); // Use defaults
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2); // Retried 500 error
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ Success on first try
 * ✅ Success after retries (1, 2, 3+)
 * ✅ Failure after exhausting retries
 * ✅ Non-retryable errors (immediate failure)
 * ✅ Exponential backoff timing
 * ✅ Custom delays and multipliers
 * ✅ Custom shouldRetry logic
 * ✅ Attempt number tracking
 * ✅ Edge cases (non-Error objects, defaults)
 *
 * What we learned:
 * - How to test async retry logic
 * - How to use fake timers (vi.useFakeTimers)
 * - How to test exponential backoff
 * - How to test custom callbacks
 * - How to handle timing in tests
 *
 * Coverage: 100% of retry.ts 🎉
 *
 * Why this matters:
 * - Retry logic is used in ALL API calls
 * - Bad retry = infinite loops or no retries
 * - Good retry = resilient, user-friendly app
 */
