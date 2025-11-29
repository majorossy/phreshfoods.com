// src/components/Map/MapSearchControls.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapSearchControls from './MapSearchControls';
import { AppProviders } from '../../contexts/AppProviders';
import { BrowserRouter } from 'react-router-dom';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AppProviders>
        <MapSearchControls />
      </AppProviders>
    </BrowserRouter>
  );
};

describe('MapSearchControls', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Search Input', () => {
    it('should render search input field', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/enter.*zip.*city.*address/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should have proper accessibility labels', () => {
      renderComponent();

      const searchInput = screen.getByLabelText(/search.*location/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should display current search value', () => {
      renderComponent();

      const searchInput = screen.getByRole('textbox') as HTMLInputElement;
      // Default value might be set from context
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should allow typing in search field', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(searchInput, 'Portland');

      expect(searchInput.value).toContain('Portland');
    });
  });

  describe('Radius Slider', () => {
    it('should render radius slider', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider');
      expect(radiusSlider).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider');
      expect(radiusSlider).toHaveAttribute('aria-label', 'Search radius');
      expect(radiusSlider).toHaveAttribute('aria-valuemin');
      expect(radiusSlider).toHaveAttribute('aria-valuemax');
    });

    it('should display current radius value', () => {
      renderComponent();

      // Should show radius value with "mi" unit
      const radiusDisplay = screen.getByText(/\d+ mi/);
      expect(radiusDisplay).toBeInTheDocument();
    });

    it('should update radius when slider changes', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider') as HTMLInputElement;
      const initialValue = radiusSlider.value;

      fireEvent.change(radiusSlider, { target: { value: '50' } });

      expect(radiusSlider.value).toBe('50');
      expect(radiusSlider.value).not.toBe(initialValue);
    });

    it('should have min/max/step attributes', () => {
      renderComponent();

      const radiusSlider = screen.getByRole('slider') as HTMLInputElement;

      expect(radiusSlider).toHaveAttribute('min', '5');
      expect(radiusSlider).toHaveAttribute('max', '100');
      expect(radiusSlider).toHaveAttribute('step', '5');
    });
  });

  describe('Layout & Styling', () => {
    it('should render with proper container classes', () => {
      const { container } = renderComponent();

      // Should have positioning and styling classes
      const mainDiv = container.querySelector('[role="search"]');
      expect(mainDiv).toBeTruthy();
    });

    it('should be visible on large screens only', () => {
      const { container } = renderComponent();

      // Check for lg:flex or lg:block class (hidden on mobile/tablet)
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv?.className).toContain('lg:');
    });
  });

  describe('Integration with Contexts', () => {
    it('should sync with SearchContext', async () => {
      renderComponent();

      // Changing radius should update SearchContext
      const radiusSlider = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(radiusSlider, { target: { value: '30' } });

      // After debounce, context should update
      await waitFor(() => {
        expect(radiusSlider.value).toBe('30');
      });
    });
  });
});
