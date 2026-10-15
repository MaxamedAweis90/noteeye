import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Cloud,
  Folder,
  Heart,
  Keyboard,
  Menu,
  MessageCircle,
  MousePointer2,
  Moon,
  Pause,
  PenTool,
  Play,
  Repeat,
  Search,
  Star,
  Users,
  X,
  Zap,
  Lock,
  ShieldAlert,
} from '@/components/ui/icons';
import { APP_URL } from '../api/client';
import { useAuthStore } from '../store/authStore';

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

const STATS = [
  { value: '2014', label: 'App Excellence Award' },
  { value: '2015', label: 'Innovation in Design' },
  { value: '2025', label: 'Global Recognition' },
  { value: '1M+', label: 'Downloads' },
];

const AVATARS = [
  '/avatars/avatar-1.jpg',
  '/avatars/avatar-2.jpg',
  '/avatars/avatar-3.jpg',
  '/avatars/avatar-4.jpg',
];

const FEATURE_TILES = [
  { title: 'Workspace Management', icon: Folder, bg: '#F3E3D3', fg: '#8B5A2B' },
  { title: 'Calendar Sync', icon: Calendar, bg: '#FFE3C2', fg: '#E8730C' },
  { title: 'Collab', icon: Users, bg: '#D6EEFB', fg: '#0284C7' },
  { title: 'Rapid Search', icon: Search, bg: '#FFF3C4', fg: '#CA8A04' },
  { title: 'Key Shortcuts', icon: Keyboard, bg: '#FFE7B3', fg: '#D97706' },
  { title: 'Day & Night', icon: Moon, bg: '#FFF1B8', fg: '#B45309' },
  { title: 'Super Fast', icon: Zap, bg: '#EAF7C6', fg: '#65A30D' },
  { title: 'Cloud Backup', icon: Cloud, bg: '#E9E1FB', fg: '#7C3AED' },
];

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    suffix: '',
    tint: 'from-[#E6F6FB] to-white',
    border: 'border-slate-200',
    popular: false,
    features: ['Standard tools', 'Custom lists', 'Standard notes', 'Local & cloud sync'],
  },
  {
    name: 'Structure',
    price: '$5',
    suffix: '/mo',
    tint: 'from-[#E9E1FB] to-white',
    border: 'border-[#C9B8F5]',
    popular: true,
    features: ['Featured features', 'Customizable lists', 'Color & card themes', 'Extra storage limits'],
  },
  {
    name: 'Premium',
    price: '$10',
    suffix: '/mo',
    tint: 'from-[#FFE9DA] to-white',
    border: 'border-[#F8CBB0]',
    popular: false,
    features: ['Unlimited features', 'All lists & folders', 'Priority support', 'Early access to new tools'],
  },
];

const TESTIMONIALS = {
  features: {
    avatar: AVATARS[1],
    name: 'Jesse S. Sir.',
    quote:
      'Noteeye has completely transformed the way I organize my thoughts. Embedding mathematical equations is finally clutter-free.',
  },
  matrix: {
    avatar: AVATARS[2],
    name: 'Leon H. Frick',
    quote:
      'Switching to Noteeye was the best decision for my workflow. The super-fast performance and key shortcuts have saved me hours every week.',
  },
  writing: {
    avatar: AVATARS[0],
    name: 'Lisa M. Wong',
    quote:
      'The smart writing flow is a game-changer. I just enter a prompt and my ideas land on the page in a structure I never had to fight for.',
  },
  pricing: {
    avatar: AVATARS[3],
    name: 'Inez V. Cox',
    quote:
      'Upgrading to the Structure plan was a game-changer. Unlimited notes and seamless syncing boosted our team’s productivity.',
  },
};

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

