// src/config/wineryProducts.ts
'use strict';

import { ProductIconsConfig } from './products';

export const WINERY_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Wine Types
  'red_wine':    { csvHeader: 'red_wine',    name: 'Red Wine',    icon_available: 'red_wine_1.jpg',    icon_unavailable: 'red_wine_0.jpg',    category: 'Wine Types' },
  'white_wine':  { csvHeader: 'white_wine',  name: 'White Wine',  icon_available: 'white_wine_1.jpg',  icon_unavailable: 'white_wine_0.jpg',  category: 'Wine Types' },
  'rose':        { csvHeader: 'rose',        name: 'Rosé',        icon_available: 'rose_1.jpg',        icon_unavailable: 'rose_0.jpg',        category: 'Wine Types' },
  'sparkling':   { csvHeader: 'sparkling',   name: 'Sparkling',   icon_available: 'sparkling_1.jpg',   icon_unavailable: 'sparkling_0.jpg',   category: 'Wine Types' },
  'dessert_wine': { csvHeader: 'dessert_wine', name: 'Dessert Wine', icon_available: 'dessert_wine_1.jpg', icon_unavailable: 'dessert_wine_0.jpg', category: 'Wine Types' },

  // Offerings
  'tours':       { csvHeader: 'tours',       name: 'Tours',       icon_available: 'tours_1.jpg',       icon_unavailable: 'tours_0.jpg',       category: 'Offerings' },
  'tastings':    { csvHeader: 'tastings',    name: 'Tastings',    icon_available: 'tastings_1.jpg',    icon_unavailable: 'tastings_0.jpg',    category: 'Offerings' },
  'food':        { csvHeader: 'food',        name: 'Food',        icon_available: 'food_1.jpg',        icon_unavailable: 'food_0.jpg',        category: 'Offerings' },
  'vineyard_views': { csvHeader: 'vineyard_views', name: 'Vineyard Views', icon_available: 'vineyard_views_1.jpg', icon_unavailable: 'vineyard_views_0.jpg', category: 'Offerings' },
  'events':      { csvHeader: 'events',      name: 'Events',      icon_available: 'events_1.jpg',      icon_unavailable: 'events_0.jpg',      category: 'Offerings' },
};

export const FILTERABLE_WINERY_ATTRIBUTES: string[] = Object.keys(WINERY_PRODUCT_ICONS_CONFIG);

export const WINERY_CATEGORY_DISPLAY_ORDER: string[] = ['Wine Types', 'Offerings'];
