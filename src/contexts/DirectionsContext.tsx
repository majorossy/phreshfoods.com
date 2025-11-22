// src/contexts/DirectionsContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useToast } from './ToastContext';
import { parseGoogleMapsError, logGoogleMapsError, formatErrorMessage } from '../utils/googleMapsErrors';

interface DirectionsContextType {
  directionsResult: google.maps.DirectionsResult | null;
  directionsError: string | null;
  isFetchingDirections: boolean;
  fetchAndDisplayDirections: (
    origin: google.maps.LatLngLiteral | string | google.maps.Place,
    destination: google.maps.LatLngLiteral | string | google.maps.Place
  ) => Promise<void>;
  clearDirections: () => void;
}

const DirectionsContext = createContext<DirectionsContextType | undefined>(undefined);

export const DirectionsProvider = ({ children }: { children: ReactNode }) => {
  const { showError } = useToast();
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [isFetchingDirections, setIsFetchingDirections] = useState<boolean>(false);
  const pendingRequestRef = useRef<Promise<void> | null>(null);
  const lastRequestKeyRef = useRef<string>('');

  const clearDirections = useCallback(() => {
    setDirectionsResult(null);
    setDirectionsError(null);
    setIsFetchingDirections(false);
    pendingRequestRef.current = null;
    lastRequestKeyRef.current = '';
  }, []);

  /**
   * Fetches and displays driving directions between two points
   * Includes request deduplication to prevent duplicate requests
   */
  const fetchAndDisplayDirections = useCallback(async (
    origin: google.maps.LatLngLiteral | string | google.maps.Place,
    destination: google.maps.LatLngLiteral | string | google.maps.Place
  ) => {
    const mapsApiReady = window.googleMapsApiLoaded && window.google?.maps?.DirectionsService;

    if (!mapsApiReady) {
      const errorMsg = "Directions service is not available right now.";
      setDirectionsError(errorMsg);
      setIsFetchingDirections(false);
      showError(errorMsg);
      return;
    }

    // Create a unique key for this request to deduplicate
    const requestKey = `${JSON.stringify(origin)}-${JSON.stringify(destination)}`;

    // If there's an identical pending request, return the same promise
    if (pendingRequestRef.current && lastRequestKeyRef.current === requestKey) {
      return pendingRequestRef.current;
    }

    // Cancel any pending different request
    pendingRequestRef.current = null;
    lastRequestKeyRef.current = requestKey;

    setIsFetchingDirections(true);
    setDirectionsResult(null);
    setDirectionsError(null);

    const directionsService = new window.google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    const requestPromise = (async () => {
      try {
        const response = await directionsService.route(request);
        if (response.status === 'OK') {
          setDirectionsResult(response);
        } else {
          // Parse Google Maps API error status
          const errorInfo = parseGoogleMapsError(response.status);
          const errorMsg = formatErrorMessage(errorInfo);
          logGoogleMapsError(response.status, 'Directions (DirectionsService)');
          setDirectionsError(errorMsg);
          showError(errorMsg);
        }
      } catch (error) {
        // Parse and log the error
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching directions.';
        logGoogleMapsError(errorMessage, 'Directions (DirectionsService)');
        const errorInfo = parseGoogleMapsError(errorMessage);
        const userMsg = formatErrorMessage(errorInfo);
        setDirectionsError(userMsg);
        showError(userMsg);
      } finally {
        setIsFetchingDirections(false);
        pendingRequestRef.current = null;
      }
    })();

    pendingRequestRef.current = requestPromise;
    return requestPromise;
  }, [showError]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: DirectionsContextType = useMemo(() => ({
    directionsResult,
    directionsError,
    isFetchingDirections,
    fetchAndDisplayDirections,
    clearDirections,
  }), [directionsResult, directionsError, isFetchingDirections, fetchAndDisplayDirections, clearDirections]);

  return <DirectionsContext.Provider value={value}>{children}</DirectionsContext.Provider>;
};

export const useDirections = () => {
  const context = useContext(DirectionsContext);
  if (context === undefined) {
    throw new Error('useDirections must be used within a DirectionsProvider');
  }
  return context;
};
