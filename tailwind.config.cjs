// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom smooth transition timing functions
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',        // Material Design standard
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',      // Decelerate
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',     // Accelerate
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Slight overshoot
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-like bounce
      },
      // Custom transition durations
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        cardHover: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '100%': { transform: 'scale(1.02) translateY(-4px)' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        expandHeight: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '1000px', opacity: '1' },
        },
        collapseHeight: {
          '0%': { maxHeight: '1000px', opacity: '1' },
          '100%': { maxHeight: '0', opacity: '0' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        slideUp: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slideOutRight: 'slideOutRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        slideInLeft: 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slideOutLeft: 'slideOutLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        fadeIn: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fadeOut: 'fadeOut 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleOut: 'scaleOut 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        cardHover: 'cardHover 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        dotPulse: 'dotPulse 1.5s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        expandHeight: 'expandHeight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        collapseHeight: 'collapseHeight 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Box shadow with smooth glow effect
      boxShadow: {
        'glow-sm': '0 0 10px -3px currentColor',
        'glow': '0 0 15px -3px currentColor',
        'glow-lg': '0 0 25px -5px currentColor',
        'lift': '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'lift-lg': '0 20px 35px -10px rgba(0, 0, 0, 0.2), 0 10px 15px -8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
};