// src/config/antiqueProducts.ts
'use strict';

import { ProductIconsConfig } from './products';

export const ANTIQUE_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Furniture & Decor
  'furniture': {
    csvHeader: 'furniture',
    name: 'Furniture',
    icon_available: 'furniture_1.jpg',
    icon_unavailable: 'furniture_0.jpg',
    category: 'Furniture & Decor',
  },
  'art': {
    csvHeader: 'art',
    name: 'Art',
    icon_available: 'art_1.jpg',
    icon_unavailable: 'art_0.jpg',
    category: 'Furniture & Decor',
  },

  // Jewelry & Accessories
  'jewelry': {
    csvHeader: 'jewelry',
    name: 'Jewelry',
    icon_available: 'jewelry_1.jpg',
    icon_unavailable: 'jewelry_0.jpg',
    category: 'Jewelry & Accessories',
  },
  'vintage_clothing': {
    csvHeader: 'vintage_clothing',
    name: 'Vintage Clothing',
    icon_available: 'vintage_clothing_1.jpg',
    icon_unavailable: 'vintage_clothing_0.jpg',
    category: 'Jewelry & Accessories',
  },

  // Collectibles
  'books': {
    csvHeader: 'books',
    name: 'Books',
    icon_available: 'books_1.jpg',
    icon_unavailable: 'books_0.jpg',
    category: 'Collectibles',
  },
  'collectibles': {
    csvHeader: 'collectibles',
    name: 'Collectibles',
    icon_available: 'collectibles_1.jpg',
    icon_unavailable: 'collectibles_0.jpg',
    category: 'Collectibles',
  },

  // Tableware
  'ceramics': {
    csvHeader: 'ceramics',
    name: 'Ceramics',
    icon_available: 'ceramics_1.jpg',
    icon_unavailable: 'ceramics_0.jpg',
    category: 'Tableware',
  },
  'glassware': {
    csvHeader: 'glassware',
    name: 'Glassware',
    icon_available: 'glassware_1.jpg',
    icon_unavailable: 'glassware_0.jpg',
    category: 'Tableware',
  },
  'silverware': {
    csvHeader: 'silverware',
    name: 'Silverware',
    icon_available: 'silverware_1.jpg',
    icon_unavailable: 'silverware_0.jpg',
    category: 'Tableware',
  },

  // Textiles
  'textiles': {
    csvHeader: 'textiles',
    name: 'Textiles',
    icon_available: 'textiles_1.jpg',
    icon_unavailable: 'textiles_0.jpg',
    category: 'Textiles',
  },
};

export const FILTERABLE_ANTIQUE_ATTRIBUTES: string[] = Object.keys(ANTIQUE_PRODUCT_ICONS_CONFIG);

export const ANTIQUE_CATEGORY_DISPLAY_ORDER: string[] = ['Furniture & Decor', 'Jewelry & Accessories', 'Collectibles', 'Tableware', 'Textiles'];
