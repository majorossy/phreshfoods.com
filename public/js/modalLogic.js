// public/js/modalLogic.js
'use strict';

const DEBUG_MODAL_LOGIC = true;

function modalLog(...args) { if (DEBUG_MODAL_LOGIC) console.log('[ModalLogic]', ...args); }
function modalWarn(...args) { if (DEBUG_MODAL_LOGIC) console.warn('[ModalLogic]', ...args); }
function modalError(...args) { if (DEBUG_MODAL_LOGIC) console.error('[ModalLogic]', ...args); }

window.modalAutocompletePlace = null; 
let modalAutocompleteListenerAttached = false; // Prevent multiple attachments

function setupModalAutocompleteEventListeners() {
    if (modalAutocompleteListenerAttached) {
        modalLog("setupModalAutocompleteEventListeners: Listener already attached. Skipping.");
        return;
    }
    modalLog("setupModalAutocompleteEventListeners (from modalLogic.js) HAS BEEN CALLED.");
    if (!window.AppState || !AppState.dom || !AppState.dom.modalSearchAutocompleteElement) {
        modalWarn("setupModalAutocompleteEventListeners: AppState.dom.modalSearchAutocompleteElement not available.");
        return; 
    }
    const modalSearchAutocomplete = AppState.dom.modalSearchAutocompleteElement;

     modalLog("setupModalAutocompleteEventListeners: Setting up 'gmp-select' listener. Element:", modalSearchAutocomplete);
     
    // Use the N, S, E, W structure from MAINE_BOUNDS_LITERAL (config.js)
    if (typeof MAINE_BOUNDS_LITERAL !== 'undefined' && MAINE_BOUNDS_LITERAL.north !== undefined) {
        // Format for gmp-place-autocomplete bias/restriction string: rectangle:south,west,north,east
        const biasRect = `rectangle:${MAINE_BOUNDS_LITERAL.south},${MAINE_BOUNDS_LITERAL.west},${MAINE_BOUNDS_LITERAL.north},${MAINE_BOUNDS_LITERAL.east}`;
        modalLog("setupModalAutocompleteEventListeners: Setting modal autocomplete bias/restriction string:", biasRect);
         if (!modalSearchAutocomplete.getAttribute('location-bias')) modalSearchAutocomplete.locationBias = biasRect;
         if (!modalSearchAutocomplete.getAttribute('location-restriction')) modalSearchAutocomplete.locationRestriction = biasRect;
    } else { modalWarn("setupModalAutocompleteEventListeners: MAINE_BOUNDS_LITERAL not found or invalid for modal autocomplete bias."); }
     if (!modalSearchAutocomplete.getAttribute('country')) modalSearchAutocomplete.country = "us";
     if (!modalSearchAutocomplete.getAttribute('place-fields')) modalSearchAutocomplete.placeFields = "name,formatted_address,geometry,address_components,place_id,types";
 
// In modalLogic.js, inside setupModalAutocompleteEventListeners
// In modalLogic.js, inside setupModalAutocompleteEventListeners
// In modalLogic.js, inside setupModalAutocompleteEventListeners

const modalPlaceChangeListener = (event) => { // LISTENING TO 'gmp-select' NOW
    modalLog("--- MODAL GMP-SELECT EVENT (from modalLogic.js) ---");
    modalLog("  Full event object:", event);

    let selectedPlaceObject = null;
    const targetElement = event.target; // Store event.target

    // Priority 1: Synchronous access to event.target.place (as per documentation)
    if (targetElement && targetElement.place && typeof targetElement.place === 'object' && targetElement.place.geometry) {
        modalLog("  SUCCESS: Found Place object on 'event.target.place' (synchronously):", targetElement.place);
        selectedPlaceObject = targetElement.place;
        window.modalAutocompletePlace = selectedPlaceObject;
        modalLog("  window.modalAutocompletePlace SET (synchronously from target.place) TO:", window.modalAutocompletePlace);
        modalLog("--------------------------------------------------------------------------");
        return; // Exit early if successful
    }

    // Log current state if synchronous access failed
    modalLog("  Synchronous access to event.target.place failed or place invalid.");
    if (targetElement) {
        modalLog("  event.target.place (synchronous check):", targetElement.place);
        modalLog("  event.target.value (synchronous check):", targetElement.value);
    }

    // Priority 2: Asynchronous access to event.target.place via setTimeout
    // This handles cases where the 'place' property might be populated slightly after the event.
    if (targetElement) {
        modalLog("  Attempting asynchronous retrieval of event.target.place via setTimeout.");
        setTimeout(() => {
            modalLog("  (setTimeout) Checking event.target.place again.");
            if (targetElement.place && typeof targetElement.place === 'object' && targetElement.place.geometry) {
                modalLog("  (setTimeout) SUCCESS: Found Place object on 'event.target.place':", targetElement.place);
                selectedPlaceObject = targetElement.place;
                window.modalAutocompletePlace = selectedPlaceObject;
                modalLog("  (setTimeout) window.modalAutocompletePlace NOW SET TO:", window.modalAutocompletePlace);
            } else {
                modalWarn("  (setTimeout) Still could not find a valid Place object on event.target.place.");
                modalLog("  (setTimeout) event.target.place (after timeout):", targetElement.place);
                modalLog("  (setTimeout) event.target.value (after timeout):", targetElement.value);

                // Fallback to other event properties if event.target.place is definitively not working
                if (event.place && typeof event.place === 'object' && event.place.geometry) {
                    modalLog("  (setTimeout) FALLBACK: Using 'event.place':", event.place);
                    selectedPlaceObject = event.place;
                } else if (event.detail && typeof event.detail.place === 'object' && event.detail.place.geometry) {
                    modalLog("  (setTimeout) FALLBACK: Using 'event.detail.place':", event.detail.place);
                    selectedPlaceObject = event.detail.place;
                } else if (event.detail && typeof event.detail === 'object' && event.detail.geometry) {
                    modalLog("  (setTimeout) FALLBACK: Using 'event.detail' (as place):", event.detail);
                    selectedPlaceObject = event.detail;
                }
                window.modalAutocompletePlace = selectedPlaceObject;
                modalLog("  (setTimeout) window.modalAutocompletePlace (after fallbacks) NOW SET TO:", window.modalAutocompletePlace);
            }
            modalLog("--------------------------------------------------------------------------");
        }, 50); // 50ms delay
        return; // Exit: setTimeout will handle the rest
    }

    // Fallback Scenarios (if event.target was not available for setTimeout)
    modalWarn("  event.target not available for setTimeout. Attempting direct fallbacks.");
    if (event.place && typeof event.place === 'object' && event.place.geometry) {
        modalLog("  FALLBACK (no target): Using 'event.place':", event.place);
        selectedPlaceObject = event.place;
    } else if (event.detail && typeof event.detail.place === 'object' && event.detail.place.geometry) {
        modalLog("  FALLBACK (no target): Using 'event.detail.place':", event.detail.place);
        selectedPlaceObject = event.detail.place;
    } else if (event.detail && typeof event.detail === 'object' && event.detail.geometry) {
        modalLog("  FALLBACK (no target): Using 'event.detail' (as place):", event.detail);
        selectedPlaceObject = event.detail;
    } else {
        modalWarn("  FALLBACK (no target): Could not find a valid Place object on event or event.detail.");
    }

    window.modalAutocompletePlace = selectedPlaceObject;
    modalLog("  window.modalAutocompletePlace (after no-target fallbacks) NOW SET TO:", window.modalAutocompletePlace);
    modalLog("--------------------------------------------------------------------------");
};

// Ensure the listener is for 'gmp-select'
// This part is in setupModalAutocompleteEventListeners:
// modalSearchAutocomplete.removeEventListener('gmp-select', modalPlaceChangeListener);
// modalSearchAutocomplete.addEventListener('gmp-select', modalPlaceChangeListener);

    modalSearchAutocomplete.removeEventListener('gmp-select', modalPlaceChangeListener); // Still good practice
    modalSearchAutocomplete.addEventListener('gmp-select', modalPlaceChangeListener);
    modalAutocompleteListenerAttached = true;
    modalLog("setupModalAutocompleteEventListeners: 'gmp-select' listener ADDED.");
}

