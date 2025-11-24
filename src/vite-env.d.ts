/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />
/// <reference types="@types/node" />

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
