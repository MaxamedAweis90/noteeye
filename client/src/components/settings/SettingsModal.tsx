import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Keyboard,
  Bell,
  Trash2,
  Clock,
  RotateCcw,
  Volume2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Database,
  Download,
  Lock,
  Loader2,
  LogOut,
} from '@/components/ui/icons';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/useNoteStore';
import { useUIStore } from '../../store/uiStore';
import { useSplashStore } from '../../store/splashStore';
import { authApi } from '../../api';
import { PASTEL_PALETTE } from '../../types';
import type { ItemType } from '../../types';
import { handleSessionEndRedirect } from '../../utils/sessionNavigation';
import { DeleteDialog } from '../modals/DeleteDialog';

/**
 * SettingsModal Component — Minimalist Humane Redesign
 * Full-screen popup screen covering entire viewport.
 * Header layout: Close 'X' pinned to TOP-LEFT, Screen Title pinned to TOP-RIGHT.
 * Minimalist, humane desktop utility feel:
 * - Appearance & Editor Preferences (pastel swatch selector, note/checklist pill)
 * - Keyboard Shortcuts Options with modifier pills & keybindings
 * - PWA Notifications Control section with permission badge & daily reminder
 * - Password Security collapsible form
 * - Data & Storage export
 * - Account Deletion WITHOUT confirmation & 30-day recovery grace period
 */
