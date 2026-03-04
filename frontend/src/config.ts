// Global configuration for the frontend application

// Use environment variable for API URL, fallback to localhost for development
// In production (Railway), VITE_API_BASE_URL must be set in build environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
