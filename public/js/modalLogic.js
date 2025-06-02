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
    
    if (typeof MAINE_BOUNDS_LITERAL !== 'undefined' && MAINE_BOUNDS_LITERAL) {
        const biasRect = `rectangle:${MAINE_BOUNDS_LITERAL.sw.lat},${MAINE_BOUNDS_LITERAL.sw.lng},${MAINE_BOUNDS_LITERAL.ne.lat},${MAINE_BOUNDS_LITERAL.ne.lng}`;
        if (!modalSearchAutocomplete.getAttribute('location-bias')) modalSearchAutocomplete.locationBias = biasRect;
        if (!modalSearchAutocomplete.getAttribute('location-restriction')) modalSearchAutocomplete.locationRestriction = biasRect;
    } else { /* ... warn ... */ }
    if (!modalSearchAutocomplete.getAttribute('country')) modalSearchAutocomplete.country = "us";
    if (!modalSearchAutocomplete.getAttribute('place-fields')) modalSearchAutocomplete.placeFields = "name,formatted_address,geometry,address_components,place_id,types";

// In modalLogic.js, inside setupModalAutocompleteEventListeners
// In modalLogic.js, inside setupModalAutocompleteEventListeners
// In modalLogic.js, inside setupModalAutocompleteEventListeners

const modalPlaceChangeListener = (event) => { // LISTENING TO 'gmp-select' NOW
    modalLog("--- MODAL GMP-SELECT EVENT (from modalLogic.js) ---");
    modalLog("  Full event object:", event); 
    
    let selectedPlaceObject = null;

    // Scenario 1: The event object itself has a 'place' property (as your log suggests)
    if (event.place && typeof event.place === 'object' && event.place.geometry) {
        modalLog("  SUCCESS: Found Place object directly on 'event.place':", event.place);
        selectedPlaceObject = event.place;
    } 
    // Scenario 2: Data is in event.detail.place (common for custom events)
    else if (event.detail && typeof event.detail.place === 'object' && event.detail.place.geometry) {
        modalLog("  Found Place object in 'event.detail.place':", event.detail.place);
        selectedPlaceObject = event.detail.place;
    }
    // Scenario 3: Data is event.detail itself (less common for this structure)
    else if (event.detail && typeof event.detail === 'object' && event.detail.geometry) {
        modalLog("  'event.detail' itself appears to be the Place object:", event.detail);
        selectedPlaceObject = event.detail;
    }
    // Scenario 4: Data is on event.target.place (original expectation)
    else if (event.target && event.target.place && typeof event.target.place === 'object' && event.target.place.geometry) {
        modalLog("  Found Place object on 'event.target.place':", event.target.place);
        selectedPlaceObject = event.target.place;
    } else {
        modalWarn("  Could not find a valid Place object on event, event.detail, or event.target.place synchronously.");
    }

    // Log the component's own value property, though it might still be undefined
    if (event.target) {
        modalLog("  event.target.value (synchronous):", event.target.value);
    }

    window.modalAutocompletePlace = selectedPlaceObject;
    modalLog("  window.modalAutocompletePlace NOW SET TO:", window.modalAutocompletePlace);

    // We don't need the setTimeout if event.place gives us the data directly.
    // If event.place is consistently the source, the setTimeout logic becomes a fallback.

    // Optional: If event.place works, we can try to see if event.target.place gets updated shortly after
    if (selectedPlaceObject && event.target) {
        setTimeout(() => {
            modalLog("  (setTimeout) Checking event.target properties again:");
            modalLog("    event.target.place (after timeout):", event.target.place);
            modalLog("    event.target.value (after timeout):", event.target.value);
            // If window.modalAutocompletePlace wasn't set by event.place, maybe it's set now on event.target.place
            if (!window.modalAutocompletePlace && event.target.place && event.target.place.geometry) {
                modalLog("    (setTimeout) Updating window.modalAutocompletePlace from event.target.place");
                window.modalAutocompletePlace = event.target.place;
            }
        }, 0);
    }
    
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
    modalLog("openInitialSearchModal called.");
    // Use AppState.dom if populated, otherwise fallback (though it should be populated by main.js first)
    const initialSearchModal = AppState.dom?.initialSearchModal || document.getElementById('initialSearchModal');
    if (!initialSearchModal) { 
        modalWarn("openInitialSearchModal: initialSearchModal element not found."); 
        return; 
    }
    document.body.classList.add('modal-active');
    initialSearchModal.style.display = 'flex';
    requestAnimationFrame(() => { initialSearchModal.classList.add('modal-open'); });
}

function closeInitialSearchModal() {
    modalLog("closeInitialSearchModal called.");
    const initialSearchModal = AppState.dom?.initialSearchModal || document.getElementById('initialSearchModal');
    if (!initialSearchModal) return;

    initialSearchModal.classList.remove('modal-open');
    setTimeout(() => {
        if (!initialSearchModal.classList.contains('modal-open')) {
            initialSearchModal.style.display = 'none';
            const dom = window.AppState?.dom;
            if (dom) { /* ... check other overlays ... */ } else { document.body.classList.remove('modal-active'); }
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
    modalLog("initializeModalLogic called. showModalFlag:", showModalFlag);
    const dom = AppState.dom;

    // Use elements from AppState.dom now
    const initialSearchModal = dom.initialSearchModal; 
    const modalSearchAutocompleteElem = dom.modalSearchAutocompleteElement; 
    const modalSearchButton = dom.modalSearchButton;
    const modalSkipButton = dom.modalSkipButton;

    if (!initialSearchModal || !modalSearchAutocompleteElem || !modalSearchButton || !modalSkipButton) {
        modalWarn("initializeModalLogic: One or more core modal DOM elements (from AppState.dom) missing.");
        return; 
    }
    
    if (showModalFlag) {
        openInitialSearchModal();
    }

    modalSearchButton.addEventListener('click', submitModalSearch);
    modalSearchAutocompleteElem.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { e.preventDefault(); submitModalSearch(); }
    });
    modalSkipButton.addEventListener('click', () => {
        closeInitialSearchModal();
        if (dom.searchAutocompleteElement && dom.searchAutocompleteElement.value.trim() === "" && typeof DEFAULT_MAP_CENTER !== 'undefined') {
            dom.searchAutocompleteElement.value = "Biddeford, Maine"; 
            AppState.lastPlaceSelectedByAutocomplete = null; // No specific place from skip
            // Set a default cookie if desired, or let handleSearch do it with the default term
            const defaultPlaceForCookie = {
                name: "Biddeford, Maine",
                formatted_address: "Biddeford, ME, USA", // Example
                geometry: { location: DEFAULT_MAP_CENTER }
            };
            const defaultCookieData = { term: "Biddeford, Maine", place: defaultPlaceForCookie };
            setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify(defaultCookieData), COOKIE_EXPIRY_DAYS);
            modalLog("Cookie set to default (Biddeford) on modal skip.");
        }
        // Trigger map initialization THEN search
        if (typeof attemptMapInitialization === "function") {
            modalLog("Modal skipped, attempting map initialization THEN search...");
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