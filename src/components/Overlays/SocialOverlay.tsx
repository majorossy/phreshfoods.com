// src/components/Overlays/SocialOverlay.tsx
import React from 'react';
import { Shop } from '../../types'; // Adjust path

interface SocialOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const SocialOverlay: React.FC<SocialOverlayProps> = ({ shop, onClose }) => {
  if (!shop) return null;

  return (
    <div id="detailsOverlaySocial" className="detail-pop-overlay detail-pop-overlay-social custom-scrollbar is-open">
      <button onClick={onClose} className="overlay-close-button" aria-label="Close social details">
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
      <div className="pt-10 sm:pt-12 shrink-0">
        <div className="mb-4 border-b border-gray-200 px-2 sm:px-4">
          <nav id="socialOverlayTabs" className="flex flex-wrap -mb-px" aria-label="Tabs">
            {/* Tabs will be added here */}
            <button className="social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm">Photos</button>
            <button className="social-tab-button group inline-flex items-center py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm">Reviews</button>
          </nav>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 sm:px-4 pb-4">
        <p>Social content for {shop.Name} will go here...</p>
        {/* Tab panels will be added here */}
      </div>
    </div>
  );
};

export default SocialOverlay;