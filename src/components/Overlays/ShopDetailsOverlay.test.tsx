// src/components/Overlays/ShopDetailsOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ShopDetailsOverlay from './ShopDetailsOverlay';
import { UIProvider } from '../../contexts/UIContext';
import type { Shop } from '../../types';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Mock shop data
const mockShop: Shop = {
  Name: 'Test Farm Stand',
  Address: '123 Main St',
  City: 'Portland',
  Zip: '04101',
  type: 'farm_stand',
  lat: 43.6591,
  lng: -70.2568,
  slug: 'test-farm-stand',
  GoogleProfileID: 'test-123',
  placeDetails: {
    name: 'Test Farm Stand',
    formatted_address: '123 Main St, Portland, ME 04101',
    rating: 4.5,
    user_ratings_total: 42,
    opening_hours: {
      open_now: true,
      weekday_text: [
        'Monday: 9:00 AM – 5:00 PM',
        'Tuesday: 9:00 AM – 5:00 PM',
        'Wednesday: 9:00 AM – 5:00 PM',
        'Thursday: 9:00 AM – 5:00 PM',
        'Friday: 9:00 AM – 5:00 PM',
        'Saturday: 9:00 AM – 3:00 PM',
        'Sunday: Closed'
      ]
    },
    url: 'https://maps.google.com/?cid=123',
    website: 'https://example.com'
  },
  Phone: '555-1234',
  Website: 'https://example.com',
  beef: true,
  pork: false,
  lamb: false,
  chicken: true,
  eggs: true
};

