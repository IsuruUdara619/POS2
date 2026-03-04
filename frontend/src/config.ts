// Global configuration for the frontend application

// Use relative path to leverage Vite proxy in development and absolute URL in Electron
// In Electron, the frontend is loaded via file:// protocol, so we need absolute URL
export const API_BASE_URL = window.location.protocol === 'file:' 
  ? 'http://localhost:5000/api'  // Electron packaged app
  : '/api';  // Development with Vite proxy
