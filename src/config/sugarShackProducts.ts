// src/config/sugarShackProducts.ts
'use strict';

import { ProductConfig, ProductIconsConfig } from './products';

export const SUGAR_SHACK_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Maple Products
  'maple_syrup':   { csvHeader: 'maple_syrup',   name: 'Maple Syrup',   icon_available: 'maple_syrup_1.jpg',   icon_unavailable: 'maple_syrup_0.jpg',   category: 'Maple Products' },
  'maple_candy':   { csvHeader: 'maple_candy',   name: 'Maple Candy',   icon_available: 'maple_candy_1.jpg',   icon_unavailable: 'maple_candy_0.jpg',   category: 'Maple Products' },
  'maple_cream':   { csvHeader: 'maple_cream',   name: 'Maple Cream',   icon_available: 'maple_cream_1.jpg',   icon_unavailable: 'maple_cream_0.jpg',   category: 'Maple Products' },
  'maple_sugar':   { csvHeader: 'maple_sugar',   name: 'Maple Sugar',   icon_available: 'maple_sugar_1.jpg',   icon_unavailable: 'maple_sugar_0.jpg',   category: 'Maple Products' },

  // Experiences
  'tours':         { csvHeader: 'tours',         name: 'Tours',         icon_available: 'tours_1.jpg',         icon_unavailable: 'tours_0.jpg',         category: 'Experiences' },
  'tastings':      { csvHeader: 'tastings',      name: 'Tastings',      icon_available: 'tastings_1.jpg',      icon_unavailable: 'tastings_0.jpg',      category: 'Experiences' },
  'pancake_breakfast': { csvHeader: 'pancake_breakfast', name: 'Pancake Breakfast', icon_available: 'pancake_breakfast_1.jpg', icon_unavailable: 'pancake_breakfast_0.jpg', category: 'Experiences' },
  'seasonal_events': { csvHeader: 'seasonal_events', name: 'Seasonal Events', icon_available: 'seasonal_events_1.jpg', icon_unavailable: 'seasonal_events_0.jpg', category: 'Experiences' },
};

export const FILTERABLE_SUGAR_SHACK_ATTRIBUTES: string[] = Object.keys(SUGAR_SHACK_PRODUCT_ICONS_CONFIG);

export const SUGAR_SHACK_CATEGORY_DISPLAY_ORDER: string[] = ['Maple Products', 'Experiences'];
