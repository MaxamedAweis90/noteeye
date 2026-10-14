import { MARKETING_URL } from '../api/client';
import { isPWAMode } from '../pwa/registerSW';

export type SessionTerminationReason = 'logout' | 'unauthorized' | 'revoked';

/**
 * Handles session termination (explicit logout, token revocation, or 401 session expiry).
 * 
 * Rules:
 * 1. PWA Standalone Mode:
 *    User MUST remain inside the standalone app window.
 *    Redirects to: app-noteeye.vercel.app/login?reason=...
 * 
 * 2. Web App Workspace (app-noteeye.vercel.app) in standard browser:
 *    User is directed to the main marketing domain:
 *    Redirects to: https://noteeye.vercel.app?reason=...
 * 
 * 3. Local Development (localhost):
 *    Redirects cleanly to /login?reason=...
 */
export function handleSessionEndRedirect(reason: SessionTerminationReason = 'logout'): void {
  if (typeof window === 'undefined') return;

  // 1. PWA Standalone Invariant: NEVER kick user out of standalone app window
  if (isPWAMode()) {
    window.location.replace(`/login?reason=${reason}`);
    return;
  }

  // 2. Local development fallback
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    window.location.replace(`/login?reason=${reason}`);
    return;
  }

  // 3. Production Web App: Redirect strictly to the marketing domain noteeye.vercel.app
  try {
    const targetUrl = new URL(MARKETING_URL);
    if (reason) {
      targetUrl.searchParams.set('reason', reason);
    }
    window.location.replace(targetUrl.toString());
  } catch {
    window.location.replace(`${MARKETING_URL}?reason=${reason}`);
  }
}
