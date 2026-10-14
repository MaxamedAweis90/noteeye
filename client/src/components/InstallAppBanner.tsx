import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from '@/components/ui/icons';
import { usePWAInstallPrompt } from '../pwa/registerSW';

/**
 * InstallAppBanner Component
 * Unobtrusive, minimalist floating pill prompt for Noteeye PWA installation.
 * - Activates only when the browser fires beforeinstallprompt on the workspace app.
 * - Never renders on the marketing landing page (noteeye.vercel.app).
 * - Respects permanent or temporary user dismissal in localStorage.
 */
export const InstallAppBanner: React.FC = () => {
  const { isInstallable, install, dismiss } = usePWAInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed bottom-[74px] left-4 right-18 sm:left-auto sm:right-20 sm:bottom-6 z-40 max-w-sm select-none"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:px-3 sm:py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12),0_1px_3px_rgb(0,0,0,0.06)] border border-slate-200/80 flex items-center gap-2.5 sm:gap-3">
          {/* Leading Icon Badge */}
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center shrink-0 border border-blue-100/80">
            <Smartphone className="w-4 h-4 stroke-[2.2]" />
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs font-semibold text-[#1F1F1F] leading-tight truncate">
              Install Noteeye App
            </p>
            <p className="text-[11px] text-slate-500 font-normal leading-tight hidden xs:block truncate mt-0.5">
              Install Noteeye desktop/mobile app
            </p>
          </div>

          {/* Install Action Button */}
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalling}
            aria-label="Install Noteeye desktop or mobile application"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isInstalling ? 'Installing...' : 'Install'}</span>
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss app install banner"
            title="Dismiss"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallAppBanner;
