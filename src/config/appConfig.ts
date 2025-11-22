// src/config/appConfig.ts
'use strict';

/**
 * @deprecated This file is kept for backward compatibility.
 * New code should import from specific config modules:
 * - import { MAP_ID, GOOGLE_MAPS_API_KEY } from '../config/map';
 * - import { PRODUCT_ICONS_CONFIG } from '../config/products';
 * - import { API_RETRY_FARM_STANDS_MAX } from '../config/api';
 * - import { DEBOUNCE_DELAY_MS } from '../config/ui';
 *
 * Or use the barrel export:
 * - import { MAP_ID, PRODUCT_ICONS_CONFIG } from '../config';
 */

// Re-export everything from the new modular config files
export * from './map';
export * from './products';
export * from './api';
export * from './ui';
