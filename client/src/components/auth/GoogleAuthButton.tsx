import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from '@/components/ui/icons';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useSplashStore } from '../../store/splashStore';
import { useNavigate } from 'react-router-dom';
import {
  initGoogleIdentity,
  registerGoogleCallback,
  renderGoogleButton,
} from '../../lib/googleAuth';

interface GoogleAuthButtonProps {
  text?: string;
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  className?: string;
  disabled?: boolean;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 shrink-0' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text,
  mode = 'signin',
  onSuccess,
  onError,
  className = '',
  disabled = false,
}) => {
  const navigate = useNavigate();
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const fetchUserProfile = useUserStore((state) => state.fetchProfile);
  const showToast = useUIStore((state) => state.showToast);
  const triggerLoginSplash = useSplashStore((state) => state.triggerLoginSplash);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const buttonLabel = text || (mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google');

  useEffect(() => {
    if (!clientId) return;

    // Register active callback
    const unregister = registerGoogleCallback(async (response) => {
      try {
        setIsLoading(true);
        const data = await loginWithGoogle(response.credential);

        if (onSuccess) {
          onSuccess();
        } else {
          triggerLoginSplash(data.user.name, () => {
            navigate('/');
            showToast(`Signed in as ${data.user.name}`);
          });
        }

        fetchUserProfile().catch(() => {});
      } catch (err: any) {
        console.error('[GoogleAuthButton] Authentication error:', err);
        const msg = err.message || 'Google authentication failed. Please try again.';
        if (onError) {
          onError(msg);
        } else {
          showToast(msg);
        }
      } finally {
        setIsLoading(false);
      }
    });

    let pollInterval: any = null;
    let resizeTimer: any = null;

    const setupButton = () => {
      if (!window.google?.accounts?.id || !btnContainerRef.current) return false;

      // Initialize singleton
      initGoogleIdentity(clientId);

      const measuredWidth = Math.floor(
        btnContainerRef.current.getBoundingClientRect().width ||
        btnContainerRef.current.clientWidth ||
        btnContainerRef.current.parentElement?.clientWidth ||
        300
      );
      const targetWidth = Math.min(Math.max(measuredWidth, 200), 400);

      // Render official Google button into container
      const ok = renderGoogleButton(btnContainerRef.current, {
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: targetWidth,
      });

      if (ok) {
        setIsRendered(true);
      }
      return ok;
    };

    if (!setupButton()) {
      pollInterval = setInterval(() => {
        if (setupButton()) {
          clearInterval(pollInterval);
        }
      }, 150);
    }

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setupButton();
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unregister();
      if (pollInterval) clearInterval(pollInterval);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [clientId, mode, onSuccess, onError, loginWithGoogle, fetchUserProfile, navigate, showToast, triggerLoginSplash]);

  const handleManualClick = () => {
    if (!clientId) {
      const msg = 'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID.';
      if (onError) onError(msg);
      else showToast(msg);
    }
  };

  return (
    <div className={`w-full max-w-full flex flex-col items-center justify-center ${className}`}>
      {/* Container for Google's official button */}
      <div
        ref={btnContainerRef}
        className={`w-full max-w-full overflow-hidden flex justify-center min-h-[44px] rounded-xl ${
          isRendered ? 'flex' : 'hidden'
        }`}
      />

      {/* Fallback button shown while Google SDK loads or if not yet rendered */}
      {!isRendered && (
        <button
          type="button"
          onClick={handleManualClick}
          disabled={disabled || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <GoogleIcon />
          )}
          <span>{isLoading ? 'Connecting...' : buttonLabel}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleAuthButton;
