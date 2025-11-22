// src/config/fishProducts.ts
'use strict';

import { ProductConfig, ProductIconsConfig } from './products';

export const FISH_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Fish Types
  'salmon': {
    csvHeader: 'salmon',
    name: 'Salmon',
    icon_available: 'salmon_1.jpg',
    icon_unavailable: 'salmon_0.jpg',
    category: 'Fish',
  },
  'cod': {
    csvHeader: 'cod',
    name: 'Cod',
    icon_available: 'cod_1.jpg',
    icon_unavailable: 'cod_0.jpg',
    category: 'Fish',
  },
  'haddock': {
    csvHeader: 'haddock',
    name: 'Haddock',
    icon_available: 'haddock_1.jpg',
    icon_unavailable: 'haddock_0.jpg',
    category: 'Fish',
  },
  'tuna': {
    csvHeader: 'tuna',
    name: 'Tuna',
    icon_available: 'tuna_1.jpg',
    icon_unavailable: 'tuna_0.jpg',
    category: 'Fish',
  },
  'halibut': {
    csvHeader: 'halibut',
    name: 'Halibut',
    icon_available: 'halibut_1.jpg',
    icon_unavailable: 'halibut_0.jpg',
    category: 'Fish',
  },

  // Shellfish
  'lobster': {
    csvHeader: 'lobster',
    name: 'Lobster',
    icon_available: 'lobster_1.jpg',
    icon_unavailable: 'lobster_0.jpg',
    category: 'Shellfish',
  },
  'shrimp': {
    csvHeader: 'shrimp',
    name: 'Shrimp',
    icon_available: 'shrimp_1.jpg',
    icon_unavailable: 'shrimp_0.jpg',
    category: 'Shellfish',
  },
  'crab': {
    csvHeader: 'crab',
    name: 'Crab',
    icon_available: 'crab_1.jpg',
    icon_unavailable: 'crab_0.jpg',
    category: 'Shellfish',
  },
  'oysters': {
    csvHeader: 'oysters',
    name: 'Oysters',
    icon_available: 'oysters_1.jpg',
    icon_unavailable: 'oysters_0.jpg',
    category: 'Shellfish',
  },
  'clams': {
    csvHeader: 'clams',
    name: 'Clams',
    icon_available: 'clams_1.jpg',
    icon_unavailable: 'clams_0.jpg',
    category: 'Shellfish',
  },
  'mussels': {
    csvHeader: 'mussels',
    name: 'Mussels',
    icon_available: 'mussels_1.jpg',
    icon_unavailable: 'mussels_0.jpg',
    category: 'Shellfish',
  },
  'scallops': {
    csvHeader: 'scallops',
    name: 'Scallops',
    icon_available: 'scallops_1.jpg',
    icon_unavailable: 'scallops_0.jpg',
    category: 'Shellfish',
  },
};

export const FILTERABLE_FISH_ATTRIBUTES: string[] = Object.keys(FISH_PRODUCT_ICONS_CONFIG);

export const FISH_CATEGORY_DISPLAY_ORDER: string[] = ['Fish', 'Shellfish'];
