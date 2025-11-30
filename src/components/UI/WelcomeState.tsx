// src/components/UI/WelcomeState.tsx
import React from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { LocationType } from '../../types/shop';

interface CategoryCard {
  type: LocationType;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
}

const categories: CategoryCard[] = [
  {
    type: 'farm_stand',
    emoji: '🌾',
    title: 'Farm Stands',
    subtitle: 'Fresh produce & local goods',
    gradient: 'from-green-400 to-green-600'
  },
  {
    type: 'cheese_shop',
    emoji: '🧀',
    title: 'Cheesemongers',
    subtitle: 'Artisanal cheeses',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  {
    type: 'fish_monger',
    emoji: '🐟',
    title: 'Fishmongers',
    subtitle: 'Fresh seafood daily',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    type: 'butcher',
    emoji: '🥩',
    title: 'Butcher Shops',
    subtitle: 'Quality meats & cuts',
    gradient: 'from-red-400 to-red-600'
  },
  {
    type: 'antique_shop',
    emoji: '🏺',
    title: 'Antique Shops',
    subtitle: 'Unique treasures & finds',
    gradient: 'from-purple-400 to-purple-600'
  }
];

const WelcomeState: React.FC = () => {
  const { setActiveLocationTypes, setActiveProductFilters } = useFilters();

  const handleCategoryClick = (type: LocationType) => {
    // Set only the selected location type
    setActiveLocationTypes(new Set([type]));
    // Clear any product filters to show all locations of this type
    setActiveProductFilters({});
  };

  return (
    <div id="welcome-state" className="flex flex-col items-center justify-start py-8 px-4 text-center animate-fadeIn">
      {/* Header Section */}
      <div id="welcome-header" className="mb-8 max-w-2xl bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-200/50">
        <div className="mb-3">
          <span className="text-5xl" role="img" aria-label="Maine pine tree">🌲</span>
        </div>
        <h2 id="welcome-title" className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to phind.us
        </h2>
        <p id="welcome-tagline" className="text-lg text-gray-600 leading-relaxed">
          Discover Maine's finest local food and artisan goods
        </p>
      </div>

      {/* Category Cards Grid */}
      <div className="w-full max-w-4xl mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category.type}
              onClick={() => handleCategoryClick(category.type)}
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 bg-white/95 backdrop-blur-sm border border-gray-200/50"
              aria-label={`Browse ${category.title}`}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative p-6 flex flex-col items-center justify-center min-h-[140px]">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {category.emoji}
                </div>
                <h3 id={`category-title-${category.type}`} className="text-sm font-semibold text-gray-900 mb-1">
                  {category.title}
                </h3>
                <p id={`category-subtitle-${category.type}`} className="text-xs text-gray-600">
                  {category.subtitle}
                </p>
              </div>

              {/* Hover border effect */}
              <div className={`absolute inset-0 border-2 border-transparent group-hover:border-current bg-gradient-to-br ${category.gradient} bg-clip-text text-transparent rounded-xl pointer-events-none`} />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Help Text */}
      <div id="welcome-help" className="max-w-xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200/50">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span id="welcome-filter-hint">Or use the <strong>Filters</strong> menu above to find exactly what you need</span>
        </div>

        {/* Popular searches hint */}
        <div id="popular-searches" className="text-xs text-gray-500">
          <p id="popular-searches-label" className="mb-2 font-medium">Popular searches:</p>
          <p id="popular-searches-list" className="leading-relaxed">
            Fresh Eggs • Raw Milk • Grass-Fed Beef • Local Honey • Artisan Cheese • Day-Boat Seafood
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeState;
