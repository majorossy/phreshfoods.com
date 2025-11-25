# Testing Guide for Beginners

Welcome to the PhreshFoods testing suite! This guide will teach you everything you need to know about testing this application, even if you've never written a test before.

## 📊 Current Test Coverage

**4 test files | 63 tests | All passing ✅**

- ✅ `shopFilters.test.ts` - 14 tests (Pure function testing)
- ✅ `apiService.test.ts` - 19 tests (Async/API testing)
- ✅ `FilterContext.test.tsx` - 16 tests (React hooks testing)
- ✅ `FarmDataContext.test.tsx` - 14 tests (Async context testing)

## 🎯 Why We Test

### The Problem (Without Tests)
Every time you make a change to the code:
1. You manually refresh the browser
2. Click around to see if things still work
3. Hope you didn't break something you forgot to check
4. Maybe discover a bug weeks later when a user reports it

**This takes 10-15 minutes per change** and is error-prone!

### The Solution (With Tests)
- Run `npm test`
- All features are checked automatically in 5 seconds
- If something breaks, you know EXACTLY what and where
- Sleep better at night knowing your app works 😴

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests (watch mode - re-runs on file changes)
npm test

# Run all tests once
npm test:run

# Run tests with visual UI
npm test:ui

# Run specific test file
npm test shopFilters.test.ts

# Run with coverage report
npm test:coverage
```

### Your First Test

Let's write a simple test to understand the basics:

```typescript
// src/utils/example.test.ts
import { describe, it, expect } from 'vitest';

// The function we want to test
function add(a: number, b: number): number {
  return a + b;
}

