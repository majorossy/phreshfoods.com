// src/components/Header/Header.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProductFilterDropdown from '../Filters/ProductFilterDropdown';
import { useHeaderCollapse } from '../../hooks/useHeaderCollapse';
import { useUI } from '../../contexts/UIContext';
import { useFilters } from '../../contexts/FilterContext';
import { LocationType } from '../../types/shop';
import { getProductConfig } from '../../config/productRegistry';
import { getDisplayName, getEmoji } from '../../utils/typeUrlMappings';
import { ENABLED_LOCATION_TYPES } from '../../config/enabledLocationTypes';

// Location type UI configurations (color and disabled state)
// Display names and emojis come from centralized config
const LOCATION_TYPE_CONFIG: Record<LocationType, { emoji: string; label: string; color: string; disabled?: boolean }> = {
  farm_stand: { emoji: getEmoji('farm_stand'), label: getDisplayName('farm_stand'), color: 'green' },
  fish_monger: { emoji: getEmoji('fish_monger'), label: getDisplayName('fish_monger'), color: 'blue' },
  cheese_shop: { emoji: getEmoji('cheese_shop'), label: getDisplayName('cheese_shop'), color: 'yellow' },
  butcher: { emoji: getEmoji('butcher'), label: getDisplayName('butcher'), color: 'red' },
  brewery: { emoji: getEmoji('brewery'), label: getDisplayName('brewery'), color: 'amber' },
  winery: { emoji: getEmoji('winery'), label: getDisplayName('winery'), color: 'purple' },
  antique_shop: { emoji: getEmoji('antique_shop'), label: getDisplayName('antique_shop'), color: 'gray' },
  sugar_shack: { emoji: getEmoji('sugar_shack'), label: getDisplayName('sugar_shack'), color: 'orange' },
};

