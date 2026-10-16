import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Check,
  CheckSquare,
  Cloud,
  FileText,
  Folder,
  Heart,
  Keyboard,
  Lightbulb,
  MessageCircle,
  MousePointer2,
  Moon,
  Palette,
  Pause,
  PenTool,
  Play,
  Repeat,
  Search,
  Star,
  Zap,
} from '@/components/ui/icons';
import { APP_URL } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { LandingNavbar, type AuthNotice } from '../components/landing/LandingNavbar';

/* ═════════════════════════════════════════════════════════════
   DATA
   ═════════════════════════════════════════════════════════════ */

const DEMO_VIDEO_SRC = '/videos/noteeye-workspace-demo.mp4';
const FALLBACK_DURATION = 12;

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
];

const GITHUB_URL = 'https://github.com/MaxamedAweis90';
const DEVELOPER_NAME = 'Maxamed Aweis';
const DEVELOPER_HANDLE = '@MaxamedAweis90';

const ROTATING_HERO_WORDS = [
  { text: 'notes.', font: 'font-display', color: 'text-slate-900' },
  { text: 'checklists.', font: 'font-sans', color: 'text-slate-900' },
  { text: 'ideas.', font: 'font-handwriting text-5xl sm:text-7xl lg:text-8xl leading-none font-bold', color: 'text-purple-700' },
];

