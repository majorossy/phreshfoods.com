// src/config/index.ts
// Barrel export file - re-exports all config modules

// Map configuration
export * from './map';

// Product configuration
export * from './products';

// API configuration
export * from './api';

// UI configuration
export * from './ui';

// Note: appConfig.ts is kept for backward compatibility but will be deprecated
// New code should import from specific config modules above