function openInitialSearchModal() {
    console.log('[ModalLogic-DEBUG] openInitialSearchModal CALLED. Timestamp:', Date.now()); // Ensure this is logged
    modalLog("openInitialSearchModal called.");
    const initialSearchModal = AppState.dom?.initialSearchModal || document.getElementById('initialSearchModal');
    if (!initialSearchModal) {
        modalWarn("openInitialSearchModal: initialSearchModal element NOT FOUND. Returning.");
        return;
    }
    console.log('[ModalLogic-DEBUG] openInitialSearchModal: ADDING "modal-active" to body. Current body classes:', document.body.className, 'Timestamp:', Date.now());
    document.body.classList.add('modal-active');
    initialSearchModal.style.display = 'flex';
    requestAnimationFrame(() => { initialSearchModal.classList.add('modal-open'); });
}

function closeInitialSearchModal() {
    console.log('[ModalLogic-DEBUG] closeInitialSearchModal CALLED. Timestamp:', Date.now()); // Ensure this is logged
    modalLog("closeInitialSearchModal called.");
    const initialSearchModal = AppState.dom?.initialSearchModal || document.getElementById('initialSearchModal');
    if (!initialSearchModal) {
        modalWarn("closeInitialSearchModal: initialSearchModal element NOT FOUND. Returning.");
        return;
    }

    const wasOpen = initialSearchModal.classList.contains('modal-open');
    console.log(`[ModalLogic-DEBUG] closeInitialSearchModal: Modal 'modal-open' class was present: ${wasOpen}. Current body classes: ${document.body.className}`);

    initialSearchModal.classList.remove('modal-open');

    setTimeout(() => {
        console.log('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): Checking conditions to remove "modal-active". Timestamp:', Date.now());
        if (!initialSearchModal.classList.contains('modal-open')) { // Check if it's *still* not open (e.g. not rapidly re-opened)
            initialSearchModal.style.display = 'none';
            const dom = window.AppState?.dom;
            let removedClass = false;
            if (dom) {
                const shopOverlayIsOpen = dom.detailsOverlayShopElement?.classList.contains('is-open');
                const socialOverlayIsOpen = dom.detailsOverlaySocialElement?.classList.contains('is-open');
                console.log(`[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): shopOverlayIsOpen=${shopOverlayIsOpen}, socialOverlayIsOpen=${socialOverlayIsOpen}`);

                if (!shopOverlayIsOpen && !socialOverlayIsOpen) {
                    document.body.classList.remove('modal-active');
                    removedClass = true;
                    console.log('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): REMOVED "modal-active" from body. New body classes:', document.body.className, 'Timestamp:', Date.now());
                } else {
                    console.log('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): "modal-active" NOT removed because other overlays are open. Body classes:', document.body.className, 'Timestamp:', Date.now());
                }
            } else {
                document.body.classList.remove('modal-active');
                removedClass = true;
                console.log('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): REMOVED "modal-active" from body (dom fallback). New body classes:', document.body.className, 'Timestamp:', Date.now());
            }
            if (!removedClass && document.body.classList.contains('modal-active')) {
                 console.warn('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): "modal-active" was EXPECTED to be removed or not present, but it IS STILL ON BODY. Body classes:', document.body.className);
            }

        } else {
            console.log('[ModalLogic-DEBUG] closeInitialSearchModal (setTimeout): "modal-open" class was re-added or still present, not hiding modal or touching body class. Body classes:', document.body.className);
        }
    }, 300);
}

