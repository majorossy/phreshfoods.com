// src/contexts/GestureContext.tsx
/**
 * Gesture Coordination Context
 *
 * Manages gesture ownership between competing touch handlers:
 * - Bottom sheet (vertical drag)
 * - Card carousel (horizontal swipe)
 * - Photo carousel within cards (horizontal swipe)
 *
 * This prevents gesture conflicts by allowing components to "claim"
 * the current gesture and signal their direction preference.
 */

import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';
import type { GestureOwner, GestureDirection, GestureState } from '../config/mobile';

interface GestureContextValue {
  /**
   * Current gesture state
   */
  getState: () => GestureState;

  /**
   * Attempt to claim gesture ownership
   * @param owner - Component requesting ownership
   * @param direction - Direction of the gesture
   * @returns true if claim was successful, false if another component owns it
   */
  claimGesture: (owner: GestureOwner, direction: GestureDirection) => boolean;

  /**
   * Release gesture ownership
   * @param owner - Component releasing ownership
   */
  releaseGesture: (owner: GestureOwner) => void;

  /**
   * Check if a specific owner has the gesture
   */
  isOwner: (owner: GestureOwner) => boolean;

  /**
   * Check if any gesture is active
   */
  isGestureActive: () => boolean;

  /**
   * Get current gesture owner
   */
  getCurrentOwner: () => GestureOwner;

  /**
   * Get current gesture direction
   */
  getCurrentDirection: () => GestureDirection;

  /**
   * Start drag mode (sets isDragging flag)
   */
  startDrag: (owner: GestureOwner) => void;

  /**
   * End drag mode
   */
  endDrag: (owner: GestureOwner) => void;
}

const GestureContext = createContext<GestureContextValue | null>(null);

interface GestureProviderProps {
  children: ReactNode;
}

/**
 * Gesture Provider Component
 *
 * Wrap this around components that need gesture coordination.
 * Typically placed in MobileBottomSheet to coordinate all mobile gestures.
 */
export function GestureProvider({ children }: GestureProviderProps): React.JSX.Element {
  // Use ref to avoid re-renders during gesture
  const stateRef = useRef<GestureState>({
    owner: null,
    direction: null,
    isDragging: false,
  });

  const getState = useCallback((): GestureState => {
    return { ...stateRef.current };
  }, []);

  const claimGesture = useCallback((owner: GestureOwner, direction: GestureDirection): boolean => {
    const state = stateRef.current;

    // If no owner, claim it
    if (state.owner === null) {
      stateRef.current = {
        owner,
        direction,
        isDragging: true,
      };
      return true;
    }

    // If already owned by same owner, update direction
    if (state.owner === owner) {
      stateRef.current = {
        ...state,
        direction,
      };
      return true;
    }

    // Owned by another component - claim denied
    return false;
  }, []);

  const releaseGesture = useCallback((owner: GestureOwner): void => {
    const state = stateRef.current;

    // Only release if owner matches
    if (state.owner === owner) {
      stateRef.current = {
        owner: null,
        direction: null,
        isDragging: false,
      };
    }
  }, []);

  const isOwner = useCallback((owner: GestureOwner): boolean => {
    return stateRef.current.owner === owner;
  }, []);

  const isGestureActive = useCallback((): boolean => {
    return stateRef.current.owner !== null;
  }, []);

  const getCurrentOwner = useCallback((): GestureOwner => {
    return stateRef.current.owner;
  }, []);

  const getCurrentDirection = useCallback((): GestureDirection => {
    return stateRef.current.direction;
  }, []);

  const startDrag = useCallback((owner: GestureOwner): void => {
    if (stateRef.current.owner === owner || stateRef.current.owner === null) {
      stateRef.current = {
        ...stateRef.current,
        owner,
        isDragging: true,
      };
    }
  }, []);

  const endDrag = useCallback((owner: GestureOwner): void => {
    if (stateRef.current.owner === owner) {
      stateRef.current = {
        owner: null,
        direction: null,
        isDragging: false,
      };
    }
  }, []);

  const value: GestureContextValue = {
    getState,
    claimGesture,
    releaseGesture,
    isOwner,
    isGestureActive,
    getCurrentOwner,
    getCurrentDirection,
    startDrag,
    endDrag,
  };

  return (
    <GestureContext.Provider value={value}>
      {children}
    </GestureContext.Provider>
  );
}

/**
 * Hook to access gesture coordination context
 *
 * @example
 * const { claimGesture, releaseGesture, isOwner } = useGesture();
 *
 * const handleTouchMove = (e: TouchEvent) => {
 *   if (determineDirection(deltaX, deltaY) === 'horizontal') {
 *     if (claimGesture('carousel', 'horizontal')) {
 *       // Handle horizontal swipe
 *     }
 *   }
 * };
 *
 * const handleTouchEnd = () => {
 *   releaseGesture('carousel');
 * };
 */
export function useGesture(): GestureContextValue {
  const context = useContext(GestureContext);

  if (!context) {
    // Return a no-op implementation if not wrapped in provider
    // This allows the hook to work outside the mobile context
    return {
      getState: () => ({ owner: null, direction: null, isDragging: false }),
      claimGesture: () => true,
      releaseGesture: () => {},
      isOwner: () => false,
      isGestureActive: () => false,
      getCurrentOwner: () => null,
      getCurrentDirection: () => null,
      startDrag: () => {},
      endDrag: () => {},
    };
  }

  return context;
}

/**
 * Higher-order component to provide gesture context
 *
 * @example
 * export default withGestureProvider(MobileBottomSheet);
 */
export function withGestureProvider<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <GestureProvider>
        <Component {...props} />
      </GestureProvider>
    );
  };
}

export default GestureContext;
