// src/components/UI/OptimizedImage.tsx
import React, { useState, useEffect, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  // Priority hint for LCP optimization
  priority?: boolean;
}

/**
 * OptimizedImage component that automatically serves WebP with fallback
 *
 * Features:
 * - Automatic WebP conversion (handled by Vite build)
 * - Fallback to original format if WebP fails or isn't supported
 * - Lazy loading by default
 * - Error handling with fallback image
 * - Accessibility support
 *
 * Usage:
 * <OptimizedImage
 *   src="/images/example.jpg"
 *   alt="Description"
 *   width={400}
 *   height={300}
 * />
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/Flag_of_Maine.svg',
  width,
  height,
  className = '',
  loading = 'lazy',
  onError,
  priority = false,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  // Check WebP support on mount
  useEffect(() => {
    const checkWebPSupport = async () => {
      const webP = new Image();
      webP.onload = webP.onerror = function() {
        setSupportsWebP(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };

    checkWebPSupport();
  }, []);

  // Generate WebP source path
  const getWebPSrc = (originalSrc: string): string => {
    // Don't convert SVG or already WebP images
    if (originalSrc.endsWith('.svg') || originalSrc.endsWith('.webp')) {
      return originalSrc;
    }
    // Replace extension with .webp
    return originalSrc.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Try fallback image
      if (imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
      // Call parent error handler
      if (onError) {
        onError();
      }
    }
  };

  // For browsers that support WebP and the picture element
  if (supportsWebP !== false && !src.endsWith('.svg')) {
    return (
      <picture>
        {/* WebP source */}
        <source
          type="image/webp"
          srcSet={getWebPSrc(src)}
        />
        {/* Original format fallback */}
        <source
          type={
            src.endsWith('.png') ? 'image/png' :
            src.endsWith('.gif') ? 'image/gif' :
            'image/jpeg'
          }
          srcSet={src}
        />
        {/* Actual img element with fallback */}
        <img
          src={hasError ? fallbackSrc : imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading={priority ? 'eager' : loading}
          onError={handleError}
          // Priority hint for LCP optimization
          {...(priority && { fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
          {...rest}
        />
      </picture>
    );
  }

  // Fallback for browsers that don't support WebP or picture element
  return (
    <img
      src={hasError ? fallbackSrc : imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : loading}
      onError={handleError}
      {...(priority && { fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
      {...rest}
    />
  );
};

export default OptimizedImage;