// src/config/cheeseProducts.ts
'use strict';

import { ProductIconsConfig } from './products';

export const CHEESE_PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Cheese Types
  'cheddar': {
    csvHeader: 'cheddar',
    name: 'Cheddar',
    icon_available: 'cheddar_1.jpg',
    icon_unavailable: 'cheddar_0.jpg',
    category: 'Cheese Types',
  },
  'brie': {
    csvHeader: 'brie',
    name: 'Brie',
    icon_available: 'brie_1.jpg',
    icon_unavailable: 'brie_0.jpg',
    category: 'Cheese Types',
  },
  'gouda': {
    csvHeader: 'gouda',
    name: 'Gouda',
    icon_available: 'gouda_1.jpg',
    icon_unavailable: 'gouda_0.jpg',
    category: 'Cheese Types',
  },
  'mozzarella': {
    csvHeader: 'mozzarella',
    name: 'Mozzarella',
    icon_available: 'mozzarella_1.jpg',
    icon_unavailable: 'mozzarella_0.jpg',
    category: 'Cheese Types',
  },
  'feta': {
    csvHeader: 'feta',
    name: 'Feta',
    icon_available: 'feta_1.jpg',
    icon_unavailable: 'feta_0.jpg',
    category: 'Cheese Types',
  },
  'blue_cheese': {
    csvHeader: 'blue_cheese',
    name: 'Blue Cheese',
    icon_available: 'blue_cheese_1.jpg',
    icon_unavailable: 'blue_cheese_0.jpg',
    category: 'Cheese Types',
  },
  'parmesan': {
    csvHeader: 'parmesan',
    name: 'Parmesan',
    icon_available: 'parmesan_1.jpg',
    icon_unavailable: 'parmesan_0.jpg',
    category: 'Cheese Types',
  },
  'swiss': {
    csvHeader: 'swiss',
    name: 'Swiss',
    icon_available: 'swiss_1.jpg',
    icon_unavailable: 'swiss_0.jpg',
    category: 'Cheese Types',
  },
  'provolone': {
    csvHeader: 'provolone',
    name: 'Provolone',
    icon_available: 'provolone_1.jpg',
    icon_unavailable: 'provolone_0.jpg',
    category: 'Cheese Types',
  },

  // Milk Sources
  'cow_milk': {
    csvHeader: 'cow_milk',
    name: 'Cow Milk',
    icon_available: 'cow_milk_1.jpg',
    icon_unavailable: 'cow_milk_0.jpg',
    category: 'Milk Source',
  },
  'goat_milk': {
    csvHeader: 'goat_milk',
    name: 'Goat Milk',
    icon_available: 'goat_milk_1.jpg',
    icon_unavailable: 'goat_milk_0.jpg',
    category: 'Milk Source',
  },
  'sheep_milk': {
    csvHeader: 'sheep_milk',
    name: 'Sheep Milk',
    icon_available: 'sheep_milk_1.jpg',
    icon_unavailable: 'sheep_milk_0.jpg',
    category: 'Milk Source',
  },
};

export const FILTERABLE_CHEESE_ATTRIBUTES: string[] = Object.keys(CHEESE_PRODUCT_ICONS_CONFIG);

export const CHEESE_CATEGORY_DISPLAY_ORDER: string[] = ['Cheese Types', 'Milk Source'];
