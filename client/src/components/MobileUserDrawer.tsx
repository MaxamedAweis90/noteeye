import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, X, Cloud, CheckCircle2, AlertCircle, Clock, Camera, Loader2, Laptop, Sun, Moon, MessageSquarePlus } from '@/components/ui/icons';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useSplashStore } from '../store/splashStore';
import { useThemeStore } from '../store/themeStore';
import { handleSessionEndRedirect } from '../utils/sessionNavigation';

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
  const uploadAvatar = useUserStore((state) => state.uploadAvatar);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const openProfileModal = useUIStore((state) => state.openProfileModal);
  const openSettingsModal = useUIStore((state) => state.openSettingsModal);
  const openSessionsModal = useUIStore((state) => state.openSessionsModal);
  const openFeedbackModal = useUIStore((state) => state.openFeedbackModal);
  const showToast = useUIStore((state) => state.showToast);
  const triggerLogoutSplash = useSplashStore((state) => state.triggerLogoutSplash);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      handleSessionEndRedirect('logout');
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
            className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 border-l border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            {/* Header with Close */}
            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Account & Settings
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Greeting & Identity Section */}
            <div className="p-5 flex flex-col gap-4 bg-[#F8FAFD] dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="relative group cursor-pointer w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-300" />
                  ) : user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      showToast('Please select a valid image file');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      showToast('Image size exceeds 5MB limit');
                      return;
                    }
                    setIsUploadingAvatar(true);
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const dataUrl = reader.result as string;
                      const success = await uploadAvatar(dataUrl, file.name);
                      setIsUploadingAvatar(false);
                      if (success) {
                        showToast('Avatar updated successfully');
                      } else {
                        showToast('Failed to upload avatar');
                      }
                    };
                    reader.onerror = () => {
                      setIsUploadingAvatar(false);
                      showToast('Failed to read image file');
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-[#1F1F1F] dark:text-white truncate leading-tight">
                    {greeting}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.email || 'No email attached'}
                  </span>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>MongoDB Atlas Connected</span>
                </div>

                {user.isEmailVerified ? (
                  <div className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Unverified</span>
                  </div>
                )}
              </div>

              {user.isScheduledForDeletion && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Deletion scheduled ({user.remainingRecoveryDays ?? 30} days remaining)</span>
                </div>
              )}

              {/* Theme Segmented Switcher in Drawer */}
              <div className="p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-300/40 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer border-0 ${
                    theme === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer border-0 ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer border-0 ${
                    theme === 'system'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 shrink-0" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openProfileModal();
                }}
                className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
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
                className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Preferences & Shortcuts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openSessionsModal();
                }}
                className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <span>Active Sessions & Devices</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openFeedbackModal();
                }}
                className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <span>Feedback & Report</span>
              </button>
            </div>

            {/* Logout Footer */}
            {isAuthenticated && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
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