// Group related tests together
describe('add function', () => {
  // Individual test
  it('adds two positive numbers', () => {
    // Call the function
    const result = add(2, 3);

    // Check the result (assertion)
    expect(result).toBe(5);
  });

  it('adds negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });
});
```

**Run it:**
```bash
npm test example.test.ts
```

## 📚 Test File Structure

Each test file follows this pattern:

```typescript
// 1. IMPORTS
import { describe, it, expect } from 'vitest';
import { functionToTest } from './myFile';

// 2. SETUP (if needed)
beforeEach(() => {
  // Runs before each test
});

// 3. TEST SUITES
describe('Feature Name', () => {
  // 4. INDIVIDUAL TESTS
  it('does something specific', () => {
    // ARRANGE: Set up test data
    const input = 'test';

    // ACT: Call the function
    const result = functionToTest(input);

    // ASSERT: Check the result
    expect(result).toBe('expected output');
  });
});
```

## 🔑 Key Testing Concepts

### 1. Matchers (expect())

Matchers let you check if values match what you expect:

```typescript
// Equality
expect(value).toBe(5);                    // Exact equality (===)
expect(object).toEqual({ a: 1 });         // Deep equality (compares contents)

// Truthiness
expect(value).toBeTruthy();               // Is truthy
expect(value).toBeFalsy();                // Is falsy
expect(value).toBeNull();                 // Is null
expect(value).toBeUndefined();            // Is undefined
expect(value).toBeDefined();              // Is not undefined

// Numbers
expect(value).toBeGreaterThan(3);         // > 3
expect(value).toBeLessThan(10);           // < 10

// Strings
expect(string).toContain('substring');    // Contains text
expect(string).toMatch(/pattern/);        // Matches regex

// Arrays
expect(array).toHaveLength(3);            // Has 3 items
expect(array).toContain('item');          // Includes item

// Functions
expect(fn).toHaveBeenCalled();            // Mock was called
expect(fn).toHaveBeenCalledWith(arg);     // Called with arg
```

### 2. Test Organization

```typescript
describe('Big Feature', () => {
  describe('Sub-feature 1', () => {
    it('does thing A', () => {});
    it('does thing B', () => {});
  });

  describe('Sub-feature 2', () => {
    it('does thing C', () => {});
  });
});
```

### 3. Setup and Teardown

```typescript
beforeEach(() => {
  // Runs BEFORE each test
  // Use for: Resetting state, creating fresh data
});

afterEach(() => {
  // Runs AFTER each test
  // Use for: Cleanup, clearing mocks
});

beforeAll(() => {
  // Runs ONCE before all tests in this file
});

afterAll(() => {
  // Runs ONCE after all tests in this file
});
```

## 📖 The 4 Types of Tests We Have

### Type 1: Pure Function Tests (Easiest)

**What:** Functions that take inputs and return outputs. No side effects.

**Example:** `shopFilters.test.ts`

```typescript
it('filters shops by distance', () => {
  const shops = [
    { name: 'Close Farm', lat: 43.6600, lng: -70.2600 },
    { name: 'Far Farm', lat: 44.3000, lng: -69.0000 },
  ];

  const result = filterShops(shops, { radius: 10, location: portland });

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Close Farm');
});
```

**Key Learnings:**
- Simple input → output testing
- No mocking needed
- Fast and predictable

### Type 2: Async/API Tests (Medium Difficulty)

**What:** Functions that make network requests or handle promises.

**Example:** `apiService.test.ts`

```typescript
it('fetches farm stands successfully', async () => {
  // Mock the API response
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: 1, name: 'Farm' }],
  });

  // Call async function
  const result = await fetchFarmStands();

  // Check result
  expect(result).toHaveLength(1);
  expect(mockFetch).toHaveBeenCalledWith('/api/locations');
});
```

**Key Learnings:**
- Use `async/await` in tests
- Mock fetch to avoid real API calls
- Test both success and error cases

### Type 3: React Hook Tests (Medium-Hard)

**What:** Testing custom React hooks and contexts.

**Example:** `FilterContext.test.tsx`

```typescript
it('toggles a filter on', () => {
  const { result } = renderHook(() => useFilters(), {
    wrapper: FilterProvider,
  });

  // Wrap state changes in act()
  act(() => {
    result.current.toggleFilter('strawberries');
  });

  expect(result.current.activeProductFilters.strawberries).toBe(true);
});
```

**Key Learnings:**
- Use `renderHook()` for hooks
- Wrap state changes in `act()`
- Access values with `result.current`

### Type 4: Async Context Tests (Hardest)

**What:** Testing contexts that fetch data asynchronously.

**Example:** `FarmDataContext.test.tsx`

```typescript
it('loads data on mount', async () => {
  mockAPI.mockResolvedValue([{ id: 1 }]);

  const { result } = renderHook(() => useFarmData(), {
    wrapper: AllProviders,
  });

  // Initially loading
  expect(result.current.isLoading).toBe(true);

  // Wait for loading to finish
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  // Check final state
  expect(result.current.data).toHaveLength(1);
});
```

**Key Learnings:**
- Use `waitFor()` for async state changes
- Test loading states
- Test error handling
- Mock dependencies

## 🛠️ Common Testing Patterns

### Pattern 1: Testing Error Handling

```typescript
it('handles errors gracefully', async () => {
  // Simulate an error
  mockFetch.mockRejectedValue(new Error('Network error'));

  const result = await fetchData();

  // Should return empty array, not crash
  expect(result).toEqual([]);
});
```

### Pattern 2: Testing Input Validation

```typescript
it('returns null for empty input', () => {
  expect(geocodeAddress('')).toBeNull();
  expect(geocodeAddress(null)).toBeNull();
  expect(geocodeAddress('   ')).toBeNull();
});
```

### Pattern 3: Testing State Changes

```typescript
it('updates state when filter changes', () => {
  const { result } = renderUseFilters();

  act(() => {
    result.current.toggleFilter('eggs');
  });

  expect(result.current.activeFilters.eggs).toBe(true);
});
```

### Pattern 4: Testing Cleanup

```typescript
it('aborts request on unmount', async () => {
  const { unmount } = renderUseFarmData();

  // Unmount immediately
  unmount();

  // Verify abort was called
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/data',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
});
```

## 🐛 Common Mistakes & How to Fix Them

### Mistake 1: Forgetting `async/await`

❌ **Wrong:**
```typescript
it('fetches data', () => {
  const result = fetchData(); // Returns a Promise!
  expect(result).toEqual([...]); // FAILS: comparing Promise to array
});
```

✅ **Correct:**
```typescript
it('fetches data', async () => {
  const result = await fetchData(); // Wait for Promise
  expect(result).toEqual([...]);
});
```

### Mistake 2: Not Using `act()` for State Updates

❌ **Wrong:**
```typescript
it('toggles filter', () => {
  const { result } = renderUseFilters();
  result.current.toggleFilter('eggs'); // Warning: not wrapped in act!
  expect(result.current.filters.eggs).toBe(true);
});
```

✅ **Correct:**
```typescript
it('toggles filter', () => {
  const { result } = renderUseFilters();
  act(() => {
    result.current.toggleFilter('eggs');
  });
  expect(result.current.filters.eggs).toBe(true);
});
```

### Mistake 3: Not Waiting for Async Updates

❌ **Wrong:**
```typescript
it('loads data', async () => {
  const { result } = renderUseFarmData();
  expect(result.current.isLoading).toBe(false); // TOO EARLY!
});
```

✅ **Correct:**
```typescript
it('loads data', async () => {
  const { result } = renderUseFarmData();

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
});
```

### Mistake 4: Not Resetting Mocks

❌ **Wrong:**
```typescript
// Test 1
mockFetch.mockResolvedValue('data1');

