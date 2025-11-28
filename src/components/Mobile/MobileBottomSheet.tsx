// src/components/Mobile/MobileBottomSheet.tsx
import React, { useCallback } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
import HorizontalCarousel from './HorizontalCarousel';
import QuickShopInfo from './QuickShopInfo';

/**
 * MobileBottomSheet - Mobile-only bottom sheet component
 *
 * Phase 4: Quick preview + full details
 *
 * Features:
 * - Drag handle to expand/collapse (30vh → 50vh → 75vh)
 * - Carousel when collapsed/half (≤50vh)
 * - Quick shop info when expanded (>50vh)
 * - "See Full Details" button opens full overlay
 */
const MobileBottomSheet: React.FC = () => {
  const { bottomSheetHeight, setBottomSheetHeight, selectedShop, bottomSheetExpanded } = useUI();

  // Handle snap point changes
  const handleSnapChange = useCallback((newHeight: number) => {
    setBottomSheetHeight(newHeight);
  }, [setBottomSheetHeight]);

  // Drag gesture hook
  const { ref, height, isDragging, style } = useBottomSheetDrag({
    initialHeight: bottomSheetHeight,
    snapPoints: [0.3, 0.5, 0.75],
    onSnapChange: handleSnapChange,
    enabled: true,
  });

  return (
    <div
      ref={ref}
      id="mobileBottomSheet"
      className={`
        fixed bottom-0 left-0 right-0
        bg-white dark:bg-gray-800
        rounded-t-2xl
        shadow-[0_-4px_20px_rgba(0,0,0,0.15)]
        z-40
        ${isDragging ? 'is-dragging' : ''}
      `}
      style={{
        ...style,
        // Performance hints
        willChange: isDragging ? 'height' : 'auto',
      }}
    >
      {/* Drag Handle - Now functional! */}
      <div className="flex justify-center pt-2 pb-1">
        <div
          className="drag-handle w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"
          aria-label="Drag to expand or collapse"
          role="button"
          tabIndex={0}
        />
      </div>

      {/* Content Container - switches between carousel and quick info */}
      <div className="h-full overflow-hidden">
        {bottomSheetHeight > 0.5 && selectedShop ? (
          /* Quick Shop Info - shown when expanded (>50vh) */
          <div className="h-full overflow-y-auto">
            <QuickShopInfo shop={selectedShop} />
          </div>
        ) : (
          /* Carousel - shown when collapsed/half (≤50vh) */
          <HorizontalCarousel />
        )}
      </div>
    </div>
  );
};

export default MobileBottomSheet;
