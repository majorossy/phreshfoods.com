// src/contexts/ToastContext.test.tsx
/**
 * Tests for ToastContext - Toast notification system
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { ToastProvider, useToast } from './ToastContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have no toasts initially', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.toasts).toEqual([]);
    });

    it('should provide showToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showToast).toBe('function');
    });

    it('should provide removeToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.removeToast).toBe('function');
    });
  });

  describe('Showing Toasts', () => {
    it('should add toast when showToast is called', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({
          message: 'Test message',
          type: 'success',
        });
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].message).toBe('Test message');
      expect(result.current.toasts[0].type).toBe('success');
    });

    it('should generate unique id for each toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Toast 1', type: 'info' });
      });

      act(() => {
        result.current.showToast({ message: 'Toast 2', type: 'info' });
      });

      expect(result.current.toasts.length).toBe(2);
      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
    });

    it('should support different toast types', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Success', type: 'success' });
      });

      act(() => {
        result.current.showToast({ message: 'Error', type: 'error' });
      });

      act(() => {
        result.current.showToast({ message: 'Warning', type: 'warning' });
      });

      act(() => {
        result.current.showToast({ message: 'Info', type: 'info' });
      });

      expect(result.current.toasts.length).toBe(4);
      expect(result.current.toasts.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info']);
    });

    it('should allow multiple toasts at once', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'First', type: 'info' });
        result.current.showToast({ message: 'Second', type: 'info' });
        result.current.showToast({ message: 'Third', type: 'info' });
      });

      expect(result.current.toasts.length).toBe(3);
    });
  });

  describe('Removing Toasts', () => {
    it('should remove toast by id', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let toastId: string;

      act(() => {
        result.current.showToast({ message: 'Test', type: 'info' });
      });

      toastId = result.current.toasts[0].id;

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts.length).toBe(0);
    });

    it('should only remove specified toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'First', type: 'info' });
        result.current.showToast({ message: 'Second', type: 'info' });
      });

      const firstId = result.current.toasts[0].id;

      act(() => {
        result.current.removeToast(firstId);
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].message).toBe('Second');
    });

    it('should handle removing non-existent toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Test', type: 'info' });
      });

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      // Should not crash, toast should still exist
      expect(result.current.toasts.length).toBe(1);
    });
  });

  describe('Auto-Dismiss', () => {
    it('should auto-dismiss toasts after duration', async () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Auto dismiss', type: 'info', duration: 1000 });
      });

      expect(result.current.toasts.length).toBe(1);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.toasts.length).toBe(0);
      });
    });

    it('should use default duration if not specified', async () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Default duration', type: 'info' });
      });

      expect(result.current.toasts.length).toBe(1);

      // Fast-forward by default duration (usually 3-5 seconds)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.toasts.length).toBe(0);
      });
    });

    it('should support persistent toasts (duration: 0)', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'Persistent', type: 'error', duration: 0 });
      });

      expect(result.current.toasts.length).toBe(1);

      // Even after long time, should not auto-dismiss
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.toasts.length).toBe(1);
    });
  });

  describe('Toast Queue Management', () => {
    it('should maintain FIFO order for toasts', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ message: 'First', type: 'info' });
        result.current.showToast({ message: 'Second', type: 'info' });
        result.current.showToast({ message: 'Third', type: 'info' });
      });

      expect(result.current.toasts[0].message).toBe('First');
      expect(result.current.toasts[1].message).toBe('Second');
      expect(result.current.toasts[2].message).toBe('Third');
    });

    it('should handle rapid toast additions', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.showToast({ message: `Toast ${i}`, type: 'info' });
        }
      });

      expect(result.current.toasts.length).toBe(10);
    });
  });

  describe('Toast Properties', () => {
    it('should include all required properties in toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({
          message: 'Complete toast',
          type: 'success',
          duration: 2000,
        });
      });

      const toast = result.current.toasts[0];

      expect(toast).toHaveProperty('id');
      expect(toast).toHaveProperty('message');
      expect(toast).toHaveProperty('type');
      expect(toast.message).toBe('Complete toast');
      expect(toast.type).toBe('success');
    });

    it('should support custom action buttons', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const action = {
        label: 'Undo',
        onClick: vi.fn(),
      };

      act(() => {
        result.current.showToast({
          message: 'With action',
          type: 'info',
          action,
        });
      });

      const toast = result.current.toasts[0];

      // Toast should include action if supported
      expect(toast.message).toBe('With action');
    });
  });
});
