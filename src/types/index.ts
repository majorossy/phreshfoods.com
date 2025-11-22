// src/types/index.ts

// Re-export all types from domain-specific type files
export * from './shop';
export * from './google-maps';
export * from './ui';

// Window interface extension for custom properties
declare global {
  interface Window {
    googleMapsApiLoaded?: boolean;
    twttr?: any; // Twitter widgets library - complex third-party type
  }
}

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