// Test 2 - still has data1!
mockFetch.mockResolvedValue('data2');
```

✅ **Correct:**
```typescript
beforeEach(() => {
  vi.resetAllMocks(); // Clear all mocks before each test
});
```

## 📊 Reading Test Output

### All Tests Pass 🎉

```
✓ src/utils/shopFilters.test.ts (14 tests) 4ms
✓ src/services/apiService.test.ts (19 tests) 5ms

Test Files  4 passed (4)
Tests  63 passed (63)
```

### Test Fails ❌

```
❯ src/utils/shopFilters.test.ts > filters by distance

AssertionError: expected 2 to be 1

- Expected
+ Received

- 1
+ 2

❯ shopFilters.test.ts:42:20
```

**How to read this:**
- File: `shopFilters.test.ts`
- Test: "filters by distance"
- Error: Expected 1, but got 2
- Line: 42

## 🎓 Learning Path

### Week 1: Pure Functions
1. Read `shopFilters.test.ts`
2. Modify one test and see it fail
3. Fix it and see it pass
4. Write a new test for a different filter

### Week 2: Async Testing
1. Read `apiService.test.ts`
2. Add a test for a new error case
3. Practice mocking fetch responses

### Week 3: React Hooks
1. Read `FilterContext.test.tsx`
2. Add a test for a new filter method
3. Practice using `act()` and `renderHook()`

### Week 4: Advanced Async
1. Read `FarmDataContext.test.tsx`
2. Add a test for a new loading state
3. Practice using `waitFor()`

## 🔗 Helpful Resources

### Official Docs
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

### Your Project Files
- `vitest.config.ts` - Test configuration
- `src/test/setup.ts` - Global test setup
- `src/test/test-utils.tsx` - Custom render helpers
- `src/test/mocks/googleMaps.ts` - Google Maps mock

## 🎯 Test Coverage Goals

### Current Coverage
Run `npm test:coverage` to see detailed coverage report.

### Target Coverage by Area
- **Utilities** (shopFilters, retry, cache): 100%
- **Services** (apiService): 90%+
- **Contexts** (Filter, FarmData): 85%+
- **Components**: 70%+ (as we add more)

## 💡 Pro Tips

1. **Write tests BEFORE fixing bugs**
   - Write a failing test that reproduces the bug
   - Fix the bug
   - Test now passes!

2. **Test the behavior, not the implementation**
   - Good: "User can filter by strawberries"
   - Bad: "toggleFilter sets state.strawberries to true"

3. **Keep tests simple and focused**
   - One test = one thing
   - If test name has "and", split it into two tests

4. **Use descriptive test names**
   - Good: "returns null when address is empty"
   - Bad: "test geocode"

5. **Don't test framework code**
   - Don't test that React works
   - Test YOUR logic only

## 🚦 When to Write Tests

### Always Test
- ✅ Business logic (filters, calculations)
- ✅ API calls and error handling
- ✅ State management (contexts, hooks)
- ✅ User interactions (clicks, form submissions)
- ✅ Edge cases and error conditions

### Sometimes Test
- ⚠️ Simple UI components (if complex logic)
- ⚠️ Utility functions (if doing more than passing through)

### Don't Test
- ❌ Third-party libraries (already tested)
- ❌ Simple getters/setters
- ❌ CSS/styling

## 🎉 You Did It!

You now have a solid foundation for testing React applications! Remember:
- Start simple (pure functions)
- Build up complexity gradually
- Run tests often
- Don't be afraid to ask questions

Happy testing! 🧪✨
