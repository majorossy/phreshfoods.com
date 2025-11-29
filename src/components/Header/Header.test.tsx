// src/components/Header/Header.test.tsx
/**
 * Tests for Header component
 *
 * NOTE: Full integration testing with Google Maps Autocomplete requires complex mocking.
 * These tests verify the component can render and basic functionality is available.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { SearchProvider } from '../../contexts/SearchContext';
import { UIProvider } from '../../contexts/UIContext';
import { FilterProvider } from '../../contexts/FilterContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';

beforeEach(() => {
  mockGoogleMaps();
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
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      // Should render something
      expect(document.body).toBeTruthy();
    });

    it('should render the header with search input', () => {
      renderComponent();

      // Check for search input
      const searchInput = screen.queryByPlaceholderText(/Enter a zip, city, or address/i);
      expect(searchInput).toBeTruthy();
    });

    it('should render the banner role', () => {
      renderComponent();

      // Header has banner role
      const banner = screen.queryByRole('banner');
      expect(banner).toBeTruthy();
    });

    it('should render the search region', () => {
      renderComponent();

      // Search region exists
      const search = screen.queryByRole('search');
      expect(search).toBeTruthy();
    });
  });

  describe('Search Input', () => {
    it('should have accessible search input', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Enter a zip, city, or address/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Radius Slider', () => {
    it('should render radius slider', () => {
      renderComponent();

      const slider = screen.queryByRole('slider');
      expect(slider).toBeTruthy();
    });
  });

  describe('Logo/Reset', () => {
    it('should have logo with reset filters link', () => {
      renderComponent();

      const resetLink = screen.queryByTitle('Reset Filters');
      expect(resetLink).toBeTruthy();
    });
  });

  describe('Location Type Filters', () => {
    it('should render location type filter buttons', () => {
      renderComponent();

      // At least one location type button should exist
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
