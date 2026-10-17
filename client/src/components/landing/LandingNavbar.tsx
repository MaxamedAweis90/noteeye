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
 * Noteeye Landing Page Fluid Morphing Navbar
 * Seamless Dynamic Island / Apple-style morph: when hamburger is tapped on mobile,
 * the pill container smoothly expands and morphs directly into the full mobile menu
 * with zero flicker, zero detached dropdown cards, and fluid physics.
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

  // Auto-dismiss for active session indicator banner
  useEffect(() => {
    if (!isLoggedIn || sessionBannerDismissed || authNotice) return;

    const timer = setTimeout(() => {
      setSessionBannerDismissed(true);
    }, 6_000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, sessionBannerDismissed, authNotice]);

  // Auto-dismiss for authorization notice banner
  useEffect(() => {
    if (!authNotice || !onDismissAuthNotice) return;

    const timer = setTimeout(() => {
      onDismissAuthNotice();
    }, 12_000);

    return () => clearTimeout(timer);
  }, [authNotice, onDismissAuthNotice]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Derive readable name or email for the active session indicator
  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const userInitial = (displayName.charAt(0) || "U").toUpperCase();
  const avatarSrc = user?.avatarUrl || user?.avatar;

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-3 sm:pt-5 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto w-full flex flex-col items-center pointer-events-auto">
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
              className="overflow-hidden flex justify-center w-full px-2"
            >
              <div
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-xs backdrop-blur-md flex items-center gap-2 select-none max-w-full truncate ${
                  authNotice.type === "logout"
                    ? "bg-emerald-50/90 border-emerald-200/90 text-emerald-800"
                    : authNotice.type === "revoked"
                      ? "bg-rose-50/90 border-rose-200/90 text-rose-800"
                      : "bg-amber-50/90 border-amber-200/90 text-amber-900"
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

          {/* Case B: Active Session Indicator */}
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
              className="overflow-hidden flex justify-center w-full px-2"
            >
              <div className="px-3 sm:px-3.5 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-white/80 backdrop-blur-md border border-white/80 shadow-xs flex items-center gap-2 select-none max-w-[calc(100vw-1.5rem)] truncate">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>

                <span className="truncate">
                  Active as{" "}
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

        {/* ───────────── TAP-OUTSIDE DISMISS AREA (WHEN MORPHED OPEN) ───────────── */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-transparent -z-10 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* ───────────── UNIFIED MORPHING CAPSULE CONTAINER ───────────── */}
        <div
          className={`w-full overflow-hidden bg-white border border-slate-200/90 rounded-[28px] sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 transition-shadow duration-300 ${
            mobileOpen
              ? "shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
              : "shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          }`}
        >
          {/* Top Row / Header */}
          <div className="flex items-center justify-between w-full h-8 sm:h-9">
            {/* Brand Logo */}
            <a
              href="#home"
              onClick={() => {
                if (mobileOpen) setMobileOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 group select-none cursor-pointer shrink-0"
            >
              <img
                src="/noteeye_logo.png"
                alt="Noteeye logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="font-display font-bold text-slate-900 text-base sm:text-[19px] tracking-tight">
                Noteeye
              </span>
            </a>

            {/* Desktop Navigation Links */}
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

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Desktop Auth & Workspace Action */}
              <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
                {isLoggedIn ? (
                  <>
                    <a
                      href={workspaceHref}
                      title={`Signed in as ${displayName} — Open workspace`}
                      className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 text-xs font-semibold flex items-center justify-center text-slate-700 overflow-hidden shrink-0 select-none shadow-xs hover:ring-2 hover:ring-slate-300 transition-all"
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
                    </a>

                    <a
                      href={workspaceHref}
                      className="bg-[#18181B] text-white font-medium px-4 py-2 rounded-full hover:bg-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer text-xs sm:text-sm"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>

                    <button
                      type="button"
                      onClick={onLogout}
                      title="Sign out"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={loginUrl}
                      className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      Log in
                    </a>
                    <a
                      href={registerUrl}
                      className="bg-[#18181B] text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-full hover:bg-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      Get Started
                    </a>
                  </>
                )}
              </div>

              {/* Mobile Quick Action (smoothly fades when morphed menu opens) */}
              <AnimatePresence>
                {!mobileOpen && (
                  <motion.div
                    key="mobile-quick-action"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex md:hidden items-center"
                  >
                    {isLoggedIn ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={workspaceHref}
                          title={`Signed in as ${displayName} — Open workspace`}
                          className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/90 text-xs font-semibold flex items-center justify-center text-slate-700 overflow-hidden shrink-0 select-none shadow-xs hover:ring-2 hover:ring-slate-300 transition-all"
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
                        </a>
                        <a
                          href={workspaceHref}
                          className="bg-[#18181B] text-white font-medium px-2.5 py-1.5 rounded-full hover:bg-black flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3 h-3 stroke-[2.2]" />
                        </a>
                      </div>
                    ) : (
                      <a
                        href={registerUrl}
                        className="bg-[#18181B] text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        Get Started
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hamburger / Close Toggle Button (Fixed dimension, perfectly stable) */}
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((prev) => !prev)}
                className={`md:hidden w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  mobileOpen
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileOpen ? "close-icon" : "menu-icon"}
                    initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                    transition={{ duration: 0.16 }}
                    className="flex items-center justify-center"
                  >
                    {mobileOpen ? (
                      <X className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Menu className="w-5 h-5 text-slate-900" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Morphed Mobile Menu Content (Animated seamlessly inside the container) */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="morphed-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  transition: {
                    height: {
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    },
                    opacity: {
                      duration: 0.2,
                      delay: 0.08,
                    },
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: {
                    height: {
                      duration: 0.22,
                      ease: [0.16, 1, 0.3, 1],
                    },
                    opacity: {
                      duration: 0.12,
                    },
                  },
                }}
                className="flex flex-col gap-1.5 pt-3.5 mt-2.5 border-t border-slate-100/90 select-none overflow-hidden"
              >
                {/* Profile header if logged in */}
                {isLoggedIn && (
                  <div className="flex items-center gap-3 p-3 mb-1 rounded-2xl bg-slate-50/90 border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300/80 text-xs font-semibold flex items-center justify-center text-slate-700 overflow-hidden shrink-0 shadow-xs">
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
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                )}

                {/* Navigation links */}
                <div className="flex flex-col gap-0.5">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </a>
                  ))}
                </div>

                <div className="h-px bg-slate-100 my-1" />

                {/* Primary Actions inside morphed menu */}
                {isLoggedIn ? (
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <a
                      href={workspaceHref}
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center justify-center gap-2 bg-[#18181B] text-white text-sm font-semibold py-3 rounded-2xl hover:bg-black active:scale-[0.99] transition-all shadow-sm"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 py-2.5 rounded-xl hover:bg-rose-50/70 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out ({displayName})</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-0.5">
                    <a
                      href={registerUrl}
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-3 text-sm font-semibold text-white bg-[#18181B] rounded-2xl hover:bg-black shadow-sm transition-colors"
                    >
                      Get Started Free
                    </a>
                    <a
                      href={loginUrl}
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-2.5 text-sm font-medium text-slate-700 rounded-2xl hover:bg-slate-50 border border-slate-200/80 transition-colors"
                    >
                      Sign In to Account
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
