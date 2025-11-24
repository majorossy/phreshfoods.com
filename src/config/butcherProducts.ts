// src/config/butcherProducts.ts
'use strict';

import { ProductIconsConfig } from './products';

export const BUTCHER_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Fresh Meats
  'beef': {
    csvHeader: 'beef',
    name: 'Beef',
    icon_available: 'beef_1.jpg',
    icon_unavailable: 'beef_0.jpg',
    category: 'Fresh Meats',
  },
  'pork': {
    csvHeader: 'pork',
    name: 'Pork',
    icon_available: 'pork_1.jpg',
    icon_unavailable: 'pork_0.jpg',
    category: 'Fresh Meats',
  },
  'lamb': {
    csvHeader: 'lamb',
    name: 'Lamb',
    icon_available: 'lamb_1.jpg',
    icon_unavailable: 'lamb_0.jpg',
    category: 'Fresh Meats',
  },
  'veal': {
    csvHeader: 'veal',
    name: 'Veal',
    icon_available: 'veal_1.jpg',
    icon_unavailable: 'veal_0.jpg',
    category: 'Fresh Meats',
  },

  // Poultry
  'chicken': {
    csvHeader: 'chicken',
    name: 'Chicken',
    icon_available: 'chicken_1.jpg',
    icon_unavailable: 'chicken_0.jpg',
    category: 'Poultry',
  },
  'turkey': {
    csvHeader: 'turkey',
    name: 'Turkey',
    icon_available: 'turkey_1.jpg',
    icon_unavailable: 'turkey_0.jpg',
    category: 'Poultry',
  },
  'duck': {
    csvHeader: 'duck',
    name: 'Duck',
    icon_available: 'duck_1.jpg',
    icon_unavailable: 'duck_0.jpg',
    category: 'Poultry',
  },

  // Prepared Meats
  'sausages': {
    csvHeader: 'sausages',
    name: 'Sausages',
    icon_available: 'sausages_1.jpg',
    icon_unavailable: 'sausages_0.jpg',
    category: 'Prepared Meats',
  },
  'bacon': {
    csvHeader: 'bacon',
    name: 'Bacon',
    icon_available: 'bacon_1.jpg',
    icon_unavailable: 'bacon_0.jpg',
    category: 'Prepared Meats',
  },
  'ground_meat': {
    csvHeader: 'ground_meat',
    name: 'Ground Meat',
    icon_available: 'ground_meat_1.jpg',
    icon_unavailable: 'ground_meat_0.jpg',
    category: 'Prepared Meats',
  },

  // Cuts
  'steaks': {
    csvHeader: 'steaks',
    name: 'Steaks',
    icon_available: 'steaks_1.jpg',
    icon_unavailable: 'steaks_0.jpg',
    category: 'Cuts',
  },
  'roasts': {
    csvHeader: 'roasts',
    name: 'Roasts',
    icon_available: 'roasts_1.jpg',
    icon_unavailable: 'roasts_0.jpg',
    category: 'Cuts',
  },
};

export const FILTERABLE_BUTCHER_ATTRIBUTES: string[] = Object.keys(BUTCHER_PRODUCT_ICONS_CONFIG);

export const BUTCHER_CATEGORY_DISPLAY_ORDER: string[] = ['Fresh Meats', 'Poultry', 'Prepared Meats', 'Cuts'];
