// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot for rendering React components into InfoWindow
import { AppContext } from '../../contexts/AppContext.tsx'; // Removed AutocompletePlace as it's not directly used here after context update
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAINE_BOUNDS_LITERAL, MAP_ID, USER_LOCATION_MAP_ZOOM, markerColor } from '../../config/appConfig.ts';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import InfoWindowContent from './InfoWindowContent.tsx'; // Your new component for InfoWindow content

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  // Use a Map to store markers by shop ID for efficient lookup and updates
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  // Ref to store the React root for the InfoWindow content, so it can be unmounted
  const infoWindowContentRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);

  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  if (!appContext) {
    // Return a div with the same ID for layout consistency during loading
    return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">Loading map context...</div>;
  }

  const {
    mapsApiReady,
    currentlyDisplayedShops,
    lastPlaceSelectedByAutocomplete,
    selectedShop,      // Shop selected via list, URL, or marker click
    openShopOverlays,  // Function from context to open your main shop details overlay
    setSelectedShop,   // Function from context to update the currently selected shop
    // allFarmStands, // Only needed if performing slug lookup logic within MapComponent
  } = appContext;

  // Callback to close InfoWindow and unmount React content
  const closeInfoWindow = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    if (infoWindowContentRootRef.current) {
      // Unmount the React component from the InfoWindow content
      infoWindowContentRootRef.current.unmount();
      infoWindowContentRootRef.current = null;
    }
  }, []); // Empty dependency array: refs and ReactDOM.unmount don't change

  // Initialize Map
  useEffect(() => {
    if (!mapsApiReady || !mapRef.current || googleMapRef.current) return; // Only init once

    let initialCenter: google.maps.LatLngLiteral = DEFAULT_MAP_CENTER;
    // No initialZoom variable, let map options handle it or specific logic below

    const mapInstance = new window.google.maps.Map(mapRef.current as HTMLDivElement, {
      center: initialCenter,
      zoom: DEFAULT_MAP_ZOOM, // Use default zoom initially
      mapTypeControl: false,
      gestureHandling: "greedy",
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      restriction: { latLngBounds: MAINE_BOUNDS_LITERAL, strictBounds: false },
      mapId: MAP_ID,
    });
    googleMapRef.current = mapInstance;

    // Initialize a single InfoWindow instance
    infoWindowRef.current = new window.google.maps.InfoWindow({
      pixelOffset: new window.google.maps.Size(0, -10), // Visual offset for the InfoWindow
      disableAutoPan: false, // Let map pan if InfoWindow is out of view
    });

    // Listener to close InfoWindow when map itself is clicked (not on a marker)
    mapInstance.addListener("click", () => {
      closeInfoWindow();
      setSelectedShop(null); // Also clear the selected shop in context
    });

    console.log("MapComponent: Google Map Initialized.");
  }, [mapsApiReady, setSelectedShop, closeInfoWindow]); // Added dependencies

  // Plot/Update Markers when `currentlyDisplayedShops` or `selectedShop` (for highlighting) changes
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !window.google.maps.marker || !currentlyDisplayedShops) {
      return;
    }
    console.log(`MapComponent: Plotting/Updating ${currentlyDisplayedShops.length} markers.`);

    const newMarkersMap = new Map<string, google.maps.marker.AdvancedMarkerElement>();

    currentlyDisplayedShops.forEach((shop: Shop) => {
      if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) {
        console.warn(`MapComponent: Invalid lat/lng for shop ${shop.Name}, skipping.`);
        return;
      }

      const shopId = shop.slug || shop.GoogleProfileID || shop.id; // Use a reliable unique ID
      if (!shopId) {
        console.warn("Shop has no usable ID for marker key:", shop.Name);
        return;
      }

      let marker = markersRef.current.get(shopId);

      if (!marker) { // If marker doesn't exist, create it
        const markerElement = document.createElement('div');
        // Basic marker styling, customize as needed
        markerElement.style.width = '18px';
        markerElement.style.height = '18px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid white';
        markerElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.transition = 'transform 0.1s ease-out, background-color 0.1s ease-out'; // For hover/selection
        
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: shop.lat, lng: shop.lng },
          map: map,
          title: shop.Name,
          content: markerElement, // Assign the styled div as marker content
        });

        marker.addListener('gmp-click', (event: MouseEvent) => {
          event.domEvent?.stopPropagation(); // Stop event from bubbling to map click listener
          console.log(`Marker clicked: ${shop.Name}`);
          setSelectedShop(shop); // Update context: this will trigger the InfoWindow effect
          if (shop.slug) {
            navigate(`/farm/${shop.slug}`, { replace: true }); // Update URL
          }
        });
      } else {
        // Marker exists, ensure it's on the map
        marker.map = map;
      }
      
      // Update appearance based on whether it's the selectedShop
      const isSelected = selectedShop?.slug === shop.slug; // Compare based on unique ID
      (marker.content as HTMLElement).style.transform = isSelected ? 'scale(1.4)' : 'scale(1)';
      (marker.content as HTMLElement).style.backgroundColor = isSelected ? 'darkred' : markerColor; // Use your config color
      marker.zIndex = isSelected ? 1001 : newMarkersMap.size + 1; // Higher z-index for selected

      newMarkersMap.set(shopId, marker);
    });

    // Remove markers that are no longer in currentlyDisplayedShops
    markersRef.current.forEach((oldMarker, shopId) => {
      if (!newMarkersMap.has(shopId)) {
        oldMarker.map = null; // Remove from map
      }
    });
    markersRef.current = newMarkersMap; // Update the ref with the current set of markers

  }, [currentlyDisplayedShops, mapsApiReady, selectedShop, navigate, setSelectedShop, markerColor]);

  // Effect to handle opening/closing InfoWindow when `selectedShop` changes
  useEffect(() => {
    const map = googleMapRef.current;
    const infoWin = infoWindowRef.current;

    if (!map || !infoWin || !mapsApiReady || !setSelectedShop || !openShopOverlays) {
      // Ensure all necessary functions/refs are available
      return;
    }
    
    if (selectedShop && selectedShop.lat && selectedShop.lng) {
      const shopId = selectedShop.slug || selectedShop.GoogleProfileID || selectedShop.id;
      const markerInstance = markersRef.current.get(shopId);

      if (markerInstance) {
        console.log(`MapComponent: Opening InfoWindow for selected shop: ${selectedShop.Name}`);
        
        // Close and unmount any previous InfoWindow content FIRST
        // This is now handled more implicitly by the overall closeInfoWindow,
        // but ensuring it here if another component could also close it.
        // We need to be careful not to create a loop if closeInfoWindow itself calls setSelectedShop(null)
        if (infoWindowContentRootRef.current) {
            infoWindowContentRootRef.current.unmount();
            infoWindowContentRootRef.current = null;
        }
        
        const contentDiv = document.createElement('div');
        infoWin.setContent(contentDiv); // Assign placeholder div

        const root = ReactDOM.createRoot(contentDiv); // Create React root in the placeholder
        infoWindowContentRootRef.current = root;      // Store the root for later unmounting

        root.render(
          // StrictMode removed for brevity, can be added back if needed
          <InfoWindowContent
            shop={selectedShop}
            onDirectionsClick={(clickedShop) => {
              console.log(`MapComponent: Directions requested for: ${clickedShop.Name}`);
              const destination = clickedShop.Address || (clickedShop.lat && clickedShop.lng ? `${clickedShop.lat},${clickedShop.lng}` : '');
              if (destination) {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
                window.open(mapsUrl, '_blank');
              }
              // Optionally close infowindow and deselect after action
              closeInfoWindow(); 
              setSelectedShop(null);
            }}
            onDetailsClick={(clickedShop) => {
              console.log(`MapComponent: Details requested for: ${clickedShop.Name}`);
              openShopOverlays(clickedShop); // This should trigger your main details overlay
              closeInfoWindow();
              // Keep selectedShop active as the main overlay will use it.
            }}
          />
        );

        infoWin.open({
          anchor: markerInstance,
          map: map,
          shouldFocus: false, // Prevent map from overly aggressive panning
        });
      } else {
         console.warn(`MapComponent: Marker instance not found for selectedShop: ${selectedShop.Name}. Closing InfoWindow.`);
         closeInfoWindow();
      }
    } else {
      // No shop selected, ensure infowindow is closed
      closeInfoWindow();
    }
    // Dependencies: selectedShop is the primary trigger. Others are for function stability or map readiness.
  }, [selectedShop, mapsApiReady, closeInfoWindow, setSelectedShop, openShopOverlays]);

  // Effect to pan/zoom map when `lastPlaceSelectedByAutocomplete` changes
  useEffect(() => {
    if (!googleMapRef.current || !mapsApiReady) return;

    if (lastPlaceSelectedByAutocomplete?.geometry?.location) {
      const place = lastPlaceSelectedByAutocomplete;
      const location = place.geometry.location as google.maps.LatLngLiteral; // Ensure it's literal
      console.log("MapComponent: Updating map view for autocomplete selection:", place.formatted_address);
    // OLD LOGIC THAT USES fitBounds()
    // if (place.geometry.viewport) {
    //   googleMapRef.current.fitBounds(place.geometry.viewport as google.maps.LatLngBoundsLiteral);
    // } else {
    //   googleMapRef.current.setCenter(location);
    //   googleMapRef.current.setZoom(USER_LOCATION_MAP_ZOOM); // Sets a specific zoom
    // }

// NEW LOGIC: PAN BUT TRY TO KEEP CURRENT ZOOM
if (googleMapRef.current && location) {
  const currentZoom = googleMapRef.current.getZoom(); // Get current zoom level

  googleMapRef.current.panTo(location); // Pan to the new center

  if (currentZoom) { // If getZoom() returned a value
    googleMapRef.current.setZoom(currentZoom); // Re-apply the current zoom
  } else {
    googleMapRef.current.setZoom(USER_LOCATION_MAP_ZOOM); // Fallback if currentZoom is undefined
  }
  console.log(`MapComponent: Panned to ${place.formatted_address}, zoom maintained or set to default.`);
}
      // When map re-centers due to search, close InfoWindow and deselect shop
      closeInfoWindow();
      setSelectedShop(null);
    }
  }, [lastPlaceSelectedByAutocomplete, mapsApiReady, closeInfoWindow, setSelectedShop]);

  return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200"></div>;
};

export default MapComponent;