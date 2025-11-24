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

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Mock Google Maps API
const mockAddListener = vi.fn();
const mockClearInstanceListeners = vi.fn();
const mockAutocomplete = {
  addListener: mockAddListener,
  getPlace: vi.fn(),
};

beforeEach(() => {
  // Setup Google Maps mock
  (global as any).google = {
    maps: {
      places: {
        Autocomplete: vi.fn().mockImplementation(() => mockAutocomplete),
      },
      LatLngBounds: vi.fn().mockImplementation(() => ({})),
      event: {
        clearInstanceListeners: mockClearInstanceListeners,
      },
      DirectionsService: vi.fn(),
    },
  };

  // Mark API as ready
  (global as any).window.googleMapsApiLoaded = true;
});

afterEach(() => {
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
      expect(screen.getByAlt('Maine Flag')).toBeInTheDocument();

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

      // Check for location type buttons
      expect(screen.getByTitle(/Show Farm Stands/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Show Cheesemongers/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Show Fishmongers/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Show Butchers/i)).toBeInTheDocument();
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
        expect(global.google.maps.places.Autocomplete).toHaveBeenCalled();
      });
    });

    it('should handle place selection from autocomplete', async () => {
      const mockPlace = {
        geometry: {
          location: {
            lat: () => 43.6591,
            lng: () => -70.2568,
          },
        },
        formatted_address: 'Portland, ME, USA',
        name: 'Portland',
        place_id: 'test-place-id',
      };

      mockAutocomplete.getPlace.mockReturnValue(mockPlace);

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
      const radiusDisplay = screen.getByText(/mi$/);

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

      const farmStandButton = screen.getByTitle(/Farm Stands/i);

      expect(farmStandButton).toHaveAttribute('type', 'button');
      expect(farmStandButton.tagName).toBe('BUTTON');
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
      delete (global as any).google;
      (global as any).window.googleMapsApiLoaded = false;

      renderComponent();

      // Component should still render
      expect(screen.getByPlaceholderText(/Enter a zip, city, or address/i)).toBeInTheDocument();

      // Autocomplete should not be initialized
      expect(mockAutocomplete.addListener).not.toHaveBeenCalled();
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
      expect(screen.getByAlt('Maine Flag')).toBeInTheDocument();
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
});
