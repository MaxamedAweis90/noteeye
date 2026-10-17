// Google Identity Services (GSI) global type declarations
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: 'signin' | 'signup' | 'use';
            prompt_parent_id?: string;
            state_cookie_domain?: string;
            ux_mode?: 'popup' | 'redirect';
            allowed_parent_origin?: string | string[];
            intermediate_iframe_close_callback?: () => void;
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
          }) => void;
          prompt: (notification?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          cancel: () => void;
          revoke: (hint: string, callback?: (done: { successful: boolean; error: string }) => void) => void;
        };
      };
    };
  }
}

export {};
