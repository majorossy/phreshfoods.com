// src/components/UI/ProductIconsDisplay.tsx
import React from 'react';
import { Shop } from '../../types'; // Adjust path as needed
import { PRODUCT_ICONS_CONFIG, CATEGORY_DISPLAY_ORDER } from '../../config/appConfig.ts'; // Adjust path
import { escapeHTMLSafe } from '../../utils'; // Adjust path

interface ProductIconsDisplayProps {
  shop: Shop | null;
}

const ProductIconsDisplay: React.FC<ProductIconsDisplayProps> = ({ shop }) => {
  if (!shop) {
    return <p id="product-data-unavailable" className="text-sm text-gray-500 text-center p-2 col-span-full">Product data unavailable.</p>;
  }

  // Group products by category based on PRODUCT_ICONS_CONFIG
  const productsByCategory: { [category: string]: Array<typeof PRODUCT_ICONS_CONFIG[string] & { key: string }> } = {};

  for (const key in PRODUCT_ICONS_CONFIG) {
    // eslint-disable-next-line no-prototype-builtins
    if (PRODUCT_ICONS_CONFIG.hasOwnProperty(key)) {
      const config = PRODUCT_ICONS_CONFIG[key];
      if (!config || typeof config.category !== 'string' || !config.name || !config.csvHeader) {
        continue;
      }
      const category = config.category;
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push({ key, ...config });
    }
  }

  let atLeastOneCategoryRendered = false;

  return (
    <div id="product-icons-display" className="space-y-4">
      {CATEGORY_DISPLAY_ORDER.map(categoryName => {
        const productsInThisCategory = productsByCategory[categoryName];

        if (productsInThisCategory && productsInThisCategory.length > 0) {
          atLeastOneCategoryRendered = true;
          return (
            <div key={categoryName} id={`product-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`} className="category-section">
              <h4 id={`product-category-heading-${categoryName.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-semibold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">
                {escapeHTMLSafe(categoryName)}
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-3"> {/* Adjusted md cols */}
                {productsInThisCategory.map(prodConfig => {
                  // The key for accessing availability in the shop object is prodConfig.csvHeader
                  // e.g., if prodConfig.csvHeader is "beef", we check shop['beef']
                  const productKeyInShop = prodConfig.csvHeader as keyof Shop;
                  const isAvailable = shop[productKeyInShop] === true;

                  const iconFileToUse = isAvailable
                    ? prodConfig.icon_available
                    : prodConfig.icon_unavailable;
                  
                  const itemClasses = `product-icon-item flex flex-col items-center text-center p-1 rounded-md transition-opacity duration-200 ${
                    isAvailable ? 'opacity-100 hover:bg-gray-100' : 'opacity-40'
                  }`;
                  const altText = `${escapeHTMLSafe(prodConfig.name)}${isAvailable ? '' : ' (not available)'}`;

                  return (
                    <div key={prodConfig.key} id={`product-item-${prodConfig.key}`} className={itemClasses} title={altText}>
                    <img
                      src={`/images/icons/${iconFileToUse}`}
                      alt={altText}
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover mb-0.5" // Smaller + object-cover
                      loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none'; // Hide broken image
                          // Optionally, replace with a placeholder or text
                          const parent = target.parentElement;
                          if (parent) {
                            const errorText = document.createElement('span');
                            errorText.className = 'text-xs text-red-500';
                            errorText.textContent = 'Img err';
                            parent.appendChild(errorText);
                          }
                        }}
                      />
                    <span id={`product-name-${prodConfig.key}`} className="text-[0.65rem] sm:text-[0.7rem] font-medium text-gray-600 leading-tight"> {/* Slightly smaller text too */}
                      {escapeHTMLSafe(prodConfig.name)}
                    </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null; // No products in this category or category not found
      })}
      {!atLeastOneCategoryRendered && (
        <p id="no-product-categories" className="text-sm text-gray-500 text-center p-2">No product categories configured for display.</p>
      )}
    </div>
  );
};

export default ProductIconsDisplay;