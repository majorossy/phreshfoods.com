// src/components/UI/ProductPreview.tsx
import React, { useMemo } from 'react';
import type { Shop, LocationType } from '../../types';
import { getProductConfig, getCategoryDisplayOrder } from '../../config/productRegistry';
import type { ProductConfig } from '../../config/products';

/**
 * Product item for preview display
 */
export interface ProductItem {
  key: string;
  name: string;
  icon: string;
  category: string;
}

interface ProductPreviewProps {
  shop: Shop;
  /** Maximum number of product icons to show (default: 5) */
  maxProducts?: number;
  /** Size of icons in pixels (default: 24) */
  iconSize?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get available products from a shop, prioritized by category diversity
 *
 * Strategy:
 * 1. Get all available products
 * 2. Group by category
 * 3. Take 1-2 from each category to show variety
 * 4. Return up to maxProducts
 */
export function getPreviewProducts(shop: Shop, maxProducts: number = 5): ProductItem[] {
  const productConfig = getProductConfig(shop.type as LocationType);
  const categoryOrder = getCategoryDisplayOrder(shop.type as LocationType);

  // Get all available products
  const availableProducts: ProductItem[] = [];

  Object.entries(productConfig).forEach(([key, config]: [string, ProductConfig]) => {
    // Check if product is available on this shop
    // Products are stored directly on shop or in shop.products
    const isAvailable = (shop as any)[key] === true ||
                        (shop as any).products?.[key] === true;

    if (isAvailable) {
      availableProducts.push({
        key,
        name: config.name,
        icon: config.icon_available,
        category: config.category,
      });
    }
  });

  // If no products, return empty
  if (availableProducts.length === 0) {
    return [];
  }

  // Group by category
  const byCategory: Record<string, ProductItem[]> = {};
  availableProducts.forEach(product => {
    if (!byCategory[product.category]) {
      byCategory[product.category] = [];
    }
    byCategory[product.category].push(product);
  });

  // Select products ensuring category diversity
  const selected: ProductItem[] = [];
  const categoriesWithProducts = categoryOrder.filter(cat => byCategory[cat]?.length > 0);

  // First pass: take 1 from each category
  for (const category of categoriesWithProducts) {
    if (selected.length >= maxProducts) break;
    const products = byCategory[category];
    if (products.length > 0) {
      selected.push(products[0]);
    }
  }

  // Second pass: take more if needed and available
  if (selected.length < maxProducts) {
    for (const category of categoriesWithProducts) {
      if (selected.length >= maxProducts) break;
      const products = byCategory[category];
      for (let i = 1; i < products.length && selected.length < maxProducts; i++) {
        selected.push(products[i]);
      }
    }
  }

  return selected;
}

/**
 * Count total available products for a shop
 */
export function countAvailableProducts(shop: Shop): number {
  const productConfig = getProductConfig(shop.type as LocationType);
  let count = 0;

  Object.keys(productConfig).forEach(key => {
    const isAvailable = (shop as any)[key] === true ||
                        (shop as any).products?.[key] === true;
    if (isAvailable) count++;
  });

  return count;
}

/**
 * ProductPreview Component
 *
 * Shows a compact row of product icons with "+N more" pill.
 * Icons are 24x24 by default for compact display.
 *
 * Features:
 * - Shows diverse products across categories
 * - Fallback gracefully if no icon image
 * - "+N more" pill shows total count
 */
const ProductPreview: React.FC<ProductPreviewProps> = ({
  shop,
  maxProducts = 5,
  iconSize = 24,
  className = '',
}) => {
  const previewProducts = useMemo(
    () => getPreviewProducts(shop, maxProducts),
    [shop, maxProducts]
  );

  const totalProducts = useMemo(
    () => countAvailableProducts(shop),
    [shop]
  );

  // Don't render if no products
  if (previewProducts.length === 0) {
    return null;
  }

  const moreCount = totalProducts - previewProducts.length;

  return (
    <div
      id={`product-preview-${shop.slug || shop.GoogleProfileID}`}
      className={`product-preview flex items-center gap-1.5 ${className}`}
      role="list"
      aria-label="Available products"
    >
      {previewProducts.map((product, index) => (
        <div
          key={product.key}
          className="product-preview__icon flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700"
          style={{
            width: iconSize,
            height: iconSize,
            animationDelay: `${index * 50}ms`,
          }}
          role="listitem"
          title={product.name}
        >
          <img
            src={`/images/icons/${product.icon}`}
            alt={product.name}
            width={iconSize}
            height={iconSize}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}

      {/* "+N more" pill */}
      {moreCount > 0 && (
        <span
          className="product-preview__more text-[11px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap"
          aria-label={`${moreCount} more products available`}
        >
          +{moreCount}
        </span>
      )}
    </div>
  );
};

export default ProductPreview;
