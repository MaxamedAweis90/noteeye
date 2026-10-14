import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Laptop,
  Smartphone,
  Tablet,
  Loader2,
  RefreshCw,
  LogOut,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { sessionsApi } from '../../api';
import type { UserSession } from '../../types';
import { handleSessionEndRedirect } from '../../utils/sessionNavigation';

/**
 * Format timestamp into clean, minimalist relative time string.
 */
const formatLastActive = (dateString?: string): string => {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 120_000) {
      return 'Active now';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

/**
 * Clean monochrome device icon.
 */
const getDeviceIcon = (deviceType?: string) => {
  const norm = (deviceType || '').toLowerCase();
  if (norm === 'mobile') {
    return <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />;
  }
  if (norm === 'tablet') {
    return <Tablet className="w-4 h-4 text-slate-500 shrink-0" />;
  }
  return <Laptop className="w-4 h-4 text-slate-500 shrink-0" />;
};

/**
 * SessionsModal Component
 * Full-screen popup screen for device and active session management.
 * Clean, standard, minimalist human design (no colorful AI decorative clutter).
 */
export const SessionsModal: React.FC = () => {
  const isSessionsOpen = useUIStore((state) => state.isSessionsOpen);
  const closeSessionsModal = useUIStore((state) => state.closeSessionsModal);
  const showToast = useUIStore((state) => state.showToast);
  const logout = useAuthStore((state) => state.logout);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [mainDeviceNotice, setMainDeviceNotice] = useState<string | null>(null);

  const isMountedRef = useRef(false);

  // Load sessions from API with real-time cross-device check
  const fetchSessions = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const list = await sessionsApi.getSessions();
        if (!isMountedRef.current) return;
        setSessions(list);

        // Cross-device sync check: if list has sessions but none are isCurrent, this device was revoked by another device!
        if (list.length > 0 && !list.some((s) => s.isCurrent)) {
          showToast('This device was signed out from another session.');
          closeSessionsModal();
          logout(false);
          handleSessionEndRedirect('revoked');
        }
      } catch (err: any) {
        // If 401 was returned, auth interceptor will handle kick-out
        if (isManual) {
          showToast(err.message || 'Could not load sessions');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [showToast, closeSessionsModal, logout]
  );

  // Polling & focus synchronization when modal is open
  useEffect(() => {
    isMountedRef.current = true;
    if (!isSessionsOpen) return;

    fetchSessions(false);

    // Smooth 3.5s polling for cross-device live session updates
    const pollInterval = setInterval(() => {
      fetchSessions(false);
    }, 3500);

    const handleFocus = () => {
      fetchSessions(false);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSessionsOpen, fetchSessions]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSessionsOpen) {
        closeSessionsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionsOpen, closeSessionsModal]);

  if (!isSessionsOpen) return null;

  // Revoke single device session
  const handleRevoke = async (session: UserSession) => {
    try {
      setRevokingId(session.id);
      // Optimistic update on current device
      setSessions((prev) => prev.filter((s) => s.id !== session.id));

      const res = await sessionsApi.deleteSession(session.id);

      if (session.isCurrent || res.isCurrentRevoked) {
        showToast('Current session signed out');
        closeSessionsModal();
        logout();
        handleSessionEndRedirect('logout');
        return;
      }

      showToast('Device signed out');
    } catch (err: any) {
      showToast(err.message || 'Could not remove device');
      fetchSessions(false);
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeOthers = async () => {
    try {
      setIsRevokingOthers(true);
      // Optimistic update: keep only current session
      setSessions((prev) => prev.filter((s) => s.isCurrent));

      const res = await sessionsApi.revokeOtherSessions();
      showToast(res.message || 'All other devices signed out');
    } catch (err: any) {
      showToast(err.message || 'Could not sign out other devices');
      fetchSessions(false);
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <AnimatePresence>
      <motion.div
        key="sessions-modal-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-[#F8FAFD] flex flex-col overflow-y-auto custom-scrollbar select-none"
      >
        {/* Sticky Top Header Bar: Close 'X' + Esc Hint on TOP-LEFT, Title on TOP-RIGHT */}
        <header className="sticky top-0 z-30 bg-[#F8FAFD]/95 backdrop-blur-sm px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/70">
          {/* Top-Left: Close X Button + Desktop Esc Hint */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeSessionsModal}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer border border-slate-200/60 bg-white shadow-2xs"
              aria-label="Close Active Sessions screen"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal select-none">
              Press Esc to close
            </span>
          </div>

          {/* Top-Right: Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight">
              Active Sessions
            </h1>
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-6">
          {/* Section Introduction */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1F1F1F]">Connected Devices</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Devices currently signed into your Noteeye account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchSessions(true)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh session list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Future Feature Notice (If dismissed, stays hidden) */}
          {mainDeviceNotice && (
            <div className="p-3 bg-slate-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-700 border border-slate-200/80">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{mainDeviceNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setMainDeviceNotice(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Minimalist Sessions List Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span className="text-xs">Loading sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active session records found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => {
                  const isRevoking = revokingId === session.id;
                  const deviceLabel =
                    session.deviceType === 'mobile'
                      ? 'Mobile'
                      : session.deviceType === 'tablet'
                      ? 'Tablet'
                      : 'Desktop';

                  return (
                    <div
                      key={session.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Left: Device Icon & Information */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getDeviceIcon(session.deviceType)}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#1F1F1F] truncate">
                              {deviceLabel} – {session.osName}
                            </span>
                            {session.isCurrent && (
                              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                This device
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                            <span className="text-slate-600">{session.browserName}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{session.ipAddress}</span>
                            <span>•</span>
                            <span>{formatLastActive(session.lastActiveAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Future Feature Hook: Set as Main Device */}
                        <button
                          type="button"
                          onClick={() =>
                            setMainDeviceNotice(
                              `Upcoming: Designating "${session.osName}" as your primary trusted device will require email verification.`
                            )
                          }
                          className="hidden md:inline text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Set as main device"
                        >
                          Set as main
                        </button>

                        {!session.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(session)}
                            disabled={isRevoking}
                            className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 px-2 py-1"
                          >
                            {isRevoking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Log out'
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium px-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active now</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Action: Log out all other sessions */}
            {otherSessions.length > 0 && !isLoading && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {otherSessions.length} other {otherSessions.length === 1 ? 'session' : 'sessions'} active
                </span>
                <button
                  type="button"
                  onClick={handleRevokeOthers}
                  disabled={isRevokingOthers}
                  className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRevokingOthers ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Sign out of all other sessions</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionsModal;
