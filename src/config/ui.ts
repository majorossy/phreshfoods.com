// src/config/ui.ts
'use strict';

// UI Timing Configuration
export const DEBOUNCE_DELAY_MS: number = 300; // Default delay for debouncing user input
export const TOAST_DURATION_MS: number = 5000; // Default duration for toast notifications

// Local Storage and Cookie Keys
export const LAST_SEARCHED_LOCATION_KEY: string = 'farmStandFinder_lastSearchedLocation';
export const LAST_SELECTED_RADIUS_KEY: string = 'farmStandFinder_lastSelectedRadius';
export const LAST_SEARCHED_LOCATION_COOKIE_NAME: string = 'farmStandFinder_lastLocation';
export const COOKIE_EXPIRY_DAYS: number = 30; // Cookie will last for 30 days
