// src/config/products.ts
// This file now serves as the base type definitions and re-exports for backward compatibility
'use strict';

export interface ProductConfig {
  csvHeader: string;
  name: string;
  icon_available: string;
  icon_unavailable: string;
  category: string;
}

export interface ProductIconsConfig {
  [key: string]: ProductConfig;
}

// Re-export farm products for backward compatibility
export { FARM_PRODUCT_ICONS_CONFIG as PRODUCT_ICONS_CONFIG } from './farmProducts';
export { FILTERABLE_FARM_ATTRIBUTES as FILTERABLE_PRODUCT_ATTRIBUTES } from './farmProducts';
export { FARM_CATEGORY_DISPLAY_ORDER as CATEGORY_DISPLAY_ORDER } from './farmProducts';

// Export all new modules for convenience
export * from './farmProducts';
export * from './cheeseProducts';
export * from './productRegistry';
