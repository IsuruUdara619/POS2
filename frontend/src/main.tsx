import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './services/logger';
import { errorReporter } from './services/errorReporter';
import './assets/fonts.css';

// Initialize error reporter (sets up global error handlers)
errorReporter.reportInfo('Application Starting', {
  url: window.location.href,
  timestamp: new Date().toISOString()
});

// Log app initialization
logger.info('Application Starting', {
  url: window.location.href,
  timestamp: new Date().toISOString()
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
