// src/components/Listings/ListingsPanel.tsx
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext.tsx'; // Adjust path
import ShopCard from './ShopCard.tsx'; // You'll create this next

const ListingsPanel = () => {
  const appContext = useContext(AppContext);
  const { currentlyDisplayedShops } = appContext || {};

  if (!currentlyDisplayedShops) {
    return (
      <section id="listingsPanel" className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0">
        <div>Loading listings...</div>
      </section>
    );
  }

  return (
    <section id="listingsPanel" className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0">
      {currentlyDisplayedShops.length > 0 ? (
        <div id="listingsContainer" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {currentlyDisplayedShops.map(shop => (
            <ShopCard key={shop.slug || shop.GoogleProfileID || shop.Name} shop={shop} />
          ))}
        </div>
      ) : (
        <div id="noResults" className="text-center text-gray-600 mt-10 p-4">
          No farm stands found matching your criteria.
        </div>
      )}
    </section>
  );
};

export default ListingsPanel;