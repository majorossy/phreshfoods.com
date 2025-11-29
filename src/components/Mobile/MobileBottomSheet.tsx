// src/components/Mobile/MobileBottomSheet.tsx
import React, { useCallback, useEffect } from 'react';
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
  const { bottomSheetHeight, setBottomSheetHeight, selectedShop, isManuallyCollapsed, setIsManuallyCollapsed } = useUI();

  // Handle snap point changes
  const handleSnapChange = useCallback((newHeight: number) => {
    // Set flag FIRST (before height triggers auto-expand effect)
    // This ensures React batches both updates and effect sees the flag
    if (newHeight === 0.3 && selectedShop) {
      setIsManuallyCollapsed(true);
    } else if (newHeight > 0.3) {
      // Clear flag when expanding (drag up or snap to higher point)
      setIsManuallyCollapsed(false);
    }

    // Then set height - React batches both updates together
    setBottomSheetHeight(newHeight);
  }, [setBottomSheetHeight, selectedShop, setIsManuallyCollapsed]);

  // Auto-expand to 90% when a shop is selected (unless manually collapsed)
  useEffect(() => {
    if (selectedShop && bottomSheetHeight < 0.5 && !isManuallyCollapsed) {
      setBottomSheetHeight(0.9);
    }
  }, [selectedShop, bottomSheetHeight, isManuallyCollapsed, setBottomSheetHeight]);

  // Drag gesture hook - expand to 90% when shop is selected
  const { ref, isDragging, style } = useBottomSheetDrag({
    initialHeight: bottomSheetHeight,
    snapPoints: selectedShop ? [0.3, 0.5, 0.9] : [0.3, 0.5, 0.75],
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
        overflow-visible
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

      {/* Content Container - switches between carousel and detailed info */}
      <div className="h-full overflow-x-visible overflow-y-hidden">
        {bottomSheetHeight >= 0.5 && selectedShop ? (
          /* Detailed Shop Info - shown when expanded (≥50vh) */
          <div className="h-full overflow-y-auto custom-scrollbar">
            <QuickShopInfo shop={selectedShop} showFullDetails={bottomSheetHeight >= 0.9} />
          </div>
        ) : (
          /* Carousel - shown when collapsed (<50vh) */
          <HorizontalCarousel />
        )}
      </div>
    </div>
  );
};

export default MobileBottomSheet;
