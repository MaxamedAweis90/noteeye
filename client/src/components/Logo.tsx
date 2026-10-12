import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { MARKETING_URL } from '../api/client';

interface LogoProps {
  className?: string;
  showMobileTrigger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Noteeye Brand Logo Component
 * Renders the authentic Noteeye logo mark and brand text.
 * Clicking the logo routes to the landing page:
 * - In production: from app-noteeye.vercel.app to noteeye.vercel.app (with token sync)
 * - In local development: routes to /landing
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  disabled = false,
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
    const token = localStorage.getItem('noteeye_auth_token');
    const authQuery = token ? `?auth_token=${encodeURIComponent(token)}` : '';

    // 1. In production: if on the web app domain, redirect to the marketing landing domain
    if (
      hostname === 'app-noteeye.vercel.app' ||
      hostname.includes('app-noteeye') ||
      (import.meta.env.PROD && !hostname.includes('localhost') && hostname !== 'noteeye.vercel.app')
    ) {
      window.location.href = `${MARKETING_URL}${authQuery}`;
      return;
    }

    // 2. If already on the production marketing domain, smooth scroll to the top
    if (hostname === 'noteeye.vercel.app' || hostname === 'noteeye.com') {
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // 3. In local development or preview:
    if (window.location.pathname === '/landing') {
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (navigate) {
      navigate('/landing');
    } else {
      window.location.href = '/landing';
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
        <span className="text-[22px] font-bold tracking-tight text-[#1F1F1F]">
          Noteeye
        </span>
      </div>
    </div>
  );
};

