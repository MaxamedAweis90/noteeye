import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSyncStore } from '../store/syncStore';
import { addToOutbox } from '../lib/offlineDb';

const isWrite = (method?: string) =>
  !!method && ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
const isTracked = (config?: { method?: string; url?: string }) =>
  isWrite(config?.method) && !(config?.url || '').includes('/auth/');

export const getBaseUrl = (): string => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    // In production on Vercel, use same-origin /api (Vercel rewrites proxy to noteeye-server)
    // This avoids cross-domain CORS preflight drops and 3rd-party cookie/header restrictions on mobile devices
    return `${window.location.origin}/api`;
  }
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

export const BASE_URL = getBaseUrl();

export const getAppUrl = (): string => {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (
    envUrl &&
    envUrl !== 'https://noteeye.vercel.app' &&
    envUrl !== 'http://noteeye.vercel.app'
  ) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    // If on production marketing domain, app workspace is strictly app-noteeye.vercel.app
    if (
      hostname === 'noteeye.vercel.app' ||
      hostname === 'noteeye.com' ||
      hostname === 'www.noteeye.com' ||
      hostname.includes('marketing')
    ) {
      return 'https://app-noteeye.vercel.app';
    }
    // If on localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }
  return 'https://app-noteeye.vercel.app';
};

export const APP_URL = getAppUrl();

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

// Request Interceptor: Attach bearer token and idempotency key
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

    // Attach Idempotency-Key on mutating requests
    if (isWrite(config.method) && config.headers && !config.headers.get('Idempotency-Key')) {
      const key =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      config.headers.set('Idempotency-Key', key);
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
      const isNetworkIssue =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        !error.response ||
        error.code === 'ERR_NETWORK';

      if (isNetworkIssue && error.config) {
        addToOutbox({
          endpoint: error.config.url || '',
          method: (error.config.method?.toUpperCase() || 'POST') as any,
          payload: error.config.data
            ? typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : error.config.data
            : undefined,
          type: 'MUTATION',
        }).catch(() => null);
      }

      useSyncStore
        .getState()
        .endWrite(false, error.response?.data?.message || (isNetworkIssue ? 'Saved offline. Will sync when reconnected.' : error.message));
    }
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't auto-redirect or clear if it's a failed login attempt
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        try {
          const message = error.response?.data?.message || '';
          const isRevoked = typeof message === 'string' && message.toLowerCase().includes('revoked');
          localStorage.removeItem('noteeye_auth_token');
          try {
            localStorage.removeItem('noteeye-drive-storage');
          } catch {}
          window.dispatchEvent(
            new CustomEvent('noteeye:unauthorized', { detail: { isRevoked, message } })
          );
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
