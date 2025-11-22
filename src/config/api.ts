// src/config/api.ts
'use strict';

// API Retry Configuration
export const API_RETRY_FARM_STANDS_MAX: number = 3;
export const API_RETRY_FARM_STANDS_DELAY_MS: number = 1000;

export const API_RETRY_GEOCODE_MAX: number = 2;
export const API_RETRY_GEOCODE_DELAY_MS: number = 500;

// Caching and Rate Limiting
export const RATE_LIMIT_CACHE_DURATION_MS: number = 15 * 60 * 1000; // 15 minutes
export const SESSION_CACHE_DURATION_MS: number = 15 * 60 * 1000; // 15 minutes
