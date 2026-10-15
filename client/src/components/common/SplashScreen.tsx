import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useIsFetching } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useSplashStore } from '../../store/splashStore';
import { verifyInitialConnection } from '../../hooks/useOnlineStatus';
import { isPWAMode } from '../../pwa/registerSW';
import { isMarketingDomain } from '../../utils/domain';

/**
 * Noteeye Authentic Vector Brand Icon
 * Rendered using precise SVG geometry with gradient styling matching Noteeye's design system.
 */
const AnimatedBrandIcon: React.FC<{ isDone?: boolean }> = ({ isDone }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Dynamic ambient breathing aura */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#863BFF] via-[#7E14FF] to-[#47BFFF] blur-2xl pointer-events-none"
      />

      {/* Main Vector Icon Container with Entrance & Exit Physics */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 16, filter: 'blur(6px)' }}
        animate={
          isDone
            ? { scale: 1.08, opacity: 0, y: -10, filter: 'blur(4px)' }
            : { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }
        }
        transition={{
          duration: isDone ? 0.4 : 0.65,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center drop-shadow-[0_8px_32px_rgba(134,59,255,0.45)]"
      >
        <img
          src="/noteeye_logo.png"
          alt="Noteeye Logo"
          className="w-full h-full object-contain select-none"
          onError={(e) => {
            // High-fidelity SVG fallback if png is missing
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('svg')) {
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('viewBox', '0 0 48 46');
              svg.setAttribute('class', 'w-full h-full drop-shadow-[0_0_24px_rgba(134,59,255,0.7)]');
              svg.innerHTML = `
                <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
              `;
              parent.appendChild(svg);
            }
          }}
        />
      </motion.div>
    </div>
  );
};

/**
 * FullScreen Noteeye Master Splash Screen Implementation
 * Orchestrates:
 * 1. Full-screen edge-to-edge luxury background (No square card)
 * 2. Real-time network reachability check
 * 3. User session authentication & authorization check
 * 4. TanStack Query workspace pre-fetching & settling (notes, folders, profile)
 * 5. Safety ceiling timeout (never hangs indefinitely)
 * 6. Smooth animated logo entrance, idle pulse, and exit transition
 * 7. PWA standalone mode differentiation
 * 8. Staged login/logout overlay support
 */
