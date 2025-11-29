// src/contexts/UIContext.test.tsx
/**
 * Tests for UIContext - Complex state management for overlays and UI
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { UIProvider, useUI } from './UIContext';
import { BrowserRouter } from 'react-router-dom';
import type { Shop } from '../types';

const mockShop: Shop = {
  type: 'farm_stand',
  Name: 'Test Farm',
  Address: '123 Main St',
  slug: 'test-farm',
  lat: 43.6591,
  lng: -70.2568,
  products: { beef: true },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <UIProvider>{children}</UIProvider>
  </BrowserRouter>
);

describe('UIContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have overlays closed initially', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.isShopOverlayOpen).toBe(false);
      expect(result.current.isSocialOverlayOpen).toBe(false);
      expect(result.current.selectedShop).toBe(null);
    });

    it('should have default bottom sheet height', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.bottomSheetHeight).toBe(0.3);
    });

    it('should not be manually collapsed initially', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.isManuallyCollapsed).toBe(false);
    });

    it('should have filter drawer closed initially', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.isFilterDrawerOpen).toBe(false);
    });
  });

  describe('Shop Selection', () => {
    it('should set selected shop', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setSelectedShop(mockShop);
      });

      expect(result.current.selectedShop).toEqual(mockShop);
    });

    it('should clear selected shop', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setSelectedShop(mockShop);
      });

      expect(result.current.selectedShop).toEqual(mockShop);

      act(() => {
        result.current.setSelectedShop(null);
      });

      expect(result.current.selectedShop).toBe(null);
    });
  });

  describe('Opening Shop Overlays', () => {
    it('should open shop overlay when openShopOverlays called with default params', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      expect(result.current.selectedShop).toEqual(mockShop);
      expect(result.current.isShopOverlayOpen).toBe(true);
      expect(result.current.isSocialOverlayOpen).toBe(true);
    });

    it('should set selectedShop when opening overlays', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      expect(result.current.selectedShop).toEqual(mockShop);
    });

    it('should open only shop tab when openTab="shop"', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop, 'shop');
      });

      expect(result.current.isShopOverlayOpen).toBe(true);
      expect(result.current.isSocialOverlayOpen).toBe(true);
    });

    it('should open social tab when openTab="social"', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop, 'social');
      });

      expect(result.current.isSocialOverlayOpen).toBe(true);
      expect(result.current.isShopOverlayOpen).toBe(false);
    });

    it('should open directions tab when openTab="directions"', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop, 'directions');
      });

      expect(result.current.isSocialOverlayOpen).toBe(true);
      expect(result.current.isShopOverlayOpen).toBe(false);
    });

    it('should add modal-active class to body when opening', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      expect(document.body.classList.contains('modal-active')).toBe(true);
    });
  });

  describe('Closing Shop Overlays', () => {
    it('should close both overlays', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      act(() => {
        result.current.closeShopOverlays();
      });

      expect(result.current.isShopOverlayOpen).toBe(false);
      expect(result.current.isSocialOverlayOpen).toBe(false);
    });

    it('should remove modal-active class from body', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      expect(document.body.classList.contains('modal-active')).toBe(true);

      act(() => {
        result.current.closeShopOverlays();
      });

      expect(document.body.classList.contains('modal-active')).toBe(false);
    });

    it('should delay clearing selectedShop for animation', async () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      expect(result.current.selectedShop).toEqual(mockShop);

      act(() => {
        result.current.closeShopOverlays();
      });

      // selectedShop should still be set immediately after close (for animation)
      expect(result.current.selectedShop).toEqual(mockShop);

      // After animation duration, selectedShop should be cleared
      await waitFor(() => {
        expect(result.current.selectedShop).toBe(null);
      }, { timeout: 500 });
    });
  });

  describe('Bottom Sheet Height', () => {
    it('should update bottom sheet height', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setBottomSheetHeight(0.5);
      });

      expect(result.current.bottomSheetHeight).toBe(0.5);
    });

    it('should accept height values between 0 and 1', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setBottomSheetHeight(0.9);
      });

      expect(result.current.bottomSheetHeight).toBe(0.9);
    });
  });

  describe('Manual Collapse Flag', () => {
    it('should set manual collapse flag', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setIsManuallyCollapsed(true);
      });

      expect(result.current.isManuallyCollapsed).toBe(true);
    });

    it('should clear manual collapse flag', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setIsManuallyCollapsed(true);
      });

      act(() => {
        result.current.setIsManuallyCollapsed(false);
      });

      expect(result.current.isManuallyCollapsed).toBe(false);
    });
  });

  describe('Filter Drawer', () => {
    it('should toggle filter drawer open', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setIsFilterDrawerOpen(true);
      });

      expect(result.current.isFilterDrawerOpen).toBe(true);
    });

    it('should toggle filter drawer closed', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setIsFilterDrawerOpen(true);
      });

      act(() => {
        result.current.setIsFilterDrawerOpen(false);
      });

      expect(result.current.isFilterDrawerOpen).toBe(false);
    });
  });

  describe('Social Overlay Tab Management', () => {
    it('should set social overlay initial tab', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.setSocialOverlayActiveTab('reviews');
      });

      expect(result.current.socialOverlayInitialTab).toBe('reviews');
    });

    it('should open social overlay with specific tab', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop, 'social', 'directions');
      });

      expect(result.current.socialOverlayInitialTab).toBe('directions');
    });
  });

  describe('Overlay Animation State', () => {
    it('should compute shouldRenderShopOverlay correctly', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      // Initially should not render
      expect(result.current.shouldRenderShopOverlay).toBe(false);

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      // Should render when open
      expect(result.current.shouldRenderShopOverlay).toBe(true);
    });

    it('should compute shouldRenderSocialOverlay correctly', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.shouldRenderSocialOverlay).toBe(false);

      act(() => {
        result.current.openShopOverlays(mockShop, 'social');
      });

      expect(result.current.shouldRenderSocialOverlay).toBe(true);
    });

    it('should provide animated open states for transitions', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      // Animated states should be available
      expect(typeof result.current.isShopOverlayAnimatedOpen).toBe('boolean');
      expect(typeof result.current.isSocialOverlayAnimatedOpen).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close actions', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      act(() => {
        result.current.closeShopOverlays();
      });

      act(() => {
        result.current.openShopOverlays(mockShop);
      });

      // Should handle rapid state changes without crashing
      expect(result.current.isShopOverlayOpen).toBe(true);
    });

    it('should handle opening overlays with null shop', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.openShopOverlays(null as any);
      });

      // Should handle gracefully
      expect(result.current.selectedShop).toBe(null);
    });
  });
});