export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const closeSettingsModal = useUIStore((state) => state.closeSettingsModal);
  const activeSettingsSection = useUIStore((state) => state.activeSettingsSection);
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

  // Settings form states
  const [defaultColor, setDefaultColor] = useState<string>(
    user.settings?.defaultNoteColor || 'peach'
  );
  const [defaultType, setDefaultType] = useState<ItemType>(
    user.settings?.defaultNoteType || 'note'
  );
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
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isSettingsOpen]);

  // Auto-scroll to section if requested (e.g. from user menu -> active sessions)
  useEffect(() => {
    if (isSettingsOpen && activeSettingsSection === 'sessions') {
      const timer = setTimeout(() => {
        const el = document.getElementById('active-sessions');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isSettingsOpen, activeSettingsSection]);

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadDraft = () => {
    const s = useUserStore.getState().user.settings;
    setDefaultColor(s?.defaultNoteColor || 'peach');
    setDefaultType(s?.defaultNoteType || 'note');
    setShortcutsEnabled(s?.shortcutsEnabled ?? true);
    setModifierKey(s?.modifierKey || 'ctrl');
    setNotificationsEnabled(s?.notificationsEnabled ?? false);
    setDailyReminderEnabled(s?.dailyReminderEnabled ?? false);
    setDailyReminderTime(s?.dailyReminderTime || '09:00');
    setSoundEffectsEnabled(s?.soundEffectsEnabled ?? true);
  };

  // Initialise the draft ONLY when the modal opens (background syncs must not clobber edits)
  useEffect(() => {
    if (isSettingsOpen) {
      loadDraft();
      fetchProfile().then(loadDraft).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen]);

  const draftSettings = {
    defaultNoteColor: defaultColor,
    defaultNoteType: defaultType,
    shortcutsEnabled,
    modifierKey,
    notificationsEnabled,
    dailyReminderEnabled,
    dailyReminderTime,
    soundEffectsEnabled,
  };
  const savedSettings = {
    defaultNoteColor: user.settings?.defaultNoteColor || 'peach',
    defaultNoteType: user.settings?.defaultNoteType || 'note',
    shortcutsEnabled: user.settings?.shortcutsEnabled ?? true,
    modifierKey: user.settings?.modifierKey || 'ctrl',
    notificationsEnabled: user.settings?.notificationsEnabled ?? false,
    dailyReminderEnabled: user.settings?.dailyReminderEnabled ?? false,
    dailyReminderTime: user.settings?.dailyReminderTime || '09:00',
    soundEffectsEnabled: user.settings?.soundEffectsEnabled ?? true,
  };
  const isDirty = JSON.stringify(draftSettings) !== JSON.stringify(savedSettings);

  const requestClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    loadDraft();
    closeSettingsModal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        requestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen, isDirty]);

  if (!isSettingsOpen) return null;

  // Persist the whole draft in one request
  const handleSaveSettings = async () => {
    if (!isDirty || isSavingSettings) return;
    setIsSavingSettings(true);
    const success = await updateSettings(draftSettings);
    setIsSavingSettings(false);
    showToast(success ? 'Settings saved' : 'Error saving settings');
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
      showToast('Password updated');
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

  // Browser notification permission request
  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showToast('Notifications enabled — save to apply');
      } else {
        showToast('Permission not granted');
      }
    } catch {
      showToast('Could not request notification permission');
    }
  };

  // Test notification trigger
  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Noteeye Alert', {
        body: 'Push notifications are active.',
        icon: '/favicon.ico',
      });
      showToast('Test notification sent');
    } else {
      showToast('Noteeye Alert: Test notification preview');
    }
  };

  // Export JSON archive
  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: { name: user.name, email: user.email },
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

  // Delete account directly without confirmation
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

  // Expiry date calculation
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

  // Shortcuts list
  const shortcutsList = [
    { label: 'Search Noteeye', keyCombo: `${modifierKey.toUpperCase()} + K`, desc: 'Focus global search' },
    { label: 'New Note', keyCombo: `${modifierKey.toUpperCase()} + N`, desc: 'Create blank note' },
    { label: 'New Checklist', keyCombo: `${modifierKey.toUpperCase()} + Shift + N`, desc: 'Create checklist card' },
    { label: 'New Folder', keyCombo: `${modifierKey.toUpperCase()} + Shift + F`, desc: 'Create folder' },
    { label: 'Undo Action', keyCombo: `${modifierKey.toUpperCase()} + Z`, desc: 'Undo note change' },
    { label: 'Redo Action', keyCombo: `${modifierKey.toUpperCase()} + Shift + Z`, desc: 'Redo action' },
    { label: 'Copy Selected', keyCombo: `${modifierKey.toUpperCase()} + C`, desc: 'Copy to clipboard' },
    { label: 'Cut Selected', keyCombo: `${modifierKey.toUpperCase()} + X`, desc: 'Cut item' },
    { label: 'Paste into View', keyCombo: `${modifierKey.toUpperCase()} + V`, desc: 'Paste clipboard item' },
    { label: 'Delete Selected', keyCombo: 'Delete / Backspace', desc: 'Move to trash' },
    { label: 'Toggle Inspector', keyCombo: `${modifierKey.toUpperCase()} + I`, desc: 'Show/hide details' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="settings-modal-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-[#F8FAFD] dark:bg-[#0B0F17] flex flex-col overflow-y-auto custom-scrollbar select-none"
      >
        {/* Sticky Top Header Bar: Close 'X' on TOP-LEFT, Title on TOP-RIGHT */}
        <header className="sticky top-0 z-30 bg-[#F8FAFD]/95 dark:bg-[#0B0F17]/95 backdrop-blur-sm px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800">
          {/* Top-Left: Close X Button + Desktop Esc Hint */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={requestClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
              aria-label="Close Settings screen"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 font-normal select-none">
              Press Esc to close
            </span>
          </div>

          {/* Top-Right: Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Preferences
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
              Settings
            </h1>
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-6">
          {/* Active Account Deletion Notice Banner */}
          {user.isScheduledForDeletion && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">
                    Account Scheduled for Deletion
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Data safely frozen. You have <strong>{user.remainingRecoveryDays ?? 30} days</strong> remaining (until {getRecoveryExpiryDate()}).
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                Appearance & Editor Preferences
              </h2>
            </div>

            {/* Default Note Color Swatches */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Default Note Color
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  New cards automatically apply this pastel tone.
                </span>
              </div>

              <div className="flex items-center gap-2">
                {PASTEL_PALETTE.map((color) => {
                  const isSelected = defaultColor === color.key;
                  return (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setDefaultColor(color.key)}
                      className={`w-7 h-7 rounded-full border transition-all cursor-pointer flex items-center justify-center ${color.bgClass} ${color.borderClass} ${
                        isSelected ? 'ring-2 ring-slate-800 dark:ring-white scale-110 shadow-xs' : 'hover:scale-105 opacity-80'
                      }`}
                      title={color.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-800" />}
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

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                {(['note', 'checklist', 'idea'] as const).map((typeOption) => (
                  <button
                    key={typeOption}
                    type="button"
                    onClick={() => setDefaultType(typeOption)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                      defaultType === typeOption
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                    Keyboard Shortcuts
                  </h2>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Master accelerator keybindings.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  shortcutsEnabled ? 'bg-[#1F1F1F] dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full absolute top-1 transition-transform ${
                    shortcutsEnabled ? 'left-6 bg-white dark:bg-slate-900' : 'left-1 bg-white dark:bg-slate-400'
                  }`}
                />
              </button>
            </div>

            {/* Modifier Key */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Modifier Key
              </span>
              <div className="flex items-center gap-1.5">
                {(['ctrl', 'cmd', 'alt'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setModifierKey(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      modifierKey === key
                        ? 'bg-[#1F1F1F] dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Keybindings Reference */}
            <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFD] dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2 px-3.5">Action</th>
                    <th className="py-2 px-3.5">Keybinding</th>
                    <th className="py-2 px-3.5 hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {shortcutsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {item.label}
                      </td>
                      <td className="py-2 px-3.5">
                        <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {item.keyCombo}
                        </kbd>
                      </td>
                      <td className="py-2 px-3.5 text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                        {item.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: PWA Notifications Control */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-5">
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {notificationPermission === 'granted' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {notificationPermission === 'granted' ? 'Allowed' : 'Not Configured'}
              </span>
            </div>

            {/* Master Push Toggle / Grant Button */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
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
                  onClick={handleRequestNotificationPermission}
                  className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Grant Access
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notificationsEnabled ? 'bg-[#1F1F1F] dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full absolute top-1 transition-transform ${
                      notificationsEnabled ? 'left-6 bg-white dark:bg-slate-900' : 'left-1 bg-white dark:bg-slate-400'
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
                  onChange={(e) => setDailyReminderTime(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setDailyReminderEnabled(!dailyReminderEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    dailyReminderEnabled ? 'bg-[#1F1F1F] dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full absolute top-1 transition-transform ${
                      dailyReminderEnabled ? 'left-6 bg-white dark:bg-slate-900' : 'left-1 bg-white dark:bg-slate-400'
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
                onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEffectsEnabled ? 'bg-[#1F1F1F] dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full absolute top-1 transition-transform ${
                    soundEffectsEnabled ? 'left-6 bg-white dark:bg-slate-900' : 'left-1 bg-white dark:bg-slate-400'
                  }`}
                />
              </button>
            </div>

            {/* Test Notification Trigger */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestNotification}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Send Test Notification
              </button>
            </div>
          </div>

          {/* Section 4: Security & Password */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
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
                    className="w-full bg-[#F8FAFD] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
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
                      className="w-full bg-[#F8FAFD] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
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
                      className="w-full bg-[#F8FAFD] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
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
                    className="px-4 py-1.5 rounded-lg bg-[#1F1F1F] dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPasswordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 5: Data & Storage */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                Data & Storage
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  closeSettingsModal();
                  triggerLogoutSplash(() => {
                    logout();
                    showToast('Signed out of Noteeye');
                    handleSessionEndRedirect('logout');
                  });
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
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
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete account"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Save / Discard bar — active only when there are unsaved changes */}
        <div className="sticky bottom-0 z-30 bg-[#F8FAFD]/95 dark:bg-[#0B0F17]/95 backdrop-blur-sm border-t border-slate-200/70 dark:border-slate-800 px-5 sm:px-8 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-2.5">
            <span className="mr-auto text-[11px] text-slate-400 dark:text-slate-500">
              {isDirty ? 'You have unsaved changes' : 'All changes saved'}
            </span>
            <button
              type="button"
              onClick={loadDraft}
              disabled={!isDirty || isSavingSettings}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!isDirty || isSavingSettings}
              className="px-5 py-2 rounded-xl bg-[#1F1F1F] dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
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
    </AnimatePresence>
  );
};

export default SettingsModal;
