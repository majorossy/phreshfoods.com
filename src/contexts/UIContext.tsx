// src/contexts/UIContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';
import { Shop } from '../types';

// Animation duration for overlay transitions (must match CSS)
const OVERLAY_ANIMATION_DURATION_MS = 350;

interface UIContextType {
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  hoveredShop: Shop | null;
  setHoveredShop: (shop: Shop | null) => void;
  isShopOverlayOpen: boolean;
  isSocialOverlayOpen: boolean;
  // Track if overlays should be rendered (stays true during close animation)
  shouldRenderShopOverlay: boolean;
  shouldRenderSocialOverlay: boolean;
  // Track if overlays should show "is-open" class (delayed for enter animation)
  isShopOverlayAnimatedOpen: boolean;
  isSocialOverlayAnimatedOpen: boolean;
  openShopOverlays: (shop: Shop, openTab?: 'shop' | 'social' | 'directions', socialTab?: string) => void;
  closeShopOverlays: () => void;
  openBothOverlays: () => void;
  closeShopOverlay: () => void;
  closeSocialOverlay: () => void;
  toggleBothOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  socialOverlayInitialTab: string;
  setSocialOverlayActiveTab: (tab: string) => void;
  tabChangeKey: number;
  // Mobile bottom sheet state (Phase 2)
  bottomSheetHeight: number; // 0.3 to 0.75 (30vh to 75vh)
  setBottomSheetHeight: (height: number) => void;
  bottomSheetExpanded: boolean; // true when height > 0.3
  // Mobile filter drawer state
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (isOpen: boolean) => void;
  // Manual collapse flag - prevents auto-expand after user minimizes
  isManuallyCollapsed: boolean;
  setIsManuallyCollapsed: (collapsed: boolean) => void;
  // Preview shop for carousel browsing (shows in InfoWindow without selecting)
  previewShop: Shop | null;
  setPreviewShop: (shop: Shop | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [selectedShop, _setSelectedShopInternal] = useState<Shop | null>(null);
  const [hoveredShop, setHoveredShop] = useState<Shop | null>(null);
  const [isShopOverlayOpen, setIsShopOverlayOpen] = useState<boolean>(false);
  const [isSocialOverlayOpen, setIsSocialOverlayOpen] = useState<boolean>(false);
  // Track if overlays should be rendered (delayed unmount for animation)
  const [shouldRenderShopOverlay, setShouldRenderShopOverlay] = useState<boolean>(false);
  const [shouldRenderSocialOverlay, setShouldRenderSocialOverlay] = useState<boolean>(false);
  const [socialOverlayInitialTab, setSocialOverlayInitialTab] = useState<string>('photos');
  const [tabChangeKey, setTabChangeKey] = useState<number>(0);

  // Refs for cleanup timeouts
  const shopOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socialOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedShopCleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Initial modal disabled - users should use header search instead
  const [isInitialModalOpen, setIsInitialModalOpen] = useState<boolean>(false);

  // Mobile bottom sheet state (Phase 2)
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(0.3); // Start at 30vh
  const bottomSheetExpanded = bottomSheetHeight > 0.3;

  // Mobile filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Manual collapse flag - prevents auto-expand when user minimizes bottom sheet
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState<boolean>(false);

  // Preview shop for carousel browsing (shows in InfoWindow without selecting)
  const [previewShop, setPreviewShop] = useState<Shop | null>(null);

  // Handle delayed unmount for shop overlay
  useEffect(() => {
    if (isShopOverlayOpen) {
      // Opening: immediately render
      if (shopOverlayTimeoutRef.current) {
        clearTimeout(shopOverlayTimeoutRef.current);
        shopOverlayTimeoutRef.current = null;
      }
      setShouldRenderShopOverlay(true);
    } else if (shouldRenderShopOverlay) {
      // Closing: delay unmount for animation
      shopOverlayTimeoutRef.current = setTimeout(() => {
        setShouldRenderShopOverlay(false);
        shopOverlayTimeoutRef.current = null;
      }, OVERLAY_ANIMATION_DURATION_MS);
    }

    return () => {
      if (shopOverlayTimeoutRef.current) {
        clearTimeout(shopOverlayTimeoutRef.current);
      }
    };
  }, [isShopOverlayOpen, shouldRenderShopOverlay]);

  // Track if overlays should show their "open" animation state (delayed for enter animation)
  const [isShopOverlayAnimatedOpen, setIsShopOverlayAnimatedOpen] = useState<boolean>(false);
  const [isSocialOverlayAnimatedOpen, setIsSocialOverlayAnimatedOpen] = useState<boolean>(false);

  // Delay the "is-open" class until after mount for smooth enter animation
  useEffect(() => {
    if (isShopOverlayOpen && shouldRenderShopOverlay) {
      // Use requestAnimationFrame to ensure DOM has painted before adding class
      const rafId = requestAnimationFrame(() => {
        setIsShopOverlayAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsShopOverlayAnimatedOpen(false);
    }
  }, [isShopOverlayOpen, shouldRenderShopOverlay]);

  // Handle delayed unmount for social overlay
  useEffect(() => {
    if (isSocialOverlayOpen) {
      // Opening: immediately render
      if (socialOverlayTimeoutRef.current) {
        clearTimeout(socialOverlayTimeoutRef.current);
        socialOverlayTimeoutRef.current = null;
      }
      setShouldRenderSocialOverlay(true);
    } else if (shouldRenderSocialOverlay) {
      // Closing: delay unmount for animation
      socialOverlayTimeoutRef.current = setTimeout(() => {
        setShouldRenderSocialOverlay(false);
        socialOverlayTimeoutRef.current = null;
      }, OVERLAY_ANIMATION_DURATION_MS);
    }

    return () => {
      if (socialOverlayTimeoutRef.current) {
        clearTimeout(socialOverlayTimeoutRef.current);
      }
    };
  }, [isSocialOverlayOpen, shouldRenderSocialOverlay]);

  // Delay the "is-open" class for social overlay until after mount for smooth enter animation
  useEffect(() => {
    if (isSocialOverlayOpen && shouldRenderSocialOverlay) {
      // Use requestAnimationFrame to ensure DOM has painted before adding class
      const rafId = requestAnimationFrame(() => {
        setIsSocialOverlayAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsSocialOverlayAnimatedOpen(false);
    }
  }, [isSocialOverlayOpen, shouldRenderSocialOverlay]);

  const handleSetSelectedShop = useCallback((shop: Shop | null) => {
    _setSelectedShopInternal(shop);
  }, []);

  const openShopOverlays = useCallback((shop: Shop, openTab: 'shop' | 'social' | 'directions' = 'shop', socialTab: string = 'photos') => {
    // Validate shop object
    if (!shop) {
      if (import.meta.env.DEV) {
        console.error('[UIContext] Attempted to open overlay with null/undefined shop');
      }
      return;
    }

    // Validate required shop fields
    if (!shop.Name && !shop.slug && !shop.GoogleProfileID) {
      if (import.meta.env.DEV) {
        console.error('[UIContext] Shop missing required identifiers (Name, slug, or GoogleProfileID)');
      }
      return;
    }

    // Cancel any pending selectedShop cleanup from a previous close
    if (selectedShopCleanupRef.current) {
      clearTimeout(selectedShopCleanupRef.current);
      selectedShopCleanupRef.current = null;
    }

    handleSetSelectedShop(shop);
    setSocialOverlayInitialTab(socialTab);

    if (openTab === 'shop') {
      setIsShopOverlayOpen(true);
      setIsSocialOverlayOpen(true);
    } else if (openTab === 'directions') {
      setIsSocialOverlayOpen(true);
      setIsShopOverlayOpen(false);
    } else if (openTab === 'social') {
      setIsSocialOverlayOpen(true);
      setIsShopOverlayOpen(false);
    }

    // Safely add class to body
    if (document.body) {
      document.body.classList.add('modal-active');
    }
  }, [handleSetSelectedShop]);

  const closeShopOverlays = useCallback(() => {
    setIsShopOverlayOpen(false);
    setIsSocialOverlayOpen(false);
    // Safely remove class from body
    if (document.body) {
      document.body.classList.remove('modal-active');
    }

    // Clear any pending cleanup
    if (selectedShopCleanupRef.current) {
      clearTimeout(selectedShopCleanupRef.current);
    }

    // Delay clearing selectedShop until after animation completes
    // This keeps the shop data available during the exit animation
    selectedShopCleanupRef.current = setTimeout(() => {
      _setSelectedShopInternal(null);
      selectedShopCleanupRef.current = null;
    }, OVERLAY_ANIMATION_DURATION_MS + 50); // Small buffer after animation
  }, []);

  // Open both overlays without changing selectedShop (for the double-arrow button)
  const openBothOverlays = useCallback(() => {
    setIsShopOverlayOpen(true);
    setIsSocialOverlayOpen(true);
    // Safely add class to body
    if (document.body) {
      document.body.classList.add('modal-active');
    }
  }, []);

  // Close just the shop overlay (for individual panel control)
  const closeShopOverlay = useCallback(() => {
    setIsShopOverlayOpen(false);
    // Only remove modal-active if both are now closed
    if (!isSocialOverlayOpen && document.body) {
      document.body.classList.remove('modal-active');
    }
  }, [isSocialOverlayOpen]);

  // Close just the social overlay (for individual panel control)
  const closeSocialOverlay = useCallback(() => {
    setIsSocialOverlayOpen(false);
    // Only remove modal-active if both are now closed
    if (!isShopOverlayOpen && document.body) {
      document.body.classList.remove('modal-active');
    }
  }, [isShopOverlayOpen]);

  // Toggle both overlays together (for the double-arrow button)
  // If either is open -> close both; if both closed -> open both
  const toggleBothOverlays = useCallback(() => {
    const eitherOpen = isShopOverlayOpen || isSocialOverlayOpen;

    if (eitherOpen) {
      // Close both
      setIsShopOverlayOpen(false);
      setIsSocialOverlayOpen(false);
      if (document.body) {
        document.body.classList.remove('modal-active');
      }
    } else {
      // Open both
      setIsShopOverlayOpen(true);
      setIsSocialOverlayOpen(true);
      if (document.body) {
        document.body.classList.add('modal-active');
      }
    }
  }, [isShopOverlayOpen, isSocialOverlayOpen]);

  const setSocialOverlayActiveTab = useCallback((tab: string) => {
    setSocialOverlayInitialTab(tab);
    setTabChangeKey(prev => prev + 1); // Force update even if tab is the same
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: UIContextType = useMemo(() => ({
    selectedShop,
    setSelectedShop: handleSetSelectedShop,
    hoveredShop,
    setHoveredShop,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    shouldRenderShopOverlay,
    shouldRenderSocialOverlay,
    isShopOverlayAnimatedOpen,
    isSocialOverlayAnimatedOpen,
    openShopOverlays,
    closeShopOverlays,
    openBothOverlays,
    closeShopOverlay,
    closeSocialOverlay,
    toggleBothOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen,
    socialOverlayInitialTab,
    setSocialOverlayActiveTab,
    tabChangeKey,
    // Mobile bottom sheet (Phase 2)
    bottomSheetHeight,
    setBottomSheetHeight,
    bottomSheetExpanded,
    // Mobile filter drawer
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    // Manual collapse flag
    isManuallyCollapsed,
    setIsManuallyCollapsed,
    // Preview shop
    previewShop,
    setPreviewShop,
  }), [
    selectedShop,
    handleSetSelectedShop,
    hoveredShop,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    shouldRenderShopOverlay,
    shouldRenderSocialOverlay,
    isShopOverlayAnimatedOpen,
    isSocialOverlayAnimatedOpen,
    openShopOverlays,
    closeShopOverlays,
    openBothOverlays,
    closeShopOverlay,
    closeSocialOverlay,
    toggleBothOverlays,
    isInitialModalOpen,
    socialOverlayInitialTab,
    setSocialOverlayActiveTab,
    tabChangeKey,
    // Mobile bottom sheet (Phase 2)
    bottomSheetHeight,
    bottomSheetExpanded,
    // Mobile filter drawer
    isFilterDrawerOpen,
    // Manual collapse flag
    isManuallyCollapsed,
    // Preview shop
    previewShop,
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