const TestimonialStrip: React.FC<{ t: { avatar: string; name: string; quote: string } }> = ({ t }) => (
  <Reveal className="max-w-5xl mx-auto px-4 sm:px-6">
    <figure className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-slate-100 bg-white/80 backdrop-blur px-6 py-5 shadow-xs">
      <blockquote className="text-sm sm:text-[15px] leading-relaxed text-[#444746] max-w-2xl">
        “{t.quote}”
      </blockquote>
      <figcaption className="flex items-center gap-3 shrink-0 sm:pl-6 sm:border-l border-slate-100">
        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover scale-[1.15]" />
        </div>
        <span className="text-sm font-semibold text-[#1F1F1F]">{t.name}</span>
      </figcaption>
    </figure>
  </Reveal>
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

export interface AuthNotice {
  type: 'unauthorized' | 'revoked' | 'logout';
  title: string;
  description: string;
}

export const LandingPage: React.FC = () => {
  const authStoreIsAuth = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);

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

  return (
    <div
      id="home"
      className="min-h-screen bg-white text-[#1F1F1F] font-sans antialiased overflow-x-hidden selection:bg-sky-200 selection:text-sky-950"
    >
      {/* ───────────── 1. TOP NAVIGATION ───────────── */}
      <header className="absolute top-0 inset-x-0 z-50">
        {/* Authorization Alert Notification Banner */}
        {authNotice && (
          <div
            className={`text-white border-b px-4 py-2.5 shadow-md transition-all ${
              authNotice.type === 'logout'
                ? 'bg-[#002B1D] border-emerald-500/30'
                : authNotice.type === 'revoked'
                ? 'bg-[#2B0E14] border-rose-500/30'
                : 'bg-[#001D35] border-white/10'
            }`}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    authNotice.type === 'logout'
                      ? 'bg-emerald-400/20 text-emerald-400'
                      : authNotice.type === 'revoked'
                      ? 'bg-rose-400/20 text-rose-300'
                      : 'bg-amber-400/20 text-amber-300'
                  }`}
                >
                  {authNotice.type === 'revoked' ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : authNotice.type === 'logout' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                  <span className="font-semibold text-white">{authNotice.title}:</span>
                  <span className="text-slate-300 text-xs">{authNotice.description}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={loginUrl}
                  className={`px-3 py-1 rounded-lg text-white text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                    authNotice.type === 'logout'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : authNotice.type === 'revoked'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#0B57D0] hover:bg-[#0041A2]'
                  }`}
                >
                  Sign in
                </a>
                <button
                  type="button"
                  onClick={() => setAuthNotice(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between select-none">
          <a href="#home" className="flex items-center gap-2.5 group">
            <img
              src="/noteeye_logo.png"
              alt="Noteeye logo"
              className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold tracking-tight">Noteeye</span>
          </a>

          <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-[#444746]">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="relative hover:text-[#1F1F1F] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#1F1F1F] hover:after:w-full after:transition-all after:duration-300"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-xl border border-transparent hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Log out
                </button>
                <a
                  href={workspaceHref}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1F1F1F] hover:bg-black rounded-xl transition-colors"
                >
                  Open Noteeye
                </a>
              </>
            ) : (
              <>
                <a
                  href={loginUrl}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-transparent hover:bg-slate-50 transition-colors"
                >
                  Log in
                </a>
                <a
                  href={registerUrl}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1F1F1F] hover:bg-black rounded-xl transition-colors"
                >
                  Sign up
                </a>
              </>
            )}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden ml-1 p-2 rounded-xl hover:bg-white/70 cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mx-6 rounded-2xl bg-white/95 backdrop-blur border border-slate-100 shadow-lg p-2"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-slate-50"
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-medium rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Log out
              </button>
            )}
          </motion.nav>
        )}
      </header>

      {/* ───────────── 2. HERO ───────────── */}
      <section className="relative pt-32 sm:pt-36 pb-16 bg-gradient-to-b from-[#BFE0FB] via-[#DDF1FC] to-white">
        <CloudLayer />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-col items-center gap-1.5 mb-7"
          >
            <div className="flex -space-x-2.5">
              {AVATARS.map((src, i) => (
                <div
                  key={src}
                  className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm"
                  style={{ zIndex: AVATARS.length - i }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover scale-[1.15]" />
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 border border-slate-200 bg-white/80 rounded-full px-3 py-1 text-xs font-medium text-[#444746]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-[#1F1F1F]">4.9</span>
              <span className="text-slate-300">|</span>
              <span>500+ reviews</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.08] text-[#1F1F1F]"
          >
            Organize Your Notes,
            <br />
            Tasks, and Ideas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-5 text-sm sm:text-base text-[#444746]"
          >
            All your notes, folders, and checklists in one calm workspace.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8"
          >
            <DarkButton href={primaryHref} className="px-8 py-3.5 text-base">
              {isLoggedIn ? 'Open Noteeye' : 'Try For Free'}
            </DarkButton>
          </motion.div>

          {/* Interactive video showcase (3D perspective) */}
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

          {/* Global stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-200/70">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} className="px-4">
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs sm:text-sm text-[#5E5E5E]">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 3. MASTER YOUR KNOWLEDGE ───────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Master Your Knowledge with\nDigital Notecards'}</SectionHeading>

          <div className="mt-14 flex flex-col md:flex-row gap-6">
            {/* Left: beige note */}
            <Reveal className="flex-1">
              <div className="relative h-full min-h-[340px] rounded-[2rem] bg-[#F6EBDD] p-8 sm:p-10 flex flex-col justify-between overflow-hidden group">
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight max-w-xs">
                  Revolutionary Note-Taking
                </h3>
                <div className="flex items-end justify-between gap-4">
                  <DarkButton href={primaryHref} className="px-5 py-2.5">
                    Thumbnail
                  </DarkButton>
                  <motion.div
                    whileHover={{ rotate: 0, scale: 1.05 }}
                    className="w-28 h-32 rounded-2xl bg-white shadow-lg rotate-6 p-3 flex flex-col gap-2 transition-transform"
                  >
                    <span className="h-2 w-12 rounded-full bg-[#F6EBDD]" />
                    <span className="h-1.5 w-full rounded-full bg-slate-100" />
                    <span className="h-1.5 w-4/5 rounded-full bg-slate-100" />
                    <span className="h-1.5 w-3/5 rounded-full bg-slate-100" />
                    <span className="mt-auto text-[10px] font-semibold text-slate-400">∑ x² + y²</span>
                  </motion.div>
                </div>
              </div>
            </Reveal>

            {/* Right: cyan window with pen */}
            <Reveal className="flex-1" delay={0.12}>
              <div className="relative h-full min-h-[340px] rounded-[2rem] bg-[#D8F1F7] p-8 sm:p-10 overflow-hidden">
                <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-lg p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Electrical Engineering
                  </p>
                  <p className="mt-1 text-lg font-bold">Electronic Switch</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    A transistor is a semiconductor device used to amplify or switch electronic
                    signals and electrical power…
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
                <h3 className="relative z-10 mt-8 text-3xl sm:text-4xl font-bold tracking-tight leading-tight max-w-xs ml-auto text-right">
                  Powerful, Flexible Digital Notes
                </h3>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="mt-10">
          <TestimonialStrip t={TESTIMONIALS.features} />
        </div>
      </section>

      {/* ───────────── 4. PLANNING ───────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F6FAFE] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Planning that feels easy\nand effortless'}</SectionHeading>

          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Orange — calendar */}
            <Reveal delay={0}>
              <motion.div
                whileHover={{ y: -8, rotate: -1.5 }}
                className="h-72 rounded-[1.75rem] bg-gradient-to-b from-[#FFB36B] to-[#FF9A52] p-5 flex flex-col justify-between shadow-lg text-white"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/90 text-[#E8730C] flex items-center justify-center shadow">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-4xl font-extrabold leading-none">18 June</p>
                  <p className="mt-2 text-sm font-medium opacity-90">• Today</p>
                  <p className="text-xs opacity-80">Monday</p>
                </div>
              </motion.div>
            </Reveal>

            {/* Purple — tasks */}
            <Reveal delay={0.1} y={44}>
              <motion.div
                whileHover={{ y: -8 }}
                className="h-72 rounded-[1.75rem] bg-gradient-to-b from-[#D8C7FB] to-[#BFA6F5] p-5 flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-[#7C3AED] flex items-center justify-center shadow">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Tasks</p>
                  <div className="mt-3 space-y-2">
                    {['Write report', 'Plan schedule'].map((t, i) => (
                      <div
                        key={t}
                        className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-xs font-medium"
                      >
                        {t}
                        <span
                          className={`w-8 h-4 rounded-full relative ${i === 0 ? 'bg-[#7C3AED]' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                              i === 0 ? 'right-0.5' : 'left-0.5'
                            }`}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Pink — journal */}
            <Reveal delay={0.2}>
              <motion.div
                whileHover={{ y: -8, rotate: 1.5 }}
                className="h-72 rounded-[1.75rem] bg-gradient-to-b from-[#FFC4DD] to-[#FFA6CB] p-5 flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-[#DB2777] flex items-center justify-center shadow">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Journal</p>
                  <div className="mt-3 rounded-xl bg-white/80 p-3">
                    <p className="text-xs font-semibold">Today</p>
                    <div className="mt-2 space-y-1.5">
                      <span className="block h-1.5 w-full rounded-full bg-pink-200" />
                      <span className="block h-1.5 w-4/5 rounded-full bg-pink-200" />
                      <span className="block h-1.5 w-2/3 rounded-full bg-pink-200" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Blue / yellow — folding curl */}
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
          <SectionHeading>{'Everything You Need\nIn One App'}</SectionHeading>

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
        <div className="mt-14">
          <TestimonialStrip t={TESTIMONIALS.matrix} />
        </div>
      </section>

      {/* ───────────── 6. THINKING FLOWS INTO WRITING ───────────── */}
      <section id="about" className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F4F9FE] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Where Thinking Flows\nStraight Into Writing'}</SectionHeading>

          <div className="relative mt-16 max-w-3xl mx-auto min-h-[380px] sm:min-h-[420px]">
            {/* Back panel: note editor */}
            <Reveal className="absolute left-0 top-0 w-[86%] sm:w-[62%]">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-5">
                <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400">
                  <span>TAKE EDIT</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold">What’s the note to stop today?</p>
                <div className="mt-2 h-10 rounded-xl bg-slate-50 border border-slate-100" />
                <p className="mt-4 text-sm font-bold">Content</p>
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
                A writer’s a conundrum once, each editor, adjusting thy artistry; thoughts, evolving
                naked iterations, in regard run in the lowest conventions.
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#0B57D0]">
                  <Check className="w-3.5 h-3.5" /> Saved to Journal
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
                <span className="text-xs font-semibold">Draft outline</span>
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
        <div className="mt-14">
          <TestimonialStrip t={TESTIMONIALS.writing} />
        </div>
      </section>

      {/* ───────────── 7. PRICING ───────────── */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading>{'Smart Pricing For\nModern Teams.'}</SectionHeading>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1} className="h-full">
                <motion.div
                  whileHover={{ y: -8 }}
                  className={`relative h-full rounded-3xl border ${p.border} bg-gradient-to-b ${p.tint} p-7 flex flex-col ${
                    p.popular ? 'shadow-xl md:scale-[1.04]' : 'shadow-sm'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute top-5 right-5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#7C3AED] rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="text-xl font-bold">{p.name}</p>
                  <p className="mt-4 text-4xl font-extrabold tracking-tight">
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
                  <DarkButton href={primaryHref} className="mt-8 w-full">
                    Get Started
                  </DarkButton>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mt-14">
          <TestimonialStrip t={TESTIMONIALS.pricing} />
        </div>
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
              {'Your space for\nnotes and docs.'}
            </p>
          </motion.div>

          <Reveal className="mt-14">
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight">
              Simple Notes. Powerful Docs.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#444746]">
              Write notes and documents seamlessly — organized, fast, and distraction free.
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
                placeholder="Search or enter your email…"
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
                <span className="text-lg font-bold">Noteeye</span>
              </a>
              <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-[#444746]">
                {NAV_LINKS.map((l) => (
                  <a key={l.label} href={l.href} className="hover:text-[#1F1F1F] transition-colors">
                    {l.label}
                  </a>
                ))}
              </nav>

              <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-md">
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

              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-white/70 text-xs text-[#444746]">
                <span>noteeye.vercel.app</span>
                <span>© {new Date().getFullYear()} Noteeye. All rights reserved.</span>
              </div>
            </Reveal>
          </footer>
        </div>
      </section>

    </div>
  );
};

/* Brand glyphs (lucide v1 dropped brand icons) — Simple Icons paths */
const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'Dribbble',
    href: 'https://dribbble.com',
    path: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.174 10.174 0 0 0 4.392-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4a10.15 10.15 0 0 0 6.29 2.166c1.42 0 2.77-.29 4.006-.816zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.075.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
];

export default LandingPage;