const AppSplashScreen: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const user = useAuthStore((state) => state.user);

  // Splash Store state (for programmatic login / logout splashes)
  const isStoreSplashActive = useSplashStore((state) => state.isActive);
  const storeMode = useSplashStore((state) => state.mode);
  const storeTitle = useSplashStore((state) => state.title);
  const storeMessage = useSplashStore((state) => state.stepMessage);
  const storeProgress = useSplashStore((state) => state.progress);
  const isInitialBootDone = useSplashStore((state) => state.isInitialBootDone);
  const markInitialBootDone = useSplashStore((state) => state.markInitialBootDone);

  const isFetching = useIsFetching();
  const isPWA = typeof window !== 'undefined' && isPWAMode();

  // Internal lifecycle states for initial boot
  const [progress, setProgress] = useState(15);
  const [isDone, setIsDone] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [activeMessage, setActiveMessage] = useState<string>('Verifying connection...');
  const [hasAuthSettled, setHasAuthSettled] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [networkChecked, setNetworkChecked] = useState(false);

  // Safety ceiling ref to avoid hanging indefinitely if network or query stalls
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Progress Acceleration (Stages 15% -> 85%) during initial boot
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Cap progress at 85% until real data queries have fully completed
        if (prev >= 85) return prev;
        return prev + Math.floor(Math.random() * 8) + 5;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isInitialBootDone, isStoreSplashActive]);

  // 2. Perform authoritative connection check right during splash display
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive) return;

    verifyInitialConnection().then((online) => {
      setIsNetworkOnline(online);
      setNetworkChecked(true);
      if (!online) {
        setActiveMessage(
          isPWA
            ? 'PWA Offline Workspace: Loading local cache...'
            : 'Offline mode: Loading cached workspace...'
        );
        // In offline mode, do not block waiting for live network queries
        setIsDataReady(true);
      }
    });
  }, [isInitialBootDone, isStoreSplashActive, isPWA]);

  // 3. Allow React component tree to mount and trigger background queries once session is known
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive) return;

    if (!isCheckingAuth && !hasAuthSettled) {
      const timer = setTimeout(() => {
        setHasAuthSettled(true);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [isCheckingAuth, isInitialBootDone, isStoreSplashActive, hasAuthSettled]);

  // 4. Safety Timeout (Maximum 3.0s ceiling for smooth exit even on slow networks)
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive) return;

    safetyTimeoutRef.current = setTimeout(() => {
      setIsDataReady(true);
    }, 3000);

    return () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [isInitialBootDone, isStoreSplashActive]);

  // 5. Data Readiness Detection: Wait until auth is settled AND remote queries have finished
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive || isDataReady) return;

    // If offline check already resolved to offline, data is ready from cache
    if (networkChecked && !isNetworkOnline) {
      setIsDataReady(true);
      return;
    }

    if (!isCheckingAuth) {
      if (isAuthenticated && user) {
        setActiveMessage('Synchronizing workspace notes & folders...');
        // For authenticated users: wait until initial queries have dispatched and settled
        if (hasAuthSettled && isFetching === 0) {
          setIsDataReady(true);
        }
      } else {
        // For guest users: workspace is immediately ready once auth resolves
        if (hasAuthSettled) {
          setIsDataReady(true);
        }
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    user,
    hasAuthSettled,
    isFetching,
    isDataReady,
    networkChecked,
    isNetworkOnline,
    isInitialBootDone,
    isStoreSplashActive,
  ]);

  // 6. Completion Transition: Once data is 100% ready, smoothly complete progress and fade out
  useEffect(() => {
    if (isInitialBootDone || isStoreSplashActive || !isDataReady) return;

    if (networkChecked && !isNetworkOnline) {
      setActiveMessage(isPWA ? 'PWA Offline Ready' : 'Offline Workspace Ready');
    } else {
      setActiveMessage(isAuthenticated ? 'Workspace Ready' : 'Ready to Take Notes');
    }
    setProgress(100);

    const fadeTimer = setTimeout(() => {
      setIsDone(true);
      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
        markInitialBootDone();
      }, 450);
      return () => clearTimeout(unmountTimer);
    }, 280);

    return () => clearTimeout(fadeTimer);
  }, [
    isDataReady,
    isInitialBootDone,
    isStoreSplashActive,
    isAuthenticated,
    networkChecked,
    isNetworkOnline,
    isPWA,
    markInitialBootDone,
  ]);

  // 7. Handle Programmatic Login / Logout Splash Triggers
  const isDisplayingTriggerSplash = isStoreSplashActive && (storeMode === 'login' || storeMode === 'logout');
  const effectiveProgress = isDisplayingTriggerSplash ? storeProgress : progress;
  const effectiveMessage = isDisplayingTriggerSplash ? storeMessage : activeMessage;
  const effectiveTitle = isDisplayingTriggerSplash
    ? storeTitle
    : isPWA
      ? 'Noteeye App'
      : 'Noteeye';

  // Determine whether splash should be visible
  const isVisible = (!isInitialBootDone && shouldRender) || isDisplayingTriggerSplash;

  if (!isVisible) return null;

  return (
    <div
      id="noteeye-splash-screen"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${
        isDone && !isDisplayingTriggerSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#F8FAFD',
        backgroundImage: `
          radial-gradient(circle at 50% 40%, #FFFFFF 0%, #F1F5F9 55%, #E8EEF5 100%),
          linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
      }}
    >
      <div className="flex flex-col items-center text-center max-w-sm px-6 w-full">
        {/* Animated Brand Vector Icon */}
        <div className="mb-4">
          <AnimatedBrandIcon isDone={isDone && !isDisplayingTriggerSplash} />
        </div>

        {/* Brand Title & PWA Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight font-display">
              {effectiveTitle}
            </h1>
            {isPWA && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200/80">
                PWA
              </span>
            )}
          </div>
          <p className="text-[11px] tracking-[0.22em] font-medium text-slate-500 uppercase mt-1.5">
            Calm Notes & Ideas · Workspace
          </p>
        </motion.div>

        {/* Gradient Progress Bar */}
        <div className="w-56 sm:w-64 h-2 bg-slate-200/90 border border-slate-300/60 rounded-full overflow-hidden mt-7 mb-3.5 relative shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-[#863BFF] via-[#7E14FF] to-[#3B82F6] rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(134,59,255,0.45)]"
            style={{ width: `${effectiveProgress}%` }}
          />
        </div>

        {/* Dynamic Status Text with Pulse Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="truncate max-w-[280px]">{effectiveMessage}</span>
        </div>
      </div>

      {/* App Version at bottom 12px */}
      <div className="absolute bottom-3 text-[10px] tracking-[0.25em] font-semibold text-slate-400 uppercase select-none">
        {isPWA ? 'Noteeye App · v0.2.0' : 'Noteeye · v0.2.0'}
      </div>
    </div>
  );
};

/**
 * Noteeye Master Splash Screen
 * Strictly rendered only on the App Workspace domain (app-noteeye.vercel.app, localhost app, or PWA standalone).
 * Completely bypassed on marketing landing domain (noteeye.vercel.app or local /landing).
 */
export const SplashScreen: React.FC = () => {
  if (isMarketingDomain()) {
    return null;
  }
  return <AppSplashScreen />;
};

export default SplashScreen;
