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
 * Checks whether the current browser context qualifies as the App Workspace domain.
 */
export const isAppDomain = (): boolean => {
  return !isMarketingDomain();
};
