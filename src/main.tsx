// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

import './index.css'; // <--- THIS IS THE CRUCIAL IMPORT

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
} else {
  console.error(
    "Failed to find the root element. Ensure your public/index.html has an element with id='root'."
  );
}