import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { APP_URL } from '../../api/client';
import {
  initGoogleIdentity,
  registerGoogleCallback,
  promptGoogleOneTap,
} from '../../lib/googleAuth';

interface GoogleOneTapProps {
  onSuccess?: (token: string) => void;
  onError?: (err: Error) => void;
}

/**
 * Google One Tap Floating Prompt Component
 * Renders the native Google One Tap sign-in prompt at the upper-right corner of the landing page.
 * When authenticated, synchronizes the auth token across subdomains and routes to the app workspace.
 */
export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({ onSuccess, onError }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const promptAttemptedRef = useRef(false);

  useEffect(() => {
    // 1. If user is actively authenticated in the store, do not display One Tap
    if (isAuthenticated) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      console.warn('[GoogleOneTap] VITE_GOOGLE_CLIENT_ID is not set in client environment.');
      return;
    }

    if (promptAttemptedRef.current) return;

    // 2. Register callback for credential return
    const unregister = registerGoogleCallback(async (response) => {
      try {
        const data = await authApi.loginWithGoogle(response.credential);

        localStorage.setItem('noteeye_auth_token', data.token);
        useAuthStore.getState().login(data.token, data.user);

        if (onSuccess) {
          onSuccess(data.token);
        } else {
          // Direct cross-domain sync to app workspace
          const targetAppUrl = APP_URL || 'https://app-noteeye.vercel.app';
          const separator = targetAppUrl.includes('?') ? '&' : '?';
          const redirectUrl = `${targetAppUrl.replace(/\/+$/, '')}/${separator}auth_token=${encodeURIComponent(data.token)}`;

          window.location.href = redirectUrl;
        }
      } catch (err: any) {
        console.error('[GoogleOneTap] Authentication error:', err);
        if (onError) onError(err);
      }
    });

    let pollTimer: any = null;

    const tryPrompt = () => {
      if (!window.google?.accounts?.id) return false;

      promptAttemptedRef.current = true;
      initGoogleIdentity(clientId);
      promptGoogleOneTap();
      return true;
    };

    if (!tryPrompt()) {
      pollTimer = setInterval(() => {
        if (tryPrompt()) {
          clearInterval(pollTimer);
        }
      }, 150);
    }

    return () => {
      unregister();
      if (pollTimer) clearInterval(pollTimer);
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {}
      }
    };
  }, [isAuthenticated, onSuccess, onError]);

  return <div id="google-one-tap-container" className="fixed top-4 right-4 z-[999999]" />;
};

export default GoogleOneTap;
