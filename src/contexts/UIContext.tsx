// src/contexts/UIContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Shop } from '../types';

interface UIContextType {
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  hoveredShop: Shop | null;
  setHoveredShop: (shop: Shop | null) => void;
  isShopOverlayOpen: boolean;
  isSocialOverlayOpen: boolean;
  openShopOverlays: (shop: Shop, openTab?: 'shop' | 'social' | 'directions', socialTab?: string) => void;
  closeShopOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  socialOverlayInitialTab: string;
  setSocialOverlayActiveTab: (tab: string) => void;
  tabChangeKey: number;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [selectedShop, _setSelectedShopInternal] = useState<Shop | null>(null);
  const [hoveredShop, setHoveredShop] = useState<Shop | null>(null);
  const [isShopOverlayOpen, setIsShopOverlayOpen] = useState<boolean>(false);
  const [isSocialOverlayOpen, setIsSocialOverlayOpen] = useState<boolean>(false);
  const [socialOverlayInitialTab, setSocialOverlayInitialTab] = useState<string>('photos');
  const [tabChangeKey, setTabChangeKey] = useState<number>(0);

  // Initial modal disabled - users should use header search instead
  const [isInitialModalOpen, setIsInitialModalOpen] = useState<boolean>(false);

  const handleSetSelectedShop = useCallback((shop: Shop | null) => {
    _setSelectedShopInternal(shop);
  }, []);

  const openShopOverlays = useCallback((shop: Shop, openTab: 'shop' | 'social' | 'directions' = 'shop', socialTab: string = 'photos') => {
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
    document.body.classList.add('modal-active');
  }, [handleSetSelectedShop]);

  const closeShopOverlays = useCallback(() => {
    setIsShopOverlayOpen(false);
    setIsSocialOverlayOpen(false);
    document.body.classList.remove('modal-active');
  }, []);

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
    openShopOverlays,
    closeShopOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen,
    socialOverlayInitialTab,
    setSocialOverlayActiveTab,
    tabChangeKey,
  }), [
    selectedShop,
    handleSetSelectedShop,
    hoveredShop,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    openShopOverlays,
    closeShopOverlays,
    isInitialModalOpen,
    socialOverlayInitialTab,
    setSocialOverlayActiveTab,
    tabChangeKey,
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
