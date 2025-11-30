// src/components/Listings/ListingsPanel.test.tsx
/**
 * Minimal tests for ListingsPanel component
 * More complex integration tests should be in integration test files
 */
import { describe, it, expect } from 'vitest';

describe('ListingsPanel', () => {
  it('should be importable', async () => {
    // Just verify the component can be imported without errors
    const module = await import('./ListingsPanel');
    expect(module.default).toBeDefined();
  });
});
