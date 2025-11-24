// src/components/UI/ProductIconGrid.tsx
import React, { useMemo } from 'react';
import { Shop, LocationType } from '../../types';
import { getProductConfig, getCategoryDisplayOrder } from '../../config/productRegistry';

interface ProductWithAvailability {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

interface ProductIconGridProps {
  shop?: Shop; // Optional for filter-selector mode
  displayMode: 'compact' | 'detailed' | 'filter-selector';
  maxProducts?: number;
  showCategories?: boolean;
  showProductNames?: boolean;
  showSummary?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
  // For filter-selector mode
  products?: Record<string, any>; // Product config to display
  locationType?: LocationType; // Location type to get category order
  activeFilters?: Record<string, boolean>; // Which products are filtered
  onProductClick?: (productId: string) => void; // Click handler for toggling
}

const ProductIconGrid: React.FC<ProductIconGridProps> = ({
  shop,
  displayMode,
  maxProducts,
  showCategories = false,
  showProductNames = false,
  showSummary = false,
  iconSize = 'md',
  products,
  locationType,
  activeFilters = {},
  onProductClick
}) => {
  // FILTER-SELECTOR MODE: Use provided products instead of shop data
  if (displayMode === 'filter-selector' && products) {
    const iconSizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };

    // Group products by category if showCategories is true
    if (showCategories && locationType) {
      const categoryOrder = getCategoryDisplayOrder(locationType);
      const productsByCategory: Record<string, Array<[string, any]>> = {};

      // Group products by category
      Object.entries(products).forEach(([productId, config]) => {
        const category = config.category || 'Other';
        if (!productsByCategory[category]) {
          productsByCategory[category] = [];
        }
        productsByCategory[category].push([productId, config]);
      });

      // Sort categories by display order
      const sortedCategories = [
        ...categoryOrder.filter(cat => productsByCategory[cat]),
        ...Object.keys(productsByCategory).filter(cat => !categoryOrder.includes(cat))
      ];

      return (
        <div className="p-3">
          {sortedCategories.map((category) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize border-b border-gray-200 pb-1">
                {category}
              </h3>
              <div className="grid grid-cols-6 gap-1.5">
                {productsByCategory[category].map(([productId, config]) => {
                  const isActive = !!activeFilters[productId];
                  const icon = isActive ? config.icon_available : config.icon_unavailable;

                  return (
                    <button
                      key={productId}
                      onClick={() => onProductClick?.(productId)}
                      className={`${iconSizeClasses[iconSize]} rounded overflow-hidden border-2 transition-all hover:scale-110 ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400 opacity-70'
                      }`}
                      title={`${config.name}${isActive ? ' (active filter)' : ' (click to filter)'}`}
                      aria-label={`${isActive ? 'Remove' : 'Add'} ${config.name} filter`}
                      aria-pressed={isActive}
                    >
                      <img
                        src={`/images/icons/${icon}`}
                        alt={config.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Simple grid without categories (fallback)
    return (
      <div className="p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {Object.entries(products).map(([productId, config]: [string, any]) => {
            const isActive = !!activeFilters[productId];
            const icon = isActive ? config.icon_available : config.icon_unavailable;

            return (
              <button
                key={productId}
                onClick={() => onProductClick?.(productId)}
                className={`${iconSizeClasses[iconSize]} rounded overflow-hidden border-2 transition-all hover:scale-110 ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400 opacity-70'
                }`}
                title={`${config.name}${isActive ? ' (active filter)' : ' (click to filter)'}`}
                aria-label={`${isActive ? 'Remove' : 'Add'} ${config.name} filter`}
                aria-pressed={isActive}
              >
                <img
                  src={`/images/icons/${icon}`}
                  alt={config.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Get config for shop type (for shop display modes)
  if (!shop) return null;
  const productConfig = getProductConfig(shop.type);
  const categoryOrder = getCategoryDisplayOrder(shop.type);

  // Build product list with availability - shows ALL products
  const allProducts = useMemo(() => {
    const products: Record<string, ProductWithAvailability[]> = {};

    for (const productId in productConfig) {
      const product = productConfig[productId];
      const category = product.category || 'Other';
      const isAvailable = shop.products?.[productId] === true;

      if (!products[category]) {
        products[category] = [];
      }

      products[category].push({
        id: productId,
        name: product.name,
        // KEY: Choose color icon if available, grey icon if not
        icon: isAvailable ? product.icon_available : product.icon_unavailable,
        available: isAvailable
      });
    }
    return products;
  }, [shop, productConfig]);

  // Flatten and optionally limit products for compact mode
  const flatProducts = useMemo(() => {
    let flat = Object.values(allProducts).flat();
    if (maxProducts && displayMode === 'compact') {
      flat = flat.slice(0, maxProducts);
    }
    return flat;
  }, [allProducts, maxProducts, displayMode]);

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  // Count available products
  const availableCount = flatProducts.filter(p => p.available).length;
  const totalCount = flatProducts.length;

  // COMPACT MODE - Simple icon grid for InfoWindow
  if (displayMode === 'compact') {
    // WITH CATEGORIES - Grouped display for InfoWindow
    if (showCategories) {
      const allCategorizedProducts = Object.values(allProducts).flat();
      const totalAvailableCount = allCategorizedProducts.filter(p => p.available).length;
      const grandTotalCount = allCategorizedProducts.length;

      return (
        <div className="p-2 pb-1 border-b border-gray-200">
          {showSummary && (
            <div className="mb-2 text-xs text-gray-600">
              {totalAvailableCount} of {grandTotalCount} available
            </div>
          )}
          {/* Render categories in order */}
          {[...categoryOrder, ...Object.keys(allProducts).filter(cat => !categoryOrder.includes(cat))]
            .filter(category => allProducts[category]?.length > 0)
            .map((category) => (
              <div key={category} className="mb-3 last:mb-0">
                <h4 className="text-xs font-semibold text-gray-700 mb-1.5 capitalize">
                  {category}
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {allProducts[category].map(product => (
                    <div
                      key={product.id}
                      className={`${iconSizeClasses[iconSize]} rounded overflow-hidden border ${
                        product.available ? 'border-gray-300' : 'border-gray-200 opacity-50'
                      }`}
                      title={product.name}
                    >
                      <img
                        src={`/images/icons/${product.icon}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      );
    }

    // WITHOUT CATEGORIES - Simple flat grid
    return (
      <div className="p-2 pb-1 border-b border-gray-200">
        {showSummary && (
          <div className="mb-2 text-xs text-gray-600">
            {availableCount} of {totalCount} available
          </div>
        )}
        <div className="grid grid-cols-6 gap-1">
          {flatProducts.map(product => (
            <div
              key={product.id}
              className={`${iconSizeClasses[iconSize]} rounded overflow-hidden border ${
                product.available ? 'border-gray-300' : 'border-gray-200 opacity-50'
              }`}
              title={product.name}
            >
              <img
                src={`/images/icons/${product.icon}`}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DETAILED MODE - Category organized for overlay
  const allCategorizedProducts = Object.values(allProducts).flat();
  const totalAvailableCount = allCategorizedProducts.filter(p => p.available).length;
  const grandTotalCount = allCategorizedProducts.length;

  return (
    <>
      {showSummary && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {totalAvailableCount}
            </span>
            {' '}available of{' '}
            <span className="font-semibold">{grandTotalCount}</span>
            {' '}total products
          </p>
        </div>
      )}

      {showCategories ? (
        <div className="space-y-2.5">
          {[...categoryOrder, ...Object.keys(allProducts).filter(cat => !categoryOrder.includes(cat))]
            .filter(category => allProducts[category]?.length > 0)
            .map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 capitalize border-b border-gray-200 dark:border-gray-700 pb-0.5">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {allProducts[category].map(product => (
                    <div
                      key={product.id}
                      className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs transition-all ${
                        product.available
                          ? 'bg-gray-100 dark:bg-gray-700 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                      }`}
                    >
                      <img
                        src={`/images/icons/${product.icon}`}
                        alt={`${product.name} - ${product.available ? 'Available' : 'Not available'}`}
                        className={`${iconSizeClasses[iconSize]} object-contain`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {showProductNames && (
                        <span className={product.available ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-500'}>
                          {product.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {flatProducts.map(product => (
            <div
              key={product.id}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs transition-all ${
                product.available
                  ? 'bg-gray-100 dark:bg-gray-700 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 opacity-50'
              }`}
            >
              <img
                src={`/images/icons/${product.icon}`}
                alt={`${product.name} - ${product.available ? 'Available' : 'Not available'}`}
                className={`${iconSizeClasses[iconSize]} object-contain`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {showProductNames && (
                <span className={product.available ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-500'}>
                  {product.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ProductIconGrid;
