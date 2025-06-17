// src/components/Overlays/SocialOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Shop } from '../../types'; // Adjust path

interface SocialOverlayProps {
  shop: Shop; // Assuming shop is never null when this overlay is rendered
  onClose: () => void;
}

const SocialOverlay: React.FC<SocialOverlayProps> = ({ shop, onClose }) => {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos', 'reviews', 'posts'

  // Log the photo data when the component mounts or shop changes
  useEffect(() => {
    console.log("[SocialOverlay] Shop Data:", shop);
    if (shop.placeDetails) {
      console.log("[SocialOverlay] placeDetails:", shop.placeDetails);
      if (shop.placeDetails.photos) {
        console.log("[SocialOverlay] placeDetails.photos:", shop.placeDetails.photos);
        if (shop.placeDetails.photos.length > 0) {
          // Log the first photo object to see its structure and methods
          console.log("[SocialOverlay] First photo object:", shop.placeDetails.photos[0]);
          // Test getUrl() on the first photo
          try {
            const testUrl = shop.placeDetails.photos[0].getUrl({ maxWidth: 400 });
            console.log("[SocialOverlay] Test getUrl() for first photo:", testUrl);
          } catch (e) {
            console.error("[SocialOverlay] Error calling getUrl() on first photo:", e);
          }
        }
      } else {
        console.log("[SocialOverlay] No photos array in placeDetails.");
      }
    } else {
      console.log("[SocialOverlay] No placeDetails on shop object.");
    }
  }, [shop]);

  if (!shop) return null; // Should not happen if App.tsx controls rendering

  const googlePhotos = shop.placeDetails?.photos;

  return (
    <div id="detailsOverlaySocial" className="detail-pop-overlay detail-pop-overlay-social custom-scrollbar is-open">
      <button onClick={onClose} className="overlay-close-button" aria-label="Close social details">
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      {/* Tab Headers */}
      <div className="pt-10 sm:pt-12 shrink-0">
        <div className="mb-2 sm:mb-4 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4">
          <nav id="socialOverlayTabs" className="flex flex-wrap -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('photos')}
              className={`social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm
                ${activeTab === 'photos' ? 'active-social-tab border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
            >
              <svg className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${activeTab === 'photos' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Photos
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm ml-2 sm:ml-4
                ${activeTab === 'reviews' ? 'active-social-tab border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
            >
             <svg className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${activeTab === 'reviews' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Reviews
            </button>
            {/* Add more tabs for Facebook, Instagram, Twitter if needed */}
          </nav>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 sm:px-4 pb-4">
        {/* Photos Tab Panel */}
        {activeTab === 'photos' && (
          <div id="social-photos-panel">
            {/* Google Places Photos */}
            {googlePhotos && googlePhotos.length > 0 ? (
              <div id="socialOverlayGooglePhotosContainer" className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-4">
                {googlePhotos.map((photo, index) => {
                  // CRITICAL: You MUST provide maxWidth or maxHeight (or both) for getUrl()
                  let imageUrl = '';
                  try {
                    // You can adjust maxWidth/maxHeight based on your desired display size
                    imageUrl = photo.getUrl({ maxWidth: 400, maxHeight: 400 });
                  } catch (e) {
                    console.error("Error calling getUrl for photo:", photo, e);
                    return (
                      <div key={`error-${index}`} className="gallery-image-container aspect-square bg-red-100 dark:bg-red-900 rounded overflow-hidden flex items-center justify-center text-red-700 dark:text-red-300 text-xs p-1">
                        Error loading
                      </div>
                    );
                  }
                  
                  if (!imageUrl) return null; // Skip if URL couldn't be generated

                  return (
                    <div key={imageUrl || index} className="gallery-image-container aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" title={`View full image ${index + 1} for ${shop.Name}`}>
                        <img
                          src={imageUrl}
                          alt={`Shop image ${index + 1} for ${shop.Name}`}
                          className="w-full h-full object-cover transition-transform duration-200 ease-in-out hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                               const errorDiv = document.createElement('div');
                               errorDiv.className = "w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 p-1";
                               errorDiv.textContent = "Img Error";
                               parent.appendChild(errorDiv);
                            }
                          }}
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No Google photos available for this location.</p>
            )}
            {/* You can add sections for other photo sources (e.g., your own uploaded images) here */}
          </div>
        )}

        {/* Reviews Tab Panel */}
        {activeTab === 'reviews' && (
          <div id="social-reviews-panel">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Reviews</h3>
            {shop.placeDetails?.reviews && shop.placeDetails.reviews.length > 0 ? (
              <ul className="space-y-3">
                {shop.placeDetails.reviews.map((review, index) => (
                  <li key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
                    <div className="flex items-center mb-1.5">
                      {review.profile_photo_url && (
                        <img src={review.profile_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full mr-2" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{review.author_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.relative_time_description}</p>
                      </div>
                      {review.rating && (
                        <div className="ml-auto flex items-center text-xs text-yellow-500">
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">{review.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No reviews available for this location.</p>
            )}
          </div>
        )}
        {/* Add other tab panels here */}
      </div>
    </div>
  );
};

export default SocialOverlay;