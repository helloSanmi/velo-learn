
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './frontend/App';
import { mockDataService } from './frontend/services/mockDataService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * Bootstraps the application by initializing the monolithic 
 * local storage database and then rendering the UI.
 */
const startApp = async () => {
  // Initialize monolithic store
  await mockDataService.init();

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Fire the application startup
startApp();
