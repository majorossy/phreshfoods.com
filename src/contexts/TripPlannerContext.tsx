// src/contexts/TripPlannerContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Shop } from '../types/shop';
import {
  TripStop,
  saveTripToLocalStorage,
  loadTripFromLocalStorage,
  clearTripFromLocalStorage,
  decodeTripFromUrl,
  encodeTripToUrl
} from '../types/trip';
import { useToast } from './ToastContext';
import { useFarmData } from './LocationDataContext';
import { logger } from '../utils/logger';


interface TripPlannerContextType {
  // State
  tripStops: TripStop[];
  isTripMode: boolean;
  tripDirectionsResult: google.maps.DirectionsResult | null;
  isOptimizedRoute: boolean;
  isFetchingTripRoute: boolean;
  tripError: string | null;

  // Actions
  addStopToTrip: (shop: Shop) => void;
  removeStopFromTrip: (stopId: string) => void;
  reorderStops: (fromIndex: number, toIndex: number) => void;
  toggleRouteOptimization: () => void;
  calculateTripRoute: (origin: string | google.maps.LatLngLiteral) => Promise<void>;
  clearTrip: () => void;
  toggleTripMode: () => void;
  isShopInTrip: (shopSlug: string) => boolean;
  getTripShareUrl: () => string;
}

const TripPlannerContext = createContext<TripPlannerContextType | undefined>(undefined);

