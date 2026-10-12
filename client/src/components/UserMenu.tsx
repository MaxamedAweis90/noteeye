import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Settings, LogOut, X, ChevronDown, Clock, LogIn, Camera, Loader2 } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useUIStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { useSplashStore } from "../store/splashStore";

interface UserMenuProps {
  className?: string;
  onMobileAvatarClick?: () => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 450,
  damping: 30,
};

/**
 * UserMenu Component
 * If Authenticated: Elevated user profile avatar pill with layout morphing animation.
 * If Unauthenticated: Minimalist dark pill "Sign in" button.
 */
export const UserMenu: React.FC<UserMenuProps> = ({ className = "", onMobileAvatarClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const triggerLogoutSplash = useSplashStore((state) => state.triggerLogoutSplash);

  const user = useUserStore((state) => state.user);
  const uploadAvatar = useUserStore((state) => state.uploadAvatar);
  const openProfileModal = useUIStore((state) => state.openProfileModal);
  const openSettingsModal = useUIStore((state) => state.openSettingsModal);
  const showToast = useUIStore((state) => state.showToast);

  // Helper for initials
  const getInitials = (text: string) => {
    const parts = (text || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (text || '').slice(0, 2).toUpperCase() || 'NE';
  };

  const displayName = user.name || 'User';
  const displayEmail = user.email || '';
  const initials = getInitials(displayName);

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // If user is not authenticated, render clean Sign In action pill
  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link
          to="/login"
          className="h-10 px-4 rounded-full bg-[#1F1F1F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign in</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 1. Mobile Avatar Circle (< 768px): Clean, clickable standalone circular avatar */}
      <div className="flex md:hidden items-center">
        <button
          type="button"
          onClick={() => onMobileAvatarClick?.()}
          className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300/70 overflow-hidden flex items-center justify-center font-semibold text-xs text-slate-700 shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-transform relative select-none"
          aria-label="Open profile drawer"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
          {user.isScheduledForDeletion && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* 2. Desktop User Menu (>= 768px): Elevated pill with morphing layout card */}
      <div ref={containerRef} className={`hidden md:block relative select-none ${className}`}>
        {/* Ghost spacer to preserve exact navbar layout when morphed */}
        {isOpen && (
          <div
            className="invisible h-10 px-2 flex items-center gap-2 pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-9 h-9 rounded-full" />
            <span className="text-sm font-medium hidden sm:inline">
              {displayName}
            </span>
            <div className="w-4 h-4" />
          </div>
        )}

        <motion.div
          layout
          transition={springTransition}
          style={{ transformOrigin: "top right" }}
          className={`bg-white border select-none overflow-hidden ${
            isOpen
              ? "absolute top-0 right-0 w-64 p-3 rounded-2xl shadow-2xl border-slate-200/80 flex flex-col z-50"
              : "h-10 px-2 rounded-full border-transparent bg-transparent hover:bg-[#E8EDF4] flex items-center gap-2 cursor-pointer transition-colors shadow-none"
          }`}
          onClick={!isOpen ? () => setIsOpen(true) : undefined}
        >
          <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            /* State 1: Collapsed Avatar Pill */
            <motion.div
              key="collapsed-avatar"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 text-[#1F1F1F]"
              aria-label="Open user menu"
            >
              {/* Avatar Circle with image or initials */}
              <div className="w-9 h-9 ml-[-5px] rounded-full bg-slate-200 border border-slate-300/60 overflow-hidden flex items-center justify-center font-semibold text-xs text-slate-700 shadow-2xs shrink-0 relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                {user.isScheduledForDeletion && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </div>

              <span className="text-sm font-medium text-[#1F1F1F] hidden sm:inline truncate max-w-[100px]">
                {displayName}
              </span>

              <ChevronDown className="w-4 h-4 text-[#737785] shrink-0" />
            </motion.div>
          ) : (
            /* State 2: Morphed Expanded Menu Card */
            <motion.div
              key="expanded-avatar-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full flex flex-col"
            >
              {/* User Header Summary */}
              <div className="flex items-center justify-between pb-2 mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="relative group/avatar cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    title="Change avatar"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      ) : user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-3.5 h-3.5 text-white" />
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
                    <span className="text-xs font-semibold text-[#1F1F1F] truncate">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {displayEmail}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close profile menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {user.isScheduledForDeletion && (
                <div className="my-1 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 text-[10px] text-rose-700 font-medium">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Deletion pending ({user.remainingRecoveryDays ?? 30}d left)</span>
                </div>
              )}

              <div className="h-px bg-slate-100 my-1" />

              {/* Action Rows */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openProfileModal();
                  }}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openSettingsModal();
                  }}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1.5" />

              {/* Logout Row */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerLogoutSplash(() => {
                    logout();
                    showToast('Signed out of Noteeye');
                  });
                }}
                className="hover:bg-rose-50 text-rose-600 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Log out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
    </>
  );
};

export default UserMenu;