const ROTATING_DOCS = [
  { name: 'Rich Notes', type: 'Editor & Tables', icon: FileText, color: 'text-sky-600 bg-sky-50' },
  { name: 'Checklists', type: 'Tasks & Progress', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Idea Boards', type: 'Kanban Flow', icon: Lightbulb, color: 'text-purple-600 bg-purple-50' },
];

const PASTEL_THEMES_LOOP = [
  { name: 'Warm Peach', hex: '#FDE3C9', border: '#F8CBA6' },
  { name: 'Mint Sage', hex: '#C7F3DE', border: '#A3E5C5' },
  { name: 'Soft Sky', hex: '#CEEBFD', border: '#ADD9FA' },
  { name: 'Soft Lavender', hex: '#E5DEFA', border: '#CEC2F5' },
  { name: 'Rose Petal', hex: '#FCDDEC', border: '#F7BEDE' },
  { name: 'Buttercup Yellow', hex: '#FEF3C7', border: '#FDE68A' },
];

const ROTATING_SPEED = [
  { title: 'Offline-First', desc: 'No internet needed' },
  { title: 'Instant PWA', desc: 'Desktop & mobile' },
  { title: 'Local Cache', desc: 'Zero loading lag' },
];

const ROTATING_FREE = [
  { title: '100% Free', desc: 'No paywalls' },
  { title: 'Open Source', desc: 'Full transparency' },
  { title: 'Solo Built', desc: 'By Maxamed Aweis' },
];

const FEATURE_TILES = [
  { title: 'Notes Management', icon: Folder, bg: '#F3E3D3', fg: '#8B5A2B' },
  { title: 'Smart Checklists', icon: CheckSquare, bg: '#FFE3C2', fg: '#E8730C' },
  { title: 'Pastel Themes', icon: Palette, bg: '#D6EEFB', fg: '#0284C7' },
  { title: 'Rapid Search', icon: Search, bg: '#FFF3C4', fg: '#CA8A04' },
  { title: 'Key Shortcuts', icon: Keyboard, bg: '#FFE7B3', fg: '#D97706' },
  { title: 'Day & Night', icon: Moon, bg: '#FFF1B8', fg: '#B45309' },
  { title: 'Super Fast', icon: Zap, bg: '#EAF7C6', fg: '#65A30D' },
  { title: 'Cloud Backup', icon: Cloud, bg: '#E9E1FB', fg: '#7C3AED' },
];

const PLANS = [
  {
    name: 'Personal',
    price: '$0',
    suffix: ' / forever',
    description: 'Fast local thought capture and offline note-taking',
    tint: 'from-[#EBF7FD] to-white',
    border: 'border-[#BFE0FB]',
    badge: null,
    popular: false,
    ctaText: 'Start Writing',
    href: undefined as string | undefined,
    features: [
      'Unlimited notes & checklists',
      'All 6 pastel theme accents',
      'Instant local offline cache',
      'Quick keyboard shortcuts',
      'Table editor & markdown support',
    ],
  },
  {
    name: 'Complete Workspace',
    price: '$0',
    suffix: ' / forever',
    description: 'The complete multi-device personal cloud experience',
    tint: 'from-[#F2EEFD] to-white',
    border: 'border-[#C9B8F5]',
    badge: '100% Free • Recommended',
    popular: true,
    ctaText: 'Launch Noteeye Free',
    href: undefined as string | undefined,
    features: [
      'Everything in Personal',
      'Cloud account & multi-device sync',
      'Idea Boards & task kanban flow',
      'Installable PWA for mobile & desktop',
      'Instant search history & filters',
    ],
  },
  {
    name: 'Open Source',
    price: '$0',
    suffix: ' / open source',
    description: 'For developers who value complete data sovereignty',
    tint: 'from-[#FFF4EC] to-white',
    border: 'border-[#FED7AA]',
    badge: null,
    popular: false,
    ctaText: 'View on GitHub',
    href: GITHUB_URL,
    features: [
      'Full MIT licensed source code',
      'Self-host with your own database',
      'Zero tracking or analytics',
      'Community contributions & forks',
      'Direct developer updates',
    ],
  },
];

/* ═════════════════════════════════════════════════════════════
   SMALL BUILDING BLOCKS
   ═════════════════════════════════════════════════════════════ */

const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}> = ({ children, className = '', delay = 0, y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const SectionHeading: React.FC<{ children: React.ReactNode; eyebrow?: string }> = ({
  children,
  eyebrow,
}) => (
  <Reveal className="text-center">
    {eyebrow && (
      <span className="inline-block px-3 py-1 mb-4 text-[11px] font-semibold tracking-wider text-sky-700 bg-sky-100/80 border border-sky-200/70 rounded-full">
        {eyebrow}
      </span>
    )}
    <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-[#1F1F1F] leading-[1.12] whitespace-pre-line">
      {children}
    </h2>
  </Reveal>
);

const DarkButton: React.FC<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}> = ({ children, href, onClick, className = '' }) => {
  const cls = `inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#1F1F1F] hover:bg-black rounded-full shadow-md hover:scale-105 transition-all duration-300 ${className}`;
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

const GhostButton: React.FC<{
  children: React.ReactNode;
  href: string;
  className?: string;
  external?: boolean;
}> = ({ children, href, className = '', external }) => (
  <a
    href={href}
    className={`inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-[#1F1F1F] bg-white/80 backdrop-blur border border-slate-200 hover:border-slate-300 hover:bg-white rounded-full shadow-xs hover:scale-105 transition-all duration-300 ${className}`}
    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
  >
    {children}
  </a>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

/** Slow-moving volumetric cloud puffs used behind hero & footer */
const CloudLayer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    {[
      { top: '6%', size: 420, dur: 60, from: -10, to: 20, op: 0.9 },
      { top: '28%', size: 520, dur: 80, from: 60, to: 20, op: 0.75 },
      { top: '52%', size: 380, dur: 70, from: 10, to: 70, op: 0.8 },
      { top: '-6%', size: 340, dur: 90, from: 70, to: 30, op: 0.7 },
    ].map((c, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white blur-3xl"
        style={{ top: c.top, width: c.size, height: c.size * 0.45, opacity: c.op }}
        initial={{ left: `${c.from}%` }}
        animate={{ left: [`${c.from}%`, `${c.to}%`, `${c.from}%`] }}
        transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const FountainPen: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 72 }) => (
  <div
    className={`flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#4F7CFF] to-[#2347C5] text-white shadow-xl ${className}`}
    style={{ width: size, height: size }}
  >
    <PenTool style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.75} />
  </div>
);

const Handwriting: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 220 60" className={className} fill="none" aria-hidden>
    <motion.path
      d="M4 38 C 20 6, 34 58, 50 30 S 78 10, 92 34 S 120 56, 136 28 S 170 8, 184 32 S 206 44, 216 24"
      stroke="#2347C5"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2.2, ease: 'easeInOut' }}
    />
  </svg>
);

/* ═════════════════════════════════════════════════════════════
   HERO — LOOPING WORKSPACE VIDEO + PLAYER OVERLAY
   ═════════════════════════════════════════════════════════════ */

const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const MOCK_CARDS = [
  { title: 'Movie Review', date: '18 Nov 2026', bg: '#FFDCC2', border: '#F8C9A5' },
  { title: 'Class Notes', date: '02 Dec 2026', bg: '#E4D9FB', border: '#CDBBF5' },
  { title: 'Book Lists', date: '09 Dec 2026', bg: '#CFE6FB', border: '#B3D5F5' },
];

/** Animated stand-in rendered only if the demo video file can't be loaded */
const WorkspaceMock: React.FC<{ current: number }> = ({ current }) => {
  const active = Math.floor(current / 4) % 3;
  const cursorX = ['17%', '50%', '83%'][active];
  return (
    <div className="relative w-full h-full bg-white flex text-left overflow-hidden">
      <aside className="hidden sm:flex w-44 shrink-0 flex-col gap-1 border-r border-slate-100 p-4 bg-[#FAFBFE]">
        <div className="flex items-center gap-2 mb-4">
          <img src="/noteeye_logo.png" alt="" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold">Noteeye</span>
        </div>
        {['All Docs', 'Tasks', 'Calendar', 'Starred', 'Journal', 'More'].map((item, i) => (
          <div
            key={item}
            className={`px-3 py-2 rounded-xl text-xs font-medium ${
              i === 0 ? 'bg-[#E8F0FE] text-[#0B57D0]' : 'text-slate-500'
            }`}
          >
            {item}
          </div>
        ))}
      </aside>
      <div className="flex-1 p-4 sm:p-6 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-xl font-bold text-[#1F1F1F] truncate">My Notes &amp; Ideas</h3>
          <div className="hidden sm:flex items-center gap-2 h-8 w-48 px-3 rounded-full bg-slate-100 text-slate-400 text-xs">
            <Search className="w-3.5 h-3.5" /> Search
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500 mb-3">All Docs</p>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {MOCK_CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              animate={{ y: i === active ? -8 : 0, scale: i === active ? 1.04 : 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="rounded-2xl p-3 sm:p-4 h-28 sm:h-40 border flex flex-col justify-between"
              style={{
                backgroundColor: c.bg,
                borderColor: c.border,
                boxShadow: i === active ? '0 14px 28px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <div>
                <p className="text-xs sm:text-base font-bold text-[#1F1F1F]">{c.title}</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1">{c.date}</p>
              </div>
              <div className="flex gap-1">
                <span className="h-1.5 w-8 rounded-full bg-black/10" />
                <span className="h-1.5 w-5 rounded-full bg-black/10" />
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="absolute top-[58%] text-[#1F1F1F] drop-shadow"
          animate={{ left: cursorX }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
          <MousePointer2 className="w-5 h-5 fill-white" />
        </motion.div>
      </div>
    </div>
  );
};

const DemoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_DURATION);

  // Drive the fallback timeline when no real video is available
  useEffect(() => {
    if (!videoFailed || !playing) return;
    const id = window.setInterval(() => setCurrent((c) => (c + 0.25) % FALLBACK_DURATION), 250);
    return () => window.clearInterval(id);
  }, [videoFailed, playing]);

  const togglePlay = () => {
    if (videoFailed) {
      setPlaying((p) => !p);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (videoFailed) {
      setCurrent(ratio * FALLBACK_DURATION);
    } else if (videoRef.current) {
      videoRef.current.currentTime = ratio * duration;
    }
  };

  const total = videoFailed ? FALLBACK_DURATION : duration;
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden bg-white">
      {videoFailed ? (
        <WorkspaceMock current={current} />
      ) : (
        <video
          ref={videoRef}
          src={DEMO_VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover rounded-3xl border border-slate-200/50 shadow-2xl"
          onError={() => setVideoFailed(true)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || FALLBACK_DURATION)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Centered play / pause */}
      <button
        type="button"
        aria-label={playing ? 'Pause demo' : 'Play demo'}
        onClick={togglePlay}
        className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1F1F1F]/85 backdrop-blur text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        {playing ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
      </button>

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-3 sm:pb-4 pt-10 bg-gradient-to-t from-black/35 to-transparent">
        <div className="flex items-center gap-3 text-white text-xs font-medium">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="cursor-pointer"
          >
            {playing ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(current)}
            onClick={seek}
            className="relative flex-1 h-1.5 rounded-full bg-white/35 cursor-pointer"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${pct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
          <span className="tabular-nums">
            {formatTime(current)} / {formatTime(total)}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">
            <Repeat className="w-3 h-3" /> Looping
          </span>
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════
   PAGE
   ═════════════════════════════════════════════════════════════ */

export type { AuthNotice };

export const LandingPage: React.FC = () => {
  const authStoreIsAuth = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [email, setEmail] = useState('');
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);

  // Rotating animated ticker states for Hero section
  const [wordIndex, setWordIndex] = useState(0);
  const [docIndex, setDocIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [freeIndex, setFreeIndex] = useState(0);

  useEffect(() => {
    const wTimer = setInterval(() => setWordIndex((i) => (i + 1) % ROTATING_HERO_WORDS.length), 2200);
    const dTimer = setInterval(() => setDocIndex((i) => (i + 1) % ROTATING_DOCS.length), 2400);
    const tTimer = setInterval(() => setThemeIndex((i) => (i + 1) % PASTEL_THEMES_LOOP.length), 2000);
    const sTimer = setInterval(() => setSpeedIndex((i) => (i + 1) % ROTATING_SPEED.length), 2600);
    const fTimer = setInterval(() => setFreeIndex((i) => (i + 1) % ROTATING_FREE.length), 2800);

    return () => {
      clearInterval(wTimer);
      clearInterval(dTimer);
      clearInterval(tTimer);
      clearInterval(sTimer);
      clearInterval(fTimer);
    };
  }, []);

  // Directly check both storage and zustand store to immediately catch active session on render
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasToken = Boolean(localStorage.getItem('noteeye_auth_token'));
    return hasToken && authStoreIsAuth;
  });

  // Keep isLoggedIn strictly in sync with storage & store events
  useEffect(() => {
    const syncAuthState = () => {
      if (typeof window === 'undefined') return;
      const hasToken = Boolean(localStorage.getItem('noteeye_auth_token'));
      const isAuth = useAuthStore.getState().isAuthenticated;
      setIsLoggedIn(hasToken && isAuth);
    };

    syncAuthState();

    window.addEventListener('noteeye:login', syncAuthState);
    window.addEventListener('noteeye:logout', syncAuthState);
    window.addEventListener('storage', syncAuthState);

    const unsubscribe = useAuthStore.subscribe((state) => {
      const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('noteeye_auth_token'));
      setIsLoggedIn(hasToken && state.isAuthenticated);
    });

    return () => {
      window.removeEventListener('noteeye:login', syncAuthState);
      window.removeEventListener('noteeye:logout', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
      unsubscribe();
    };
  }, []);

  // Sync token if redirected from the app subdomain, or revalidate an existing session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');

    if (reason === 'unauthorized' || reason === 'no-access') {
      setAuthNotice({
        type: 'unauthorized',
        title: 'Sign-in Required',
        description: 'Access to that workspace page is restricted. Please sign in to continue.',
      });
    } else if (reason === 'revoked') {
      setAuthNotice({
        type: 'revoked',
        title: 'Session Terminated',
        description: 'This session was signed out from another device. Please sign in again to continue.',
      });
    } else if (reason === 'logout') {
      setAuthNotice({
        type: 'logout',
        title: 'Logged Out Successfully',
        description: 'You have been safely signed out of your Noteeye account.',
      });
    }

    const authToken = params.get('auth_token');

    if (authToken) {
      localStorage.setItem('noteeye_auth_token', authToken);
      useAuthStore.getState().checkAuth().catch(() => {});
    } else if (localStorage.getItem('noteeye_auth_token')) {
      useAuthStore.getState().checkAuth().catch(() => {});
    }

    if (reason || authToken) {
      params.delete('auth_token');
      params.delete('reason');
      const cleanSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${cleanSearch}${window.location.hash}`
      );
    }
  }, []);

  const loginUrl = `${APP_URL}/login`;
  const registerUrl = `${APP_URL}/register`;
  const appWorkspaceUrl = `${APP_URL}/`;

  // Workspace URL that carries the auth token across production subdomains
  const workspaceHref = useMemo(() => {
    if (typeof window === 'undefined') return appWorkspaceUrl;
    const hostname = window.location.hostname.toLowerCase();
    const token = localStorage.getItem('noteeye_auth_token');
    const authQuery = token ? `?auth_token=${encodeURIComponent(token)}` : '';

    if (hostname === 'noteeye.vercel.app' || hostname.includes('noteeye')) {
      return `${APP_URL}/${authQuery}`;
    }
    return '/';
  }, [isLoggedIn, appWorkspaceUrl]);

  const primaryHref = isLoggedIn ? workspaceHref : registerUrl;

  const handleLogout = () => {
    logout();
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname.toLowerCase();
    // Propagate logout to the app subdomain via a hidden frame
    if (hostname === 'noteeye.vercel.app' || hostname.includes('noteeye')) {
      try {
        const iframe = document.createElement('iframe');
        iframe.src = `${APP_URL}/?action=logout`;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            /* noop */
          }
        }, 2000);
      } catch {
        /* noop */
      }
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
    window.location.href = isLoggedIn ? workspaceHref : `${registerUrl}${q}`;
  };

  // Strictly enforce light mode on the landing page and restore user's preferred theme on exit
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    return () => {
      const saved = (localStorage.getItem('noteeye-theme') as 'light' | 'dark' | 'system') || 'system';
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (saved === 'system' && systemDark)) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }
    };
  }, []);

  return (
    <div
      id="home"
      className="min-h-screen bg-white text-[#1F1F1F] font-sans antialiased overflow-x-hidden selection:bg-sky-200 selection:text-sky-950"
    >
      {/* ───────────── 1. FLOATING PILL NAVBAR & SESSION BAR ───────────── */}
      <LandingNavbar
        authNotice={authNotice}
        onDismissAuthNotice={() => setAuthNotice(null)}
        isLoggedIn={isLoggedIn}
        loginUrl={loginUrl}
        registerUrl={registerUrl}
        workspaceHref={workspaceHref}
        onLogout={handleLogout}
      />

      {/* ───────────── 2. HERO ───────────── */}
      <section className="relative pt-32 sm:pt-36 pb-16 bg-gradient-to-b from-[#BFE0FB] via-[#DDF1FC] to-white">
        <CloudLayer />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Top developer badge */}
          <motion.a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-sm text-xs sm:text-[13px] font-medium text-slate-700 shadow-xs hover:bg-white hover:text-slate-900 transition-colors"
          >
            <span className="text-base leading-none">✨</span>
            Crafted by <strong className="font-semibold text-slate-900">{DEVELOPER_NAME} ({DEVELOPER_HANDLE})</strong>
            <span className="text-slate-300">•</span>
            Independent &amp; Free Personal Workspace
          </motion.a>

          {/* Headline with 3-Font Animated Word Switcher */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.12] text-[#1F1F1F]"
          >
            One calm workspace for your
            <br />
            <span className="inline-block relative overflow-hidden align-bottom h-[1.25em] min-w-[200px] sm:min-w-[340px] text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_HERO_WORDS[wordIndex].text}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -32 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`inline-block ${ROTATING_HERO_WORDS[wordIndex].font} ${ROTATING_HERO_WORDS[wordIndex].color}`}
                >
                  {ROTATING_HERO_WORDS[wordIndex].text}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 sm:mt-5 text-sm sm:text-base text-[#444746] max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Write rich documents, track checklists with live progress, and organize ideas on visual
            Kanban boards — crafted in soft pastels without corporate bloat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <DarkButton href={primaryHref} className="px-8 py-3.5 text-base">
              {isLoggedIn ? 'Open Noteeye' : 'Try For Free'}
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </DarkButton>
            <GhostButton href={GITHUB_URL} external className="px-7 py-3.5 text-base">
              <GithubIcon className="w-4 h-4" /> View on GitHub
            </GhostButton>
          </motion.div>

          {/* Interactive video showcase (3D perspective preserved as-is) */}
          <div className="mt-14 sm:mt-16" style={{ perspective: 1800 }}>
            <motion.div
              initial={{ opacity: 0, rotateX: 16, y: 60 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'center top' }}
              className="rounded-[2rem] bg-white/60 backdrop-blur p-2 sm:p-3 shadow-[0_30px_80px_-20px_rgba(30,64,120,0.35)] border border-white/70"
            >
              <DemoPlayer />
            </motion.div>
          </div>

          {/* Infinite Looping Project Metrics Bento Grid (Figma-styled) */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Col 1: Document Formats Loop */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shadow-xs text-left h-28 sm:h-32 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Document Formats
              </p>
              <div className="relative overflow-hidden h-8 sm:h-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={ROTATING_DOCS[docIndex].name}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2"
                  >
                    <span className={`p-1.5 rounded-lg ${ROTATING_DOCS[docIndex].color}`}>
                      {React.createElement(ROTATING_DOCS[docIndex].icon, { className: 'w-4 h-4' })}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-display text-slate-900 truncate">
                      {ROTATING_DOCS[docIndex].name}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-sans">
                {ROTATING_DOCS[docIndex].type}
              </p>
            </div>

            {/* Col 2: Pastel Themes Circle Loop */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shadow-xs text-left h-28 sm:h-32 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pastel Themes
              </p>
              <div className="relative overflow-hidden h-8 sm:h-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={PASTEL_THEMES_LOOP[themeIndex].name}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2.5"
                  >
                    <span
                      className="w-5 h-5 rounded-full border shadow-2xs shrink-0"
                      style={{
                        backgroundColor: PASTEL_THEMES_LOOP[themeIndex].hex,
                        borderColor: PASTEL_THEMES_LOOP[themeIndex].border,
                      }}
                    />
                    <span className="text-base sm:text-lg font-bold font-display text-slate-900 truncate">
                      {PASTEL_THEMES_LOOP[themeIndex].name}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {PASTEL_THEMES_LOOP[themeIndex].hex.toUpperCase()} • 6 Shades
              </p>
            </div>

            {/* Col 3: Architecture / Speed Loop */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shadow-xs text-left h-28 sm:h-32 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Speed &amp; Storage
              </p>
              <div className="relative overflow-hidden h-8 sm:h-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={ROTATING_SPEED[speedIndex].title}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2"
                  >
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-base sm:text-lg font-bold font-display text-slate-900 truncate">
                      {ROTATING_SPEED[speedIndex].title}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-sans">
                {ROTATING_SPEED[speedIndex].desc}
              </p>
            </div>

            {/* Col 4: Open & Free Craft Loop */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shadow-xs text-left h-28 sm:h-32 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Access &amp; Craft
              </p>
              <div className="relative overflow-hidden h-8 sm:h-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={ROTATING_FREE[freeIndex].title}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2"
                  >
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="text-base sm:text-lg font-bold font-display text-slate-900 truncate">
                      {ROTATING_FREE[freeIndex].title}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-sans">
                {ROTATING_FREE[freeIndex].desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 3. MASTER YOUR KNOWLEDGE ───────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Organize Notes with\nPastel Themes & Folders'}</SectionHeading>

          <div className="mt-14 flex flex-col md:flex-row gap-6">
            {/* Left: beige note */}
            <Reveal className="flex-1">
              <div className="relative h-full min-h-[340px] rounded-[2rem] bg-[#F6EBDD] p-8 sm:p-10 flex flex-col justify-between overflow-hidden group">
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight max-w-xs">
                  Revolutionary Note-Taking
                </h3>
                <div className="flex items-end justify-between gap-4">
                  <DarkButton href={primaryHref} className="px-5 py-2.5">
                    Start Writing
                  </DarkButton>
                  <motion.div
                    whileHover={{ rotate: 0, scale: 1.05 }}
                    className="w-28 h-32 rounded-2xl bg-white shadow-lg rotate-6 p-3 flex flex-col gap-2 transition-transform"
                  >
                    <span className="h-2 w-12 rounded-full bg-[#F6EBDD]" />
                    <span className="h-1.5 w-full rounded-full bg-slate-100" />
                    <span className="h-1.5 w-4/5 rounded-full bg-slate-100" />
                    <span className="h-1.5 w-3/5 rounded-full bg-slate-100" />
                    <span className="mt-auto text-[10px] font-semibold text-slate-400">noteeye.app</span>
                  </motion.div>
                </div>
              </div>
            </Reveal>

            {/* Right: cyan window with pen */}
            <Reveal className="flex-1" delay={0.12}>
              <div className="relative h-full min-h-[340px] rounded-[2rem] bg-[#D8F1F7] p-8 sm:p-10 overflow-hidden">
                <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-lg p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Personal Workspace
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Pastel Notes &amp; Folders</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Organize your thoughts into clean folders, customize with 6 pastel colors, and
                    capture ideas with zero latency or distraction.
                  </p>
                  <div className="mt-4 flex gap-4 text-slate-400">
                    <Heart className="w-4 h-4" />
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <Handwriting className="mt-3 w-40 h-10" />
                </div>
                <motion.div
                  className="absolute right-6 top-10 sm:right-10 rotate-[18deg]"
                  animate={{ y: [0, -10, 0], rotate: [18, 12, 18] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <FountainPen size={84} />
                </motion.div>
                <h3 className="relative z-10 mt-8 text-3xl sm:text-4xl font-bold tracking-tight leading-tight max-w-xs ml-auto text-right text-slate-900">
                  Powerful, Flexible Digital Notes
                </h3>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="h-20 sm:h-28" aria-hidden="true" />
      </section>

      {/* ───────────── 4. PLANNING ───────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F6FAFE] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Notes, Checklists & Ideas\nIn One Seamless Flow'}</SectionHeading>

          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Peach — Rich Notes */}
            <Reveal delay={0}>
              <motion.div
                whileHover={{ y: -8, rotate: -1.5 }}
                className="h-72 rounded-[1.75rem] bg-[#FDE3C9] border border-[#F8CBA6] p-5 flex flex-col justify-between shadow-md text-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/90 text-[#C2410C] flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] bg-white/60 px-2.5 py-0.5 rounded-full">
                    Rich Docs
                  </span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Rich Notes
                  </p>
                  <div className="mt-2.5 rounded-xl bg-white/80 border border-[#F8CBA6]/60 p-3 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <span className="px-1 bg-slate-100 rounded">H1</span>
                      <span className="px-1 bg-slate-100 rounded italic">I</span>
                      <span className="px-1 bg-slate-100 rounded underline">U</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Architecture &amp; Specs
                    </p>
                    <div className="flex gap-1 pt-0.5">
                      <span className="h-1 w-8 rounded-full bg-[#C2410C]/30" />
                      <span className="h-1 w-5 rounded-full bg-[#C2410C]/20" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Mint — Smart Checklists */}
            <Reveal delay={0.1} y={44}>
              <motion.div
                whileHover={{ y: -8 }}
                className="h-72 rounded-[1.75rem] bg-[#C7F3DE] border border-[#A3E5C5] p-5 flex flex-col justify-between shadow-md text-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/90 text-[#047857] flex items-center justify-center shadow-xs">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857] bg-white/60 px-2.5 py-0.5 rounded-full">
                    Tasks
                  </span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Checklists
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {[
                      { text: 'Refine pastel themes', done: true },
                      { text: 'Sync to offline PWA', done: true },
                      { text: 'Ship v2.0 release', done: false },
                    ].map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-2 rounded-xl bg-white/80 border border-[#A3E5C5]/60 px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs"
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            item.done ? 'bg-[#047857] text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className={`truncate ${item.done ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Lavender — Idea Boards */}
            <Reveal delay={0.2}>
              <motion.div
                whileHover={{ y: -8, rotate: 1.5 }}
                className="h-72 rounded-[1.75rem] bg-[#E5DEFA] border border-[#CEC2F5] p-5 flex flex-col justify-between shadow-md text-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/90 text-[#7E22CE] flex items-center justify-center shadow-xs">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E22CE] bg-white/60 px-2.5 py-0.5 rounded-full">
                    Kanban
                  </span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Idea Board
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    <div className="rounded-xl bg-white/80 border border-[#CEC2F5]/60 p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                          Ideas Column
                        </span>
                        <span className="text-[10px] text-slate-400">Today</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                        Voice capture to text
                      </p>
                    </div>
                    <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-purple-800">
                      <span>Completed</span>
                      <span>✓ Shipped</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Blue / yellow — folding curl (kept as-is) */}
            <Reveal delay={0.3} y={44}>
              <motion.div
                whileHover={{ y: -8, rotate: -1 }}
                className="relative h-72 rounded-[1.75rem] bg-gradient-to-br from-[#FFE066] to-[#FFC93C] shadow-lg overflow-hidden flex items-center justify-center"
              >
                <span
                  aria-hidden
                  className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#E0A800] via-[#FFF3B0] to-transparent rounded-tl-[2rem] shadow-[-6px_-6px_14px_rgba(0,0,0,0.12)]"
                />
                <FountainPen size={96} className="-rotate-6" />
              </motion.div>
            </Reveal>
          </div>

          <Reveal className="mt-12 text-center">
            <DarkButton href={primaryHref}>Start Writing</DarkButton>
          </Reveal>
        </div>
      </section>

      {/* ───────────── 5. EVERYTHING IN ONE APP ───────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Every Essential Tool\nFor Your Daily Workflow'}</SectionHeading>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {FEATURE_TILES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 4) * 0.08}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="h-44 sm:h-52 rounded-3xl p-4 flex flex-col items-center justify-center gap-4 text-center cursor-default"
                    style={{ backgroundColor: f.bg }}
                  >
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm"
                      style={{ color: f.fg }}
                    >
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <p className="text-sm font-semibold text-[#1F1F1F]">{f.title}</p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="mt-10 text-center">
            <DarkButton href="#features">View Features</DarkButton>
          </Reveal>
        </div>
        <div className="h-20 sm:h-28" aria-hidden="true" />
      </section>

      {/* ───────────── 6. THINKING FLOWS INTO WRITING ───────────── */}
      <section id="about" className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F4F9FE] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'From Fleeting Ideas\nTo Structured Notes'}</SectionHeading>

          <div className="relative mt-16 max-w-3xl mx-auto min-h-[380px] sm:min-h-[420px]">
            {/* Back panel: idea editor */}
            <Reveal className="absolute left-0 top-0 w-[86%] sm:w-[62%]">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-5">
                <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400">
                  <span>IDEA DETAILS</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">Idea Title</p>
                <div className="mt-2 h-10 rounded-xl bg-slate-50 border border-slate-100 px-3 flex items-center text-xs font-medium text-slate-700">
                  Offline-first Sync &amp; Pastel Themes
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">Description</p>
                <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <Handwriting className="w-full h-10" />
                </div>
              </div>
            </Reveal>

            {/* Front panel: overlapping text card */}
            <Reveal className="absolute right-0 top-28 sm:top-24 w-[86%] sm:w-[58%]" delay={0.2} y={44}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-2xl bg-white shadow-2xl border border-slate-100 p-5 text-xs sm:text-sm leading-relaxed text-[#444746]"
              >
                Capture quick thoughts, color-code with pastel themes, and organize your daily workflow with zero friction and instant local cache.
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#0B57D0]">
                  <Check className="w-3.5 h-3.5" /> Saved to Notes
                </div>
              </motion.div>
            </Reveal>

            {/* Pen + checklist overlay */}
            <motion.div
              className="absolute left-[8%] sm:left-[14%] bottom-0 rotate-[-8deg]"
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <div className="rounded-2xl bg-white border border-slate-200 shadow-lg p-3 flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-[#0B57D0] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-semibold">Completed</span>
              </div>
            </motion.div>
            <motion.div
              className="absolute right-[4%] sm:right-[14%] bottom-2"
              animate={{ rotate: [-10, 4, -10], y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FountainPen size={92} />
            </motion.div>
          </div>
        </div>
        <div className="h-20 sm:h-28" aria-hidden="true" />
      </section>

      {/* ───────────── 7. PRICING ───────────── */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Simple, Transparent, and\n100% Free Forever.'}</SectionHeading>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1} className="h-full">
                <motion.div
                  whileHover={{ y: -8 }}
                  className={`relative h-full rounded-3xl border ${p.border} bg-gradient-to-b ${p.tint} p-7 flex flex-col ${
                    p.popular ? 'shadow-xl md:scale-[1.04]' : 'shadow-sm'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute top-5 right-5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#7C3AED] rounded-full shadow-xs">
                      {p.badge}
                    </span>
                  )}
                  <p className="text-xl font-bold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-normal">{p.description}</p>
                  <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
                    {p.price}
                    <span className="text-sm font-medium text-slate-500">{p.suffix}</span>
                  </p>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-[#444746]">
                        <Check className="w-4 h-4 text-[#0B57D0] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <DarkButton href={p.href || primaryHref} className="mt-8 w-full">
                    {p.ctaText}
                  </DarkButton>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="h-20 sm:h-28" aria-hidden="true" />
      </section>

      {/* ───────────── 8. FINAL CTA & FOOTER ───────────── */}
      <section className="relative pt-24 pb-10 bg-gradient-to-b from-white via-[#DDF1FC] to-[#BFE0FB] overflow-hidden">
        <CloudLayer />
        <span
          aria-hidden
          className="absolute inset-x-0 top-6 text-center text-[22vw] sm:text-[16rem] leading-none font-extrabold tracking-tighter text-white/60 select-none pointer-events-none"
        >
          Noteeye
        </span>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Yellow sticky note with peel */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -12 }}
            whileInView={{ opacity: 1, y: 0, rotate: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ rotate: -2, scale: 1.03 }}
            className="relative mx-auto w-52 h-52 sm:w-60 sm:h-60 bg-gradient-to-br from-[#FFE45C] to-[#FFD21F] shadow-[0_24px_40px_-12px_rgba(120,90,0,0.45)] flex items-center justify-center p-6"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 82%, 82% 100%, 0 100%)' }}
          >
            <span
              aria-hidden
              className="absolute bottom-0 right-0 w-[18%] h-[18%] bg-gradient-to-tl from-[#D9A800] to-[#FFF1A0]"
              style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
            />
            <p className="text-2xl sm:text-3xl font-handwriting font-bold leading-snug text-[#5C4600] whitespace-pre-line -rotate-2">
              {'Your space for\nnotes, checklists\n& ideas.'}
            </p>
          </motion.div>

          <Reveal className="mt-14">
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-slate-900">
              Your Thoughts, Beautifully Organized.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#444746] max-w-xl mx-auto">
              Capture thoughts, organize checklists, and build ideas with 6 pastel themes — offline-first, fast, and 100% free.
            </p>
          </Reveal>

          <Reveal className="mt-8" delay={0.1}>
            <form
              onSubmit={handleSubscribe}
              className="mx-auto max-w-lg flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-md pl-5 pr-1.5 py-1.5"
            >
              <label htmlFor="landing-email" className="sr-only">
                Email address
              </label>
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to start writing free…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1F1F1F] hover:bg-black rounded-full hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </Reveal>

          {/* Base footer */}
          <footer className="mt-20">
            <Reveal className="flex flex-col items-center gap-6">
              <a href="#home" className="flex items-center gap-2.5">
                <img src="/noteeye_logo.png" alt="Noteeye logo" className="w-9 h-9 object-contain" />
                <span className="text-lg font-bold text-slate-900">Noteeye</span>
              </a>
              <p className="text-sm text-slate-600 max-w-sm text-center">
                The personal, offline-first workspace for notes, checklists, and idea boards.
              </p>
              <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-[#444746]">
                {NAV_LINKS.map((l) => (
                  <a key={l.label} href={l.href} className="hover:text-[#1F1F1F] transition-colors">
                    {l.label}
                  </a>
                ))}
              </nav>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-xs">
                {SOCIALS.map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -4, scale: 1.05 }}
                    className="h-14 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#1F1F1F] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </motion.a>
                ))}
              </div>

              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/70 text-xs text-[#444746]">
                <div className="flex items-center gap-2">
                  <span>Crafted by <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 hover:underline">Maxamed Aweis</a></span>
                  <span>•</span>
                  <span>Open Source (MIT)</span>
                </div>
                <span>© {new Date().getFullYear()} Noteeye. All rights reserved.</span>
              </div>
            </Reveal>
          </footer>
        </div>
      </section>

    </div>
  );
};

/* Brand glyphs for project socials & links */
const SOCIALS = [
  {
    label: 'GitHub Profile',
    href: GITHUB_URL,
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    label: 'Website (engaweis.dev)',
    href: 'https://engaweis.dev',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  {
    label: 'Instagram (@engaweis)',
    href: 'https://www.instagram.com/engaweis/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
];

export default LandingPage;
