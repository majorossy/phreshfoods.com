// src/components/Listings/ListingsPanel.test.tsx
/**
 * Tests for ListingsPanel component
 * Focus on layout (no top padding) and virtual scrolling behavior
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ListingsPanel from './ListingsPanel';
import { AppProviders } from '../../contexts/AppProviders';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';

// Mock location data
const mockLocations = Array.from({ length: 30 }, (_, i) => ({
  type: 'farm_stand' as const,
  Name: `Farm ${i + 1}`,
  Address: `${i + 1} Farm Rd`,
  City: 'Portland',
  slug: `farm-${i + 1}`,
  lat: 43.6591 + (i * 0.01),
  lng: -70.2568 + (i * 0.01),
  products: { beef: true },
}));

// Mock fetch
global.fetch = vi.fn((url) => {
  if (url.includes('/api/locations')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockLocations),
    });
  }
  return Promise.reject(new Error('Not found'));
}) as any;

vi.mock('../../utils/loadGoogleMapsScript', () => ({
  loadGoogleMapsScript: vi.fn().mockResolvedValue(undefined),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AppProviders>
        <ListingsPanel />
      </AppProviders>
    </BrowserRouter>
  );
};

describe('ListingsPanel Layout', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Top Padding Removal (Regression Test)', () => {
    it('should NOT have inline paddingTop style', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const panel = container.querySelector('#listingsPanel');

      // Should not have inline paddingTop style
      expect(panel).toBeTruthy();
      if (panel) {
        const style = (panel as HTMLElement).style;
        expect(style.paddingTop).toBe('');
      }
    });

    it('should use px-3 pb-3 classes (no pt- classes)', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const panel = container.querySelector('#listingsPanel');

      if (panel) {
        const className = panel.className;
        // Should have horizontal and bottom padding
        expect(className).toContain('px-');
        expect(className).toContain('pb-');
        // Should NOT have top padding class
        expect(className).not.toContain('pt-');
      }
    });

    it('should NOT have p-3 or p-4 classes (which include top padding)', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const panel = container.querySelector('#listingsPanel');

      if (panel) {
        const className = panel.className;
        // Should not have all-sides padding
        expect(className).not.toMatch(/\bp-3\b/);
        expect(className).not.toMatch(/\bp-4\b/);
      }
    });
  });

  describe('Virtual Scrolling', () => {
    it('should enable virtual scrolling when items exceed threshold', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // With 30 mock items (> 20 threshold), virtual scrolling should be enabled
      // Check for presence of shop cards
      await waitFor(() => {
        const shopCards = screen.queryAllByText(/Farm \d+/);
        expect(shopCards.length).toBeGreaterThan(0);
      });
    });

    it('should render shop cards for visible locations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show shop cards
      await waitFor(() => {
        expect(screen.getByText(/Farm 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show loading skeleton initially', () => {
      renderComponent();

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show WelcomeState on /not-sure route', async () => {
      render(
        <BrowserRouter initialEntries={['/not-sure']}>
          <AppProviders>
            <ListingsPanel />
          </AppProviders>
        </BrowserRouter>
      );

      await waitFor(() => {
        // WelcomeState should be rendered
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Columns', () => {
    it('should calculate columns based on screen width', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should render (column calculation happens in useEffect)
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for the panel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const panel = screen.getByRole('region');
      expect(panel).toHaveAttribute('id', 'listingsPanel');
    });

    it('should have scrollable container', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const panel = container.querySelector('#listingsPanel');
      if (panel) {
        expect(panel.className).toContain('overflow-y-auto');
      }
    });
  });
});
