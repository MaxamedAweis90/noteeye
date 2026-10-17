import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { MARKETING_URL } from '../api/client';
import { isPWAMode } from '../pwa/registerSW';

interface LogoProps {
  className?: string;
  showMobileTrigger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showText?: boolean;
}

/**
 * Noteeye Brand Logo Component
 * Renders the authentic Noteeye logo mark and brand text.
 * 
 * Invariants:
 * - In PWA mode (standalone): ALWAYS stays in the app (navigates to workspace home '/').
 * - In Web App Workspace (TopNav / Authenticated): ALWAYS navigates to workspace home '/',
 *   resetting folder filters and search query.
 * - On Marketing Domain (noteeye.vercel.app): Smooth-scrolls to top hero section.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  disabled = false,
  showText = true,
}) => {
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // Rendered outside router context
  }

  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const handleBrandClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }

    try {
      setCurrentFolder(null);
      setSearchQuery('');
    } catch {
      // Ignore store error if outside context
    }

    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // 1. Marketing Domain or /landing in dev: smooth scroll to hero/top
    if (
      hostname === 'noteeye.vercel.app' ||
      hostname === 'noteeye.com' ||
      pathname === '/landing'
    ) {
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // 2. In PWA Standalone Mode or Web App Workspace:
    // ALWAYS stay in the app and navigate to workspace root ('/')
    const workspaceIsland = document.getElementById('workspace-content-island');
    if (workspaceIsland) {
      workspaceIsland.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // If on Auth pages in normal web browser (outside PWA), logo links to marketing main domain
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (isAuthPage && !isPWAMode() && (hostname === 'app-noteeye.vercel.app' || hostname.includes('app-noteeye'))) {
      window.location.href = MARKETING_URL;
      return;
    }

    if (navigate) {
      const requestNavigation = useUIStore.getState().requestNavigation;
      requestNavigation('/', (path) => navigate(path));
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <div
        onClick={handleBrandClick}
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
      >
        <img
          src="/noteeye_logo.png"
          alt="Noteeye Logo"
          className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
        />
        {showText && (
          <span className="text-[22px] font-display font-bold tracking-tight text-[#1F1F1F] dark:text-white transition-colors">
            Noteeye
          </span>
        )}
      </div>
    </div>
  );
};

