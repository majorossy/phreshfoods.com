// src/config/productRegistry.ts
'use strict';

import { LocationType } from '../types/shop';
import { ProductIconsConfig } from './products';
import { FARM_PRODUCT_ICONS_CONFIG, FARM_CATEGORY_DISPLAY_ORDER } from './farmProducts';
import { CHEESE_PRODUCT_ICONS_CONFIG, CHEESE_CATEGORY_DISPLAY_ORDER } from './cheeseProducts';

// Registry mapping location types to their product configurations
export const PRODUCT_CONFIGS: Record<LocationType, ProductIconsConfig> = {
  farm_stand: FARM_PRODUCT_ICONS_CONFIG,
  cheese_shop: CHEESE_PRODUCT_ICONS_CONFIG,
};

// Registry mapping location types to their category display order
export const CATEGORY_DISPLAY_ORDERS: Record<LocationType, string[]> = {
  farm_stand: FARM_CATEGORY_DISPLAY_ORDER,
  cheese_shop: CHEESE_CATEGORY_DISPLAY_ORDER,
};

// Helper function to get product config for a specific location type
export function getProductConfig(locationType: LocationType): ProductIconsConfig {
  return PRODUCT_CONFIGS[locationType];
}

// Helper function to get category display order for a specific location type
export function getCategoryDisplayOrder(locationType: LocationType): string[] {
  return CATEGORY_DISPLAY_ORDERS[locationType];
}

// Get all product keys for specific location types
export function getProductKeysForTypes(locationTypes: Set<LocationType>): string[] {
  const productKeys = new Set<string>();

  locationTypes.forEach(type => {
    const config = PRODUCT_CONFIGS[type];
    Object.keys(config).forEach(key => productKeys.add(key));
  });

  return Array.from(productKeys);
}

// Get merged product configs for multiple location types
export function getMergedProductConfigs(locationTypes: Set<LocationType>): ProductIconsConfig {
  const merged: ProductIconsConfig = {};

  locationTypes.forEach(type => {
    const config = PRODUCT_CONFIGS[type];
    Object.assign(merged, config);
  });

  return merged;
}
