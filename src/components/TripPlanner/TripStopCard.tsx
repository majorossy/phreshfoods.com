// src/components/TripPlanner/TripStopCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TripStop } from '../../types/trip';

interface TripStopCardProps {
  stop: TripStop;
  index: number;
  onRemove: (stopId: string) => void;
}

export const TripStopCard: React.FC<TripStopCardProps> = ({ stop, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 flex items-center space-x-3 ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>

      {/* Stop Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
        {index + 1}
      </div>

      {/* Shop Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {stop.shop.Name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {stop.shop.City}, {stop.shop.type.replace('_', ' ')}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(stop.id)}
        className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        aria-label="Remove stop"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
