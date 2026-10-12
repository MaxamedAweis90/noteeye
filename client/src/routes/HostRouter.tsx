import React, { useMemo, useEffect } from 'react';
import { AppRouter } from '../router/AppRouter';
import { LandingPage } from '../pages/LandingPage';
import { APP_URL } from '../api/client';

/**
 * Checks whether the current browser hostname or path qualifies as the Marketing / Landing domain.
 */
export const isMarketingDomain = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Explicit local development or preview toggle:
  // e.g. http://localhost:5173/landing or http://localhost:5173/?mode=landing
  if (
    pathname === '/landing' ||
    pathname.startsWith('/landing/') ||
    searchParams.get('mode') === 'landing' ||
    searchParams.get('domain') === 'marketing'
  ) {
    return true;
  }

  // 2. Production Marketing Domain & Apex domains
  if (
    hostname === 'noteeye.vercel.app' ||
    hostname === 'noteeye.com' ||
    hostname === 'www.noteeye.com' ||
    hostname === 'marketing.noteeye.com'
  ) {
    return true;
  }

  return false;
};

/**
 * Dynamic Hostname Routing Controller
 * 
 * Evaluation Logic:
 * 1. If hostname is 'noteeye.vercel.app' (or root marketing domain):
 *    - Route '/' and '/landing' to <LandingPage />
 *    - Any app workspace deep links redirect to https://app-noteeye.vercel.app
 * 2. If hostname is 'app-noteeye.vercel.app' (or localhost):
 *    - Route to Noteeye Workspace SPA (<AppRouter />)
 * 3. Local Development Fallback:
 *    - Defaults to Workspace App (localhost:5173/)
 *    - Allows toggling to Landing Page via localhost:5173/landing or ?mode=landing
 */
export const HostRouter: React.FC = () => {
  const isMarketing = useMemo(() => isMarketingDomain(), []);

  useEffect(() => {
    // If on the production marketing domain and hitting deep app paths (e.g., /login, /notes/123),
    // redirect to the dedicated app domain
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname;

    if (
      (hostname === 'noteeye.vercel.app' || hostname === 'noteeye.com') &&
      pathname !== '/' &&
      pathname !== '/landing' &&
      !pathname.startsWith('/#')
    ) {
      window.location.replace(`${APP_URL}${pathname}${window.location.search}`);
    }
  }, []);

  if (isMarketing) {
    const pathname = window.location.pathname;
    if (pathname === '/' || pathname === '/landing' || pathname === '') {
      return <LandingPage />;
    }
  }

  return <AppRouter />;
};

export default HostRouter;
