// src/components/Overlays/ShopSocials.tsx
import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Shop, PlacePhoto as PlacePhotoData } from '../../types';
import { useDirections } from '../../contexts/DirectionsContext';
import { useSearch } from '../../contexts/SearchContext';
import { useUI } from '../../contexts/UIContext';
import { useTripPlanner } from '../../contexts/TripPlannerContext';
import { useToast } from '../../contexts/ToastContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TripStopCard } from '../TripPlanner/TripStopCard';
import {
  getInstagramUrl,
  getInstagramDisplayName,
  getInstagramProfileEmbed,
  getFacebookUrl,
  getFacebookDisplayName,
  getXUrl,
  getXDisplayName,
  getXTimelineEmbed
} from '../../utils/socialMediaHelpers';

interface ShopSocialsProps {
  shop: Shop;
  isOpen?: boolean; // Controls open/close animation (true = visible, false = animating out)
  onClose: () => void;
}

const ShopSocials: React.FC<ShopSocialsProps> = ({ shop, isOpen = true, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { shopSocialsInitialTab, tabChangeKey, isShopDetailsOpen, isShopSocialsOpen, toggleBothOverlays } = useUI();
  // Check if either overlay is open (for toggle button state)
  const eitherOverlayOpen = isShopDetailsOpen || isShopSocialsOpen;
  const [activeTab, setActiveTab] = useState(shopSocialsInitialTab);
  const [manualOrigin, setManualOrigin] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Default: expanded

  // Focus trap for accessibility - handles Escape key and focus management
  useFocusTrap({
    isActive: isOpen,
    onClose,
    containerRef: overlayRef,
    initialFocusRef: closeButtonRef,
  });

  // Get toast context
  const { showToast } = useToast();

  // Get directions and search contexts
  const {
    fetchAndDisplayDirections,
    directionsResult,
    directionsError,
    isFetchingDirections,
    clearDirections,
  } = useDirections();

  const {
    lastPlaceSelectedByAutocomplete,
  } = useSearch();

  const {
    tripStops,
    isTripMode,
    tripDirectionsResult,
    isOptimizedRoute,
    isFetchingTripRoute,
    tripError,
    addStopToTrip,
    removeStopFromTrip,
    reorderStops,
    toggleRouteOptimization,
    calculateTripRoute,
    clearTrip,
    toggleTripMode,
    isShopInTrip,
    getTripShareUrl,
  } = useTripPlanner();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // When the overlay opens for a new shop, reset directions, collapse state, and set initial tab
  useEffect(() => {
    clearDirections();
    setIsCollapsed(false); // Reset to expanded state when shop changes
  }, [shop, clearDirections]);

  // Watch for external tab changes (e.g., from clicking rating stars)
  // tabChangeKey ensures this triggers even if the same tab is clicked multiple times
  useEffect(() => {
    if (shopSocialsInitialTab) {
      setActiveTab(shopSocialsInitialTab);
    }
  }, [shopSocialsInitialTab, tabChangeKey]);

  // Lazy load and process Instagram embeds
  useEffect(() => {
    if (activeTab === 'instagram') {
      // Lazy load Instagram embed script if not already loaded
      if (!window.instgrm) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          try {
            if (window.instgrm) {
              window.instgrm.Embeds.process();
            }
          } catch (_error) {
            if (import.meta.env.DEV) {
              console.warn('[SocialOverlay] Error processing Instagram embeds:', _error);
            }
          }
        };
        script.onerror = () => {
          if (import.meta.env.DEV) {
            console.warn('[SocialOverlay] Failed to load Instagram embed script');
          }
        };
        document.body.appendChild(script);
      } else {
        // Already loaded, just process the embeds
        const timer = setTimeout(() => {
          try {
            window.instgrm.Embeds.process();
          } catch (_error) {
            if (import.meta.env.DEV) {
              console.warn('[SocialOverlay] Error processing Instagram embeds:', _error);
            }
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab]);

  // Lazy load and process Twitter widgets
  useEffect(() => {
    if (activeTab === 'x') {
      // Lazy load Twitter widgets script if not already loaded
      if (!window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
          try {
            if (window.twttr && window.twttr.widgets) {
              window.twttr.widgets.load();
            }
          } catch (_error) {
            if (import.meta.env.DEV) {
              console.warn('[SocialOverlay] Error loading Twitter widgets:', _error);
            }
          }
        };
        script.onerror = () => {
          if (import.meta.env.DEV) {
            console.warn('[SocialOverlay] Failed to load Twitter widgets script');
          }
        };
        document.body.appendChild(script);
      } else {
        // Already loaded, just process the widgets
        const timer = setTimeout(() => {
          try {
            if (window.twttr && window.twttr.widgets) {
              window.twttr.widgets.load();
            }
          } catch (_error) {
            if (import.meta.env.DEV) {
              console.warn('[SocialOverlay] Error loading Twitter widgets:', _error);
            }
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab]);


  if (!shop) return null;

  const googlePhotosData: PlacePhotoData[] | undefined = shop.placeDetails?.photos;
  // Google Place Details data is already safe, only escape our own data
  const shopNameForDisplay = shop.placeDetails?.name || shop.Name;
  const shopAddressForDisplay = shop.placeDetails?.formatted_address || shop.Address;
  const shopLatLngForDisplay = shop.lat && shop.lng ? `${shop.lat.toFixed(5)}, ${shop.lng.toFixed(5)}` : null;
  const shopDestinationForApi = 
    shop.placeDetails?.geometry?.location ||
    (shop.lat && shop.lng ? { lat: shop.lat, lng: shop.lng } : null) ||
    shop.placeDetails?.formatted_address || 
    shop.Address;

  const handleGetDirectionsClick = () => {
    // This function remains the same as provided in the previous, more detailed answer
    if (!fetchAndDisplayDirections || !shopDestinationForApi) {
      alert("Directions service not ready or destination missing.");
      return;
    }
    let originRequest: google.maps.LatLngLiteral | string | google.maps.Place;
    if (useCurrentLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            originRequest = { lat: position.coords.latitude, lng: position.coords.longitude };
            fetchAndDisplayDirections(originRequest, shopDestinationForApi);
          },
          (_error) => {
            alert("Could not get current location. Please enter an address or use a previously searched location.");
          },
          { timeout: 10000 }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    } else if (manualOrigin.trim()) {
      originRequest = manualOrigin.trim();
      fetchAndDisplayDirections(originRequest, shopDestinationForApi);
    } else if (lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = lastPlaceSelectedByAutocomplete.geometry.location;
        const defaultOrigin = (typeof (loc as google.maps.LatLng).lat === 'function') 
            ? { lat: (loc as google.maps.LatLng).lat(), lng: (loc as google.maps.LatLng).lng()} 
            : (loc as google.maps.LatLngLiteral);
        fetchAndDisplayDirections(defaultOrigin, shopDestinationForApi);
    } else {
        alert("Please enter a starting address or allow current location.");
    }
  };
  
  const handleClearDirectionsClick = () => {
    clearDirections();
    setManualOrigin('');
  };

  // Trip planner handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tripStops.findIndex(stop => stop.id === active.id);
      const newIndex = tripStops.findIndex(stop => stop.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderStops(oldIndex, newIndex);
      }
    }
  };

  const handleCalculateTripRoute = () => {
    if (!lastPlaceSelectedByAutocomplete?.geometry?.location) {
      showToast('Please set a starting location by searching in the header', 'error');
      return;
    }

    const location = lastPlaceSelectedByAutocomplete.geometry.location;
    const origin = {
      lat: typeof location.lat === 'function' ? location.lat() : location.lat,
      lng: typeof location.lng === 'function' ? location.lng() : location.lng
    };

    calculateTripRoute(origin);
  };

  const handleShareTrip = () => {
    const url = getTripShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      showToast('Trip link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link. Please try again.', 'error');
    });
  };

  const handleClearTrip = () => {
    if (window.confirm('Clear all stops from your trip?')) {
      clearTrip();
    }
  };

  const handleAddCurrentShopToTrip = () => {
    addStopToTrip(shop);
  };

  const handleTabClick = (tabName: string) => {
    if (tabName !== 'directions' && directionsResult) {
        clearDirections();
    }
    setActiveTab(tabName);
  };

  // Helper functions to check tab availability
  const hasInstagram = !!(getInstagramUrl(shop) && getInstagramDisplayName(shop));
  const hasFacebook = !!(getFacebookUrl(shop) && getFacebookDisplayName(shop));
  const hasX = !!(getXUrl(shop) && getXDisplayName(shop));

  // Helper function to get tab classes (3-state system)
  const getTabClasses = (tabName: string, isAvailable: boolean = true) => {
    const isActive = activeTab === tabName;

    if (isActive) {
      // Active state - border with brand color, no background
      return 'border-b-2 border-current';
    } else if (!isAvailable) {
      // Unavailable state - no background, subtle styling
      return 'border-b-2 border-transparent cursor-not-allowed opacity-40';
    } else {
      // Available state - no background, just brand colors on icon
      return 'border-b-2 border-transparent cursor-pointer hover:opacity-80';
    }
  };

  // Helper function to get SVG icon classes
  const getIconClasses = (tabName: string, brandColor: string, isAvailable: boolean = true) => {
    const isActive = activeTab === tabName;

    if (isActive) {
      return brandColor; // Use brand color when active
    } else if (!isAvailable) {
      return 'text-red-500 dark:text-red-400'; // Red for unavailable - meets WCAG AA contrast
    } else {
      // Available state - use brand color (lighter shade already applied by tab background)
      const brandIconClasses: Record<string, string> = {
        photos: 'text-blue-600 dark:text-blue-400',
        reviews: 'text-amber-600 dark:text-amber-400',
        directions: 'text-indigo-600 dark:text-indigo-400',
        instagram: 'text-pink-600 dark:text-pink-500',
        facebook: 'text-blue-600 dark:text-blue-500',
        x: 'text-gray-800 dark:text-gray-200',
      };
      return brandIconClasses[tabName] || 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
      <div
        ref={overlayRef}
        id="shop-socials"
        className={`detail-pop-overlay detail-pop-overlay-social custom-scrollbar ${isOpen ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Social details and directions for ${shop.placeDetails?.name || shop.Name}`}
      >
        {/* Social Icons - Only visible when collapsed */}
        {isCollapsed && (
          <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-full z-[59] flex flex-col -bottom-[280px]">
            {/* Photos Icon - Always available (bottom/first in tabs) */}
            <button
              onClick={() => {
                setActiveTab('photos');
                setIsCollapsed(false);
              }}
              className="w-8 h-8 bg-white shadow-lg border border-gray-300 hover:bg-blue-50 transition-colors flex items-center justify-center"
              title="Photos"
              aria-label="View photos"
            >
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </button>

            {/* Reviews Icon - Always available */}
            <button
              onClick={() => {
                setActiveTab('reviews');
                setIsCollapsed(false);
              }}
              className="w-8 h-8 bg-white shadow-lg border border-gray-300 border-b-0 hover:bg-amber-50 transition-colors flex items-center justify-center"
              title="Reviews"
              aria-label="View reviews"
            >
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </button>

            {/* Directions Icon - Always available */}
            <button
              onClick={() => {
                setActiveTab('directions');
                setIsCollapsed(false);
              }}
              className="w-8 h-8 bg-white shadow-lg border border-gray-300 border-b-0 hover:bg-indigo-50 transition-colors flex items-center justify-center"
              title="Directions"
              aria-label="View directions"
            >
              <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.95 4.05a.75.75 0 010 1.06l-4.2 4.2a.75.75 0 000 1.06l4.2 4.2a.75.75 0 11-1.06 1.06l-4.2-4.2a2.25 2.25 0 010-3.18l4.2-4.2a.75.75 0 011.06 0zM6.22 3.22a.75.75 0 011.06 0l2.25 2.25a.75.75 0 01-1.06 1.06L6.22 4.28a.75.75 0 010-1.06zM4 8.75A.75.75 0 014.75 8h.5a.75.75 0 010 1.5h-.5A.75.75 0 014 8.75zM4.75 11a.75.75 0 000 1.5H7a.75.75 0 000-1.5H4.75zM6.22 14.22a.75.75 0 011.06 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06l2.25-2.25z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Instagram Icon - Show always, but with different styling based on availability */}
            <button
              onClick={() => {
                if (hasInstagram) {
                  setActiveTab('instagram');
                  setIsCollapsed(false);
                }
              }}
              className={`w-8 h-8 bg-white shadow-lg border border-gray-300 border-b-0 transition-colors flex items-center justify-center ${
                hasInstagram ? 'hover:bg-pink-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              title={hasInstagram ? "Instagram" : "Instagram not available"}
              aria-label={hasInstagram ? "View Instagram" : "Instagram not available"}
              disabled={!hasInstagram}
            >
              <svg className={`h-4 w-4 ${hasInstagram ? 'text-pink-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </button>

            {/* Facebook Icon - Show always, but with different styling based on availability */}
            <button
              onClick={() => {
                if (hasFacebook) {
                  setActiveTab('facebook');
                  setIsCollapsed(false);
                }
              }}
              className={`w-8 h-8 bg-white shadow-lg border border-gray-300 border-b-0 transition-colors flex items-center justify-center ${
                hasFacebook ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              title={hasFacebook ? "Facebook" : "Facebook not available"}
              aria-label={hasFacebook ? "View Facebook" : "Facebook not available"}
              disabled={!hasFacebook}
            >
              <svg className={`h-4 w-4 ${hasFacebook ? 'text-[#1877F2]' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* X Icon - Show always, but with different styling based on availability (top/last in tabs) */}
            <button
              onClick={() => {
                if (hasX) {
                  setActiveTab('x');
                  setIsCollapsed(false);
                }
              }}
              className={`w-8 h-8 bg-white shadow-lg border border-gray-300 border-b-0 transition-colors flex items-center justify-center rounded-tl-lg ${
                hasX ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              title={hasX ? "X" : "X not available"}
              aria-label={hasX ? "View X" : "X not available"}
              disabled={!hasX}
            >
              <svg className={`h-4 w-4 ${hasX ? 'text-gray-800' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Combined Collapse/Close Button on Right Edge of Overlay */}
        <div
          className={`
            absolute bottom-4 right-0 translate-x-full z-[60]
            bg-white dark:bg-gray-800 shadow-lg rounded-r-lg border border-l-0 border-gray-300 dark:border-gray-600
            flex flex-col items-center justify-center
            overflow-hidden
            pointer-events-auto
          `}
          style={{
            width: '32px',
          }}
        >
          {/* Close Button (X) - Top */}
          <button
            id="shop-socials-close-btn"
            ref={closeButtonRef}
            onClick={onClose}
            className="w-full py-2 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-b border-gray-200 dark:border-gray-600"
            aria-label="Close social details"
            title="Close this panel"
            type="button"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          {/* Toggle Both Overlays Button (Double Arrow) - Middle */}
          <button
            id="shop-socials-toggle-overlays-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBothOverlays();
            }}
            className="w-full py-2 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-200 dark:border-gray-600"
            aria-label={eitherOverlayOpen ? 'Collapse all panels' : 'Expand all panels'}
            title={eitherOverlayOpen ? 'Collapse all panels' : 'Expand all panels'}
            type="button"
          >
            {/* Arrows point inward when panels are open (collapse), outward when closed (expand) */}
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {eitherOverlayOpen ? (
                // Panels open: arrows point inward (collapse) - << >>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                // Panels closed: arrows point outward (expand) - >> <<
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>

          {/* Collapse/Expand Button (Arrow) - Bottom */}
          <button
            id="shop-socials-collapse-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="w-full py-3 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Expand social overlay' : 'Collapse social overlay'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            type="button"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300"
              style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      <div className="shrink-0">
        <div className="mb-2 sm:mb-4 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4">
          <div id="socialOverlayTabs" className="flex flex-wrap -mb-px gap-1" role="tablist" aria-label="Social media and info tabs" aria-orientation="horizontal">
            {/* Photos Tab - Always Available */}
            <button
              onClick={() => handleTabClick('photos')}
              title="Photos"
              role="tab"
              id="tab-photos"
              aria-selected={activeTab === 'photos'}
              aria-controls="tabpanel-photos"
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('photos', true)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('photos', 'text-blue-500 dark:text-blue-400', true)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span className="sr-only">Photos</span>
            </button>

            {/* Reviews Tab - Always Available */}
            <button
              onClick={() => handleTabClick('reviews')}
              title="Reviews"
              role="tab"
              id="tab-reviews"
              aria-selected={activeTab === 'reviews'}
              aria-controls="tabpanel-reviews"
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('reviews', true)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('reviews', 'text-amber-500 dark:text-amber-400', true)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              <span className="sr-only">Reviews</span>
            </button>

            {/* Directions Tab - Always Available */}
            <button
              onClick={() => handleTabClick('directions')}
              title="Directions"
              role="tab"
              id="tab-directions"
              aria-selected={activeTab === 'directions'}
              aria-controls="tabpanel-directions"
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('directions', true)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('directions', 'text-indigo-500 dark:text-indigo-400', true)}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.95 4.05a.75.75 0 010 1.06l-4.2 4.2a.75.75 0 000 1.06l4.2 4.2a.75.75 0 11-1.06 1.06l-4.2-4.2a2.25 2.25 0 010-3.18l4.2-4.2a.75.75 0 011.06 0zM6.22 3.22a.75.75 0 011.06 0l2.25 2.25a.75.75 0 01-1.06 1.06L6.22 4.28a.75.75 0 010-1.06zM4 8.75A.75.75 0 014.75 8h.5a.75.75 0 010 1.5h-.5A.75.75 0 014 8.75zM4.75 11a.75.75 0 000 1.5H7a.75.75 0 000-1.5H4.75zM6.22 14.22a.75.75 0 011.06 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06l2.25-2.25z" clipRule="evenodd" />
              </svg>
              <span className="sr-only">Directions</span>
            </button>

            {/* Instagram Tab - Conditional */}
            <button
              onClick={() => hasInstagram && handleTabClick('instagram')}
              title={hasInstagram ? "Instagram" : "Instagram not available"}
              role="tab"
              id="tab-instagram"
              aria-selected={activeTab === 'instagram'}
              aria-controls="tabpanel-instagram"
              aria-disabled={!hasInstagram}
              disabled={!hasInstagram}
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('instagram', hasInstagram)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('instagram', 'text-pink-600 dark:text-pink-500', hasInstagram)}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="sr-only">Instagram{!hasInstagram ? ' (not available)' : ''}</span>
            </button>

            {/* Facebook Tab - Conditional */}
            <button
              onClick={() => hasFacebook && handleTabClick('facebook')}
              title={hasFacebook ? "Facebook" : "Facebook not available"}
              role="tab"
              id="tab-facebook"
              aria-selected={activeTab === 'facebook'}
              aria-controls="tabpanel-facebook"
              aria-disabled={!hasFacebook}
              disabled={!hasFacebook}
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('facebook', hasFacebook)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('facebook', 'text-[#1877F2] dark:text-[#1877F2]', hasFacebook)}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="sr-only">Facebook{!hasFacebook ? ' (not available)' : ''}</span>
            </button>

            {/* X Tab - Conditional */}
            <button
              onClick={() => hasX && handleTabClick('x')}
              title={hasX ? "X" : "X not available"}
              role="tab"
              id="tab-x"
              aria-selected={activeTab === 'x'}
              aria-controls="tabpanel-x"
              aria-disabled={!hasX}
              disabled={!hasX}
              className={`social-tab-button group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('x', hasX)}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('x', 'text-black dark:text-white', hasX)}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="sr-only">X{!hasX ? ' (not available)' : ''}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 sm:px-4 pb-4">
        {/* --- MODIFIED: RESTORED PHOTOS TAB CONTENT --- */}
        {activeTab === 'photos' && (
          <div id="tabpanel-photos" role="tabpanel" aria-labelledby="tab-photos">
            {googlePhotosData && googlePhotosData.length > 0 ? (
              <div id="socialOverlayGooglePhotosContainer" className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-4">
                {googlePhotosData.map((photoDataObject, index) => {
                  if (!photoDataObject.photo_reference) return null;
                  const maxWidthForThumbnail = 400;
                  const thumbnailUrl = `/api/photo?photo_reference=${encodeURIComponent(photoDataObject.photo_reference)}&maxwidth=${maxWidthForThumbnail}`;
                  const fullSizeUrl = `/api/photo?photo_reference=${encodeURIComponent(photoDataObject.photo_reference)}&maxwidth=1600`;
                  return (
                    <div key={photoDataObject.photo_reference || `gphoto-${index}`} className="gallery-image-container aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <a href={fullSizeUrl} target="_blank" rel="noopener noreferrer" title={`View full image ${index + 1} for ${shop.Name}`}>
                        <img src={thumbnailUrl} alt={`Google Place image ${index + 1} for ${shop.Name}`} className="w-full h-full object-cover transition-transform duration-200 ease-in-out hover:scale-105" loading="lazy" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement; if (p && !p.querySelector('.img-error-fallback')) { const d = document.createElement('div'); d.className = "img-error-fallback w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 p-1"; d.textContent = "Img Load Error"; p.appendChild(d);}}} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : ( <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No Google photos available for this location.</p> )}
          </div>
        )}

        {/* --- MODIFIED: RESTORED REVIEWS TAB CONTENT --- */}
        {activeTab === 'reviews' && (
          <div id="tabpanel-reviews" role="tabpanel" aria-labelledby="tab-reviews">
            <h3 id="reviews-section-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Reviews</h3>
            {shop.placeDetails?.reviews && shop.placeDetails.reviews.length > 0 ? (
              <ul className="space-y-3">
                {shop.placeDetails.reviews.map((review, index) => (
                  <li key={review.time || index} className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg shadow">
                    <div className="flex items-center mb-1.5">
                      {review.profile_photo_url && (
                        <img src={review.profile_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full mr-2 object-cover" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{review.author_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.relative_time_description}</p>
                      </div>
                      {review.rating != null && (
                        <div className="ml-auto flex items-center text-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
                          ))}
                        </div>
                      )}
                    </div>
                    {review.text && <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">{review.text}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No Google Reviews available for this location.</p>
            )}
          </div>
        )}
        
        {/* Directions Tab Panel */}
        {activeTab === 'directions' && (
          <div id="tabpanel-directions" role="tabpanel" aria-labelledby="tab-directions" className="p-2 sm:p-4">
            {/* Header with Trip Mode Toggle */}
            <div className="flex items-center justify-between mb-3">
              <h3 id="directions-section-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {isTripMode ? 'Trip Planner' : `Directions to ${shopNameForDisplay}`}
              </h3>
              <button
                onClick={toggleTripMode}
                className="text-xs px-3 py-1 rounded-md border transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title={isTripMode ? 'Switch to single destination' : 'Plan a multi-stop trip'}
              >
                {isTripMode ? '📍 Single' : '🗺️ Trip'}
              </button>
            </div>

            {/* TRIP MODE */}
            {isTripMode ? (
              <div className="space-y-4">
                {/* Starting Point Display */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                  <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Starting from:</p>
                  <p className="text-sm text-green-900 dark:text-green-200">
                    {lastPlaceSelectedByAutocomplete?.formatted_address || 'Set location in search bar'}
                  </p>
                </div>

                {/* Add Current Shop Button */}
                {!isShopInTrip(shop.slug) && (
                  <button
                    onClick={handleAddCurrentShopToTrip}
                    className="w-full px-3 py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    + Add {shop.Name} to Trip
                  </button>
                )}

                {/* Trip Stops List */}
                {tripStops.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stops ({tripStops.length})
                      </p>
                      <label className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={isOptimizedRoute}
                          onChange={toggleRouteOptimization}
                          className="mr-1 h-3 w-3"
                        />
                        Optimize
                      </label>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={tripStops.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {tripStops.map((stop, index) => (
                            <TripStopCard
                              key={stop.id}
                              stop={stop}
                              index={index}
                              onRemove={removeStopFromTrip}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">Add shops to start planning your trip</p>
                  </div>
                )}

                {/* Trip Action Buttons */}
                {tripStops.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={handleCalculateTripRoute}
                      disabled={isFetchingTripRoute}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isFetchingTripRoute ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Calculating...
                        </>
                      ) : 'Calculate Route'}
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleShareTrip}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Share
                      </button>
                      <button
                        onClick={handleClearTrip}
                        className="flex-1 px-3 py-2 border border-red-300 dark:border-red-800 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Trip Error */}
                {tripError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {tripError}
                    </p>
                  </div>
                )}

                {/* Trip Loading Skeleton */}
                {isFetchingTripRoute && !tripDirectionsResult && (
                  <div className="mt-4 space-y-2 animate-pulse" role="status" aria-live="polite" aria-label="Calculating route">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="space-y-1.5 pl-2">
                            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      {isOptimizedRoute ? 'Optimizing route...' : 'Calculating route...'}
                    </p>
                  </div>
                )}

                {/* Trip Directions Results */}
                {!isFetchingTripRoute && tripDirectionsResult?.routes?.[0]?.legs && tripDirectionsResult.routes[0].legs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Trip Route ({tripDirectionsResult.routes[0].legs.length} stops)
                    </p>
                    <div className="text-xs space-y-3 custom-scrollbar overflow-y-auto max-h-[300px] p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                      {tripDirectionsResult.routes[0].legs.map((leg, legIndex) => (
                        <div key={`leg-${legIndex}`} className="pb-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                            Stop {legIndex + 1} → Stop {legIndex + 2}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {leg.distance?.text} - {leg.duration?.text}
                          </p>
                          {leg.steps?.slice(0, 3).map((step, stepIndex) => (
                            <div key={`step-${stepIndex}`} className="py-1 text-gray-700 dark:text-gray-300">
                              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.instructions || '') }} />
                            </div>
                          ))}
                          {(leg.steps?.length || 0) > 3 && (
                            <p className="text-gray-500 dark:text-gray-400 italic mt-1">
                              + {(leg.steps?.length || 0) - 3} more steps
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SINGLE DESTINATION MODE */
              <div>
                {shopAddressForDisplay ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="font-medium">Address:</strong> {shopAddressForDisplay}
                    </p>
                    {shopLatLngForDisplay && <p className="text-xs text-gray-500 dark:text-gray-400">Coordinates: {shopLatLngForDisplay}</p>}
                  </div>
                ) : shopLatLngForDisplay ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="font-medium">Coordinates:</strong> {shopLatLngForDisplay}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">Address and coordinates are not available.</p>
                )}

                <div className="mb-4 space-y-3">
                  <div>
                    <label htmlFor="originInput" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Starting Point</label>
                    <input
                      type="text"
                      id="originInput"
                      value={manualOrigin}
                      onChange={(e) => { setManualOrigin(e.target.value); if (e.target.value) setUseCurrentLocation(false); }}
                      placeholder={lastPlaceSelectedByAutocomplete?.formatted_address || "Enter address or city"}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="useCurrentLocationCheckbox"
                      type="checkbox"
                      checked={useCurrentLocation}
                      onChange={(e) => { setUseCurrentLocation(e.target.checked); if (e.target.checked) setManualOrigin(''); }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="useCurrentLocationCheckbox" className="text-xs text-gray-700 dark:text-gray-300">Use my current location</label>
                  </div>
                </div>

                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={handleGetDirectionsClick}
                    disabled={isFetchingDirections || !shopDestinationForApi}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isFetchingDirections ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </>
                    ) : 'Get Directions'}
                  </button>
                  {directionsResult && (
                    <button
                      onClick={handleClearDirectionsClick}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Clear Route
                    </button>
                  )}
                </div>

                {/* Add to Trip Button */}
                {directionsResult && !isShopInTrip(shop.slug) && (
                  <button
                    onClick={handleAddCurrentShopToTrip}
                    className="w-full mb-4 px-3 py-2 border border-blue-300 dark:border-blue-700 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Add to My Trip
                  </button>
                )}

                {directionsError && <p className="text-sm text-red-500 dark:text-red-400 mb-2">{directionsError}</p>}

                {isFetchingDirections && !directionsResult && !directionsError && (
                  <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Calculating route...</span>
                  </div>
                )}

                {directionsResult?.routes?.[0]?.legs?.[0]?.steps && (
                  <div className="mt-4 text-xs space-y-2 directions-steps custom-scrollbar overflow-y-auto max-h-[200px] sm:max-h-[250px] p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Total: {directionsResult.routes[0].legs[0].distance?.text} - {directionsResult.routes[0].legs[0].duration?.text}
                    </p>
                    {directionsResult.routes[0].legs.flatMap(leg => leg.steps || []).map((step, stepIndex) => (
                      <div key={`step-${stepIndex}`} className="py-1.5 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.instructions || '') }} />
                        {step.distance?.text && <span className="text-gray-500 dark:text-gray-400 text-[0.65rem] ml-1">({step.distance.text})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instagram Tab Content */}
        {activeTab === 'instagram' && (
          <div id="tabpanel-instagram" role="tabpanel" aria-labelledby="tab-instagram" className="py-4">
            {(() => {
              const profileEmbedCode = getInstagramProfileEmbed(shop);

              if (profileEmbedCode) {
                // Show Instagram profile embed
                return (
                  <div className="flex justify-center">
                    <div
                      className="instagram-embed-container max-w-md w-full"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profileEmbedCode) }}
                    />
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-start text-center pt-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 id="instagram-unavailable-heading" className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No Instagram Account
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This farm hasn't linked their Instagram account yet.
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Facebook Tab Content */}
        {activeTab === 'facebook' && (
          <div id="tabpanel-facebook" role="tabpanel" aria-labelledby="tab-facebook" className="py-4">
            {(() => {
              const facebookUrl = getFacebookUrl(shop);
              const facebookName = getFacebookDisplayName(shop);

              if (facebookUrl && facebookName) {
                return (
                  <div className="space-y-4">
                    {/* Facebook Page Plugin */}
                    <div className="flex justify-center w-full">
                      <iframe
                        src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookUrl)}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                        className="w-full max-w-md lg:max-w-lg"
                        height="600"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      />
                    </div>

                    {/* Visit Page Button */}
                    <div className="flex justify-center pt-2">
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Visit Full Page
                      </a>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-start text-center pt-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 id="facebook-unavailable-heading" className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No Facebook Page
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This farm hasn't linked their Facebook page yet.
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* X Tab Content */}
        {activeTab === 'x' && (
          <div id="tabpanel-x" role="tabpanel" aria-labelledby="tab-x" className="py-4">
            {(() => {
              const timelineEmbed = getXTimelineEmbed(shop);
              const xUrl = getXUrl(shop);
              const xName = getXDisplayName(shop);

              if (timelineEmbed) {
                return (
                  <div className="space-y-4">
                    {/* X Timeline Embed - Note: May not load due to X's restrictions */}
                    <div className="flex justify-center w-full">
                      <div
                        className="x-timeline-container max-w-md w-full"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(timelineEmbed) }}
                      />
                    </div>

                    {/* Fallback Message + Profile Card */}
                    <div className="flex flex-col items-center justify-start text-center space-y-4 mt-8">
                      <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center">
                        <svg className="w-12 h-12 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                          {xName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {shop.placeDetails?.name || shop.Name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                          Timeline feed may not display due to X restrictions
                        </p>
                      </div>
                      {xUrl && (
                        <a
                          href={xUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          Visit X Profile
                        </a>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-start text-center pt-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 id="x-unavailable-heading" className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No X Account
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This farm hasn't linked their X account yet.
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
      </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-renders when shop or onClose props change
export default React.memo(ShopSocials);