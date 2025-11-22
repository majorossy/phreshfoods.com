// src/config/products.ts
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

export const PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Meats
  'beef':       { csvHeader: 'beef',       name: 'Beef',       icon_available: 'beef_1.jpg',       icon_unavailable: 'beef_0.jpg',       category: 'Meats' },
  'pork':       { csvHeader: 'pork',       name: 'Pork',       icon_available: 'pork_1.jpg',       icon_unavailable: 'pork_0.jpg',       category: 'Meats' },
  'lamb':       { csvHeader: 'lamb',       name: 'Lamb',       icon_available: 'lamb_1.jpg',       icon_unavailable: 'lamb_0.jpg',       category: 'Meats' },
  // Poultry & Eggs
  'chicken':    { csvHeader: 'chicken',    name: 'Chicken',    icon_available: 'chicken_1.jpg',    icon_unavailable: 'chicken_0.jpg',    category: 'Poultry & Eggs' },
  'turkey':     { csvHeader: 'turkey',     name: 'Turkey',     icon_available: 'turkey_1.jpg',     icon_unavailable: 'turkey_0.jpg',    category: 'Poultry & Eggs' },
  'duck':       { csvHeader: 'duck',       name: 'Duck',       icon_available: 'duck_1.jpg',       icon_unavailable: 'duck_0.jpg',       category: 'Poultry & Eggs' },
  'eggs':       { csvHeader: 'eggs',       name: 'Eggs',       icon_available: 'eggs_1.jpg',       icon_unavailable: 'eggs_0.jpg',       category: 'Poultry & Eggs' },
  // Vegetables
  'corn':       { csvHeader: 'corn',       name: 'Corn',       icon_available: 'corn_1.jpg',       icon_unavailable: 'corn_0.jpg',       category: 'Vegetables' },
  'carrots':    { csvHeader: 'carrots',    name: 'Carrots',    icon_available: 'carrots_1.jpg',    icon_unavailable: 'carrots_0.jpg',    category: 'Vegetables' },
  'potatoes':   { csvHeader: 'potatoes',   name: 'Potatoes',   icon_available: 'potatoes_1.jpg',   icon_unavailable: 'potatoes_0.jpg',   category: 'Vegetables' },
  'lettuce':    { csvHeader: 'lettuce',    name: 'Lettuce',    icon_available: 'lettuce_1.jpg',    icon_unavailable: 'lettuce_0.jpg',    category: 'Vegetables' },
  'spinach':    { csvHeader: 'spinach',    name: 'Spinach',    icon_available: 'spinach_1.jpg',    icon_unavailable: 'spinach_0.jpg',    category: 'Vegetables' },
  'squash':     { csvHeader: 'squash',     name: 'Squash',     icon_available: 'squash_1.jpg',     icon_unavailable: 'squash_0.jpg',     category: 'Vegetables' },
  'tomatoes':   { csvHeader: 'tomatoes',   name: 'Tomatoes',   icon_available: 'tomatoes_1.jpg',   icon_unavailable: 'tomatoes_0.jpg',   category: 'Vegetables' },
  'peppers':    { csvHeader: 'peppers',    name: 'Peppers',    icon_available: 'peppers_1.jpg',    icon_unavailable: 'peppers_0.jpg',    category: 'Vegetables' },
  'cucumbers':  { csvHeader: 'cucumbers',  name: 'Cucumbers',  icon_available: 'cucumbers_1.jpg',  icon_unavailable: 'cucumbers_0.jpg',  category: 'Vegetables' },
  'zucchini':   { csvHeader: 'zucchini',   name: 'Zucchini',   icon_available: 'zucchini_1.jpg',   icon_unavailable: 'zucchini_0.jpg',   category: 'Vegetables' },
  // Aromatics
  'garlic':     { csvHeader: 'garlic',     name: 'Garlic',     icon_available: 'garlic_1.jpg',     icon_unavailable: 'garlic_0.jpg',     category: 'Aromatics' },
  'onions':     { csvHeader: 'onions',     name: 'Onions',     icon_available: 'onions_1.jpg',     icon_unavailable: 'onions_0.jpg',     category: 'Aromatics' },
  // Fruits
  'strawberries': { csvHeader: 'strawberries', name: 'Strawberries', icon_available: 'strawberries_1.jpg', icon_unavailable: 'strawberries_0.jpg', category: 'Fruits' },
  'blueberries':  { csvHeader: 'blueberries',  name: 'Blueberries',  icon_available: 'blueberries_1.jpg',  icon_unavailable: 'blueberries_0.jpg',  category: 'Fruits' },
};

export const FILTERABLE_PRODUCT_ATTRIBUTES: string[] = Object.keys(PRODUCT_ICONS_CONFIG);

export const CATEGORY_DISPLAY_ORDER: string[] = ['Meats', 'Poultry & Eggs', 'Vegetables', 'Fruits', 'Aromatics'];
