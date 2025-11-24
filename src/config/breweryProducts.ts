// src/config/breweryProducts.ts
'use strict';

import { ProductConfig, ProductIconsConfig } from './products';

export const BREWERY_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Beer Styles
  'ipa':       { csvHeader: 'ipa',       name: 'IPA',       icon_available: 'ipa_1.jpg',       icon_unavailable: 'ipa_0.jpg',       category: 'Beer Styles' },
  'lager':     { csvHeader: 'lager',     name: 'Lager',     icon_available: 'lager_1.jpg',     icon_unavailable: 'lager_0.jpg',     category: 'Beer Styles' },
  'stout':     { csvHeader: 'stout',     name: 'Stout',     icon_available: 'stout_1.jpg',     icon_unavailable: 'stout_0.jpg',     category: 'Beer Styles' },
  'ale':       { csvHeader: 'ale',       name: 'Ale',       icon_available: 'ale_1.jpg',       icon_unavailable: 'ale_0.jpg',       category: 'Beer Styles' },
  'pilsner':   { csvHeader: 'pilsner',   name: 'Pilsner',   icon_available: 'pilsner_1.jpg',   icon_unavailable: 'pilsner_0.jpg',   category: 'Beer Styles' },
  'wheat_beer': { csvHeader: 'wheat_beer', name: 'Wheat Beer', icon_available: 'wheat_beer_1.jpg', icon_unavailable: 'wheat_beer_0.jpg', category: 'Beer Styles' },

  // Offerings
  'tours':      { csvHeader: 'tours',      name: 'Tours',      icon_available: 'tours_1.jpg',      icon_unavailable: 'tours_0.jpg',      category: 'Offerings' },
  'tastings':   { csvHeader: 'tastings',   name: 'Tastings',   icon_available: 'tastings_1.jpg',   icon_unavailable: 'tastings_0.jpg',   category: 'Offerings' },
  'food':       { csvHeader: 'food',       name: 'Food',       icon_available: 'food_1.jpg',       icon_unavailable: 'food_0.jpg',       category: 'Offerings' },
  'outdoor_seating': { csvHeader: 'outdoor_seating', name: 'Outdoor Seating', icon_available: 'outdoor_seating_1.jpg', icon_unavailable: 'outdoor_seating_0.jpg', category: 'Offerings' },
};

export const FILTERABLE_BREWERY_ATTRIBUTES: string[] = Object.keys(BREWERY_PRODUCT_ICONS_CONFIG);

export const BREWERY_CATEGORY_DISPLAY_ORDER: string[] = ['Beer Styles', 'Offerings'];
