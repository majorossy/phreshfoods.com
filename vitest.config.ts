/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for faster tests (alternative to jsdom)
    // happy-dom is lighter and faster than jsdom for most React tests
    environment: 'happy-dom',

    // Setup file runs before each test file
    // This is where we import @testing-library/jest-dom matchers
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities - allows you to use describe, it, expect without importing
    globals: true,

    // Coverage configuration
    coverage: {
      // Which tool to use for coverage (v8 is faster, istanbul is more accurate)
      provider: 'v8',

      // Which files to include in coverage report
      include: ['src/**/*.{ts,tsx}'],

      // Which files to exclude from coverage
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/main.tsx', // Entry point, hard to test
        'src/vite-env.d.ts', // Type definitions
        'src/**/*.d.ts',
      ],

      // Coverage thresholds (optional - uncomment to enforce minimum coverage)
      // thresholds: {
      //   lines: 60,
      //   functions: 60,
      //   branches: 60,
      //   statements: 60,
      // },
    },

    // Test file patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Timeout for each test (default is 5000ms)
    testTimeout: 10000,
  },

  // Resolve aliases (same as your vite config)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
