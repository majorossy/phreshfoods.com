// src/components/Overlays/ShopDetailsOverlay.tsx
import React, { useEffect, useState, useContext } from 'react';
import { Shop } from '../../types'; // Adjust path as needed
import { AppContext } from '../../contexts/AppContext.tsx'; // For currentShopForDirections, etc.
// import ProductIconsDisplay from '../UI/ProductIconsDisplay.tsx'; // You'll create this
// import OpeningHoursDisplay from '../UI/OpeningHoursDisplay.tsx'; // You'll create this
// import DirectionsPanel from '../UI/DirectionsPanel.tsx'; // You'll create this
import { escapeHTMLSafe } from '../../utils'; // Or wherever your escapeHTML is
import ProductIconsDisplay from '../UI/ProductIconsDisplay.tsx'; // <-- IMPORT

interface ShopDetailsOverlayProps {
  shop: Shop | null; // Can be null if no shop is selected
  onClose: () => void;
}

const ShopDetailsOverlay: React.FC<ShopDetailsOverlayProps> = ({ shop, onClose }) => {
  const appContext = useContext(AppContext);
  // const { currentShopForDirections, setCurrentShopForDirections } = appContext || {}; // Example if needed
  // Or, if directions logic is fully self-contained or triggered by this component:
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [directionsData, setDirectionsData] = useState<any | null>(null); // Replace 'any' with your DirectionsResponse type


  useEffect(() => {
    if (shop) {
      // When a new shop is selected, reset directions view
      setShowDirectionsPanel(false);
      setDirectionsData(null);
      // If you were using currentShopForDirections from context:
      // setCurrentShopForDirections?.(shop);
    }
  }, [shop /*, setCurrentShopForDirections */]);

  if (!shop) {
    // This component shouldn't be rendered by App.tsx if shop is null,
    // but this is a good safeguard.
    return null;
  }

  const displayName = escapeHTMLSafe(shop.placeDetails?.name || shop.Name || 'Farm Stand Details');

  const handleGetDirections = async () => {
    // Logic to get origin (e.g., from appContext.lastPlaceSelectedByAutocomplete)
    // and destination (shop.lat, shop.lng or shop.GoogleProfileID)
    // Then call apiService.getDirectionsClient(...)
    // setDirectionsData(result);
    // setShowDirectionsPanel(true);
    console.log("Get Directions clicked for:", shop.Name);
    alert("Directions functionality to be implemented!");
    // Example of how you might trigger it:
    // if (appContext?.lastPlaceSelectedByAutocomplete?.geometry?.location && shop) {
    //   try {
    //     const origin = appContext.lastPlaceSelectedByAutocomplete.geometry.location;
    //     const destination = shop.GoogleProfileID ? { placeId: shop.GoogleProfileID } : { lat: shop.lat!, lng: shop.lng! };
    //     const data = await apiService.getDirectionsClient(origin, destination);
    //     setDirectionsData(data);
    //     setShowDirectionsPanel(true);
    //   } catch (error) {
    //     console.error("Error getting directions:", error);
    //     alert("Could not get directions.");
    //   }
    // } else {
    //   alert("Please set a starting location first.");
    // }
  };

  const handleClearDirections = () => {
    // Logic to clear directions from map (call a map function via context/ref)
    // and hide the directions panel
    setDirectionsData(null);
    setShowDirectionsPanel(false);
    console.log("Clear Directions clicked");
    // Example: appContext?.clearMapDirections?.();
  };


  // Image gallery logic
  const images = [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean).map(imgName => `/images/${String(imgName).trim()}`);
  const hasImages = images.length > 0;

  return (
    <div
      id="detailsOverlayShop"
      className="detail-pop-overlay custom-scrollbar is-open" // 'is-open' class should be managed by App.tsx based on state
      // Add Tailwind classes for positioning from your style.css:
      // e.g., fixed inset-0 md:top-0 md:bottom-0 md:right-0 md:w-2/5 lg:w-1/3 transform md:translate-x-0
      // The CSS you had:
      // #detailsOverlayShop { right: 0; transform: translateX(100%); }
      // #detailsOverlayShop.is-open { transform: translateX(0%); }
      // @media (min-width: 768px) { #detailsOverlayShop { width: 42%; left: auto; } }
      // So, in Tailwind it might be:
      // fixed inset-0 bg-white/95 backdrop-blur-sm shadow-xl z-50
      // md:absolute md:top-0 md:bottom-0 md:right-0 md:w-[42%] md:max-w-md lg:md:w-1/3
      // transform transition-transform duration-300 ease-in-out
      // ${isShopOverlayOpen ? 'translate-x-0' : 'translate-x-full'}
      // BUT, visibility is controlled by App.tsx, so just the base styles here:
      style={{
        // These styles are from your original CSS, applied via Tailwind in App.tsx's conditional render
        // This component just defines the *content* and internal layout.
        // The 'is-open' class and transition are handled by App.tsx's conditional rendering.
      }}
    >
      <button
        onClick={onClose}
        className="overlay-close-button absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-900 z-10"
        aria-label="Close shop details"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      {/* Header of Shop Details (Fixed relative to this overlay) */}
      <div className="p-4 pt-12 sm:pt-16 md:pt-4 border-b border-gray-200 shrink-0 sticky top-0 bg-white/90 backdrop-blur-sm z-[5]">
        <h2 id="shopDetailName" className="text-xl sm:text-2xl font-bold text-gray-800 truncate" title={displayName}>
          {displayName}
        </h2>
        {/* Potentially add short address/distance here if desired */}
      </div>

      {/* Scrollable Content of Shop Details */}
      <div id="shopDetailsContent" className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Image Gallery - MODIFIED FOR HORIZONTAL ROW */}
        <section id="shopImageGallery" aria-labelledby="gallery-heading">
          <h3 id="gallery-heading" className="sr-only">Image Gallery</h3>
          {hasImages ? (
            <div className="flex space-x-3 overflow-x-auto pb-2 custom-scrollbar-thin"> {/* Horizontal scroll */}
              {images.map((src, index) => (
                <div
                  key={index}
                  className="gallery-image-item-row flex-shrink-0 w-48 h-32 sm:w-60 sm:h-40 md:w-56 md:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow"
                > {/* Fixed width and height, flex-shrink-0 prevents shrinking */}
                  <img
                    src={src}
                    alt={`${displayName} image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if(parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">Image not found</div>`;
                        }
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center rounded-md bg-gray-100 dark:bg-gray-700">No provided photos for this stand.</p>
          )}
        </section>

        {/* Opening Hours Section */}
        <div className="opening-hours-section border-t pt-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Hours</h3>
          <div id="shopOpeningHoursContainer">
            {/* <OpeningHoursDisplay placeDetails={shop.placeDetails} /> */}
            <p className="text-sm p-2 text-center">Opening hours display to be implemented.</p>
            {shop.placeDetails?.opening_hours?.weekday_text?.map((line, index) => (
                <p key={index} className="text-sm text-gray-600">{line}</p>
            ))}
            {(!shop.placeDetails?.opening_hours?.weekday_text && shop.placeDetails?.business_status) && (
                <p className={`text-sm font-semibold ${shop.placeDetails.business_status === 'OPERATIONAL' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {shop.placeDetails.business_status.replace('_', ' ')}
                </p>
            )}
          </div>
        </div>
       
        {/* Products Available Section */}
        <div className="product-icons-section pt-3 border-t">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Products Available</h3>
          <div id="shopProductIconsContainer">
            <ProductIconsDisplay shop={shop} /> {/* <-- USE THE COMPONENT HERE */}
          </div>
        </div>

        {/* Directions Control Section */}
        <div id="directionsControlSection" className="mt-3 pt-3 border-t">
          {!showDirectionsPanel || !directionsData ? (
            <button
              id="getShopDirectionsButton"
              onClick={handleGetDirections}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            >
              Get Directions
            </button>
          ) : (
            <button
              id="clearShopDirectionsButton"
              onClick={handleClearDirections}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            >
              Clear Directions
            </button>
          )}
          {showDirectionsPanel && directionsData && (
            <div id="directionsPanelRendered" className="mt-3 text-sm bg-gray-50 p-2 border rounded">
              {/* <DirectionsPanel directionsData={directionsData} /> */}
              <p>Turn-by-turn directions to be implemented here.</p>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(directionsData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsOverlay;