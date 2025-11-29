// src/components/Filters/ProductFilterDropdown.tsx
import React, { useRef, useEffect } from 'react';
import ProductIconGrid from '../UI/ProductIconGrid';
import { useFilters } from '../../contexts/FilterContext';
import type { LocationType } from '../../types/shop';

interface ProductFilterDropdownProps {
  category: string;
  products: Record<string, any>; // Product config for this category
  locationType: LocationType; // Location type to get category order
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const ProductFilterDropdown: React.FC<ProductFilterDropdownProps> = ({
  category,
  products,
  locationType,
  isOpen,
  onClose,
  buttonRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeProductFilters, toggleFilter } = useFilters();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[420px]"
      role="dialog"
      aria-label={`${category} product filters`}
    >
      {/* Product Grid with Categories */}
      <ProductIconGrid
        displayMode="filter-selector"
        products={products}
        locationType={locationType}
        activeFilters={activeProductFilters}
        onProductClick={toggleFilter}
        iconSize="md"
        showCategories={true}
      />

      {/* Footer with close button */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProductFilterDropdown;
