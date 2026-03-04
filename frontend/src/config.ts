// Global configuration for the frontend application

// Points directly to backend for both local dev and docker production
// Since Nginx proxy is removed, we must use the absolute URL
export const API_BASE_URL = 'http://localhost:5000/api';
