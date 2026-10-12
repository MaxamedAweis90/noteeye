import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSyncStore } from '../store/syncStore';

const isWrite = (method?: string) =>
  !!method && ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
const isTracked = (config?: { method?: string; url?: string }) =>
  isWrite(config?.method) && !(config?.url || '').includes('/auth/');

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE_URL = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;

export const APP_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export const MARKETING_URL =
  import.meta.env.VITE_MARKETING_URL ||
  'https://noteeye.vercel.app';

/**
 * Standardized Noteeye API Client
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach bearer token if present in localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('noteeye_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage access issues in restricted environments
    }
    if (isTracked(config)) useSyncStore.getState().beginWrite();
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Standardize error messaging & handle 401
apiClient.interceptors.response.use(
  (response) => {
    if (isTracked(response.config)) useSyncStore.getState().endWrite(true);
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (isTracked(error.config)) {
      useSyncStore
        .getState()
        .endWrite(false, error.response?.data?.message || error.message);
    }
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't auto-redirect or clear if it's a failed login attempt
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        try {
          localStorage.removeItem('noteeye_auth_token');
          window.dispatchEvent(new CustomEvent('noteeye:unauthorized'));
        } catch {
          // Ignore
        }
      }
    }

    const customMessage =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(customMessage));
  }
);

export default apiClient;
