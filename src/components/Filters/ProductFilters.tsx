// src/components/Filters/ProductFilters.tsx
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { PRODUCT_ICONS_CONFIG, CATEGORY_DISPLAY_ORDER } from '../../config/appConfig';

const ProductFilters: React.FC = () => {
  const appContext = useContext(AppContext);

  if (!appContext) {
    return <div className="p-2 text-sm text-gray-500">Loading filters...</div>;
  }

  const { activeProductFilters, setActiveProductFilters } = appContext;

  const handleFilterChange = (filterId: string) => {
    setActiveProductFilters(prevFilters => ({
      ...prevFilters,
      [filterId]: !prevFilters[filterId],
    }));
  };

  // Group products by category based on PRODUCT_ICONS_CONFIG and respect CATEGORY_DISPLAY_ORDER
  const filtersGroupedByCategory: Record<string, Array<{ id: string; name: string }>> = {};

  // First, populate all categories found in PRODUCT_ICONS_CONFIG
  for (const productId in PRODUCT_ICONS_CONFIG) {
    const product = PRODUCT_ICONS_CONFIG[productId];
    const category = product.category || 'Other';
    if (!filtersGroupedByCategory[category]) {
      filtersGroupedByCategory[category] = [];
    }
    filtersGroupedByCategory[category].push({ id: productId, name: product.name });
  }
  
  // Sort products within each category alphabetically by name (optional)
  for (const category in filtersGroupedByCategory) {
    filtersGroupedByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  }


  return (
    <div className="bg-white p-3 shadow rounded-md border border-gray-200 max-h-[400px] overflow-y-auto custom-scrollbar"> {/* Added max-height and scroll */}
      <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2 sticky top-0 bg-white z-10">Filter by Product</h3>
      <div className="space-y-3">
        {/* Render categories in the specified order, then any remaining categories */}
        {[...CATEGORY_DISPLAY_ORDER, ...Object.keys(filtersGroupedByCategory).filter(cat => !CATEGORY_DISPLAY_ORDER.includes(cat))]
          .filter(category => filtersGroupedByCategory[category] && filtersGroupedByCategory[category].length > 0) // Only render if category exists and has items
          .map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-600 mb-1.5 capitalize">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5"> {/* Adjusted grid for dropdown context */}
                {filtersGroupedByCategory[category].map(filter => {
                  const productConfig = PRODUCT_ICONS_CONFIG[filter.id];
                  const iconPath = productConfig?.icon_available ? `/images/icons/${productConfig.icon_available}` : null;

                  return (
                    <label
                      key={filter.id}
                      className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!activeProductFilters[filter.id]}
                        onChange={() => handleFilterChange(filter.id)}
                        className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
                      />
                      {iconPath && (
                        <img
                          src={iconPath}
                          alt={filter.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span>{filter.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
        ))}
      </div>
      {Object.keys(activeProductFilters).some(key => activeProductFilters[key]) && ( // Show "Clear All" only if some filters are active
        <button
          onClick={() => setActiveProductFilters({})}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 hover:underline w-full text-left pt-2 border-t border-gray-200"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default ProductFilters;