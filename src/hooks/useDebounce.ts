// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';
import { DEBOUNCE_DELAY_MS } from '../config/appConfig';

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: DEBOUNCE_DELAY_MS)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DELAY_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
