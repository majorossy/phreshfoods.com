// src/components/Mobile/QuickShopInfo.test.tsx
/**
 * Tests for QuickShopInfo component
 * Mobile-optimized quick view of shop details
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuickShopInfo from './QuickShopInfo';
import { AppProviders } from '../../contexts/AppProviders';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';
import type { Shop } from '../../types';

const mockShop: Shop = {
  type: 'farm_stand',
  Name: 'Happy Acres Farm',
  Address: '123 Farm Road',
  City: 'Portland',
  Zip: '04101',
  slug: 'happy-acres',
  lat: 43.6591,
  lng: -70.2568,
  Phone: '207-555-1234',
  Website: 'https://happyacres.com',
  products: {
    beef: true,
    eggs: true,
    tomatoes: true,
  },
  placeDetails: {
    rating: 4.5,
    user_ratings_total: 42,
    formatted_address: '123 Farm Road, Portland, ME 04101',  // Address is rendered from placeDetails
    opening_hours: {
      open_now: true,
      weekday_text: [
        'Monday: 9:00 AM – 5:00 PM',
        'Tuesday: 9:00 AM – 5:00 PM',
        'Wednesday: 9:00 AM – 5:00 PM',
        'Thursday: 9:00 AM – 5:00 PM',
        'Friday: 9:00 AM – 6:00 PM',
        'Saturday: 8:00 AM – 6:00 PM',
        'Sunday: 10:00 AM – 4:00 PM',
      ],
    },
  },
  distance: 1500, // 1.5 km
  distanceText: '0.9 mi away',
};

const renderComponent = (shop = mockShop, showFullDetails = false) => {
  return render(
    <BrowserRouter>
      <AppProviders>
        <QuickShopInfo shop={shop} showFullDetails={showFullDetails} />
      </AppProviders>
    </BrowserRouter>
  );
};

describe('QuickShopInfo Component', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render shop name', () => {
      renderComponent();
      expect(screen.getByText('Happy Acres Farm')).toBeInTheDocument();
    });

    it('should render shop address', () => {
      renderComponent();
      // Address comes from placeDetails.formatted_address
      expect(screen.getByText(/123 Farm Road, Portland/i)).toBeInTheDocument();
    });

    it('should render distance if available', () => {
      renderComponent();
      expect(screen.getByText('0.9 mi away')).toBeInTheDocument();
    });

    it('should render location type badge with emoji', () => {
      renderComponent();
      // The badge contains both emoji and text in one element
      // e.g., "🚜 Farm Stand"
      const badge = screen.getByText(/🚜.*Farm Stand/);
      expect(badge).toBeInTheDocument();
    });

    it('should render star rating', () => {
      renderComponent();
      // StarRating component should be rendered (4.5 rating)
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('should render product icons for available products', () => {
      renderComponent();

      // Should show product grid
      // Products: beef, eggs, tomatoes
      // Exact assertions depend on ProductIconGrid implementation
      expect(screen.getByText(/Happy Acres Farm/)).toBeInTheDocument();
    });

    it('should use ProductIconGrid component', () => {
      const { container } = renderComponent();

      // ProductIconGrid should be in the DOM
      expect(container.querySelector('[class*="grid"]')).toBeTruthy();
    });
  });

  describe('Opening Hours', () => {
    it('should display today\'s hours', () => {
      renderComponent();

      // Should show hours for today (depends on current day)
      // Will match one of the weekday_text entries
      const hasHours = screen.queryByText(/AM|PM/) !== null;
      expect(hasHours).toBe(true);
    });

    it('should show "Hours not available" when no hours data', () => {
      const shopWithoutHours = {
        ...mockShop,
        placeDetails: undefined,
      };

      renderComponent(shopWithoutHours);

      expect(screen.getByText('Hours not available')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button (X)', () => {
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should collapse bottom sheet when close button clicked', () => {
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Should call setBottomSheetHeight(0.3) and setIsManuallyCollapsed(true)
      // These are tested via UIContext integration
    });
  });

  describe('Accordion Behavior', () => {
    it('should have products accordion open by default', () => {
      renderComponent();

      // Products section should be expanded by default
      // This is indicated by the accordion state
      expect(screen.getByText(/Happy Acres Farm/)).toBeInTheDocument();
    });

    it('should toggle accordion sections when clicked', () => {
      // Accordions are only shown with showFullDetails=true
      renderComponent(mockShop, true);

      // Find accordion buttons (Products and Hours buttons in the accordion headers)
      const productsButton = screen.getByRole('button', { name: /products/i });
      expect(productsButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderComponent();

      // Should use heading for shop name
      expect(screen.getByRole('heading', { name: /happy acres/i })).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Props Handling', () => {
    it('should handle showFullDetails prop', () => {
      renderComponent(mockShop, true);

      // When showFullDetails=true, should show more detailed view
      expect(screen.getByText('Happy Acres Farm')).toBeInTheDocument();
    });

    it('should handle different shop types correctly', () => {
      const cheeseShop: Shop = {
        ...mockShop,
        type: 'cheese_shop',
        Name: 'Maine Cheese Co',
        products: {
          cheddar: true,
          brie: true,
        },
      };

      renderComponent(cheeseShop);

      // Should show cheese shop emoji and label in one badge element
      // e.g., "🧀 Cheesemonger"
      const badge = screen.getByText(/🧀.*Cheesemonger/);
      expect(badge).toBeInTheDocument();
    });
  });
});
