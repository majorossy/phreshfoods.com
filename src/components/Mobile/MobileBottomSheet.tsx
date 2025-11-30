// src/components/Mobile/MobileBottomSheet.tsx
import React, { useCallback, useEffect, KeyboardEvent } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
import HorizontalCarousel from './HorizontalCarousel';
import QuickShopInfo from './QuickShopInfo';
import {
  BOTTOM_SHEET,
  getSnapPoints,
} from '../../config/mobile';

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
    if (newHeight === BOTTOM_SHEET.SNAP_COLLAPSED && selectedShop) {
      setIsManuallyCollapsed(true);
    } else if (newHeight > BOTTOM_SHEET.SNAP_COLLAPSED) {
      // Clear flag when expanding (drag up or snap to higher point)
      setIsManuallyCollapsed(false);
    }

    // Then set height - React batches both updates together
    setBottomSheetHeight(newHeight);
  }, [setBottomSheetHeight, selectedShop, setIsManuallyCollapsed]);

  // Auto-expand to full details when a shop is selected (unless manually collapsed)
  useEffect(() => {
    if (selectedShop && bottomSheetHeight < BOTTOM_SHEET.SNAP_HALF && !isManuallyCollapsed) {
      setBottomSheetHeight(BOTTOM_SHEET.SNAP_FULL_DETAILS);
    }
  }, [selectedShop, bottomSheetHeight, isManuallyCollapsed, setBottomSheetHeight]);

  // Drag gesture hook - snap points depend on whether shop is selected
  const snapPoints = getSnapPoints(!!selectedShop);
  const { ref, isDragging, style } = useBottomSheetDrag({
    initialHeight: bottomSheetHeight,
    snapPoints: [...snapPoints], // Convert readonly to mutable array
    onSnapChange: handleSnapChange,
    enabled: true,
  });

  // Handle keyboard interaction for drag handle
  const handleDragHandleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Toggle between collapsed and expanded states
      if (bottomSheetHeight <= BOTTOM_SHEET.SNAP_COLLAPSED) {
        // Expand to half or full details depending on whether shop is selected
        const targetHeight = selectedShop ? BOTTOM_SHEET.SNAP_FULL_DETAILS : BOTTOM_SHEET.SNAP_HALF;
        handleSnapChange(targetHeight);
      } else {
        // Collapse
        handleSnapChange(BOTTOM_SHEET.SNAP_COLLAPSED);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      // Expand to next snap point
      const currentIndex = snapPoints.indexOf(bottomSheetHeight);
      if (currentIndex < snapPoints.length - 1) {
        handleSnapChange(snapPoints[currentIndex + 1]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      // Collapse to previous snap point
      const currentIndex = snapPoints.indexOf(bottomSheetHeight);
      if (currentIndex > 0) {
        handleSnapChange(snapPoints[currentIndex - 1]);
      }
    }
  }, [bottomSheetHeight, selectedShop, snapPoints, handleSnapChange]);

  // Determine expansion state for aria-expanded
  const isExpanded = bottomSheetHeight > BOTTOM_SHEET.SNAP_COLLAPSED;

  return (
    <div
      ref={ref}
      id="mobileBottomSheet"
      role="region"
      aria-label="Shop listings panel"
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
      {/* Drag Handle - Keyboard accessible */}
      <div className="flex justify-center pt-2 pb-1">
        <div
          id="bottom-sheet-drag-handle"
          className="drag-handle w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          aria-label={isExpanded ? 'Press Enter to collapse panel, or use arrow keys to resize' : 'Press Enter to expand panel, or use arrow keys to resize'}
          aria-expanded={isExpanded}
          aria-controls="mobileBottomSheet"
          role="button"
          tabIndex={0}
          onKeyDown={handleDragHandleKeyDown}
        />
      </div>

      {/* Content Container - switches between carousel and detailed info */}
      <div className="h-full overflow-x-visible overflow-y-hidden">
        {bottomSheetHeight >= BOTTOM_SHEET.SHOW_QUICK_INFO_THRESHOLD && selectedShop ? (
          /* Detailed Shop Info - shown when expanded (≥50vh) */
          <div className="h-full overflow-y-auto custom-scrollbar">
            <QuickShopInfo shop={selectedShop} showFullDetails={bottomSheetHeight >= BOTTOM_SHEET.SHOW_FULL_DETAILS_THRESHOLD} />
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