// In modalLogic.js
function submitModalSearch() {
    modalLog("submitModalSearch called.");
    const dom = AppState.dom; 
    const modalSearchAutocomplete = dom.modalSearchAutocompleteElement;

    if (!modalSearchAutocomplete) {
        modalWarn("submitModalSearch: AppState.dom.modalSearchAutocompleteElement is NULL.");
        return;
    }
    if (!dom.searchAutocompleteElement) {
        modalWarn("submitModalSearch: AppState.dom.searchAutocompleteElement is NULL.");
        return;
    }
    
    modalLog("submitModalSearch: window.modalAutocompletePlace IS:", window.modalAutocompletePlace);
    modalLog("submitModalSearch: modalSearchAutocomplete.value IS:", modalSearchAutocomplete.value, "(type: " + typeof modalSearchAutocomplete.value + ")");

    let searchTerm = "";
    let placeToUseForSearch = window.modalAutocompletePlace || null;

    if (placeToUseForSearch && placeToUseForSearch.geometry) {
        searchTerm = (placeToUseForSearch.formatted_address || placeToUseForSearch.name || "").replace(/, USA$/, "").trim();
        modalLog("submitModalSearch: Using place from window.modalAutocompletePlace. Derived searchTerm:", `'${searchTerm}'`);
    } else {
        const rawValue = modalSearchAutocomplete.value;
        searchTerm = (typeof rawValue === 'string') ? rawValue.trim() : "";
        modalLog("submitModalSearch: No valid place from window.modalAutocompletePlace. Using raw input. Derived searchTerm:", `'${searchTerm}'`);
    }
    
    searchTerm = searchTerm.trim(); // Final trim

    if (searchTerm) { 
        modalLog("submitModalSearch: searchTerm is VALID:", `'${searchTerm}'`, ". Proceeding with search logic.");
        // ... rest of the if block
        dom.searchAutocompleteElement.value = searchTerm;
        AppState.lastPlaceSelectedByAutocomplete = placeToUseForSearch;
        
        if (placeToUseForSearch && placeToUseForSearch.geometry) {
            const locationDataForCookie = { term: searchTerm, place: placeToUseForSearch };
            setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify(locationDataForCookie), COOKIE_EXPIRY_DAYS);
            modalLog("Cookie set from modal submit:", locationDataForCookie);
        }

        window.modalAutocompletePlace = null; 
        closeInitialSearchModal();

        modalLog("submitModalSearch: typeof attemptMapInitialization:", typeof attemptMapInitialization);
        modalLog("submitModalSearch: typeof handleSearch:", typeof handleSearch);

        if (typeof attemptMapInitialization === "function") {
            modalLog("Modal submitted, attempting map initialization THEN search...");
            attemptMapInitialization().then(() => { 
                modalLog("Map initialization promise resolved/completed. Now calling handleSearch.");
                if (typeof handleSearch === "function") { 
                    handleSearch();
                } else { modalError("submitModalSearch: handleSearch function not found AFTER map init attempt!"); }
            }).catch(err => {
                modalError("Error during map initialization from modal:", err);
                if (typeof handleSearch === "function") handleSearch();
            });
        } else {
            modalError("submitModalSearch: attemptMapInitialization function not found!");
            if (typeof handleSearch === "function") handleSearch();
        }

    } else { 
        modalLog("submitModalSearch: searchTerm is EMPTY. Focusing input and showing error style.");
        // ... rest of the else block (focus input, error styling)
        modalSearchAutocomplete.focus(); 
        const internalInput = modalSearchAutocomplete.shadowRoot?.querySelector('input');
        if (internalInput) {
            internalInput.classList.add('border-red-500');
            setTimeout(() => internalInput.classList.remove('border-red-500'), 2000);
        } else {
            modalSearchAutocomplete.style.border = "1px solid red";
            setTimeout(() => modalSearchAutocomplete.style.border = "", 2000);
        }
    }
}   

