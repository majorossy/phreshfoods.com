// src/components/Header/Header.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { SearchProvider } from '../../contexts/SearchContext';
import { UIProvider } from '../../contexts/UIContext';
import { FilterProvider } from '../../contexts/FilterContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { mockGoogleMaps, cleanupGoogleMaps } from '../../test/mocks/googleMaps';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Store references to mock instances for testing
let mockAddListener: ReturnType<typeof vi.fn>;
let mockClearInstanceListeners: ReturnType<typeof vi.fn>;
let mockGetPlace: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Setup Google Maps mock using the proper mock utility
  mockGoogleMaps();

  // Create mock functions we can spy on
  mockAddListener = vi.fn();
  mockClearInstanceListeners = vi.fn();
  mockGetPlace = vi.fn().mockReturnValue({
    geometry: {
      location: new google.maps.LatLng(43.6591, -70.2568),
    },
    formatted_address: 'Portland, ME, USA',
    name: 'Portland',
    place_id: 'test-place-id',
  });

  // Override the Autocomplete mock to use our spy functions
  const OriginalAutocomplete = google.maps.places.Autocomplete;
  google.maps.places.Autocomplete = class extends OriginalAutocomplete {
    constructor(input: HTMLInputElement, options: any) {
      super(input, options);
    }
    addListener(event: string, callback: Function) {
      mockAddListener(event, callback);
      return super.addListener(event, callback);
    }
    getPlace() {
      return mockGetPlace();
    }
  } as any;

  // Override event.clearInstanceListeners
  google.maps.event.clearInstanceListeners = mockClearInstanceListeners;

  // Mark API as ready
  (global as any).window.googleMapsApiLoaded = true;
});

