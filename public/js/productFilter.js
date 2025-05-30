// public/js/productFilter.js
'use strict';

/**
 * Populates the product filter dropdown with checkboxes.
 */
function populateProductFilterDropdown() {
    const dom = AppState.dom;
    if (!dom.productFilterCheckboxesContainer || typeof FILTERABLE_PRODUCT_ATTRIBUTES === 'undefined' || !FILTERABLE_PRODUCT_ATTRIBUTES) {
        console.warn("populateProductFilterDropdown: Checkbox container or filterable attributes missing.");
        if(dom.productFilterCheckboxesContainer) dom.productFilterCheckboxesContainer.innerHTML = '<p class="text-xs text-gray-500">No filters available.</p>';
        return;
    }
    dom.productFilterCheckboxesContainer.innerHTML = '';
    AppState.activeProductFilters = AppState.activeProductFilters || {};

    FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attrKey => {
        const attributeConfig = PRODUCT_ICONS_CONFIG[attrKey];
        if (!attributeConfig) return;

        const displayName = attributeConfig.name || (attrKey.charAt(0).toUpperCase() + attrKey.slice(1));
        const iconFileName = attributeConfig.icon_available || null;
        AppState.activeProductFilters[attrKey] = AppState.activeProductFilters[attrKey] || false;

        const label = document.createElement('label');
        label.className = 'block hover:bg-gray-100 p-1 rounded transition-colors duration-150 flex items-center cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.name = attrKey;
        checkbox.className = 'form-checkbox h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500 mr-2';
        checkbox.checked = AppState.activeProductFilters[attrKey];
        checkbox.addEventListener('change', (e) => {
            AppState.activeProductFilters[attrKey] = e.target.checked;
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') handleSearch();
        });
        label.appendChild(checkbox);
        if (iconFileName) {
            const iconImg = document.createElement('img');
            iconImg.src = `/images/icons/${iconFileName}`;
            iconImg.alt = `${displayName} icon`;
            iconImg.className = 'w-4 h-4 object-contain mr-1.5';
            label.appendChild(iconImg);
        }
        label.appendChild(document.createTextNode(displayName));
        dom.productFilterCheckboxesContainer.appendChild(label);
    });
    updateActiveFilterCountDisplay();
}

/**
 * Updates the display showing the count of active product filters.
 */
function updateActiveFilterCountDisplay() {
    const dom = AppState.dom;
    if (!dom.activeFilterCountElement || !dom.productFilterToggleElement) return;
    const count = Object.values(AppState.activeProductFilters || {}).filter(isActive => isActive).length;
    if (count > 0) {
        dom.activeFilterCountElement.textContent = `(${count})`;
        dom.activeFilterCountElement.classList.remove('hidden');
        dom.productFilterToggleElement.classList.add('filters-active');
    } else {
        dom.activeFilterCountElement.textContent = '';
        dom.activeFilterCountElement.classList.add('hidden');
        dom.productFilterToggleElement.classList.remove('filters-active');
    }
}

/**
 * Attaches event listeners specific to the product filter UI.
 */
function setupProductFilterListeners() {
    const uiDom = AppState.dom;
    if (uiDom.productFilterToggleElement && uiDom.productFilterDropdownElement && uiDom.resetProductFiltersButton) {
        populateProductFilterDropdown();

        uiDom.productFilterToggleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            uiDom.productFilterDropdownElement.classList.toggle('hidden');
        });

        uiDom.resetProductFiltersButton.addEventListener('click', () => {
            FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attr => {
                AppState.activeProductFilters[attr] = false;
                const cb = uiDom.productFilterCheckboxesContainer.querySelector(`input[name="${attr}"]`);
                if (cb) cb.checked = false;
            });
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') handleSearch();
            uiDom.productFilterDropdownElement.classList.add('hidden');
        });

        document.body.addEventListener('click', (e) => {
            if (uiDom.productFilterDropdownElement && !uiDom.productFilterDropdownElement.classList.contains('hidden')) {
                if (!uiDom.productFilterToggleElement.contains(e.target) && !uiDom.productFilterDropdownElement.contains(e.target)) {
                    uiDom.productFilterDropdownElement.classList.add('hidden');
                }
            }
        });
    } else {
        console.warn("ProductFilter.js: One or more product filter DOM elements not found.");
    }
}