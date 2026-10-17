/**
 * Google Identity Services (GIS) Singleton Manager
 * Ensures google.accounts.id.initialize is called exactly once,
 * centralizes credential response dispatching, and coordinates One Tap & Sign-in buttons.
 */

type CredentialCallback = (response: { credential: string; select_by?: string }) => void;

let isGisInitialized = false;
let currentClientId = '';
const activeCallbacks = new Set<CredentialCallback>();

/**
 * Registers an active callback for Google credential responses
 */
export const registerGoogleCallback = (cb: CredentialCallback): (() => void) => {
  activeCallbacks.add(cb);
  return () => {
    activeCallbacks.delete(cb);
  };
};

/**
 * Safely initializes Google Identity Services exactly once per clientId
 */
export const initGoogleIdentity = (clientId: string): boolean => {
  if (!clientId || typeof window === 'undefined') return false;
  if (!window.google?.accounts?.id) return false;

  if (isGisInitialized && currentClientId === clientId) {
    return true;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) return;
        activeCallbacks.forEach((cb) => {
          try {
            cb(response);
          } catch (e) {
            console.error('[GoogleAuth] Callback error:', e);
          }
        });
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      context: 'signin',
    });

    isGisInitialized = true;
    currentClientId = clientId;
    return true;
  } catch (err) {
    console.warn('[GoogleAuth] GIS initialization warning:', err);
    return false;
  }
};

/**
 * Renders the official Google Sign-In button into a container element
 */
export const renderGoogleButton = (
  container: HTMLElement,
  options: {
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    width?: number | string;
  } = {}
): boolean => {
  if (!window.google?.accounts?.id) return false;

  try {
    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: options.theme || 'outline',
      size: options.size || 'large',
      text: options.text || 'signin_with',
      shape: options.shape || 'rectangular',
      logo_alignment: 'left',
      width: options.width || 380,
    });
    return true;
  } catch (err) {
    console.warn('[GoogleAuth] renderButton error:', err);
    return false;
  }
};

/**
 * Displays the native Google One Tap floating prompt
 */
export const promptGoogleOneTap = (
  onNotification?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
    getDismissedReason: () => string;
  }) => void
): void => {
  if (!window.google?.accounts?.id) return;

  // Clear local cooldown cookie in development/localhost if present so One Tap can be tested
  if (
    typeof document !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    try {
      document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch {}
  }

  try {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        console.info(
          '[GoogleOneTap] Prompt not displayed by Google. Reason:',
          reason,
          '(Note: Google requires an active Google session in this browser, and third-party cookies not fully blocked).'
        );
      } else if (notification.isSkippedMoment()) {
        console.info('[GoogleOneTap] Prompt skipped by Google:', notification.getSkippedReason());
      } else if (notification.isDismissedMoment()) {
        console.info('[GoogleOneTap] Prompt dismissed by user:', notification.getDismissedReason());
      } else {
        console.info('[GoogleOneTap] Prompt displayed successfully');
      }

      if (onNotification) {
        onNotification(notification);
      }
    });
  } catch (err) {
    console.warn('[GoogleOneTap] prompt error:', err);
  }
};
