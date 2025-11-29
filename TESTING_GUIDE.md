# Testing Guide

This guide provides basic examples for testing React components that use the domain-specific context hooks.

## Setup

First, install the necessary testing dependencies:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Then add a test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Create a `vitest.config.ts` file:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

## Basic Test Examples

### Testing Components with Context Hooks

#### Example 1: Testing ProductFilters (useFilters hook)

**File:** `src/components/Filters/ProductFilters.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductFilters from './ProductFilters';
import { FilterProvider } from '../../contexts/FilterContext';

describe('ProductFilters', () => {
  it('renders filter categories', () => {
    render(
      <FilterProvider>
        <ProductFilters />
      </FilterProvider>
    );

    expect(screen.getByText(/Filter by Product/i)).toBeInTheDocument();
  });

  it('toggles filter when checkbox is clicked', () => {
    render(
      <FilterProvider>
        <ProductFilters />
      </FilterProvider>
    );

    // Find a checkbox (adjust selector based on your products)
    const checkbox = screen.getAllByRole('checkbox')[0];

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('clears all filters when "Clear All" is clicked', () => {
    render(
      <FilterProvider>
        <ProductFilters />
      </FilterProvider>
    );

    // Check a filter
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click "Clear All"
    const clearButton = screen.getByText(/Clear All Filters/i);
    fireEvent.click(clearButton);

    // All checkboxes should be unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => {
      expect(cb).not.toBeChecked();
    });
  });
});
```

#### Example 2: Testing Header (useSearch + useUI hooks)

**File:** `src/components/Header/Header.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { SearchProvider } from '../../contexts/SearchContext';
import { UIProvider } from '../../contexts/UIContext';
import { LocationDataProvider } from '../../contexts/LocationDataContext';

// Helper to wrap component with all needed providers
// Note: LocationDataProvider is the primary data context (FarmDataProvider is legacy)
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <LocationDataProvider>
      <SearchProvider>
        <UIProvider>
          {children}
        </UIProvider>
      </SearchProvider>
    </LocationDataProvider>
  </BrowserRouter>
);

describe('Header', () => {
  it('renders the app title', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    expect(screen.getByText(/PhreshFoods/i)).toBeInTheDocument();
  });

  it('updates search radius when slider is moved', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    const slider = screen.getByRole('slider', { name: /Search radius/i });

    // Change the slider value
    fireEvent.change(slider, { target: { value: '25' } });

    // Verify the value is updated
    expect(slider).toHaveValue('25');
  });

  it('resets search when title is clicked', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    const title = screen.getByText(/PhreshFoods/i);

    // Click should not throw error
    expect(() => fireEvent.click(title)).not.toThrow();
  });
});
```

#### Example 3: Testing SocialOverlay (useDirections + useSearch hooks)

