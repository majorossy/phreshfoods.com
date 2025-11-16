/// <reference types="vite/client" />

// Instagram Embed API
interface Window {
  instgrm?: {
    Embeds: {
      process: () => void;
    };
  };
  // Twitter/X Widgets API
  twttr?: {
    widgets: {
      load: (el?: HTMLElement) => void;
    };
  };
}