export const TripPlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [isTripMode, setIsTripMode] = useState(false);
  const [tripDirectionsResult, setTripDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [isOptimizedRoute, setIsOptimizedRoute] = useState(false);
  const [isFetchingTripRoute, setIsFetchingTripRoute] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { allFarmStands } = useFarmData();
  const hasInitialized = useRef(false);

  // Generate unique ID for trip stop
  const generateStopId = () => `stop_${Date.now()}_${Math.random()}`;

  // Load trip from URL or localStorage on mount
  useEffect(() => {
    if (hasInitialized.current || !allFarmStands || allFarmStands.length === 0) {
      return;
    }

    hasInitialized.current = true;

    // Try URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const urlTrip = decodeTripFromUrl(urlParams);

    if (urlTrip && urlTrip.slugs.length > 0) {
      // Load from URL
      const stops: TripStop[] = [];
      urlTrip.slugs.forEach((slug, index) => {
        const shop = allFarmStands.find(s => s.slug === slug);
        if (shop) {
          stops.push({
            shop,
            order: index,
            id: generateStopId()
          });
        }
      });

      if (stops.length > 0) {
        setTripStops(stops);
        setIsOptimizedRoute(urlTrip.isOptimized);
        setIsTripMode(true);
        showToast('Trip loaded from URL', 'success');
      }
      return;
    }

    // Try localStorage
    const stored = loadTripFromLocalStorage();
    if (stored && stored.stopSlugs.length > 0) {
      const stops: TripStop[] = [];
      stored.stopSlugs.forEach((slug, index) => {
        const shop = allFarmStands.find(s => s.slug === slug);
        if (shop) {
          stops.push({
            shop,
            order: index,
            id: generateStopId()
          });
        }
      });

      if (stops.length > 0) {
        setTripStops(stops);
        setIsOptimizedRoute(stored.isOptimizedRoute);
        logger.log('[Trip Planner] Loaded trip from localStorage:', stops.length, 'stops');
      }
    }
  }, [allFarmStands, showToast]);

  // Save to localStorage whenever trip changes
  useEffect(() => {
    if (hasInitialized.current && tripStops.length > 0) {
      saveTripToLocalStorage(tripStops, isOptimizedRoute);
    }
  }, [tripStops, isOptimizedRoute]);

  const addStopToTrip = useCallback((shop: Shop) => {
    // Check conditions before state update
    const isAlreadyInTrip = tripStops.some(stop => stop.shop.slug === shop.slug);
    const isFull = tripStops.length >= 10;

    if (isAlreadyInTrip) {
      showToast(`${shop.Name} is already in your trip`, 'info');
      return;
    }

    if (isFull) {
      showToast('Maximum 10 stops allowed per trip', 'error');
      return;
    }

    // Add the stop
    const newStop: TripStop = {
      shop,
      order: tripStops.length,
      id: generateStopId()
    };

    setTripStops(current => [...current, newStop]);
    showToast(`Added ${shop.Name} to trip`, 'success');

    // Auto-enable trip mode when adding first stop
    if (tripStops.length === 0) {
      setIsTripMode(true);
    }
  }, [tripStops, showToast]);

  const removeStopFromTrip = useCallback((stopId: string) => {
    setTripStops(current => {
      const filtered = current.filter(stop => stop.id !== stopId);
      // Reorder remaining stops
      return filtered.map((stop, index) => ({ ...stop, order: index }));
    });

    // Clear directions when stops change
    setTripDirectionsResult(null);
    showToast('Stop removed from trip', 'success');
  }, [showToast]);

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setTripStops(current => {
      const result = Array.from(current);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);

      // Update order numbers
      return result.map((stop, index) => ({ ...stop, order: index }));
    });

    // Clear directions when order changes
    setTripDirectionsResult(null);
  }, []);

  const toggleRouteOptimization = useCallback(() => {
    setIsOptimizedRoute(current => !current);
    // Clear current directions so they need to be recalculated
    setTripDirectionsResult(null);
    showToast(
      isOptimizedRoute ? 'Route optimization disabled' : 'Route optimization enabled',
      'info'
    );
  }, [isOptimizedRoute, showToast]);

  const calculateTripRoute = useCallback(async (origin: string | google.maps.LatLngLiteral) => {
    // Validation: Check if there are stops
    if (tripStops.length === 0) {
      showToast('Add at least one stop to calculate route', 'error');
      return;
    }

    // Validation: Check for missing coordinates
    const invalidStops = tripStops.filter(stop => !stop.shop.lat || !stop.shop.lng);
    if (invalidStops.length > 0) {
      const invalidNames = invalidStops.map(s => s.shop.Name).join(', ');
      showToast(`Cannot calculate route: Missing coordinates for ${invalidNames}`, 'error');
      return;
    }

    // Validation: Google Directions API limit is 25 waypoints + origin + destination = 27 total
    // We have: origin + (n-1) waypoints + 1 destination
    // So max n stops = 25 + 1 = 26, but we already limit to 10 in addStopToTrip
    if (tripStops.length > 25) {
      showToast('Too many stops. Google Maps allows a maximum of 25 waypoints.', 'error');
      return;
    }

    setIsFetchingTripRoute(true);
    setTripError(null);

    try {
      // Build waypoints array (all stops except the last, which is the destination)
      const waypoints = tripStops.slice(0, -1).map(stop => ({
        lat: stop.shop.lat!,
        lng: stop.shop.lng!
      }));

      // Last stop is the destination
      const destination = {
        lat: tripStops[tripStops.length - 1].shop.lat!,
        lng: tripStops[tripStops.length - 1].shop.lng!
      };

      // Build query params
      const params = new URLSearchParams();

      // Origin
      if (typeof origin === 'string') {
        params.set('origin', origin);
      } else {
        params.set('origin', `${origin.lat},${origin.lng}`);
      }

      // Destination
      params.set('destination', `${destination.lat},${destination.lng}`);

      // Waypoints
      if (waypoints.length > 0) {
        params.set('waypoints', JSON.stringify(waypoints));
      }

      // Optimization
      if (isOptimizedRoute) {
        params.set('optimizeWaypoints', 'true');
      }

      logger.log('[Trip Planner] Calculating route with', waypoints.length, 'waypoints', isOptimizedRoute ? '(optimized)' : '(in order)');

      const response = await fetch(`/api/directions?${params.toString()}`, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to calculate route' }));
        throw new Error(errorData.error || 'Failed to calculate route');
      }

      const result = await response.json();

      // Handle different Google Directions API response statuses
      if (result.status === 'OK' && result.routes && result.routes.length > 0) {
        setTripDirectionsResult(result);
        const routeInfo = result.routes[0];
        const totalDistance = routeInfo.legs?.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) || 0;
        const totalTime = routeInfo.legs?.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) || 0;

        const distanceMiles = (totalDistance / 1609.34).toFixed(1);
        const timeMinutes = Math.round(totalTime / 60);

        showToast(`Route calculated: ${distanceMiles} miles, ${timeMinutes} min`, 'success');
      } else if (result.status === 'ZERO_RESULTS') {
        throw new Error('No route found between these locations. Try reordering stops or checking addresses.');
      } else if (result.status === 'MAX_WAYPOINTS_EXCEEDED') {
        throw new Error('Too many waypoints. Please reduce the number of stops in your trip.');
      } else if (result.status === 'INVALID_REQUEST') {
        throw new Error('Invalid route request. Please check your starting location and stops.');
      } else if (result.status === 'REQUEST_DENIED') {
        throw new Error('Route request was denied. Please contact support.');
      } else if (result.status === 'OVER_QUERY_LIMIT') {
        throw new Error('Too many requests. Please try again in a moment.');
      } else if (result.status === 'UNKNOWN_ERROR') {
        throw new Error('Server error calculating route. Please try again.');
      } else {
        throw new Error(result.status || 'No route found');
      }
    } catch (error) {
      let errorMessage = 'Failed to calculate trip route';

      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          errorMessage = 'Route calculation timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setTripError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('[Trip Planner] Error calculating route:', error);
    } finally {
      setIsFetchingTripRoute(false);
    }
  }, [tripStops, isOptimizedRoute, showToast]);

  const clearTrip = useCallback(() => {
    setTripStops([]);
    setTripDirectionsResult(null);
    setTripError(null);
    setIsOptimizedRoute(false);
    clearTripFromLocalStorage();

    // Clear URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('trip');
    url.searchParams.delete('opt');
    window.history.replaceState({}, '', url.toString());

    showToast('Trip cleared', 'success');
  }, [showToast]);

  const toggleTripMode = useCallback(() => {
    setIsTripMode(current => !current);
  }, []);

  const isShopInTrip = useCallback((shopSlug: string): boolean => {
    return tripStops.some(stop => stop.shop.slug === shopSlug);
  }, [tripStops]);

  const getTripShareUrl = useCallback((): string => {
    const urlSuffix = encodeTripToUrl(tripStops, isOptimizedRoute);
    return `${window.location.origin}${window.location.pathname}${urlSuffix}`;
  }, [tripStops, isOptimizedRoute]);

  const value: TripPlannerContextType = {
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
    getTripShareUrl
  };

  return (
    <TripPlannerContext.Provider value={value}>
      {children}
    </TripPlannerContext.Provider>
  );
};

export const useTripPlanner = () => {
  const context = useContext(TripPlannerContext);
  if (!context) {
    throw new Error('useTripPlanner must be used within TripPlannerProvider');
  }
  return context;
};
