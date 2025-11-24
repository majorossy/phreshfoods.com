// src/test/setup.ts
// This file runs BEFORE each test file to set up the testing environment

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * WHAT IS THIS FILE?
 * ------------------
 * This is the global test setup file. It runs before any tests execute.
 * Think of it like "preparing the stage" before a play starts.
 *
 * WHY DO WE NEED IT?
 * ------------------
 * 1. Import jest-dom matchers (like toBeInTheDocument, toHaveValue)
 * 2. Clean up after each test (prevents tests from affecting each other)
 * 3. Set up global mocks (like Google Maps API)
 */

// Clean up after each test automatically
// This ensures that each test starts with a fresh DOM
// Without this, leftover elements from previous tests could cause false failures
afterEach(() => {
  cleanup(); // Remove all rendered components from the DOM
  vi.clearAllMocks(); // Clear all mock function call histories
});

/**
 * GLOBAL MOCKS
 * ------------
 * These mocks are available in ALL tests without needing to set them up each time
 */

// Mock window.matchMedia (used by some UI components for responsive design)
// Many components check screen size, but the test environment doesn't have a real browser
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, // Default: assume desktop size
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but some libraries still use it
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (used by MapComponent to watch panel width changes)
// The test environment doesn't have ResizeObserver, so we provide a fake one
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (sometimes used for lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * CUSTOM MATCHERS
 * ---------------
 * jest-dom provides helpful matchers like:
 * - expect(element).toBeInTheDocument()
 * - expect(element).toHaveValue('some text')
 * - expect(element).toBeVisible()
 * - expect(element).toHaveAttribute('aria-label', 'Some Label')
 *
 * These make tests more readable than using native DOM APIs
 */

// The matchers are automatically added by importing '@testing-library/jest-dom' above
