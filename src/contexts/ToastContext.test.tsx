// src/contexts/ToastContext.test.tsx
/**
 * Tests for ToastContext - Toast notification system
 *
 * NOTE: The ToastContext provides helper functions but does not
 * expose internal state (toasts array). Tests verify the public API.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { ToastProvider, useToast } from './ToastContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useToast hook', () => {
    it('should provide showToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showToast).toBe('function');
    });

    it('should provide showSuccess function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showSuccess).toBe('function');
    });

    it('should provide showError function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showError).toBe('function');
    });

    it('should provide showWarning function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showWarning).toBe('function');
    });

    it('should provide showInfo function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showInfo).toBe('function');
    });
  });

  describe('Context requirement', () => {
    it('should throw error when used outside provider', () => {
      // renderHook without wrapper should throw
      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within a ToastProvider');
    });
  });
});
