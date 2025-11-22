// src/contexts/FilterContext.test.tsx
/**
 * BEGINNER'S GUIDE TO TESTING REACT CONTEXTS
 * ============================================
 *
 * This file tests a React Context - a way to share state across components.
 * Testing contexts is different from testing pure functions because:
 * - Contexts are React hooks (must be used inside components)
 * - State changes over time (unlike pure functions)
 * - We need to wrap tests in the Provider
 *
 * KEY CONCEPTS YOU'LL LEARN:
 * ---------------------------
 * 1. How to test custom React hooks with renderHook()
 * 2. How to test state updates with act()
 * 3. How to test context providers
 * 4. How to test validation logic
 * 5. How to test error handling (using context outside provider)
 *
 * NEW TESTING TOOLS:
 * ------------------
 * - renderHook() - Render a hook in a test environment
 * - act() - Wrap state updates (tells React to process updates)
 * - result.current - Access the hook's current return value
 *
 * WHY act()?
 * ----------
 * React batches state updates for performance. act() ensures all updates
 * are processed before your assertions run. Without it, tests might check
 * state before it's actually updated!
 *
 * EXAMPLE:
 * --------
 * const { result } = renderHook(() => useFilters(), { wrapper: FilterProvider });
 * act(() => {
 *   result.current.toggleFilter('strawberries');
 * });
 * expect(result.current.activeProductFilters.strawberries).toBe(true);
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FilterProvider, useFilters } from './FilterContext';

/**
 * HELPER: Render the useFilters hook with its provider
 * This makes our tests cleaner and more readable
 *
 * @returns The rendered hook result
 */
function renderUseFilters() {
  return renderHook(() => useFilters(), {
    wrapper: FilterProvider, // Wrap the hook in its provider
  });
}

/**
 * TEST SUITE 1: Basic Functionality
 * ==================================
 * Testing the fundamentals of the filter context
 */
describe('FilterContext - Basic Functionality', () => {
  it('initializes with empty filters', () => {
    // WHY THIS TEST: Default state should be empty (no filters active)

    const { result } = renderUseFilters();

    // Initial state should have no active filters
    expect(result.current.activeProductFilters).toEqual({});
    expect(Object.keys(result.current.activeProductFilters)).toHaveLength(0);
  });

  it('provides all expected methods', () => {
    // WHY THIS TEST: Verify the context exposes all required functionality

    const { result } = renderUseFilters();

    // Check that all methods exist and are functions
    expect(typeof result.current.toggleFilter).toBe('function');
    expect(typeof result.current.clearAllFilters).toBe('function');
    expect(typeof result.current.isValidProductKey).toBe('function');
    expect(typeof result.current.setActiveProductFilters).toBe('function');
  });

  it('throws error when used outside provider', () => {
    // WHY THIS TEST: Safety - catch developer mistakes early
    // If someone forgets to wrap their component in FilterProvider, give a clear error

    // Render the hook WITHOUT the provider wrapper
    expect(() => {
      renderHook(() => useFilters()); // No wrapper!
    }).toThrow('useFilters must be used within a FilterProvider');
  });
});

/**
 * TEST SUITE 2: toggleFilter Function
 * ====================================
 * Testing the main filter toggle functionality
 */
