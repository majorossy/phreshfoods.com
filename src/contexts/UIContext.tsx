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
  isShopDetailsOpen: boolean;
  isShopSocialsOpen: boolean;
  // Track if overlays should be rendered (stays true during close animation)
  shouldRenderShopDetails: boolean;
  shouldRenderShopSocials: boolean;
  // Track if overlays should show "is-open" class (delayed for enter animation)
  isShopDetailsAnimatedOpen: boolean;
  isShopSocialsAnimatedOpen: boolean;
  openShopOverlays: (shop: Shop, openTab?: 'shop' | 'social' | 'directions', socialTab?: string) => void;
  closeShopOverlays: () => void;
  openBothOverlays: () => void;
  closeShopDetails: () => void;
  closeShopSocials: () => void;
  toggleBothOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shopSocialsInitialTab: string;
  setShopSocialsActiveTab: (tab: string) => void;
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
  const [isShopDetailsOpen, setIsShopDetailsOpen] = useState<boolean>(false);
  const [isShopSocialsOpen, setIsShopSocialsOpen] = useState<boolean>(false);
  // Track if overlays should be rendered (delayed unmount for animation)
  const [shouldRenderShopDetails, setShouldRenderShopDetails] = useState<boolean>(false);
  const [shouldRenderShopSocials, setShouldRenderShopSocials] = useState<boolean>(false);
  const [shopSocialsInitialTab, setShopSocialsInitialTab] = useState<string>('photos');
  const [tabChangeKey, setTabChangeKey] = useState<number>(0);

  // Refs for cleanup timeouts
  const shopDetailsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shopSocialsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Handle delayed unmount for shop details
  useEffect(() => {
    if (isShopDetailsOpen) {
      // Opening: immediately render
      if (shopDetailsTimeoutRef.current) {
        clearTimeout(shopDetailsTimeoutRef.current);
        shopDetailsTimeoutRef.current = null;
      }
      setShouldRenderShopDetails(true);
    } else if (shouldRenderShopDetails) {
      // Closing: delay unmount for animation
      shopDetailsTimeoutRef.current = setTimeout(() => {
        setShouldRenderShopDetails(false);
        shopDetailsTimeoutRef.current = null;
      }, OVERLAY_ANIMATION_DURATION_MS);
    }

    return () => {
      if (shopDetailsTimeoutRef.current) {
        clearTimeout(shopDetailsTimeoutRef.current);
      }
    };
  }, [isShopDetailsOpen, shouldRenderShopDetails]);

  // Track if overlays should show their "open" animation state (delayed for enter animation)
  const [isShopDetailsAnimatedOpen, setIsShopDetailsAnimatedOpen] = useState<boolean>(false);
  const [isShopSocialsAnimatedOpen, setIsShopSocialsAnimatedOpen] = useState<boolean>(false);

  // Delay the "is-open" class until after mount for smooth enter animation
  useEffect(() => {
    if (isShopDetailsOpen && shouldRenderShopDetails) {
      // Use requestAnimationFrame to ensure DOM has painted before adding class
      const rafId = requestAnimationFrame(() => {
        setIsShopDetailsAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsShopDetailsAnimatedOpen(false);
    }
  }, [isShopDetailsOpen, shouldRenderShopDetails]);

  // Handle delayed unmount for shop socials
  useEffect(() => {
    if (isShopSocialsOpen) {
      // Opening: immediately render
      if (shopSocialsTimeoutRef.current) {
        clearTimeout(shopSocialsTimeoutRef.current);
        shopSocialsTimeoutRef.current = null;
      }
      setShouldRenderShopSocials(true);
    } else if (shouldRenderShopSocials) {
      // Closing: delay unmount for animation
      shopSocialsTimeoutRef.current = setTimeout(() => {
        setShouldRenderShopSocials(false);
        shopSocialsTimeoutRef.current = null;
      }, OVERLAY_ANIMATION_DURATION_MS);
    }

    return () => {
      if (shopSocialsTimeoutRef.current) {
        clearTimeout(shopSocialsTimeoutRef.current);
      }
    };
  }, [isShopSocialsOpen, shouldRenderShopSocials]);

  // Delay the "is-open" class for shop socials until after mount for smooth enter animation
  useEffect(() => {
    if (isShopSocialsOpen && shouldRenderShopSocials) {
      // Use requestAnimationFrame to ensure DOM has painted before adding class
      const rafId = requestAnimationFrame(() => {
        setIsShopSocialsAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsShopSocialsAnimatedOpen(false);
    }
  }, [isShopSocialsOpen, shouldRenderShopSocials]);

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
    setShopSocialsInitialTab(socialTab);

    if (openTab === 'shop') {
      setIsShopDetailsOpen(true);
      setIsShopSocialsOpen(true);
    } else if (openTab === 'directions') {
      setIsShopSocialsOpen(true);
      setIsShopDetailsOpen(false);
    } else if (openTab === 'social') {
      setIsShopSocialsOpen(true);
      setIsShopDetailsOpen(false);
    }

    // Safely add class to body
    if (document.body) {
      document.body.classList.add('modal-active');
    }
  }, [handleSetSelectedShop]);

  const closeShopOverlays = useCallback(() => {
    setIsShopDetailsOpen(false);
    setIsShopSocialsOpen(false);
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
    setIsShopDetailsOpen(true);
    setIsShopSocialsOpen(true);
    // Safely add class to body
    if (document.body) {
      document.body.classList.add('modal-active');
    }
  }, []);

  // Close just the shop details (for individual panel control)
  const closeShopDetails = useCallback(() => {
    setIsShopDetailsOpen(false);
    // Only remove modal-active if both are now closed
    if (!isShopSocialsOpen && document.body) {
      document.body.classList.remove('modal-active');
    }
  }, [isShopSocialsOpen]);

  // Close just the shop socials (for individual panel control)
  const closeShopSocials = useCallback(() => {
    setIsShopSocialsOpen(false);
    // Only remove modal-active if both are now closed
    if (!isShopDetailsOpen && document.body) {
      document.body.classList.remove('modal-active');
    }
  }, [isShopDetailsOpen]);

  // Toggle both overlays together (for the double-arrow button)
  // If either is open -> close both; if both closed -> open both
  const toggleBothOverlays = useCallback(() => {
    const eitherOpen = isShopDetailsOpen || isShopSocialsOpen;

    if (eitherOpen) {
      // Close both
      setIsShopDetailsOpen(false);
      setIsShopSocialsOpen(false);
      if (document.body) {
        document.body.classList.remove('modal-active');
      }
    } else {
      // Open both
      setIsShopDetailsOpen(true);
      setIsShopSocialsOpen(true);
      if (document.body) {
        document.body.classList.add('modal-active');
      }
    }
  }, [isShopDetailsOpen, isShopSocialsOpen]);

  const setShopSocialsActiveTab = useCallback((tab: string) => {
    setShopSocialsInitialTab(tab);
    setTabChangeKey(prev => prev + 1); // Force update even if tab is the same
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: UIContextType = useMemo(() => ({
    selectedShop,
    setSelectedShop: handleSetSelectedShop,
    hoveredShop,
    setHoveredShop,
    isShopDetailsOpen,
    isShopSocialsOpen,
    shouldRenderShopDetails,
    shouldRenderShopSocials,
    isShopDetailsAnimatedOpen,
    isShopSocialsAnimatedOpen,
    openShopOverlays,
    closeShopOverlays,
    openBothOverlays,
    closeShopDetails,
    closeShopSocials,
    toggleBothOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen,
    shopSocialsInitialTab,
    setShopSocialsActiveTab,
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
    isShopDetailsOpen,
    isShopSocialsOpen,
    shouldRenderShopDetails,
    shouldRenderShopSocials,
    isShopDetailsAnimatedOpen,
    isShopSocialsAnimatedOpen,
    openShopOverlays,
    closeShopOverlays,
    openBothOverlays,
    closeShopDetails,
    closeShopSocials,
    toggleBothOverlays,
    isInitialModalOpen,
    shopSocialsInitialTab,
    setShopSocialsActiveTab,
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