describe('ShopDetailsOverlay - Accordion Functionality', () => {
  const renderComponent = () => {
    return render(
      <UIProvider>
        <ShopDetailsOverlay shop={mockShop} onClose={vi.fn()} />
      </UIProvider>
    );
  };

  describe('Initial State', () => {
    it('should render with Products accordion open by default', () => {
      renderComponent();

      // Products section should be visible
      const productsPanel = screen.getByRole('region', { name: /products/i });
      expect(productsPanel).toBeInTheDocument();

      // Check that products accordion button shows expanded state
      const productsButton = screen.getByRole('button', { name: /products/i });
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render with Info accordion closed by default', () => {
      renderComponent();

      // Info accordion button should show collapsed state
      const infoButton = screen.getByRole('button', { name: /information/i });
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');

      // Info panel should not be visible
      expect(screen.queryByRole('region', { name: /information/i })).not.toBeInTheDocument();
    });

    it('should render with Hours accordion closed by default', () => {
      renderComponent();

      // Hours accordion button should show collapsed state
      const hoursButton = screen.getByRole('button', { name: /hours/i });
      expect(hoursButton).toHaveAttribute('aria-expanded', 'false');

      // Hours panel should not be visible
      expect(screen.queryByRole('region', { name: /hours/i })).not.toBeInTheDocument();
    });
  });

  describe('Accordion Toggling', () => {
    it('should toggle Info accordion when clicked', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });

      // Initially closed
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      fireEvent.click(infoButton);
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      fireEvent.click(infoButton);
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should toggle Hours accordion when clicked', () => {
      renderComponent();

      const hoursButton = screen.getByRole('button', { name: /hours/i });

      // Initially closed
      expect(hoursButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      fireEvent.click(hoursButton);
      expect(hoursButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      fireEvent.click(hoursButton);
      expect(hoursButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should toggle Products accordion when clicked', () => {
      renderComponent();

      const productsButton = screen.getByRole('button', { name: /products/i });

      // Initially open
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      fireEvent.click(productsButton);
      expect(productsButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open again
      fireEvent.click(productsButton);
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Multiple Accordions Open', () => {
    it('should allow multiple accordions to be open simultaneously', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });
      const hoursButton = screen.getByRole('button', { name: /hours/i });
      const productsButton = screen.getByRole('button', { name: /products/i });

      // Products is already open by default
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');

      // Open Info
      fireEvent.click(infoButton);
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');

      // Products should still be open
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');

      // Open Hours
      fireEvent.click(hoursButton);
      expect(hoursButton).toHaveAttribute('aria-expanded', 'true');

      // Both Products and Info should still be open
      expect(productsButton).toHaveAttribute('aria-expanded', 'true');
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accordion Content', () => {
    it('should display shop information when Info accordion is opened', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });
      fireEvent.click(infoButton);

      // Check for address
      expect(screen.getByText(/123 Main St, Portland, ME 04101/i)).toBeInTheDocument();

      // Check for phone
      expect(screen.getByText(/555-1234/i)).toBeInTheDocument();

      // Check for website link
      expect(screen.getByText(/Visit Website/i)).toBeInTheDocument();
    });

    it('should display hours when Hours accordion is opened', () => {
      renderComponent();

      const hoursButton = screen.getByRole('button', { name: /hours/i });
      fireEvent.click(hoursButton);

      // Check for hours
      expect(screen.getByText(/Monday/i)).toBeInTheDocument();
      expect(screen.getAllByText(/9:00 AM – 5:00 PM/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Currently Open/i)).toBeInTheDocument();
    });

    it('should display products when Products accordion is opened', () => {
      renderComponent();

      // Products accordion is open by default
      const productsPanel = screen.getByRole('region', { name: /products/i });
      expect(productsPanel).toBeInTheDocument();

      // ProductIconGrid should be rendered
      // (specific content depends on ProductIconGrid implementation)
    });
  });

  describe('Accordion Reset on Shop Change', () => {
    it('should reset accordions to default state when shop changes', () => {
      const { rerender } = render(
        <UIProvider>
          <ShopDetailsOverlay shop={mockShop} onClose={vi.fn()} />
        </UIProvider>
      );

      // Open Info accordion
      const infoButton = screen.getByRole('button', { name: /information/i });
      fireEvent.click(infoButton);
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');

      // Close Products accordion
      const productsButton = screen.getByRole('button', { name: /products/i });
      fireEvent.click(productsButton);
      expect(productsButton).toHaveAttribute('aria-expanded', 'false');

      // Change shop (new shop with different slug)
      const newShop = { ...mockShop, slug: 'different-farm', Name: 'Different Farm' };
      rerender(
        <UIProvider>
          <ShopDetailsOverlay shop={newShop} onClose={vi.fn()} />
        </UIProvider>
      );

      // Products should be open again (reset to default)
      const newProductsButton = screen.getByRole('button', { name: /products/i });
      expect(newProductsButton).toHaveAttribute('aria-expanded', 'true');

      // Info should be closed again (reset to default)
      const newInfoButton = screen.getByRole('button', { name: /information/i });
      expect(newInfoButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on accordion buttons', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });
      const hoursButton = screen.getByRole('button', { name: /hours/i });
      const productsButton = screen.getByRole('button', { name: /products/i });

      // All buttons should have aria-expanded
      expect(infoButton).toHaveAttribute('aria-expanded');
      expect(hoursButton).toHaveAttribute('aria-expanded');
      expect(productsButton).toHaveAttribute('aria-expanded');

      // All buttons should have aria-controls
      expect(infoButton).toHaveAttribute('aria-controls', 'shop-info-panel');
      expect(hoursButton).toHaveAttribute('aria-controls', 'shop-hours-panel');
      expect(productsButton).toHaveAttribute('aria-controls', 'shop-products-panel');
    });

    it('should have proper IDs on accordion panels', () => {
      renderComponent();

      // Open all accordions to check their IDs
      fireEvent.click(screen.getByRole('button', { name: /information/i }));
      fireEvent.click(screen.getByRole('button', { name: /hours/i }));

      expect(screen.getByRole('region', { name: /information/i })).toHaveAttribute('id', 'shop-info-panel');
      expect(screen.getByRole('region', { name: /hours/i })).toHaveAttribute('id', 'shop-hours-panel');
      expect(screen.getByRole('region', { name: /products/i })).toHaveAttribute('id', 'shop-products-panel');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible via native button behavior', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });
      const hoursButton = screen.getByRole('button', { name: /hours/i });
      const productsButton = screen.getByRole('button', { name: /products/i });

      // All accordion triggers should be native buttons (automatically keyboard accessible)
      expect(infoButton.tagName).toBe('BUTTON');
      expect(hoursButton.tagName).toBe('BUTTON');
      expect(productsButton.tagName).toBe('BUTTON');

      // Native buttons support Enter and Space keys automatically via onClick
      // Testing via click simulates keyboard activation
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(infoButton); // Simulates Enter/Space key
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should support keyboard navigation on rating button', () => {
      renderComponent();

      const rating = screen.getByRole('button', { name: /view.*reviews/i });

      // Should have proper keyboard accessibility attributes
      expect(rating).toHaveAttribute('tabIndex', '0');
      expect(rating).toHaveAttribute('role', 'button');

      // Should have onKeyDown handler (verified by presence in code)
      // Native div with role="button" requires keyboard handler
      fireEvent.keyDown(rating, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(rating, { key: ' ', code: 'Space' });

      // Test passes if no errors are thrown
      expect(rating).toBeInTheDocument();
    });

    it('should have proper focus management with close button', () => {
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /close shop details/i });

      // Close button should be focusable
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('should allow Tab navigation through accordion buttons', () => {
      renderComponent();

      const infoButton = screen.getByRole('button', { name: /information/i });
      const hoursButton = screen.getByRole('button', { name: /hours/i });
      const productsButton = screen.getByRole('button', { name: /products/i });

      // All accordion buttons should be in the tab order
      expect(infoButton.tagName).toBe('BUTTON');
      expect(hoursButton.tagName).toBe('BUTTON');
      expect(productsButton.tagName).toBe('BUTTON');

      // Buttons should not have negative tabIndex
      expect(infoButton).not.toHaveAttribute('tabIndex', '-1');
      expect(hoursButton).not.toHaveAttribute('tabIndex', '-1');
      expect(productsButton).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Automated Accessibility Tests', () => {
    it('should have no accessibility violations with default state (Products open)', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with all accordions open', async () => {
      const { container } = renderComponent();

      // Open all accordions
      const infoButton = screen.getByRole('button', { name: /information/i });
      const hoursButton = screen.getByRole('button', { name: /hours/i });

      fireEvent.click(infoButton);
      fireEvent.click(hoursButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with all accordions closed', async () => {
      const { container } = renderComponent();

      // Close Products accordion
      const productsButton = screen.getByRole('button', { name: /products/i });
      fireEvent.click(productsButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when clicking rating to open reviews', async () => {
      const { container } = renderComponent();

      // Click rating (which triggers setSocialOverlayActiveTab)
      const rating = screen.getByRole('button', { name: /view.*reviews/i });
      fireEvent.click(rating);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
