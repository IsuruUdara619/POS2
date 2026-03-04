// Global configuration for the frontend application

// Use environment variable for API URL, fallback to localhost for development
// In production (Railway), VITE_API_BASE_URL must be set in build environment variables
let apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Ensure API URL ends with /api
if (!apiUrl.endsWith('/api')) {
  // Remove trailing slash if present
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }
  // Check again and append if needed
  if (!apiUrl.endsWith('/api')) {
    apiUrl += '/api';
  }
}

export const API_BASE_URL = apiUrl;
