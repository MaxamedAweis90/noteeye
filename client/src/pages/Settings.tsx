import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Lock,
  Database,
  Download,
  Trash2,
  Clock,
  RotateCcw,
  Volume2,
  Calendar,
  Bell,
  Keyboard,
  LogOut,
  Loader2,
  Check,
  CheckCircle2,
  AlertTriangle,
} from '@/components/ui/icons';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { useSplashStore } from '../store/splashStore';
import { handleSessionEndRedirect } from '../utils/sessionNavigation';
import { authApi } from '../api';
import { PASTEL_PALETTE } from '../types';
import type { ItemType } from '../types';
import { DeleteDialog } from '../components/modals/DeleteDialog';

/**
 * Settings Screen — Minimalist Humane Redesign
 * Grounded Material 3 / Linear-inspired desktop utility:
 * Crisp typography, warm white/slate canvases, clean 1px borders, subtle pill switches.
 */
export const Settings: React.FC = () => {
  const showToast = useUIStore((state) => state.showToast);
  const user = useUserStore((state) => state.user);
  const updateSettings = useUserStore((state) => state.updateSettings);
  const deleteAccount = useUserStore((state) => state.deleteAccount);
  const recoverAccount = useUserStore((state) => state.recoverAccount);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);
  const triggerLogoutSplash = useSplashStore((state) => state.triggerLogoutSplash);

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);

  // Settings states
  const [defaultColor, setDefaultColor] = useState<string>(
    user.settings?.defaultNoteColor || 'peach'
  );
  const [defaultType, setDefaultType] = useState<ItemType>(
    user.settings?.defaultNoteType || 'note'
  );
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // Password change form states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Shortcuts & Notifications states
  const [shortcutsEnabled, setShortcutsEnabled] = useState(
    user.settings?.shortcutsEnabled ?? true
  );
  const [modifierKey, setModifierKey] = useState(
    user.settings?.modifierKey || 'ctrl'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user.settings?.notificationsEnabled ?? false
  );
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(
    user.settings?.dailyReminderEnabled ?? false
  );
  const [dailyReminderTime, setDailyReminderTime] = useState(
    user.settings?.dailyReminderTime || '09:00'
  );
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(
    user.settings?.soundEffectsEnabled ?? true
  );

  // Browser Notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    fetchProfile();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    if (typeof window !== 'undefined' && window.location.hash === '#sessions') {
      const timer = setTimeout(() => {
        const el = document.getElementById('active-sessions');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [fetchProfile]);

  useEffect(() => {
    setDefaultColor(user.settings?.defaultNoteColor || 'peach');
    setDefaultType(user.settings?.defaultNoteType || 'note');
    setShortcutsEnabled(user.settings?.shortcutsEnabled ?? true);
    setModifierKey(user.settings?.modifierKey || 'ctrl');
    setNotificationsEnabled(user.settings?.notificationsEnabled ?? false);
    setDailyReminderEnabled(user.settings?.dailyReminderEnabled ?? false);
    setDailyReminderTime(user.settings?.dailyReminderTime || '09:00');
    setSoundEffectsEnabled(user.settings?.soundEffectsEnabled ?? true);
  }, [user.settings]);

  // Save preference helper
  const handleSavePreferences = async (overrides = {}) => {
    const nextSettings = {
      defaultNoteColor: defaultColor,
      defaultNoteType: defaultType,
      shortcutsEnabled,
      modifierKey,
      notificationsEnabled,
      dailyReminderEnabled,
      dailyReminderTime,
      soundEffectsEnabled,
      ...overrides,
    };
    const success = await updateSettings(nextSettings);
    if (success) {
      showToast('Settings saved');
    }
  };

  // Change password submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    try {
      setIsPasswordLoading(true);
      await authApi.changePassword({ currentPassword, newPassword });
      showToast('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err: any) {
      showToast(err.message || 'Error updating password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Request browser push notification permission
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        handleSavePreferences({ notificationsEnabled: true });
        showToast('Notification permission granted');
      } else {
        showToast('Permission was not granted');
      }
    } catch {
      showToast('Could not request notification permission');
    }
  };

  // Test notification
  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Noteeye Workspace Alert', {
        body: 'Push notification delivery is functioning properly.',
        icon: '/favicon.ico',
      });
      showToast('Test notification dispatched');
    } else {
      showToast('Noteeye Alert: Test notification preview');
    }
  };

  // Export data as JSON
  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
      },
      notes: items,
      folders,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noteeye-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported to JSON file');
  };

  // Delete account directly (no confirmation)
  const handleDeleteAccountDirectly = async () => {
    const success = await deleteAccount();
    if (success) {
      showToast('Account scheduled for deletion (30-day recovery active)');
    }
  };

  // Recover account
  const handleRecoverAccount = async () => {
    const success = await recoverAccount();
    if (success) {
      showToast('Account recovered successfully');
    }
  };

  // Recovery expiry date calculation
  const getRecoveryExpiryDate = () => {
    if (!user.deletionScheduledAt) return '30 days';
    const date = new Date(user.deletionScheduledAt);
    date.setDate(date.getDate() + (user.recoveryPeriodDays || 30));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-10 px-4 select-none flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-200/70 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-display font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
          Customize workspace preferences, keybindings, notifications, and account security.
        </p>
      </div>

      {/* Account Deletion Active Banner */}
      {user.isScheduledForDeletion && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                Account Scheduled for Deletion
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Your data is safely frozen during the 30-day grace period. You have <strong>{user.remainingRecoveryDays ?? 30} days</strong> remaining (until {getRecoveryExpiryDate()}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRecoverAccount}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover Account</span>
          </button>
        </div>
      )}

      {/* Section 1: Appearance & Editor Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
            Appearance & Editor Preferences
          </h2>
        </div>

        {/* Default Note Color Swatches */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Default Note Color
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              New notes automatically apply this pastel tone.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {PASTEL_PALETTE.map((color) => {
              const isSelected = defaultColor === color.key;
              return (
                <button
                  key={color.key}
                  type="button"
                  onClick={() => {
                    setDefaultColor(color.key);
                    handleSavePreferences({ defaultNoteColor: color.key });
                  }}
                  className={`w-7 h-7 rounded-full border transition-all cursor-pointer flex items-center justify-center ${color.bgClass} ${color.borderClass} ${
                    isSelected ? 'ring-2 ring-slate-800 dark:ring-slate-300 scale-110 shadow-xs' : 'hover:scale-105 opacity-80'
                  }`}
                  title={color.name}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-slate-800 dark:text-slate-900" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Default Note Type Segmented Pill */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Default Note Type
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Initial format when creating blank cards.
            </span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
            {(['note', 'checklist', 'idea'] as const).map((typeOption) => (
              <button
                key={typeOption}
                type="button"
                onClick={() => {
                  setDefaultType(typeOption);
                  handleSavePreferences({ defaultNoteType: typeOption });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                  defaultType === typeOption
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {typeOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Keyboard Shortcuts Options */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                Keyboard Shortcuts
              </h2>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Desktop accelerator keybindings.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextVal = !shortcutsEnabled;
              setShortcutsEnabled(nextVal);
              handleSavePreferences({ shortcutsEnabled: nextVal });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              shortcutsEnabled ? 'bg-[#1F1F1F] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                shortcutsEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Modifier key selector */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Modifier Key
          </span>
          <div className="flex items-center gap-1.5">
            {(['ctrl', 'cmd', 'alt'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setModifierKey(key);
                  handleSavePreferences({ modifierKey: key });
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  modifierKey === key
                    ? 'bg-[#1F1F1F] dark:bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: PWA Notifications Control */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                PWA Notifications
              </h2>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Push alerts, daily review reminders, and auditory feedback.
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              notificationPermission === 'granted'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {notificationPermission === 'granted' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {notificationPermission === 'granted' ? 'Allowed' : 'Not Configured'}
          </span>
        </div>

        {/* Master Push Toggle / Grant Button */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Push Notifications
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Receive reminder alerts directly on this device.
            </span>
          </div>

          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Grant Access
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const nextVal = !notificationsEnabled;
                setNotificationsEnabled(nextVal);
                handleSavePreferences({ notificationsEnabled: nextVal });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                notificationsEnabled ? 'bg-[#1F1F1F] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationsEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          )}
        </div>

        {/* Daily Reminder Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Daily Reminder Time
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Review notes and checklist deadlines.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => {
                setDailyReminderTime(e.target.value);
                handleSavePreferences({ dailyReminderTime: e.target.value });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                const nextVal = !dailyReminderEnabled;
                setDailyReminderEnabled(nextVal);
                handleSavePreferences({ dailyReminderEnabled: nextVal });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                dailyReminderEnabled ? 'bg-[#1F1F1F] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  dailyReminderEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Sound Effects
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Subtle auditory chime on checklist completion.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextVal = !soundEffectsEnabled;
              setSoundEffectsEnabled(nextVal);
              handleSavePreferences({ soundEffectsEnabled: nextVal });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              soundEffectsEnabled ? 'bg-[#1F1F1F] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                soundEffectsEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Test Notification Trigger */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleTestNotification}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            Send Test Notification
          </button>
        </div>
      </div>

      {/* Section 4: Security & Password */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                Security & Password
              </h2>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Update account authentication password.
              </span>
            </div>
          </div>

          {!isChangingPassword && (
            <button
              type="button"
              onClick={() => setIsChangingPassword(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Change Password
            </button>
          )}
        </div>

        {/* Collapsible Change Password Form */}
        {isChangingPassword && (
          <form onSubmit={handleChangePassword} className="pt-2 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPasswordLoading}
                className="px-4 py-1.5 rounded-lg bg-[#1F1F1F] dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPasswordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 5: Data & Storage */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
            Data & Storage
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Trash Auto-Retention
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Soft-deleted notes and folders are permanently cleaned after 30 days.
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            30 Days
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Export Archive
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Download your complete workspace as an offline JSON package.
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Section 6: Account Danger Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              triggerLogoutSplash(() => {
                logout();
                showToast('Signed out of Noteeye');
                handleSessionEndRedirect('logout');
              });
            }}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Log out</span>
          </button>

          {user.isScheduledForDeletion ? (
            <button
              type="button"
              onClick={handleRecoverAccount}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recover Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Delete account"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccountDirectly}
        title="Delete Account?"
        description="Are you sure you want to delete your account? All your notes, folders, and workspace data will be scheduled for permanent deletion. You will have a 30-day grace period to recover your account."
        confirmLabel="Delete Account"
        isPermanent={true}
      />
    </div>
  );
};

export default Settings;
