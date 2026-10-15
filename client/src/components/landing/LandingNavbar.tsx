import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Menu,
  ShieldAlert,
  X,
  LogOut,
} from "@/components/ui/icons";
import { useAuthStore } from "../../store/authStore";

export interface AuthNotice {
  type: "unauthorized" | "revoked" | "logout";
  title: string;
  description: string;
}

export interface LandingNavbarProps {
  authNotice?: AuthNotice | null;
  onDismissAuthNotice?: () => void;
  isLoggedIn: boolean;
  loginUrl: string;
  registerUrl: string;
  workspaceHref: string;
  onLogout: () => void;
}

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

/**
 * Noteeye Landing Page Floating Pill Navbar & Top Session Indicator
 * Styled with ultra-clean rounded capsule geometry, translucent backdrop blur,
 * and seamless conditional session awareness.
 */
export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  authNotice,
  onDismissAuthNotice,
  isLoggedIn,
  loginUrl,
  registerUrl,
  workspaceHref,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionBannerDismissed, setSessionBannerDismissed] = useState(false);

  const user = useAuthStore((state) => state.user);

  // 12-second auto-dismiss for active session indicator banner
  useEffect(() => {
    if (!isLoggedIn || sessionBannerDismissed || authNotice) return;

    const timer = setTimeout(() => {
      setSessionBannerDismissed(true);
    }, 5_000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, sessionBannerDismissed, authNotice]);

  // 12-second auto-dismiss for authorization notice banner (unauthorized, revoked, logout)
  useEffect(() => {
    if (!authNotice || !onDismissAuthNotice) return;

    const timer = setTimeout(() => {
      onDismissAuthNotice();
    }, 12_000);

    return () => clearTimeout(timer);
  }, [authNotice, onDismissAuthNotice]);

  // Derive readable name or email for the active session indicator
  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const userInitial = (displayName.charAt(0) || "U").toUpperCase();
  const avatarSrc = user?.avatarUrl || user?.avatar;

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-5 sm:pt-6 px-4 sm:px-6 pointer-events-none">
      <motion.div
        layout
        className="max-w-6xl mx-auto w-full flex flex-col items-center pointer-events-auto"
      >
        {/* ───────────── TOP SESSION / AUTH-CHECK MINI-BANNER ───────────── */}
        <AnimatePresence>
          {/* Case A: Explicit URL redirect notification (unauthorized, revoked, logout) */}
          {authNotice && (
            <motion.div
              key="auth-notice"
              layout
              initial={{
                opacity: 0,
                y: -16,
                scale: 0.96,
                height: 0,
                marginBottom: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                height: "auto",
                marginBottom: 10,
              }}
              exit={{
                opacity: 0,
                y: -16,
                scale: 0.96,
                height: 0,
                marginBottom: 0,
              }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
                layout: { type: "spring", damping: 28, stiffness: 260 },
              }}
              className="overflow-hidden flex justify-center w-full"
            >
              <div
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-xs backdrop-blur-md flex items-center gap-2 select-none max-w-full truncate ${
                  authNotice.type === "logout"
                    ? "bg-emerald-50/85 border-emerald-200/90 text-emerald-800"
                    : authNotice.type === "revoked"
                      ? "bg-rose-50/85 border-rose-200/90 text-rose-800"
                      : "bg-amber-50/85 border-amber-200/90 text-amber-900"
                }`}
              >
                <span className="shrink-0">
                  {authNotice.type === "revoked" ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  ) : authNotice.type === "logout" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </span>
                <span className="truncate">
                  <strong className="font-semibold">{authNotice.title}:</strong>{" "}
                  <span className="opacity-90">{authNotice.description}</span>
                </span>

                {authNotice.type !== "logout" && (
                  <a
                    href={loginUrl}
                    className="ml-1 text-[11px] font-semibold underline underline-offset-2 shrink-0 hover:opacity-80 transition-opacity"
                  >
                    Sign in
                  </a>
                )}

                {onDismissAuthNotice && (
                  <button
                    type="button"
                    onClick={onDismissAuthNotice}
                    aria-label="Dismiss notice"
                    className="p-0.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0 ml-1 text-current opacity-60 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Case B: Active Session Indicator (when logged in & notice is not active & not dismissed) */}
          {!authNotice && isLoggedIn && !sessionBannerDismissed && (
            <motion.div
              key="active-session"
              layout
              initial={{
                opacity: 0,
                y: -16,
                scale: 0.96,
                height: 0,
                marginBottom: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                height: "auto",
                marginBottom: 8,
              }}
              exit={{
                opacity: 0,
                y: -16,
                scale: 0.96,
                height: 0,
                marginBottom: 0,
              }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
                layout: { type: "spring", damping: 28, stiffness: 260 },
              }}
              className="overflow-hidden flex justify-center w-full"
            >
              <div className="px-3.5 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-white/70 backdrop-blur-md border border-white/80 shadow-xs flex items-center gap-2 select-none">
                {/* Green pulsating session dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>

                <span className="truncate">
                  Active session as{" "}
                  <span className="font-semibold text-slate-800">
                    {displayName}
                  </span>
                </span>

                <a
                  href={workspaceHref}
                  className="text-slate-900 font-semibold hover:text-black hover:underline flex items-center gap-0.5 ml-0.5 transition-colors shrink-0"
                >
                  Go to App
                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                </a>

                <button
                  type="button"
                  onClick={() => setSessionBannerDismissed(true)}
                  aria-label="Dismiss session pill"
                  className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────────── FLOATING PILL CAPSULE NAVBAR ───────────── */}
        <motion.div
          layout
          transition={{
            type: "spring",
            damping: 28,
            stiffness: 260,
          }}
          className="w-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-5 sm:px-6 py-2.5 flex items-center justify-between"
        >
          {/* 1. Left Brand Logo */}
          <a
            href="#home"
            className="flex items-center gap-2.5 group select-none cursor-pointer"
          >
            <img
              src="/noteeye_logo.png"
              alt="Noteeye logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-semibold text-slate-900 text-lg sm:text-[19px] tracking-tight">
              Noteeye
            </span>
          </a>

          {/* 2. Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-slate-600 select-none">
            {NAV_LINKS.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors ${
                  index === 0
                    ? "text-slate-900 font-semibold hover:text-black"
                    : "hover:text-slate-900"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 3. Right Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              /* Authenticated State */
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* User initial avatar disc */}
                <div
                  title={`Signed in as ${displayName}`}
                  className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center justify-center text-slate-700 overflow-hidden shrink-0 select-none shadow-xs"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>

                {/* Primary Workspace Action Pill */}
                <a
                  href={workspaceHref}
                  className="bg-[#18181B] text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 rounded-full hover:bg-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2] hidden xs:inline" />
                </a>

                {/* Optional Subtle Logout Action */}
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated State (Default) */
              <div className="flex items-center gap-1 sm:gap-2">
                <a
                  href={loginUrl}
                  className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Log in
                </a>
                <a
                  href={registerUrl}
                  className="bg-[#18181B] text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 rounded-full hover:bg-black transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Sign up
                </a>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-full hover:bg-black/5 text-slate-700 transition-colors cursor-pointer"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </motion.div>

        {/* ───────────── RESPONSIVE MOBILE MENU CARD ───────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="md:hidden mt-2 w-full rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl p-3 flex flex-col gap-1 select-none"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              <div className="h-px bg-slate-100 my-1" />

              {isLoggedIn ? (
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={workspaceHref}
                    className="w-full text-center bg-[#18181B] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-black transition-colors"
                  >
                    Open Workspace
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout();
                    }}
                    className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-900 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Log out ({displayName})
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={loginUrl}
                    className="flex-1 text-center py-2 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors"
                  >
                    Log in
                  </a>
                  <a
                    href={registerUrl}
                    className="flex-1 text-center py-2 text-sm font-medium text-white bg-[#18181B] rounded-xl hover:bg-black transition-colors"
                  >
                    Sign up
                  </a>
                </div>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};

export default LandingNavbar;
