// src/contexts/TripPlannerContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Shop } from '../types/shop';
import {
  TripStop,
  TripPersistence,
  saveTripToLocalStorage,
  loadTripFromLocalStorage,
  clearTripFromLocalStorage,
  decodeTripFromUrl,
  encodeTripToUrl
} from '../types/trip';
import { useToast } from './ToastContext';
import { useFarmData } from './LocationDataContext';

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
        console.log('[Trip Planner] Loaded trip from localStorage:', stops.length, 'stops');
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
    if (tripStops.length === 0) {
      showToast('Add at least one stop to calculate route', 'error');
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

      console.log('[Trip Planner] Calculating route with', waypoints.length, 'waypoints');

      const response = await fetch(`/api/directions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to calculate route' }));
        throw new Error(errorData.error || 'Failed to calculate route');
      }

      const result = await response.json();

      if (result.status === 'OK' && result.routes && result.routes.length > 0) {
        setTripDirectionsResult(result);
        showToast('Route calculated successfully', 'success');
      } else {
        throw new Error(result.status || 'No route found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate trip route';
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