describe('FilterContext - toggleFilter', () => {
  it('toggles a filter on', () => {
    // WHY THIS TEST: Core functionality - user clicks a filter to activate it

    const { result } = renderUseFilters();

    // Initially, strawberries filter is off (undefined = false)
    expect(result.current.activeProductFilters.strawberries).toBeUndefined();

    // Toggle strawberries filter ON
    act(() => {
      result.current.toggleFilter('strawberries');
    });

    // Now strawberries filter should be ON (true)
    expect(result.current.activeProductFilters.strawberries).toBe(true);
  });

  it('toggles a filter off', () => {
    // WHY THIS TEST: User can deactivate a filter by clicking it again

    const { result } = renderUseFilters();

    // Turn filter ON
    act(() => {
      result.current.toggleFilter('strawberries');
    });
    expect(result.current.activeProductFilters.strawberries).toBe(true);

    // Turn filter OFF
    act(() => {
      result.current.toggleFilter('strawberries');
    });
    expect(result.current.activeProductFilters.strawberries).toBe(false);
  });

  it('toggles a filter on and off multiple times', () => {
    // WHY THIS TEST: Ensure toggle works repeatedly (not just once)

    const { result } = renderUseFilters();

    // Toggle ON
    act(() => {
      result.current.toggleFilter('eggs');
    });
    expect(result.current.activeProductFilters.eggs).toBe(true);

    // Toggle OFF
    act(() => {
      result.current.toggleFilter('eggs');
    });
    expect(result.current.activeProductFilters.eggs).toBe(false);

    // Toggle ON again
    act(() => {
      result.current.toggleFilter('eggs');
    });
    expect(result.current.activeProductFilters.eggs).toBe(true);
  });

  it('toggles multiple different filters independently', () => {
    // WHY THIS TEST: Multiple filters can be active at the same time

    const { result } = renderUseFilters();

    // Toggle several filters ON
    act(() => {
      result.current.toggleFilter('strawberries');
      result.current.toggleFilter('blueberries');
      result.current.toggleFilter('eggs');
    });

    // All three should be ON
    expect(result.current.activeProductFilters.strawberries).toBe(true);
    expect(result.current.activeProductFilters.blueberries).toBe(true);
    expect(result.current.activeProductFilters.eggs).toBe(true);

    // Toggle one OFF
    act(() => {
      result.current.toggleFilter('blueberries');
    });

    // Only blueberries should be OFF, others still ON
    expect(result.current.activeProductFilters.strawberries).toBe(true);
    expect(result.current.activeProductFilters.blueberries).toBe(false);
    expect(result.current.activeProductFilters.eggs).toBe(true);
  });

  it('ignores invalid product keys', () => {
    // WHY THIS TEST: Security/stability - don't allow arbitrary keys
    // What if someone tries to inject a malicious filter?

    const { result } = renderUseFilters();

    // Try to toggle an invalid filter
    act(() => {
      result.current.toggleFilter('invalid_product_key');
    });

    // Invalid key should NOT be added to filters
    expect(result.current.activeProductFilters.invalid_product_key).toBeUndefined();

    // Try another invalid key
    act(() => {
      result.current.toggleFilter('hacked_filter');
    });

    expect(result.current.activeProductFilters.hacked_filter).toBeUndefined();

    // Filters should still be empty
    expect(Object.keys(result.current.activeProductFilters)).toHaveLength(0);
  });
});

/**
 * TEST SUITE 3: clearAllFilters Function
 * =======================================
 * Testing the "Clear All" functionality
 */
describe('FilterContext - clearAllFilters', () => {
  it('clears all active filters', () => {
    // WHY THIS TEST: User clicks "Clear All" button to reset filters

    const { result } = renderUseFilters();

    // Activate several filters
    act(() => {
      result.current.toggleFilter('strawberries');
      result.current.toggleFilter('blueberries');
      result.current.toggleFilter('eggs');
      result.current.toggleFilter('beef');
    });

    // Verify filters are active
    expect(Object.keys(result.current.activeProductFilters).length).toBeGreaterThan(0);

    // Clear all filters
    act(() => {
      result.current.clearAllFilters();
    });

    // All filters should be cleared
    expect(result.current.activeProductFilters).toEqual({});
    expect(Object.keys(result.current.activeProductFilters)).toHaveLength(0);
  });

  it('does nothing when no filters are active', () => {
    // WHY THIS TEST: Edge case - clearing already-empty filters

    const { result } = renderUseFilters();

    // No filters active
    expect(result.current.activeProductFilters).toEqual({});

    // Clear (should not crash)
    act(() => {
      result.current.clearAllFilters();
    });

    // Still empty
    expect(result.current.activeProductFilters).toEqual({});
  });

  it('allows filters to be re-added after clearing', () => {
    // WHY THIS TEST: Ensure clear doesn't "break" the context

    const { result } = renderUseFilters();

    // Add filters
    act(() => {
      result.current.toggleFilter('strawberries');
    });
    expect(result.current.activeProductFilters.strawberries).toBe(true);

    // Clear
    act(() => {
      result.current.clearAllFilters();
    });
    expect(result.current.activeProductFilters).toEqual({});

    // Add filters again
    act(() => {
      result.current.toggleFilter('blueberries');
    });
    expect(result.current.activeProductFilters.blueberries).toBe(true);
  });
});

