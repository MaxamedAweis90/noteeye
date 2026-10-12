import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, X, Cloud, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useSplashStore } from '../store/splashStore';

interface MobileUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MobileUserDrawer Component
 * Slide-over drawer for mobile screens, opened when tapping the user avatar in TopNav.
 * Displays personalized greeting (inspired by user mockup), profile summary, quick links, and logout.
 */
export const MobileUserDrawer: React.FC<MobileUserDrawerProps> = ({ isOpen, onClose }) => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const openProfileModal = useUIStore((state) => state.openProfileModal);
  const openSettingsModal = useUIStore((state) => state.openSettingsModal);
  const showToast = useUIStore((state) => state.showToast);
  const triggerLogoutSplash = useSplashStore((state) => state.triggerLogoutSplash);

  // Time-based greeting helper (matching reference: "Good Morning, Dimitar!")
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user.name || (isAuthenticated ? 'User' : 'Guest');
  const greeting = `${getGreeting()}, ${displayName}!`;

  const getInitials = (text: string) => {
    const parts = (text || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (text || '').slice(0, 2).toUpperCase() || 'NE';
  };

  const handleLogout = () => {
    onClose();
    triggerLogoutSplash(() => {
      logout();
      showToast('Signed out of Noteeye');
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-over Content Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200/80"
          >
            {/* Header with Close */}
            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Account & Settings
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Greeting & Identity Section */}
            <div className="p-5 flex flex-col gap-4 bg-[#F8FAFD] border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-[#1F1F1F] truncate leading-tight">
                    {greeting}
                  </h3>
                  <span className="text-xs text-slate-500 truncate mt-0.5">
                    {user.email || 'No email attached'}
                  </span>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>MongoDB Atlas Connected</span>
                </div>

                {user.isEmailVerified ? (
                  <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-1 text-[11px] text-blue-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Unverified</span>
                  </div>
                )}
              </div>

              {user.isScheduledForDeletion && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Deletion scheduled ({user.remainingRecoveryDays ?? 30} days remaining)</span>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openProfileModal();
                }}
                className="w-full p-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 text-sm font-medium text-slate-800 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <span>Profile & Identity</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openSettingsModal();
                }}
                className="w-full p-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 text-sm font-medium text-slate-800 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Preferences & Shortcuts</span>
              </button>
            </div>

            {/* Logout Footer */}
            {isAuthenticated && (
              <div className="p-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out of Noteeye</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileUserDrawer;
