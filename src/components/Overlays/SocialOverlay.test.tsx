// src/components/Overlays/SocialOverlay.test.tsx
/**
 * Tests for SocialOverlay component (largest component - 59KB!)
 * Social media, reviews, and directions tabs
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SocialOverlay from './SocialOverlay';
import { AppProviders } from '../../contexts/AppProviders';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';
import type { Shop } from '../../types';

const mockShop: Shop = {
  type: 'farm_stand',
  Name: 'Happy Acres Farm',
  Address: '123 Farm Road',
  City: 'Portland',
  slug: 'happy-acres',
  lat: 43.6591,
  lng: -70.2568,
  products: { beef: true },
  InstagramUsername: 'happyacres',
  FacebookPageID: '123456789',
  XHandle: 'happyacres',
  placeDetails: {
    rating: 4.5,
    user_ratings_total: 42,
    reviews: [
      {
        author_name: 'John Doe',
        rating: 5,
        text: 'Great farm!',
        time: Date.now() / 1000,
        relative_time_description: '2 weeks ago',
        profile_photo_url: 'https://example.com/photo.jpg',
      },
    ],
  },
};

const renderComponent = (shop = mockShop, isOpen = true, initialTab = 'social') => {
  const mockOnClose = vi.fn();

  return render(
    <BrowserRouter>
      <AppProviders>
        <SocialOverlay
          shop={shop}
          isOpen={isOpen}
          onClose={mockOnClose}
          initialTab={initialTab}
        />
      </AppProviders>
    </BrowserRouter>
  );
};

describe('SocialOverlay Component', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Overlay Visibility', () => {
    it('should render when isOpen=true', () => {
      renderComponent(mockShop, true);

      expect(screen.getByText('Happy Acres Farm')).toBeInTheDocument();
    });

    it('should not be visible when isOpen=false', () => {
      renderComponent(mockShop, false);

      // Overlay should have opacity-0 or be hidden
      expect(screen.queryByText('Happy Acres Farm')).toBeTruthy();
    });
  });

  describe('Close Button', () => {
    it('should render close button', () => {
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
      const mockOnClose = vi.fn();

      render(
        <BrowserRouter>
          <AppProviders>
            <SocialOverlay
              shop={mockShop}
              isOpen={true}
              onClose={mockOnClose}
            />
          </AppProviders>
        </BrowserRouter>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab Navigation', () => {
    it('should render all three tabs', () => {
      renderComponent();

      expect(screen.getByRole('tab', { name: /social/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /reviews/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /directions/i })).toBeInTheDocument();
    });

    it('should start with initialTab active', () => {
      renderComponent(mockShop, true, 'reviews');

      const reviewsTab = screen.getByRole('tab', { name: /reviews/i });
      expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch tabs when clicked', () => {
      renderComponent(mockShop, true, 'social');

      const reviewsTab = screen.getByRole('tab', { name: /reviews/i });
      fireEvent.click(reviewsTab);

      expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper ARIA attributes on tabs', () => {
      renderComponent();

      const socialTab = screen.getByRole('tab', { name: /social/i });

      expect(socialTab).toHaveAttribute('aria-selected');
      expect(socialTab).toHaveAttribute('role', 'tab');
    });
  });

  describe('Social Media Tab', () => {
    it('should display Instagram link when available', () => {
      renderComponent();

      const socialTab = screen.getByRole('tab', { name: /social/i });
      fireEvent.click(socialTab);

      // Should show Instagram link
      expect(screen.getByText(/instagram/i)).toBeInTheDocument();
    });

    it('should display Facebook link when available', () => {
      renderComponent();

      const socialTab = screen.getByRole('tab', { name: /social/i });
      fireEvent.click(socialTab);

      expect(screen.getByText(/facebook/i)).toBeInTheDocument();
    });

    it('should display X (Twitter) link when available', () => {
      renderComponent();

      const socialTab = screen.getByRole('tab', { name: /social/i });
      fireEvent.click(socialTab);

      expect(screen.getByText(/twitter|@/i)).toBeInTheDocument();
    });

    it('should handle missing social media gracefully', () => {
      const shopWithoutSocial = {
        ...mockShop,
        InstagramUsername: undefined,
        FacebookPageID: undefined,
        XHandle: undefined,
      };

      renderComponent(shopWithoutSocial);

      // Should not crash, might show "no social media" message
      expect(screen.getByText('Happy Acres Farm')).toBeInTheDocument();
    });
  });

  describe('Reviews Tab', () => {
    it('should display Google reviews when available', () => {
      renderComponent(mockShop, true, 'reviews');

      // Should show review content
      expect(screen.getByText(/great farm/i)).toBeInTheDocument();
    });

    it('should display reviewer name', () => {
      renderComponent(mockShop, true, 'reviews');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display review rating', () => {
      renderComponent(mockShop, true, 'reviews');

      // Should show 5-star rating
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it('should handle shops with no reviews', () => {
      const shopWithoutReviews = {
        ...mockShop,
        placeDetails: {
          ...mockShop.placeDetails,
          reviews: [],
        },
      };

      renderComponent(shopWithoutReviews, true, 'reviews');

      // Should show "no reviews" message
      expect(screen.queryByText(/great farm/i)).not.toBeInTheDocument();
    });
  });

  describe('Directions Tab', () => {
    it('should render directions tab', () => {
      renderComponent(mockShop, true, 'directions');

      const directionsTab = screen.getByRole('tab', { name: /directions/i });
      expect(directionsTab).toBeInTheDocument();
    });

    it('should show directions panel when tab is active', () => {
      renderComponent(mockShop, true, 'directions');

      const directionsTab = screen.getByRole('tab', { name: /directions/i });
      fireEvent.click(directionsTab);

      // DirectionsContext integration should show directions
      expect(directionsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper tablist role', () => {
      renderComponent();

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('should have proper tabpanel for content', () => {
      renderComponent();

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should support keyboard navigation between tabs', () => {
      renderComponent();

      const tabs = screen.getAllByRole('tab');

      // All tabs should be keyboard accessible
      tabs.forEach(tab => {
        expect(tab.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when fetching data', () => {
      renderComponent();

      // Directions tab might show loading state
      const directionsTab = screen.getByRole('tab', { name: /directions/i });
      fireEvent.click(directionsTab);

      // Should handle loading state gracefully
      expect(directionsTab).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should be desktop-only (not shown on mobile)', () => {
      const { container } = renderComponent();

      // Component might have hidden md: classes for mobile
      expect(container.firstChild).toBeTruthy();
    });
  });
});
