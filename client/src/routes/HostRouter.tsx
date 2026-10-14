import React, { useMemo, useEffect } from 'react';
import { AppRouter } from '../router/AppRouter';
import { LandingPage } from '../pages/LandingPage';
import { APP_URL, MARKETING_URL } from '../api/client';
import { isPWAMode } from '../pwa/registerSW';

/**
 * Checks whether the current browser hostname or path qualifies as the Marketing / Landing domain.
 * Strictly guarantees that app-noteeye.vercel.app is NEVER treated as the marketing domain.
 */
export const isMarketingDomain = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Strict App Workspace Firewall:
  // app-noteeye.vercel.app and PWA standalone mode are NEVER marketing domain
  if (
    hostname === 'app-noteeye.vercel.app' ||
    hostname.includes('app-noteeye') ||
    isPWAMode()
  ) {
    return false;
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

  // 3. Local Development Fallback (localhost / 127.0.0.1):
  // Allows testing landing page locally via /landing or ?mode=landing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (
      pathname === '/landing' ||
      pathname.startsWith('/landing/') ||
      searchParams.get('mode') === 'landing' ||
      searchParams.get('domain') === 'marketing'
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Dynamic Hostname Routing Controller
 * 
 * Evaluation Logic:
 * 1. If on 'app-noteeye.vercel.app':
 *    - Landing page NEVER lives here.
 *    - Visiting '/landing' immediately redirects to https://noteeye.vercel.app (preserving query params).
 *    - All routes handled by <AppRouter />.
 * 2. If on 'noteeye.vercel.app' (Marketing Domain):
 *    - Deep app workspace links redirect to https://app-noteeye.vercel.app.
 *    - Root '/' and '/landing' render <LandingPage />.
 * 3. Local Development (localhost):
 *    - Defaults to Workspace App (localhost:5173/).
 *    - Allows previewing Landing Page via localhost:5173/landing or ?mode=landing.
 */
export const HostRouter: React.FC = () => {
  const isMarketing = useMemo(() => isMarketingDomain(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname;
    const search = window.location.search;

    // Rule A: If visiting /landing on the app workspace domain, redirect to marketing domain
    if (
      (hostname === 'app-noteeye.vercel.app' || hostname.includes('app-noteeye')) &&
      (pathname === '/landing' || pathname.startsWith('/landing/'))
    ) {
      window.location.replace(`${MARKETING_URL}${search}`);
      return;
    }

    // Rule B: If on the production marketing domain and hitting deep app paths (e.g. /login, /notes/123),
    // redirect to the dedicated app domain
    if (
      (hostname === 'noteeye.vercel.app' || hostname === 'noteeye.com') &&
      pathname !== '/' &&
      pathname !== '/landing' &&
      !pathname.startsWith('/#')
    ) {
      window.location.replace(`${APP_URL}${pathname}${search}`);
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