**File:** `src/components/Overlays/SocialOverlay.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SocialOverlay from './SocialOverlay';
import { DirectionsProvider } from '../../contexts/DirectionsContext';
import { SearchProvider } from '../../contexts/SearchContext';
import type { Shop } from '../../types/Shop';

const mockShop: Shop = {
  id: '1',
  name: 'Test Farm Stand',
  address: '123 Farm Road',
  lat: 40.7128,
  lng: -74.0060,
  slug: 'test-farm',
  GoogleProfileID: 'test-123',
  products: [],
  FacebookURL: 'https://facebook.com/testfarm',
  InstagramURL: 'https://instagram.com/testfarm',
  TwitterURL: 'https://twitter.com/testfarm',
};

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>
    <DirectionsProvider>
      {children}
    </DirectionsProvider>
  </SearchProvider>
);

describe('SocialOverlay', () => {
  it('renders shop name and tabs', () => {
    const onClose = vi.fn();

    render(
      <AllProviders>
        <SocialOverlay shop={mockShop} onClose={onClose} />
      </AllProviders>
    );

    expect(screen.getByText(mockShop.name)).toBeInTheDocument();
    expect(screen.getByLabelText(/View photos tab/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/View directions tab/i)).toBeInTheDocument();
  });

  it('switches tabs when tab button is clicked', () => {
    const onClose = vi.fn();

    render(
      <AllProviders>
        <SocialOverlay shop={mockShop} onClose={onClose} />
      </AllProviders>
    );

    // Click directions tab
    const directionsTab = screen.getByLabelText(/View directions tab/i);
    fireEvent.click(directionsTab);

    // Should show directions content
    expect(screen.getByText(/Get Directions/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <AllProviders>
        <SocialOverlay shop={mockShop} onClose={onClose} />
      </AllProviders>
    );

    const closeButton = screen.getByLabelText(/Close/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when fetching directions', async () => {
    const onClose = vi.fn();

    render(
      <AllProviders>
        <SocialOverlay shop={mockShop} onClose={onClose} />
      </AllProviders>
    );

    // Switch to directions tab
    const directionsTab = screen.getByLabelText(/View directions tab/i);
    fireEvent.click(directionsTab);

    // Fill in origin
    const originInput = screen.getByLabelText(/Starting Point/i);
    fireEvent.change(originInput, { target: { value: 'New York, NY' } });

    // Click get directions
    const getDirectionsButton = screen.getByText(/Get Directions/i);
    fireEvent.click(getDirectionsButton);

    // Should show loading state with aria-live
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

#### Example 4: Testing ErrorBoundary

**File:** `src/components/ErrorBoundary/ErrorBoundary.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders fallback UI when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument(); // Accessibility check
  });

  it('renders custom fallback if provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when "Try Again" is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Click "Try Again"
    const tryAgainButton = screen.getByText(/Try Again/i);
    fireEvent.click(tryAgainButton);

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## Testing Context Providers Directly

### Example: Testing FilterContext

**File:** `src/contexts/FilterContext.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FilterProvider, useFilters } from './FilterContext';

describe('FilterContext', () => {
  it('provides initial empty filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: FilterProvider,
    });

    expect(result.current.activeProductFilters).toEqual({});
  });

  it('updates filters when setActiveProductFilters is called', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: FilterProvider,
    });

    act(() => {
      result.current.setActiveProductFilters({ tomatoes: true });
    });

    expect(result.current.activeProductFilters).toEqual({ tomatoes: true });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useFilters());
    }).toThrow('useFilters must be used within a FilterProvider');

    console.error = originalError;
  });
});
```

## Accessibility Testing

### Example: Testing ARIA attributes

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('ProductFilters should have no accessibility violations', async () => {
    const { container } = render(
      <FilterProvider>
        <ProductFilters />
      </FilterProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ErrorBoundary alert has proper ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('SocialOverlay tab buttons have aria-labels', () => {
    render(
      <AllProviders>
        <SocialOverlay shop={mockShop} onClose={vi.fn()} />
      </AllProviders>
    );

    expect(screen.getByLabelText(/View photos tab/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/View reviews tab/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/View directions tab/i)).toBeInTheDocument();
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Best Practices

1. **Wrap components with necessary providers**: Always wrap your components with the context providers they need.

2. **Use specific hooks in tests**: Test components using the specific domain hooks (useFilters, useSearch, etc.) rather than the legacy AppContext.

3. **Test accessibility**: Include tests for ARIA attributes, keyboard navigation, and screen reader announcements.

4. **Mock external dependencies**: Mock Google Maps API, fetch calls, etc.

5. **Test loading states**: Verify that loading indicators appear correctly with proper ARIA attributes.

6. **Test error states**: Ensure ErrorBoundary catches errors and displays fallback UI.

7. **Use user-event over fireEvent**: For more realistic user interactions, prefer `@testing-library/user-event`.

## Additional Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev/)
- [jest-axe for Accessibility Testing](https://github.com/nickcolley/jest-axe)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
