import React, { useMemo, useEffect } from 'react';
import { AppRouter } from '../router/AppRouter';
import { LandingPage } from '../pages/LandingPage';
import { APP_URL, MARKETING_URL } from '../api/client';
import { isMarketingDomain } from '../utils/domain';
import { SplashScreen } from '../components/common/SplashScreen';
import { SyncProvider } from '../components/SyncProvider';

export { isMarketingDomain };

/**
 * Dynamic Hostname Routing Controller
 * 
 * Evaluation Logic:
 * 1. If on 'app-noteeye.vercel.app' (or localhost app workspace):
 *    - Landing page NEVER lives here.
 *    - Visiting '/landing' immediately redirects to https://noteeye.vercel.app (preserving query params).
 *    - All routes handled by <AppRouter />, with <SplashScreen /> active for initial boot, auth, login, and logout.
 * 2. If on 'noteeye.vercel.app' (Marketing Domain):
 *    - Deep app workspace links redirect to https://app-noteeye.vercel.app.
 *    - Root '/' and '/landing' render <LandingPage /> directly with ZERO splash screens.
 * 3. Local Development (localhost):
 *    - Defaults to Workspace App (localhost:5173/) with splash screen active.
 *    - Allows previewing Landing Page via localhost:5173/landing or ?mode=landing with splash screens disabled.
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

  return (
    <SyncProvider>
      <SplashScreen />
      <AppRouter />
    </SyncProvider>
  );
};

export default HostRouter;