const Header: React.FC = () => {
  // Product filter dropdowns for location types
  const [openLocationTypeDropdown, setOpenLocationTypeDropdown] = useState<LocationType | null>(null);
  const locationTypeButtonRefs = useRef<Record<LocationType, React.RefObject<HTMLButtonElement>>>({});

  // Header collapse on mobile (Phase 3)
  const { isCollapsed, sentinelRef } = useHeaderCollapse();

  // Mobile drawer state (hamburger menu) - now managed in UIContext
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);
  const [isDrawerAnimatedOpen, setIsDrawerAnimatedOpen] = useState(false);
  const [openDrawerAccordions, setOpenDrawerAccordions] = useState<Set<LocationType>>(new Set());
  const drawerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get UI context
  const {
    setSelectedShop,    // For handleTitleClick
    closeShopOverlays, // For handleTitleClick
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
  } = useUI();

  const {
    activeLocationTypes,
    toggleLocationType,
    activeProductFilters,
    toggleFilter,
    clearAllFilters,
  } = useFilters();

  // Drawer animation effects (delayed mount/unmount pattern)
  useEffect(() => {
    if (isFilterDrawerOpen) {
      if (drawerTimeoutRef.current) {
        clearTimeout(drawerTimeoutRef.current);
      }
      setShouldRenderDrawer(true);
    } else if (shouldRenderDrawer) {
      drawerTimeoutRef.current = setTimeout(() => {
        setShouldRenderDrawer(false);
      }, 350);
    }

    return () => {
      if (drawerTimeoutRef.current) {
        clearTimeout(drawerTimeoutRef.current);
      }
    };
  }, [isFilterDrawerOpen, shouldRenderDrawer]);

  // Delayed enter animation (RAF pattern)
  useEffect(() => {
    if (isFilterDrawerOpen && shouldRenderDrawer) {
      const rafId = requestAnimationFrame(() => {
        setIsDrawerAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsDrawerAnimatedOpen(false);
    }
  }, [isFilterDrawerOpen, shouldRenderDrawer]);

  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link's default navigation
    setSelectedShop(null);
    closeShopOverlays();
    clearAllFilters(); // Reset all filters (navigates to /all with query params)
    // Keep current search location/radius - don't reset
  }, [setSelectedShop, closeShopOverlays, clearAllFilters]);

  // Mobile drawer toggle handlers
  const toggleDrawer = useCallback(() => {
    setIsFilterDrawerOpen(!isFilterDrawerOpen);
  }, [isFilterDrawerOpen, setIsFilterDrawerOpen]);

  const closeDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, [setIsFilterDrawerOpen]);

  // Escape key closes drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterDrawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFilterDrawerOpen, closeDrawer]);

  // Toggle accordion in drawer
  const toggleDrawerAccordion = useCallback((type: LocationType) => {
    setOpenDrawerAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  return (
    <header
      className={`
        absolute top-0 left-0 right-0 z-30 print:hidden
        transition-all duration-300 ease-out
        ${isCollapsed ? 'md:py-2' : ''}
      `}
      style={{
        // Mobile-only collapsible behavior
        height: isCollapsed ? '3.5rem' : 'auto', // 56px collapsed on mobile
      }}
      role="banner"
    >
      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="absolute top-0 h-0 w-0 pointer-events-none" aria-hidden="true" />

      {/* ========== MOBILE COLLAPSED BAR ========== */}
      <div className="md:hidden w-full px-3 py-2">
        <div className="flex items-center">
          {/* Logo as Hamburger Menu */}
          <button
            onClick={toggleDrawer}
            className="cursor-pointer transition-transform duration-300 hover:scale-110 flex-shrink-0"
            aria-label={isFilterDrawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={isFilterDrawerOpen}
          >
            <img
              src="/images/logo.png"
              alt="Maine Flag"
              className="h-8 w-auto object-contain logo-hamburger drop-shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* ========== DESKTOP HEADER (UNCHANGED) ========== */}
      <div className="hidden md:block w-full">
        <div className={`
          flex flex-col sm:flex-row justify-between items-center py-2 gap-y-2 gap-x-4 w-full px-3 sm:px-4
          transition-opacity duration-300
          ${isCollapsed ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}
        `}>
          {/* Combined Container: Logo, Type Filters, Search, Radius, and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 px-5 py-3 rounded-2xl flex-wrap" style={{ backgroundColor: '#356A78' }} role="search" aria-label="Search and filter locations">
            {/* Logo Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/all"
                onClick={handleTitleClick}
                className="cursor-pointer transition-all duration-300 hover:scale-110 hover:-rotate-2 hover:drop-shadow-xl"
                style={{ transformStyle: 'preserve-3d' }}
                title="Reset Filters"
                aria-label="Reset Filters"
              >
                <img src="/images/logo.png" alt="Maine Flag" className="h-8 sm:h-10 w-auto object-contain"/>
              </Link>
            </div>

            {/* Type Filter Buttons with Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap" role="group" aria-label="Location type filters">
              <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.entries(LOCATION_TYPE_CONFIG) as [LocationType, typeof LOCATION_TYPE_CONFIG[LocationType]][])
                .filter(([type]) => ENABLED_LOCATION_TYPES.includes(type))
                .map(([type, config]) => {
                const isActive = activeLocationTypes.has(type);
                const isOpen = openLocationTypeDropdown === type;
                const isDisabled = config.disabled === true;

                // Create ref if it doesn't exist
                if (!locationTypeButtonRefs.current[type]) {
                  locationTypeButtonRefs.current[type] = React.createRef<HTMLButtonElement>();
                }

                // Color classes - inactive state uses text-gray-600 for WCAG AA compliance (4.5:1 contrast ratio)
                const colorClasses = {
                  green: isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-200 hover:text-black border border-green-400',
                  yellow: isActive
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-200 hover:text-black border border-yellow-400',
                  blue: isActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-200 hover:text-black border border-blue-400',
                  red: isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-200 hover:text-black border border-red-400',
                  purple: isActive
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-200 hover:text-black border border-purple-400',
                  amber: isActive
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-amber-200 hover:text-black border border-amber-400',
                  rose: isActive
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-200 hover:text-black border border-rose-400',
                  orange: isActive
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-200 hover:text-black border border-orange-400',
                  teal: isActive
                    ? 'bg-teal-100 text-teal-700 hover:bg-teal-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-teal-200 hover:text-black border border-teal-400',
                  gray: isActive
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-400 hover:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black border border-gray-400',
                };

                // Disabled styling - gray, low opacity, no hover effects
                const buttonClasses = isDisabled
                  ? 'bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed'
                  : colorClasses[config.color];

                return (
                  <div key={type} className="relative">
                    <div className={`flex items-center rounded-full overflow-hidden transition-all duration-200 ${buttonClasses}`}>
                      {/* Main button - toggles location type filter */}
                      <button
                        type="button"
                        onClick={() => !isDisabled && toggleLocationType(type)}
                        disabled={isDisabled}
                        className="text-xs pl-2 pr-1 py-0.5 font-medium whitespace-nowrap flex items-center gap-1 flex-shrink-0 transition-all duration-200"
                        title={isDisabled ? `${config.label} (Coming Soon)` : `${isActive ? 'Hide' : 'Show'} ${config.label}`}
                        aria-label={isDisabled ? `${config.label} (Coming Soon)` : `${isActive ? 'Hide' : 'Show'} ${config.label} locations`}
                        aria-pressed={isActive}
                        aria-disabled={isDisabled}
                      >
                        {config.emoji} {config.label}
                      </button>

                      {/* Arrow button - opens product filter dropdown (only when type is active) */}
                      {isActive && !isDisabled && (
                        <button
                          ref={locationTypeButtonRefs.current[type]}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenLocationTypeDropdown(isOpen ? null : type);
                          }}
                          className="text-xs pr-2 pl-0.5 py-0.5 flex items-center transition-colors hover:opacity-80"
                          title={`${config.label} product filters`}
                          aria-label={`Open ${config.label} product filters`}
                          aria-expanded={isOpen}
                          aria-haspopup="true"
                        >
                          <svg
                            className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {isActive && !isDisabled && (
                      <ProductFilterDropdown
                        category={config.label}
                        products={getProductConfig(type)}
                        locationType={type}
                        isOpen={isOpen}
                        onClose={() => setOpenLocationTypeDropdown(null)}
                        buttonRef={locationTypeButtonRefs.current[type]}
                      />
                    )}
                  </div>
                );
              })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========== MOBILE DRAWER ========== */}
      {shouldRenderDrawer && (
        <>
          {/* Backdrop - only covers below the header, not the map */}
          <div
            className={`
              md:hidden fixed left-0 right-0 bottom-0 bg-black pointer-events-auto
              transition-opacity duration-[350ms] ease-out
              ${isDrawerAnimatedOpen ? 'opacity-70' : 'opacity-0'}
            `}
            onClick={closeDrawer}
            aria-hidden="true"
            style={{ top: '3.5rem', zIndex: 9998, touchAction: 'none' }}
          />

          {/* Drawer Content */}
          <div
            className={`
              md:hidden fixed left-0 right-0
              bg-white dark:bg-gray-800
              shadow-lg rounded-b-2xl
              transition-transform duration-[350ms] ease-out
              overflow-y-auto overscroll-contain
              ${isDrawerAnimatedOpen ? 'translate-y-0' : '-translate-y-full'}
            `}
            style={{
              top: '3.5rem',
              height: 'calc(100vh - 3.5rem - 2rem)',
              zIndex: 9999,
              WebkitOverflowScrolling: 'touch',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter menu"
          >
            <div className="p-3 min-h-full">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                FILTER BY TYPE
              </h3>

              {/* Location Type Accordions - Full Width */}
              <div className="space-y-1">
                {(Object.entries(LOCATION_TYPE_CONFIG) as [LocationType, typeof LOCATION_TYPE_CONFIG[LocationType]][])
                .filter(([type]) => ENABLED_LOCATION_TYPES.includes(type))
                .map(([type, config]) => {
                  const isActive = activeLocationTypes.has(type);
                  const isDisabled = config.disabled === true;
                  const isExpanded = openDrawerAccordions.has(type);
                  const products = getProductConfig(type);

                  const bgColorClasses = {
                    green: isActive ? 'bg-green-100' : 'bg-gray-100 dark:bg-gray-700',
                    yellow: isActive ? 'bg-yellow-100' : 'bg-gray-100 dark:bg-gray-700',
                    blue: isActive ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700',
                    red: isActive ? 'bg-red-100' : 'bg-gray-100 dark:bg-gray-700',
                    purple: isActive ? 'bg-purple-100' : 'bg-gray-100 dark:bg-gray-700',
                    amber: isActive ? 'bg-amber-100' : 'bg-gray-100 dark:bg-gray-700',
                    rose: isActive ? 'bg-rose-100' : 'bg-gray-100 dark:bg-gray-700',
                    orange: isActive ? 'bg-orange-100' : 'bg-gray-100 dark:bg-gray-700',
                    teal: isActive ? 'bg-teal-100' : 'bg-gray-100 dark:bg-gray-700',
                    gray: isActive ? 'bg-gray-100' : 'bg-gray-100 dark:bg-gray-700',
                  };

                  const textColorClasses = isActive
                    ? {
                        green: 'text-green-700',
                        yellow: 'text-yellow-700',
                        blue: 'text-blue-700',
                        red: 'text-red-700',
                        purple: 'text-purple-700',
                        amber: 'text-amber-700',
                        rose: 'text-rose-700',
                        orange: 'text-orange-700',
                        teal: 'text-teal-700',
                        gray: 'text-gray-700',
                      }[config.color]
                    : 'text-gray-600 dark:text-gray-300'; // Fixed: improved contrast for WCAG AA compliance

                  return (
                    <div key={type} className="w-full">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => !isDisabled && toggleLocationType(type)}
                        disabled={isDisabled}
                        className={`
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-lg
                          transition-all duration-200
                          ${bgColorClasses[config.color]} ${textColorClasses}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98]'}
                        `}
                        aria-pressed={isActive}
                      >
                        <span className="font-medium text-sm flex items-center gap-2">
                          <span className="text-lg">{config.emoji}</span>
                          {config.label}
                        </span>

                        {/* Expand Arrow (only when active) */}
                        {isActive && !isDisabled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDrawerAccordion(type);
                            }}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${config.label} products`}
                            aria-expanded={isExpanded}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </button>

                      {/* Accordion Content - Product Filters */}
                      {isActive && !isDisabled && isExpanded && Object.keys(products).length > 0 && (
                        <div
                          className="mt-1 bg-white dark:bg-gray-700 rounded-lg p-3 animate-slideDown"
                          role="region"
                          aria-labelledby={`${type}-accordion`}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {Object.values(products).map((product: { csvHeader: string; name: string }) => {
                              const isProductActive = activeProductFilters[product.csvHeader] === true;
                              return (
                                <button
                                  key={product.csvHeader}
                                  type="button"
                                  onClick={() => toggleFilter(product.csvHeader)}
                                  className={`
                                    px-3 py-2 rounded-md text-xs font-medium
                                    transition-all duration-200
                                    ${isProductActive
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'}
                                  `}
                                  aria-pressed={isProductActive}
                                >
                                  {product.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;