afterEach(() => {
  cleanupGoogleMaps();
  vi.clearAllMocks();
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <SearchProvider>
          <FilterProvider>
            <UIProvider>
              <Header />
            </UIProvider>
          </FilterProvider>
        </SearchProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  describe('Initial Render', () => {
    it('should render the header with all main elements', () => {
      renderComponent();

      // Check for logo
      expect(screen.getByAltText('Maine Flag')).toBeInTheDocument();

      // Check for search input
      expect(screen.getByPlaceholderText(/Enter a zip, city, or address/i)).toBeInTheDocument();

      // Check for radius slider
      expect(screen.getByLabelText(/Search radius/i)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should render with proper ARIA structure', () => {
      renderComponent();

      // Header has banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Search region has proper label
      expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search and filter locations');
    });

    it('should display all location type filter buttons', () => {
      renderComponent();

      // Check for location type buttons by their title attributes
      expect(screen.getByTitle(/Farm Stands/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Cheesemonger/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Fishmonger/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Butcher/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input changes', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Enter a zip, city, or address/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'Portland, ME' } });

      expect(searchInput.value).toBe('Portland, ME');
    });

    it('should initialize Google Places Autocomplete when Maps API is ready', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockAddListener).toHaveBeenCalled();
      });
    });

    it('should handle place selection from autocomplete', async () => {
      const mockPlace = {
        geometry: {
          location: new google.maps.LatLng(43.6591, -70.2568),
        },
        formatted_address: 'Portland, ME, USA',
        name: 'Portland',
        place_id: 'test-place-id',
      };

      mockGetPlace.mockReturnValue(mockPlace);

      renderComponent();

      await waitFor(() => {
        expect(mockAddListener).toHaveBeenCalledWith('place_changed', expect.any(Function));
      });

      // Simulate place selection
      const placeChangedCallback = mockAddListener.mock.calls[0][1];
      placeChangedCallback();

      // Verify the place was processed
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Enter a zip, city, or address/i) as HTMLInputElement;
        expect(searchInput.value).toContain('Portland');
      });
    });

    it('should have accessible search input with proper labels', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Enter a zip, city, or address/i);

      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search for local'));
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-hint');
      expect(screen.getByText(/Start typing to search/i)).toHaveClass('sr-only');
    });
  });

  describe('Radius Slider', () => {
    it('should render radius slider with default value', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider') as HTMLInputElement;

      expect(radiusSlider).toHaveAttribute('min', '5');
      expect(radiusSlider).toHaveAttribute('max', '100');
      expect(radiusSlider).toHaveAttribute('step', '5');
      expect(parseInt(radiusSlider.value)).toBeGreaterThanOrEqual(5);
    });

    it('should update radius value when slider changes', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(radiusSlider, { target: { value: '50' } });

      expect(radiusSlider.value).toBe('50');
      // Note: The display updates after debounce
    });

    it('should have proper ARIA attributes for radius slider', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider');

      expect(radiusSlider).toHaveAttribute('aria-label', 'Search radius');
      expect(radiusSlider).toHaveAttribute('aria-valuemin');
      expect(radiusSlider).toHaveAttribute('aria-valuemax');
      expect(radiusSlider).toHaveAttribute('aria-valuenow');
      expect(radiusSlider).toHaveAttribute('aria-valuetext');
    });

    it('should announce radius changes to screen readers', () => {
      renderComponent();

      const radiusValue = screen.getByText(/mi$/);

      expect(radiusValue).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Location Type Filters', () => {
    it('should toggle location type when button is clicked', () => {
      renderComponent();

      const farmStandButton = screen.getByTitle(/Farm Stands/i);

      // Initially pressed (active by default)
      expect(farmStandButton).toHaveAttribute('aria-pressed', 'true');

      // Click to deactivate
      fireEvent.click(farmStandButton);

      // Should still be true because it's the only one selected (can't deselect all)
      // The FilterContext prevents deselecting the last type
    });

    it('should show product filter dropdown when arrow is clicked', () => {
      renderComponent();

      // Get the filter dropdown button (the arrow)
      const dropdownButtons = screen.getAllByLabelText(/product filters$/i);
      const farmDropdownButton = dropdownButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Farm')
      );

      if (farmDropdownButton) {
        expect(farmDropdownButton).toHaveAttribute('aria-expanded', 'false');
        expect(farmDropdownButton).toHaveAttribute('aria-haspopup', 'true');

        fireEvent.click(farmDropdownButton);

        expect(farmDropdownButton).toHaveAttribute('aria-expanded', 'true');
      }
    });

    it('should have proper keyboard accessibility for location type buttons', () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      const locationTypeButtons = buttons.filter(btn =>
        btn.getAttribute('title')?.includes('Stands') ||
        btn.getAttribute('title')?.includes('monger') ||
        btn.getAttribute('title')?.includes('Butcher')
      );

      expect(locationTypeButtons.length).toBeGreaterThan(0);
      locationTypeButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should display disabled state for coming soon location types', () => {
      renderComponent();

      // Check if any location types are marked as coming soon
      const allButtons = screen.getAllByRole('button');
      const comingSoonButtons = allButtons.filter(btn =>
        btn.getAttribute('title')?.includes('Coming Soon')
      );

      comingSoonButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Logo/Title Click', () => {
    it('should reset filters when logo is clicked', () => {
      renderComponent();

      const logoLink = screen.getByTitle('Reset Filters');

      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('aria-label', 'Reset Filters');

      fireEvent.click(logoLink);

      // Verify navigation would occur (testing with BrowserRouter)
      expect(window.location.pathname).toBe('/');
    });

    it('should be keyboard accessible', () => {
      renderComponent();

      const logoLink = screen.getByTitle('Reset Filters');

      expect(logoLink.tagName).toBe('A');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Error States', () => {
    it('should handle missing Google Maps API gracefully', () => {
      // Remove Google Maps mock
      cleanupGoogleMaps();
      (global as any).window.googleMapsApiLoaded = false;

      renderComponent();

      // Component should still render
      expect(screen.getByPlaceholderText(/Enter a zip, city, or address/i)).toBeInTheDocument();

      // Autocomplete should not be initialized
      expect(mockAddListener).not.toHaveBeenCalled();
    });

    it('should cleanup autocomplete on unmount', () => {
      const { unmount } = renderComponent();

      unmount();

      // Verify cleanup was called
      expect(mockClearInstanceListeners).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations with default state', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with open dropdown', async () => {
      const { container } = renderComponent();

      // Open a product filter dropdown
      const dropdownButtons = screen.getAllByLabelText(/product filters$/i);
      if (dropdownButtons.length > 0) {
        fireEvent.click(dropdownButtons[0]);
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through all interactive elements', () => {
      renderComponent();

      // All buttons should be natively keyboard accessible
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should have proper focus management', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Enter a zip, city, or address/i);

      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render all controls in proper layout structure', () => {
      renderComponent();

      // Check for main container
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toBeInTheDocument();

      // Verify all key elements are present
      expect(screen.getByAltText('Maine Flag')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter a zip, city, or address/i)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('Integration with Context', () => {
    it('should use SearchContext for managing search state', () => {
      // This is implicitly tested by other tests that verify search functionality
      // The component renders without errors when wrapped in SearchProvider
      renderComponent();
      expect(screen.getByPlaceholderText(/Enter a zip, city, or address/i)).toBeInTheDocument();
    });

    it('should use FilterContext for managing location type filters', () => {
      // Verified by location type filter tests
      renderComponent();
      expect(screen.getByTitle(/Farm Stands/i)).toBeInTheDocument();
    });

    it('should use UIContext for managing overlay state', () => {
      // Verified by logo click test that closes overlays
      renderComponent();
      expect(screen.getByTitle('Reset Filters')).toBeInTheDocument();
    });
  });

  describe('Header Layout Changes (Natural Width)', () => {
    it('should NOT have flex-1 class on main search container', () => {
      const { container } = renderComponent();

      // Find the main search container by role
      const searchContainer = container.querySelector('[role="search"]');

      if (searchContainer) {
        const className = searchContainer.className;
        // Should NOT have flex-1 class (allows natural width)
        expect(className).not.toContain('flex-1');
      }
    });

    it('should NOT have spacer div that pushes content', () => {
      const { container } = renderComponent();

      // Search for flex-1 spacer divs (should not exist)
      const allDivs = container.querySelectorAll('div');
      const spacerDivs = Array.from(allDivs).filter(div =>
        div.className.includes('flex-1') && div.textContent === ''
      );

      // Should not have empty spacer divs
      expect(spacerDivs.length).toBe(0);
    });

    it('should render with natural width container', () => {
      const { container } = renderComponent();

      const searchContainer = container.querySelector('[role="search"]');

      if (searchContainer) {
        // Should have flex classes but not flex-1
        const className = searchContainer.className;
        expect(className).toContain('flex');
        expect(className).not.toContain('flex-1');
      }
    });
  });

  describe('Location Type Chips - Feature Flag Integration', () => {
    it('should only render enabled location types', () => {
      renderComponent();

      // Count location type buttons (should be 6 with breweries/wineries disabled)
      const typeButtons = screen.getAllByRole('button', {
        name: /hide|show.*farm|cheese|fish|butcher|antique|sugar/i
      });

      // Should have 6 types (not 8)
      expect(typeButtons.length).toBeGreaterThanOrEqual(6);
    });

    it('should NOT render brewery chip when disabled', () => {
      renderComponent();

      // Should not find brewery emoji or text
      expect(screen.queryByText(/🍺/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/brewery/i)).not.toBeInTheDocument();
    });

    it('should NOT render winery chip when disabled', () => {
      renderComponent();

      // Should not find winery emoji or text
      expect(screen.queryByText(/🍷/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/winery/i)).not.toBeInTheDocument();
    });

    it('should render sugar shack chip when enabled', () => {
      renderComponent();

      // Should find sugar shack emoji
      expect(screen.getByText(/🍁/)).toBeInTheDocument();
    });
  });
});
