// src/components/Overlays/SocialOverlay.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Shop, PlacePhoto as PlacePhotoData } from '../../types';
import { escapeHTMLSafe } from '../../utils';
import { GOOGLE_MAPS_API_KEY } from '../../config/appConfig';
import { AppContext } from '../../contexts/AppContext';

interface SocialOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const SocialOverlay: React.FC<SocialOverlayProps> = ({ shop, onClose }) => {
  const [activeTab, setActiveTab] = useState('photos');
  const apiKey = GOOGLE_MAPS_API_KEY;
  const appContext = useContext(AppContext);

  const [manualOrigin, setManualOrigin] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  const {
    fetchAndDisplayDirections,
    directionsResult,
    directionsError,
    isFetchingDirections,
    clearDirections,
    lastPlaceSelectedByAutocomplete,
  } = appContext || {};
  
  // When the overlay opens for a new shop, reset directions and potentially default to a specific tab
  useEffect(() => {
    if (clearDirections) clearDirections();
    // If you always want it to default to photos when a new shop is selected:
    // setActiveTab('photos');
  }, [shop, clearDirections]);


  if (!shop) return null;

  const googlePhotosData: PlacePhotoData[] | undefined = shop.placeDetails?.photos;
  const shopAddressForDisplay = shop.placeDetails?.formatted_address || shop.Address;
  const shopLatLngForDisplay = shop.lat && shop.lng ? `${shop.lat.toFixed(5)}, ${shop.lng.toFixed(5)}` : null;
  const shopDestinationForApi = 
    shop.placeDetails?.geometry?.location ||
    (shop.lat && shop.lng ? { lat: shop.lat, lng: shop.lng } : null) ||
    shop.placeDetails?.formatted_address || 
    shop.Address;

