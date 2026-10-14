import { useState, useEffect, useCallback } from 'react';
import { isMarketingDomain } from '../routes/HostRouter';
import type { BeforeInstallPromptEvent } from '../types/pwa';

const PWA_DISMISSED_KEY = 'noteeye_pwa_dismissed';

/**
 * Checks whether the current hostname or route qualifies as the Noteeye App Workspace.
 * True for:
 * - app-noteeye.vercel.app
 * - localhost (when not on /landing or ?mode=landing)
 * False for:
 * - noteeye.vercel.app
 * - noteeye.com / www.noteeye.com
 * - /landing or ?mode=landing
 */
export const isAppDomain = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  // 1. Explicit domain check matching prompt specification:
  if (hostname === 'app-noteeye.vercel.app') {
    return true;
  }

  // 2. Localhost check: active on workspace routes, excluded on /landing:
  if (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    pathname !== '/landing' &&
    !pathname.startsWith('/landing/')
  ) {
    return !isMarketingDomain();
  }

  // 3. Fallback to HostRouter domain verification
  return !isMarketingDomain();
};

/**
 * Dynamically injects or removes the PWA web app manifest.
 * Ensures marketing landing page (noteeye.vercel.app) has zero manifest linkage.
 */
export function syncPWAManifest(): void {
  if (typeof window === 'undefined') return;

  const existingManifest = document.querySelector('link[rel="manifest"]');

  if (isAppDomain()) {
    if (!existingManifest) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest';
      document.head.appendChild(link);
    }
  } else {
    // Strictly strip manifest if visiting marketing landing page
    if (existingManifest) {
      existingManifest.remove();
    }
  }
}

/**
 * Conditional Service Worker lifecycle controller:
 * - Registers /sw.js ONLY on the app domain (app-noteeye.vercel.app or localhost app).
 * - On marketing domain (noteeye.vercel.app), skips registration, strips manifest,
 *   unregisters any stray service workers, and prevents install prompts.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (isAppDomain()) {
    syncPWAManifest();

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Check for service worker updates periodically (every 1 hour)
          setInterval(() => {
            registration.update().catch(() => null);
          }, 60 * 60 * 1000);
        })
        .catch((err) => {
          console.debug('[PWA] Service worker registration note:', err?.message || err);
        });
    });
  } else {
    // Marketing domain safety cleanup
    syncPWAManifest();

    // Unregister any active service workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => null);
      }
    });

    // Suppress any accidental browser install prompts on landing page
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
    });
  }
}

// Global cached deferred prompt instance
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Only capture on app domain; prevent on marketing domain
    if (!isAppDomain()) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

/**
 * Custom React Hook to manage PWA installation prompt state.
 */
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    globalDeferredPrompt
  );
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
  });

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    const handlePromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(handlePromptChange);
    return () => {
      promptListeners.delete(handlePromptChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    }
  }, []);

  const isInstallable = Boolean(deferredPrompt && !isStandalone && !isDismissed && isAppDomain());

  return {
    isInstallable,
    isInstalled: isStandalone,
    install,
    dismiss,
    isDismissed,
  };
}