function initializeModalLogic(showModalFlag) {
    console.log(`[ModalLogic-DEBUG] initializeModalLogic CALLED with showModalFlag: ${showModalFlag}. Timestamp:`, Date.now());
    modalLog("initializeModalLogic called. showModalFlag:", showModalFlag);
    const dom = AppState.dom;

    const initialSearchModal = dom.initialSearchModal;
    const modalSearchAutocompleteElem = dom.modalSearchAutocompleteElement;
    const modalSearchButton = dom.modalSearchButton;
    const modalSkipButton = dom.modalSkipButton;

    if (!initialSearchModal || !modalSearchAutocompleteElem || !modalSearchButton || !modalSkipButton) {
        modalWarn("initializeModalLogic: One or more core modal DOM elements (from AppState.dom) missing.");
        return;
    }
    
    if (showModalFlag) {
        console.log('[ModalLogic-DEBUG] initializeModalLogic: showModalFlag is true, calling openInitialSearchModal. Timestamp:', Date.now());
        openInitialSearchModal();
    } else {
        // If the modal is not supposed to be shown, ensure it's hidden.
        console.log('[ModalLogic-DEBUG] initializeModalLogic: showModalFlag is false, EXPLICITLY HIDING initialSearchModal. Timestamp:', Date.now());
        if (initialSearchModal) {
            initialSearchModal.style.display = 'none';
            initialSearchModal.classList.remove('modal-open'); // Remove transition class
        }
        // And ensure modal-active is NOT on the body if no other overlays are active
        // This check is crucial if 'modal-active' was somehow left behind
        if (AppState.dom &&
            !AppState.dom.detailsOverlayShopElement?.classList.contains('is-open') &&
            !AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open') &&
            document.body.classList.contains('modal-active')) { // Only remove if it's there
            console.log('[ModalLogic-DEBUG] initializeModalLogic: showModalFlag is false and no other overlays open, REMOVING "modal-active" from body.');
            document.body.classList.remove('modal-active');
        }
    }

    modalSearchButton.addEventListener('click', submitModalSearch);
    modalSearchAutocompleteElem.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { e.preventDefault(); submitModalSearch(); }
    });
    modalSkipButton.addEventListener('click', () => {
         closeInitialSearchModal();
        // ALWAYS set to Portland, Maine on skip
        if (dom.searchAutocompleteElement) { // Ensure element exists
            dom.searchAutocompleteElement.value = "Portland, Maine";
            AppState.lastPlaceSelectedByAutocomplete = null; // Let handleSearch geocode "Portland, Maine"

            if (typeof DEFAULT_PORTLAND_CENTER !== 'undefined') { // Check if constant is available
                const portlandPlaceForCookie = {
                    name: "Portland, Maine",
                    formatted_address: "Portland, ME, USA", // General formatted address
                    geometry: { location: DEFAULT_PORTLAND_CENTER } // Use Portland's coordinates
                };
                const portlandCookieData = { term: "Portland, Maine", place: portlandPlaceForCookie };
                setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify(portlandCookieData), COOKIE_EXPIRY_DAYS);
                modalLog("Cookie set to default (Portland, Maine) on modal skip.");
            } else {
                modalWarn("DEFAULT_PORTLAND_CENTER not defined. Cookie for Portland not fully set on skip.");
            }
        } else {
            modalWarn("Main search autocomplete element not found on modal skip. Cannot set Portland default.");
         }

         // Trigger map initialization THEN search
         if (typeof attemptMapInitialization === "function") {
            modalLog("Modal skipped, attempting map initialization THEN search (for Portland, Maine)...");
             attemptMapInitialization().then(() => {
                 if (typeof handleSearch === "function") { 
                     handleSearch();
                 } else { modalError("modalSkipButton: handleSearch function not found AFTER map init attempt!");}
             }).catch(err => {
                 modalError("Error during map initialization from modal skip:", err);
                 if (typeof handleSearch === "function") handleSearch();
             });
         } else {
            modalError("modalSkipButton: attemptMapInitialization function not found!");
             if (typeof handleSearch === "function") handleSearch();
         }
     });

    if (AppState.mapsApiReady) {
        modalLog("initializeModalLogic: Maps API was ALREADY ready. Calling setupModalAutocompleteEventListeners().");
        setupModalAutocompleteEventListeners();
    } else {
        modalLog("initializeModalLogic: Maps API NOT YET ready. Modal autocomplete listeners will be set by initAppMap.");
    }
}