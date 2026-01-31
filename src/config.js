// src/config.js

// Development/Production configuration
const config = {
  // API Base URL - Change this to your deployed backend URL
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://inventory-api-m7d5.onrender.com/api',
  
  // App configuration
  APP_NAME: 'Inventory Management System',
  VERSION: '1.0.0',
  
  // Default settings
  DEFAULT_PAGE_SIZE: 10,
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
};

// Environment check helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Get the appropriate API URL
export const getApiBaseUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use localhost
  if (isDevelopment) {
    return 'http://localhost:5000/api';
  }
  
  // In production, use the deployed URL
  return config.API_BASE_URL;
};

export default config;