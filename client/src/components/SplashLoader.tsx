import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { useSplashStore } from '../store/splashStore';

/**
 * SplashLoader Component
 * Full-screen minimalist humane loading transition screen.
 * Displays during Login and Logout with tailored dynamic messages and smooth progress indicator.
 */
export const SplashLoader: React.FC = () => {
  const isActive = useSplashStore((state) => state.isActive);
  const title = useSplashStore((state) => state.title);
  const stepMessage = useSplashStore((state) => state.stepMessage);
  const progress = useSplashStore((state) => state.progress);
  const mode = useSplashStore((state) => state.mode);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="noteeye-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[99999] bg-[#F8FAFD]/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 select-none"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-sm w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center gap-6"
          >
            {/* Logo Mark */}
            <div className="scale-105">
              <Logo />
            </div>

            {/* Title & Dynamic Status Message */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F] tracking-tight">
                {title || 'Loading Noteeye'}
              </h2>
              <p className="text-xs text-slate-500 font-medium h-5 transition-all text-center">
                {stepMessage || 'Please wait...'}
              </p>
            </div>

            {/* Clean Minimalist Linear Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  mode === 'logout' ? 'bg-slate-600' : 'bg-[#1F1F1F]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress footer info */}
            <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-medium px-0.5">
              <span>{mode === 'logout' ? 'Resetting session' : 'Syncing workspace'}</span>
              <span className="font-mono">{progress}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashLoader;