/**
 * TEST SUITE 4: isValidProductKey Function
 * =========================================
 * Testing product key validation
 */
describe('FilterContext - isValidProductKey', () => {
  it('returns true for valid product keys', () => {
    // WHY THIS TEST: Verify that recognized products are valid

    const { result } = renderUseFilters();

    // These are valid product keys from PRODUCT_ICONS_CONFIG
    expect(result.current.isValidProductKey('strawberries')).toBe(true);
    expect(result.current.isValidProductKey('blueberries')).toBe(true);
    expect(result.current.isValidProductKey('eggs')).toBe(true);
    expect(result.current.isValidProductKey('beef')).toBe(true);
    expect(result.current.isValidProductKey('pork')).toBe(true);
    expect(result.current.isValidProductKey('chicken')).toBe(true);
  });

  it('returns false for invalid product keys', () => {
    // WHY THIS TEST: Reject unknown/malicious keys

    const { result } = renderUseFilters();

    // These are NOT valid product keys
    expect(result.current.isValidProductKey('invalid_key')).toBe(false);
    expect(result.current.isValidProductKey('random')).toBe(false);
    expect(result.current.isValidProductKey('')).toBe(false);
    expect(result.current.isValidProductKey('hacked')).toBe(false);
  });

  it('is case-sensitive', () => {
    // WHY THIS TEST: Verify exact key matching (no case-insensitive fuzzy matching)

    const { result } = renderUseFilters();

    // Correct case
    expect(result.current.isValidProductKey('strawberries')).toBe(true);

    // Wrong case (should be invalid)
    expect(result.current.isValidProductKey('Strawberries')).toBe(false);
    expect(result.current.isValidProductKey('STRAWBERRIES')).toBe(false);
  });
});

/**
 * TEST SUITE 5: setActiveProductFilters Function
 * ===============================================
 * Testing direct state setting (for advanced usage)
 */
describe('FilterContext - setActiveProductFilters', () => {
  it('allows direct setting of filters', () => {
    // WHY THIS TEST: Power users might want to set multiple filters at once
    // Or restore saved filter state

    const { result } = renderUseFilters();

    // Set multiple filters at once
    act(() => {
      result.current.setActiveProductFilters({
        strawberries: true,
        blueberries: true,
        eggs: false,
      });
    });

    expect(result.current.activeProductFilters).toEqual({
      strawberries: true,
      blueberries: true,
      eggs: false,
    });
  });

  it('replaces existing filters when set directly', () => {
    // WHY THIS TEST: Verify that setActiveProductFilters replaces (not merges)

    const { result } = renderUseFilters();

    // Set initial filters
    act(() => {
      result.current.setActiveProductFilters({
        strawberries: true,
        eggs: true,
      });
    });

    // Set new filters (should replace, not merge)
    act(() => {
      result.current.setActiveProductFilters({
        blueberries: true,
      });
    });

    // Only blueberries should remain
    expect(result.current.activeProductFilters).toEqual({
      blueberries: true,
    });
    expect(result.current.activeProductFilters.strawberries).toBeUndefined();
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ Basic initialization and structure
 * ✅ toggleFilter (on, off, multiple toggles, multiple filters, validation)
 * ✅ clearAllFilters (clear all, clear empty, re-add after clear)
 * ✅ isValidProductKey (valid keys, invalid keys, case sensitivity)
 * ✅ setActiveProductFilters (direct setting, replacing)
 * ✅ Error handling (using context outside provider)
 *
 * What we learned:
 * - How to test React hooks with renderHook()
 * - How to test state updates with act()
 * - How to access hook values with result.current
 * - How to test context providers
 * - How to test validation logic
 * - How to test error throwing
 *
 * Testing pattern for hooks:
 * 1. renderHook(() => useYourHook(), { wrapper: YourProvider })
 * 2. act(() => { call methods that change state })
 * 3. expect(result.current.someValue).toBe(expectedValue)
 *
 * Next steps:
 * - Run this test with: npm test FilterContext
 * - All tests should pass! 🎉
 * - Move on to testing components (Header, etc.)
 */