  const handleGetDirectionsClick = () => {
    // This function remains the same as provided in the previous, more detailed answer
    if (!fetchAndDisplayDirections || !shopDestinationForApi) {
      alert("Directions service not ready or destination missing.");
      return;
    }
    let originRequest: google.maps.LatLngLiteral | string | google.maps.Place;
    if (useCurrentLocation) {
      if (navigator.geolocation) {
        if(appContext?.setIsFetchingDirections) appContext.setIsFetchingDirections(true); // Manually set loading
        navigator.geolocation.getCurrentPosition(
          (position) => {
            originRequest = { lat: position.coords.latitude, lng: position.coords.longitude };
            fetchAndDisplayDirections(originRequest, shopDestinationForApi);
          },
          (error) => {
            console.error("Error getting current location:", error);
            alert("Could not get current location. Please enter an address or use a previously searched location.");
            if (appContext?.setIsFetchingDirections) appContext.setIsFetchingDirections(false);
          },
          { timeout: 10000 }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    } else if (manualOrigin.trim()) {
      originRequest = manualOrigin.trim();
      fetchAndDisplayDirections(originRequest, shopDestinationForApi);
    } else if (lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = lastPlaceSelectedByAutocomplete.geometry.location;
        const defaultOrigin = (typeof (loc as google.maps.LatLng).lat === 'function') 
            ? { lat: (loc as google.maps.LatLng).lat(), lng: (loc as google.maps.LatLng).lng()} 
            : (loc as google.maps.LatLngLiteral);
        fetchAndDisplayDirections(defaultOrigin, shopDestinationForApi);
    } else {
        alert("Please enter a starting address or allow current location.");
    }
  };
  
  const handleClearDirectionsClick = () => {
    if(clearDirections) clearDirections();
    setManualOrigin('');
  };

  const handleTabClick = (tabName: string) => {
    if (tabName !== 'directions' && directionsResult && clearDirections) {
        clearDirections();
    }
    setActiveTab(tabName);
  };

  return (
    <div id="detailsOverlaySocial" className="detail-pop-overlay detail-pop-overlay-social custom-scrollbar is-open">
      <button onClick={onClose} className="overlay-close-button absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 z-10" aria-label="Close social details">
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <div className="pt-10 sm:pt-12 shrink-0">
        <div className="mb-2 sm:mb-4 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4">
          <nav id="socialOverlayTabs" className="flex flex-wrap -mb-px" aria-label="Tabs">
            <button onClick={() => handleTabClick('photos')} className={`social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'photos' ? 'active-social-tab' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
              <svg className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${activeTab === 'photos' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Photos
            </button>
            <button onClick={() => handleTabClick('reviews')} className={`social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm ml-2 sm:ml-4 ${activeTab === 'reviews' ? 'active-social-tab' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
             <svg className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${activeTab === 'reviews' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Reviews
            </button>
            <button onClick={() => handleTabClick('directions')} className={`social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm ml-2 sm:ml-4 ${activeTab === 'directions' ? 'active-social-tab' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
              <svg className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${activeTab === 'directions' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M12.95 4.05a.75.75 0 010 1.06l-4.2 4.2a.75.75 0 000 1.06l4.2 4.2a.75.75 0 11-1.06 1.06l-4.2-4.2a2.25 2.25 0 010-3.18l4.2-4.2a.75.75 0 011.06 0zM6.22 3.22a.75.75 0 011.06 0l2.25 2.25a.75.75 0 01-1.06 1.06L6.22 4.28a.75.75 0 010-1.06zM4 8.75A.75.75 0 014.75 8h.5a.75.75 0 010 1.5h-.5A.75.75 0 014 8.75zM4.75 11a.75.75 0 000 1.5H7a.75.75 0 000-1.5H4.75zM6.22 14.22a.75.75 0 011.06 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06l2.25-2.25z" clipRule="evenodd" /> </svg>
              Directions
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 sm:px-4 pb-4">
        {/* --- MODIFIED: RESTORED PHOTOS TAB CONTENT --- */}
        {activeTab === 'photos' && (
          <div id="social-photos-panel">
            {googlePhotosData && googlePhotosData.length > 0 ? (
              <div id="socialOverlayGooglePhotosContainer" className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-4">
                {googlePhotosData.map((photoDataObject, index) => {
                  if (!photoDataObject.photo_reference || !apiKey) return null;
                  const maxWidthForThumbnail = 400;
                  const thumbnailUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidthForThumbnail}&photoreference=${photoDataObject.photo_reference}&key=${apiKey}`;
                  const fullSizeUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photoDataObject.photo_reference}&key=${apiKey}`;
                  return (
                    <div key={photoDataObject.photo_reference || `gphoto-${index}`} className="gallery-image-container aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <a href={fullSizeUrl} target="_blank" rel="noopener noreferrer" title={`View full image ${index + 1} for ${shop.Name}`}>
                        <img src={thumbnailUrl} alt={`Google Place image ${index + 1} for ${shop.Name}`} className="w-full h-full object-cover transition-transform duration-200 ease-in-out hover:scale-105" loading="lazy" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement; if (p && !p.querySelector('.img-error-fallback')) { const d = document.createElement('div'); d.className = "img-error-fallback w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 p-1"; d.textContent = "Img Load Error"; p.appendChild(d);}}} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : ( <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No Google photos available for this location.</p> )}
          </div>
        )}

        {/* --- MODIFIED: RESTORED REVIEWS TAB CONTENT --- */}
        {activeTab === 'reviews' && (
          <div id="social-reviews-panel">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Reviews</h3>
            {shop.placeDetails?.reviews && shop.placeDetails.reviews.length > 0 ? (
              <ul className="space-y-3">
                {shop.placeDetails.reviews.map((review, index) => (
                  <li key={review.time || index} className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg shadow">
                    <div className="flex items-center mb-1.5">
                      {review.profile_photo_url && (
                        <img src={review.profile_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full mr-2 object-cover" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{review.author_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.relative_time_description}</p>
                      </div>
                      {review.rating != null && (
                        <div className="ml-auto flex items-center text-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
                          ))}
                        </div>
                      )}
                    </div>
                    {review.text && <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">{review.text}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No Google Reviews available for this location.</p>
            )}
          </div>
        )}
        
        {/* Directions Tab Panel */}
        {activeTab === 'directions' && (
          <div id="social-directions-panel" className="p-2 sm:p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Directions to {escapeHTMLSafe(shop.Name)}
            </h3>
            {shopAddressForDisplay ? (
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="font-medium">Address:</strong> {escapeHTMLSafe(shopAddressForDisplay)}
                </p>
                {shopLatLngForDisplay && ( <p className="text-xs text-gray-500 dark:text-gray-400">Coordinates: {shopLatLngForDisplay}</p> )}
              </div>
            ) : shopLatLngForDisplay ? (
                 <div className="mb-4"> <p className="text-sm text-gray-700 dark:text-gray-300"> <strong className="font-medium">Coordinates:</strong> {shopLatLngForDisplay} </p> </div>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">Address and coordinates are not available.</p>
            )}
            
            <div className="mb-4 space-y-3">
                <div>
                    <label htmlFor="originInput" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Starting Point
                    </label>
                    <input type="text" id="originInput" value={manualOrigin} onChange={(e) => { setManualOrigin(e.target.value); if (e.target.value) setUseCurrentLocation(false); }} placeholder={lastPlaceSelectedByAutocomplete?.formatted_address || "Enter address or city"} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div className="flex items-center">
                    <input id="useCurrentLocationCheckbox" type="checkbox" checked={useCurrentLocation} onChange={(e) => { setUseCurrentLocation(e.target.checked); if (e.target.checked) setManualOrigin(''); }} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" />
                    <label htmlFor="useCurrentLocationCheckbox" className="text-xs text-gray-700 dark:text-gray-300">Use my current location</label>
                </div>
            </div>
            
            <div className="flex space-x-2 mb-4">
                <button onClick={handleGetDirectionsClick} disabled={isFetchingDirections || !shopDestinationForApi} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {isFetchingDirections ? 'Getting...' : 'Get Directions'}
                </button>
                {directionsResult && clearDirections && (
                     <button onClick={handleClearDirectionsClick} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Clear Route
                    </button>
                )}
            </div>

            {directionsError && <p className="text-sm text-red-500 dark:text-red-400 mb-2">{directionsError}</p>}

            {directionsResult?.routes?.[0]?.legs?.[0]?.steps && (
              <div className="mt-4 text-xs space-y-2 directions-steps custom-scrollbar overflow-y-auto max-h-[200px] sm:max-h-[250px] p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Total: {directionsResult.routes[0].legs[0].distance?.text} - {directionsResult.routes[0].legs[0].duration?.text}
                </p>
                {directionsResult.routes[0].legs.flatMap(leg => leg.steps || []).map((step, stepIndex) => (
                  <div key={`step-${stepIndex}`} className="py-1.5 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                    <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: step.instructions || '' }} />
                    {step.distance?.text && ( <span className="text-gray-500 dark:text-gray-400 text-[0.65rem] ml-1"> ({step.distance.text})</span> )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialOverlay;