// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { loadGoogleMapsScript } from './utils/loadGoogleMapsScript';

import './index.css'; // <--- THIS IS THE CRUCIAL IMPORT

// Load Google Maps API before rendering the app
// Error handling is done in SearchContext after ToastProvider is mounted
loadGoogleMapsScript().catch(() => {
  // Error will be shown via toast in SearchContext
});

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}