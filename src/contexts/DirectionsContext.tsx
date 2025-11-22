// src/contexts/DirectionsContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ToastType } from '../types';

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

// Toast handler reference (shared)
let toastHandler: ((type: ToastType, message: string) => void) | null = null;

export const setDirectionsToastHandler = (handler: (type: ToastType, message: string) => void) => {
  toastHandler = handler;
};

export const DirectionsProvider = ({ children }: { children: ReactNode }) => {
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [isFetchingDirections, setIsFetchingDirections] = useState<boolean>(false);

  const clearDirections = useCallback(() => {
    setDirectionsResult(null);
    setDirectionsError(null);
    setIsFetchingDirections(false);
  }, []);

  /**
   * Fetches and displays driving directions between two points
   */
  const fetchAndDisplayDirections = useCallback(async (
    origin: google.maps.LatLngLiteral | string | google.maps.Place,
    destination: google.maps.LatLngLiteral | string | google.maps.Place
  ) => {
    const mapsApiReady = window.googleMapsApiLoaded && window.google?.maps?.DirectionsService;

    if (!mapsApiReady) {
      console.error("[DirectionsContext] Directions Service not available or Maps API not ready.");
      const errorMsg = "Directions service is not available right now.";
      setDirectionsError(errorMsg);
      setIsFetchingDirections(false);
      if (toastHandler) {
        toastHandler('error', errorMsg);
      }
      return;
    }

    setIsFetchingDirections(true);
    setDirectionsResult(null);
    setDirectionsError(null);

    const directionsService = new window.google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    try {
      const response = await directionsService.route(request);
      if (response.status === 'OK') {
        setDirectionsResult(response);
      } else {
        console.warn('[DirectionsContext] Directions request failed due to ' + response.status);
        const errorMsg = 'Could not retrieve directions: ' + response.status;
        setDirectionsError(errorMsg);
        if (toastHandler) {
          toastHandler('error', errorMsg);
        }
      }
    } catch (error) {
      console.error('[DirectionsContext] Error fetching directions:', error);
      const errorMsg = 'An error occurred while fetching directions.';
      setDirectionsError(errorMsg);
      if (toastHandler) {
        toastHandler('error', errorMsg);
      }
    } finally {
      setIsFetchingDirections(false);
    }
  }, []);

  const value: DirectionsContextType = {
    directionsResult,
    directionsError,
    isFetchingDirections,
    fetchAndDisplayDirections,
    clearDirections,
  };

  return <DirectionsContext.Provider value={value}>{children}</DirectionsContext.Provider>;
};

export const useDirections = () => {
  const context = useContext(DirectionsContext);
  if (context === undefined) {
    throw new Error('useDirections must be used within a DirectionsProvider');
  }
  return context;
};
