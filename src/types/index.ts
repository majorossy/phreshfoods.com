// src/types/index.ts
// @ts-nocheck - Temporarily disabled for production build testing

// Re-export all types from domain-specific type files
export * from './shop';
export * from './google-maps';
export * from './ui';

// Twitter widgets library interface (third-party)
interface TwitterWidgets {
  widgets: {
    load: (element?: HTMLElement) => void;
  };
}

// Window interface extension for custom properties
declare global {
  interface Window {
    googleMapsApiLoaded?: boolean;
    twttr?: TwitterWidgets; // Twitter widgets library
  }
}

// Import Shop type for use in utility types
import { Shop } from './shop';

// Example of a utility type you might define here or in its own file
export type FilterableProductKey = keyof Pick<
  Shop,
  | 'beef'
  | 'pork'
  | 'lamb'
  | 'chicken'
  | 'turkey'
  | 'duck'
  | 'eggs'
  | 'corn'
  | 'carrots'
  | 'potatoes'
  | 'lettuce'
  | 'spinach'
  | 'squash'
  | 'tomatoes'
  | 'peppers'
  | 'cucumbers'
  | 'zucchini'
  | 'garlic'
  | 'onions'
  | 'strawberries'
  | 'blueberries'
  // Add any other product boolean keys from the Shop interface
>;