// src/components/UI/ShopPhotoCarousel.tsx
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Shop, PlacePhoto } from '../../types';
import { CAROUSEL_SWIPE, MOBILE_ANIMATION } from '../../config/mobile';

interface ShopPhotoCarouselProps {
  shop: Shop;
  /** Height of the carousel in pixels */
  height?: number;
  /** Maximum number of photos to show (default: 5) */
  maxPhotos?: number;
  /** Photo size for API request (default: 400) */
  photoSize?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when photo changes */
  onPhotoChange?: (index: number) => void;
  /** Mark as priority for LCP optimization */
  priority?: boolean;
}

/**
 * Get photo URL for a given photo reference
 */
function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `/api/photo?photo_reference=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
}

/**
 * Get placeholder gradient based on shop type
 */
function getPlaceholderGradient(shopType: string): string {
  const gradients: Record<string, string> = {
    farm_stand: 'from-green-400 to-emerald-600',
    cheese_shop: 'from-amber-400 to-yellow-600',
    fish_monger: 'from-blue-400 to-cyan-600',
    butcher: 'from-red-400 to-rose-600',
    antique_shop: 'from-amber-700 to-stone-600',
    brewery: 'from-amber-500 to-orange-700',
    winery: 'from-purple-400 to-rose-600',
    sugar_shack: 'from-amber-600 to-amber-800',
  };
  return gradients[shopType] || 'from-gray-400 to-gray-600';
}

/**
 * Get icon for shop type (shown on placeholder)
 */
function getShopTypeIcon(shopType: string): string {
  const icons: Record<string, string> = {
    farm_stand: '🌽',
    cheese_shop: '🧀',
    fish_monger: '🐟',
    butcher: '🥩',
    antique_shop: '🏺',
    brewery: '🍺',
    winery: '🍷',
    sugar_shack: '🍁',
  };
  return icons[shopType] || '📍';
}

/**
 * ShopPhotoCarousel Component
 *
 * Swipeable photo carousel for shop cards.
 * Uses touch gestures for mobile-native feel.
 *
 * Features:
 * - Horizontal swipe with snap-to-photo
 * - Dot indicators for current position
 * - Lazy loading of off-screen photos
 * - Graceful placeholder when no photos
 * - Preloads adjacent photos for smooth transitions
 *
 * Performance:
 * - Only loads photos within 1 position of current
 * - Uses CSS transform for 60fps animations
 * - Prevents event bubbling to parent carousel
 */
const ShopPhotoCarousel: React.FC<ShopPhotoCarouselProps> = ({
  shop,
  height = 160,
  maxPhotos = 5,
  photoSize = 400,
  className = '',
  onPhotoChange,
  priority = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState<Set<number>>(new Set([0]));

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Get photos from shop data
  const photos: PlacePhoto[] = useMemo(() => {
    const allPhotos = shop.placeDetails?.photos || [];
    return allPhotos.slice(0, maxPhotos);
  }, [shop.placeDetails?.photos, maxPhotos]);

  const hasPhotos = photos.length > 0;
  const photoCount = photos.length;

  // Preload adjacent photos
  useEffect(() => {
    if (!hasPhotos) return;

    const toLoad = new Set(loadedPhotos);
    // Load current and adjacent
    toLoad.add(currentIndex);
    if (currentIndex > 0) toLoad.add(currentIndex - 1);
    if (currentIndex < photoCount - 1) toLoad.add(currentIndex + 1);

    if (toLoad.size !== loadedPhotos.size) {
      setLoadedPhotos(toLoad);
    }
  }, [currentIndex, hasPhotos, photoCount, loadedPhotos]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!hasPhotos || photoCount <= 1) return;

    // Stop propagation to prevent parent carousel from handling
    e.stopPropagation();

    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startTranslateRef.current = translateX;
    lastXRef.current = touch.clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    setIsDragging(true);
  }, [hasPhotos, photoCount, translateX]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !hasPhotos) return;

    e.stopPropagation();

    const touch = e.touches[0];
    const now = Date.now();
    const deltaX = touch.clientX - startXRef.current;

    // Calculate velocity
    const timeDelta = now - lastTimeRef.current;
    if (timeDelta > 0) {
      velocityRef.current = (touch.clientX - lastXRef.current) / timeDelta * 1000;
    }
    lastXRef.current = touch.clientX;
    lastTimeRef.current = now;

    // Calculate new translate with rubber-band effect at edges
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxTranslate = 0;
    const minTranslate = -containerWidth * (photoCount - 1);

    let newTranslate = startTranslateRef.current + deltaX;

    // Rubber band effect at edges
    if (newTranslate > maxTranslate) {
      const overscroll = newTranslate - maxTranslate;
      newTranslate = maxTranslate + overscroll * 0.3;
    } else if (newTranslate < minTranslate) {
      const overscroll = minTranslate - newTranslate;
      newTranslate = minTranslate - overscroll * 0.3;
    }

    setTranslateX(newTranslate);
  }, [isDragging, hasPhotos, photoCount]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !hasPhotos) return;

    e.stopPropagation();
    setIsDragging(false);

    const containerWidth = containerRef.current?.offsetWidth || 0;
    if (containerWidth === 0) return;

    // Determine target index based on position and velocity
    const velocity = velocityRef.current;
    const velocityThreshold = CAROUSEL_SWIPE.MIN_SWIPE_VELOCITY;

    let targetIndex = currentIndex;

    // Velocity-based navigation
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (velocity < 0 && currentIndex < photoCount - 1) {
        targetIndex = currentIndex + 1;
      }
    } else {
      // Position-based snap
      const currentPosition = -translateX / containerWidth;
      targetIndex = Math.round(currentPosition);
      targetIndex = Math.max(0, Math.min(photoCount - 1, targetIndex));
    }

    // Snap to target
    setCurrentIndex(targetIndex);
    setTranslateX(-targetIndex * containerWidth);

    if (onPhotoChange && targetIndex !== currentIndex) {
      onPhotoChange(targetIndex);
    }
  }, [isDragging, hasPhotos, currentIndex, photoCount, translateX, onPhotoChange]);

  // Update translate when container resizes
  useEffect(() => {
    const updateTranslate = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      setTranslateX(-currentIndex * containerWidth);
    };

    updateTranslate();
    window.addEventListener('resize', updateTranslate);
    return () => window.removeEventListener('resize', updateTranslate);
  }, [currentIndex]);

  // Navigate to specific photo (for dot indicators)
  const goToPhoto = useCallback((index: number) => {
    if (index < 0 || index >= photoCount) return;

    const containerWidth = containerRef.current?.offsetWidth || 0;
    setCurrentIndex(index);
    setTranslateX(-index * containerWidth);

    if (onPhotoChange && index !== currentIndex) {
      onPhotoChange(index);
    }
  }, [photoCount, currentIndex, onPhotoChange]);

  // Render placeholder when no photos
  if (!hasPhotos) {
    const gradient = getPlaceholderGradient(shop.type);
    const icon = getShopTypeIcon(shop.type);

    return (
      <div
        id={`shop-photo-carousel-placeholder-${shop.slug || shop.GoogleProfileID}`}
        className={`shop-photo-carousel relative overflow-hidden rounded-t-xl ${className}`}
        style={{ height }}
        role="img"
        aria-label={`${shop.Name} placeholder`}
      >
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <span className="text-4xl opacity-80" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`shop-photo-carousel-${shop.slug || shop.GoogleProfileID}`}
      ref={containerRef}
      className={`shop-photo-carousel relative overflow-hidden rounded-t-xl ${className}`}
      style={{ height }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${shop.Name} photos`}
    >
      {/* Photo track */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : MOBILE_ANIMATION.TRANSFORM_TRANSITION,
        }}
      >
        {photos.map((photo, index) => {
          const shouldLoad = loadedPhotos.has(index);
          const photoUrl = shouldLoad ? getPhotoUrl(photo.photo_reference, photoSize) : '';

          return (
            <div
              key={photo.photo_reference}
              className="flex-shrink-0 w-full h-full bg-gray-200 dark:bg-gray-700"
              role="group"
              aria-roledescription="slide"
              aria-label={`Photo ${index + 1} of ${photoCount}`}
            >
              {shouldLoad ? (
                <img
                  src={photoUrl}
                  alt={`Photo ${index + 1} of ${shop.Name}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={priority && index === 0 ? 'high' : undefined}
                  onError={(e) => {
                    // Show placeholder gradient on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add(
                      'bg-gradient-to-br',
                      ...getPlaceholderGradient(shop.type).split(' ')
                    );
                  }}
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      {photoCount > 1 && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10"
          role="tablist"
          aria-label="Photo navigation"
        >
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToPhoto(index);
              }}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'
                }
              `}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to photo ${index + 1}`}
              tabIndex={index === currentIndex ? 0 : -1}
            />
          ))}
        </div>
      )}

      {/* Photo count badge (top right) */}
      {photoCount > 1 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {currentIndex + 1}/{photoCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default ShopPhotoCarousel;
