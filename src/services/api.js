// src/services/api.js
import axios from 'axios';
import { getApiBaseUrl } from '../config';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // You can modify successful responses here
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors) {
            Object.values(data.errors).forEach((errorMsg) => {
              toast.error(errorMsg);
            });
          } else {
            toast.error(data.message || 'Validation failed.');
          }
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data?.message || 'An error occurred.');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response received:', error.request);
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints object for easy reference
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  UPDATE_PASSWORD: '/auth/update-password',
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  SALES_TREND: '/dashboard/sales/trend',
  TOP_SELLING_PRODUCTS: (limit = 5) => `/dashboard/products/top-selling?limit=${limit}`,
  RECENT_SALES: (limit = 5) => `/dashboard/sales/recent?limit=${limit}`,
  REVENUE_BY_CATEGORY: '/dashboard/revenue-by-category',
  INVENTORY_SUMMARY: '/dashboard/inventory-summary',
  SUPPLIER_PERFORMANCE: '/dashboard/supplier-performance',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  PRODUCT_STOCK: (id) => `/products/${id}/stock`,
  
  // Categories
  CATEGORIES: '/categories',
  
  // Suppliers
  SUPPLIERS: '/suppliers',
  
  // Sales
  SALES: '/sales',
  SALE_BY_ID: (id) => `/sales/${id}`,
  SALE_INVOICE: (id) => `/sales/${id}/invoice`,
  
  // Reports
  REPORTS: '/reports',
  SALES_REPORT: '/reports/sales',
  INVENTORY_REPORT: '/reports/inventory',
  FINANCIAL_REPORT: '/reports/financial',
};

export default api;