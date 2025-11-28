// src/components/Filters/ProductFilters.tsx
import React, { useMemo, useCallback } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { getMergedProductConfigs, CATEGORY_DISPLAY_ORDERS } from '../../config/products';
import { LocationType, ALL_LOCATION_TYPES } from '../../types/shop';

const ProductFilters: React.FC = () => {
  const { activeProductFilters, activeLocationTypes, toggleLocationType, toggleFilter, clearAllFilters } = useFilters();

  // Use the optimized toggleFilter from context instead of local handler
  const handleFilterChange = useCallback((filterId: string) => {
    toggleFilter(filterId);
  }, [toggleFilter]);

  // Get merged product configs for selected location types
  const productConfig = useMemo(() => {
    return getMergedProductConfigs(activeLocationTypes);
  }, [activeLocationTypes]);

  // Get category display order based on selected types
  const categoryOrder = useMemo(() => {
    // Merge category orders from all selected types
    const allCategories = new Set<string>();
    activeLocationTypes.forEach(type => {
      const order = CATEGORY_DISPLAY_ORDERS[type];
      order.forEach(cat => allCategories.add(cat));
    });
    return Array.from(allCategories);
  }, [activeLocationTypes]);

  // Memoize the grouping and sorting logic to prevent recalculation on every render
  const filtersGroupedByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ id: string; name: string }>> = {};

    // Populate all categories found in the merged product config
    for (const productId in productConfig) {
      const product = productConfig[productId];
      const category = product.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ id: productId, name: product.name });
    }

    // Sort products within each category alphabetically by name
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, [productConfig]); // Re-calculate when product config changes (location types change)


  return (
    <div className="bg-white p-3 shadow rounded-md border border-gray-200 max-h-[400px] overflow-y-auto custom-scrollbar"> {/* Added max-height and scroll */}
      <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2 sticky top-0 bg-white z-10">Filters</h3>

      {/* Location Type Filter Section */}
      <fieldset className="border-none p-0 m-0 mb-4 pb-3 border-b border-gray-200">
        <legend className="text-sm font-medium text-gray-600 mb-2">Location Types</legend>
        <div className="space-y-1.5">
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={activeLocationTypes.has('farm_stand')}
              onChange={() => toggleLocationType('farm_stand' as LocationType)}
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
              aria-label="Show farm stands"
            />
            <span className="font-medium">Farm Stands</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={activeLocationTypes.has('cheese_shop')}
              onChange={() => toggleLocationType('cheese_shop' as LocationType)}
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
              aria-label="Show cheesemongers"
            />
            <span className="font-medium">Cheesemongers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={activeLocationTypes.has('fish_monger')}
              onChange={() => toggleLocationType('fish_monger' as LocationType)}
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
              aria-label="Show fishmongers"
            />
            <span className="font-medium">Fishmongers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={activeLocationTypes.has('butcher')}
              onChange={() => toggleLocationType('butcher' as LocationType)}
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
              aria-label="Show butchers"
            />
            <span className="font-medium">Butchers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={activeLocationTypes.has('antique_shop')}
              onChange={() => toggleLocationType('antique_shop' as LocationType)}
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
              aria-label="Show antiques"
            />
            <span className="font-medium">Antiques</span>
          </label>
        </div>
      </fieldset>

      {/* Product Filters Section */}
      <div className="space-y-3">
        {/* Render categories in the specified order, then any remaining categories */}
        {[...categoryOrder, ...Object.keys(filtersGroupedByCategory).filter(cat => !categoryOrder.includes(cat))]
          .filter(category => filtersGroupedByCategory[category] && filtersGroupedByCategory[category].length > 0) // Only render if category exists and has items
          .map((category) => (
            <fieldset key={category} className="border-none p-0 m-0">
              <legend className="text-sm font-medium text-gray-600 mb-1.5 capitalize">{category}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5"> {/* Adjusted grid for dropdown context */}
                {filtersGroupedByCategory[category].map(filter => {
                  const productConfigItem = productConfig[filter.id];
                  const iconPath = productConfigItem?.icon_available ? `/images/icons/${productConfigItem.icon_available}` : null;

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
                        aria-label={`Filter by ${filter.name}`}
                      />
                      {iconPath && (
                        <img
                          src={iconPath}
                          alt=""
                          className="w-6 h-6 object-contain"
                          aria-hidden="true"
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
            </fieldset>
        ))}
      </div>
      {(() => {
        // Check if we're in the default state (all location types + no product filters)
        const hasActiveFilters = Object.values(activeProductFilters).some(v => v === true);
        const isAllLocationTypesSelected = activeLocationTypes.size === ALL_LOCATION_TYPES.length;
        const isDefaultState = !hasActiveFilters && isAllLocationTypesSelected;

        // Show "Back to Homepage" button when NOT in default state
        return !isDefaultState && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 hover:underline w-full text-left pt-2 border-t border-gray-200"
            aria-label="Clear all filters and return to homepage"
          >
            🏠 Back to Homepage
          </button>
        );
      })()}
    </div>
  );
};

// Memoize component to prevent re-renders when parent re-renders
// Only re-renders when activeProductFilters from context changes
export default React.memo(ProductFilters);
