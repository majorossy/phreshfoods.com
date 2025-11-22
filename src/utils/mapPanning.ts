// src/utils/mapPanning.ts
import {
  AUTO_ZOOM_PADDING_PERCENT,
  DESKTOP_BREAKPOINT_PX,
} from '../config/map';
import type { AutocompletePlace } from '../types';

/**
 * Extract google.maps.LatLng from an AutocompletePlace's geometry.location
 * Handles both LatLng objects and LatLngLiteral objects
 *
 * @param place - AutocompletePlace with geometry.location
 * @returns google.maps.LatLng or null if extraction fails
 */
export function extractLatLngFromPlace(place: AutocompletePlace | null | undefined): google.maps.LatLng | null {
  if (!place?.geometry?.location) {
    return null;
  }

  const location = place.geometry.location;

  // Check if it's already a LatLng object (has lat() and lng() methods)
  if (typeof (location as google.maps.LatLng).lat === 'function') {
    return location as google.maps.LatLng;
  }

  // Check if it's a LatLngLiteral (plain object with lat and lng properties)
  if (typeof (location as google.maps.LatLngLiteral).lat === 'number') {
    return new window.google.maps.LatLng(
      (location as google.maps.LatLngLiteral).lat,
      (location as google.maps.LatLngLiteral).lng
    );
  }

  // Unable to extract LatLng
  return null;
}

/**
 * Calculate the horizontal offset needed to account for visible overlays/panels
 * Returns NEGATIVE offset in pixels to shift map LEFT and center in visible area
 *
 * UI Layout:
 * - ListingsPanel: RIGHT side (actual width varies)
 * - ShopDetailsOverlay: RIGHT side (actual width varies, replaces ListingsPanel)
 * - SocialOverlay: LEFT side (actual width varies, appears in addition to ShopDetailsOverlay)
 *
 * Centering Logic:
 * - Gets actual rendered widths of visible panels
 * - Calculates center of visible map area
 * - Returns negative offset to shift map left into visible area
 */
export function calculatePanelOffset(
  isShopOverlayOpen: boolean,
  isSocialOverlayOpen: boolean
): number {
  // Only apply offset on desktop/tablet (overlays are full-screen on mobile)
  if (window.innerWidth < DESKTOP_BREAKPOINT_PX) return 0;

  const viewportWidth = window.innerWidth;
  let rightPanelWidth = 0;
  let leftPanelWidth = 0;

  // Get right panel width (ShopDetailsOverlay or ListingsPanel)
  if (isShopOverlayOpen) {
    const shopOverlay = document.getElementById('detailsOverlayShop');
    if (shopOverlay) {
      rightPanelWidth = shopOverlay.getBoundingClientRect().width;
    }
  } else {
    const listingsPanel = document.getElementById('listingsPanel');
    if (listingsPanel) {
      rightPanelWidth = listingsPanel.getBoundingClientRect().width;
    }
  }

  // Get left panel width (SocialOverlay, only when both overlays open)
  if (isSocialOverlayOpen) {
    const socialOverlay = document.getElementById('detailsOverlaySocial');
    if (socialOverlay) {
      leftPanelWidth = socialOverlay.getBoundingClientRect().width;
    }
  }

  // Calculate visible map area
  const visibleMapWidth = viewportWidth - rightPanelWidth - leftPanelWidth;

  // Calculate center of visible area from left edge
  const visibleCenterFromLeft = leftPanelWidth + (visibleMapWidth / 2);

  // Calculate center of viewport
  const viewportCenter = viewportWidth / 2;

  // Calculate required shift (negative = shift left)
  const requiredShift = visibleCenterFromLeft - viewportCenter;

  return requiredShift;
}

/**
 * Calculate base padding for fitBounds operations
 * Returns padding as percentage of smallest viewport dimension
 */
export function calculateBasePadding(map: google.maps.Map): number {
  const mapDiv = map.getDiv();
  return Math.min(mapDiv.offsetWidth, mapDiv.offsetHeight) * AUTO_ZOOM_PADDING_PERCENT;
}

/**
 * Calculate the offset needed to frame an info window above a marker
 * Returns offset in pixels (negative Y to move marker down in viewport)
 */
export function calculateInfoWindowOffset(map: google.maps.Map): { x: number; y: number } {
  const mapDiv = map.getDiv();
  const viewportHeight = mapDiv.offsetHeight;

  // Position marker in lower third of viewport to show info window above
  // This is more responsive than fixed pixels
  const yOffset = viewportHeight * 0.15; // Move down 15% of viewport height

  return {
    x: 0,
    y: yOffset,
  };
}

/**
 * Convert pixel offset to geographic coordinates at current zoom level
 * This allows us to calculate a target LatLng that accounts for pixel offsets
 */
export function convertPixelOffsetToLatLng(
  map: google.maps.Map,
  center: google.maps.LatLng,
  pixelOffsetX: number,
  pixelOffsetY: number
): google.maps.LatLng {
  const scale = Math.pow(2, map.getZoom());
  const projection = map.getProjection();

  if (!projection) {
    // Projection not ready, return original center
    return center;
  }

  // Convert LatLng to world coordinates
  const worldCoordinate = projection.fromLatLngToPoint(center);

  if (!worldCoordinate) {
    return center;
  }

  // Apply pixel offset in world coordinate space
  const newWorldCoordinate = new google.maps.Point(
    worldCoordinate.x - pixelOffsetX / scale,
    worldCoordinate.y - pixelOffsetY / scale
  );

  // Convert back to LatLng
  const newLatLng = projection.fromPointToLatLng(newWorldCoordinate);

  return newLatLng || center;
}

/**
 * Pan map to target location with all necessary offsets applied
 * This calculates the final coordinates first, then pans once for smooth movement
 */
export interface PanToWithOffsetsOptions {
  map: google.maps.Map;
  targetLatLng: google.maps.LatLng;
  isShopOverlayOpen: boolean;
  isSocialOverlayOpen: boolean;
  includeInfoWindowOffset?: boolean; // Set true when showing shop info window
  bounds?: google.maps.LatLngBounds; // If provided, uses fitBounds instead of panTo
}

export function panToWithOffsets(options: PanToWithOffsetsOptions): void {
  const {
    map,
    targetLatLng,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    includeInfoWindowOffset = false,
    bounds,
  } = options;

  // Calculate panel offset (horizontal)
  const panelOffsetX = calculatePanelOffset(isShopOverlayOpen, isSocialOverlayOpen);

  if (bounds) {
    // For search radius: use asymmetric padding instead of center adjustment
    // This approach works better with zoom changes from radius slider
    const basePadding = calculateBasePadding(map);

    if (panelOffsetX !== 0) {
      // Convert offset to padding adjustment
      // Negative offset (shift left) = add extra padding on right
      const paddingAdjustment = Math.abs(panelOffsetX);

      const paddingOptions = {
        top: basePadding,
        right: basePadding + paddingAdjustment, // Extra padding on right
        bottom: basePadding,
        left: basePadding,
      };

      map.fitBounds(bounds, paddingOptions);
    } else {
      // No panel offset needed - use symmetric padding
      map.fitBounds(bounds, basePadding);
    }
  } else {
    // Use panTo with calculated offset for shop selections
    let totalOffsetX = panelOffsetX;
    let totalOffsetY = 0;

    // Add info window offset if needed
    if (includeInfoWindowOffset) {
      const infoWindowOffset = calculateInfoWindowOffset(map);
      totalOffsetX += infoWindowOffset.x;
      totalOffsetY += infoWindowOffset.y;
    }

    // Convert pixel offsets to geographic coordinates
    const finalLatLng = convertPixelOffsetToLatLng(
      map,
      targetLatLng,
      totalOffsetX,
      totalOffsetY
    );

    // Single smooth pan to final coordinates
    map.panTo(finalLatLng);
  }
}
