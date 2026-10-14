import React, { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useSplashStore } from '../../store/splashStore';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login Screen
 * Production-ready authentication screen with real-time field validation,
 * Material 3 / Linear minimalist aesthetics, no placeholder hints, and integrated splash transition.
 */
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const emailInputId = useId();
  const passwordInputId = useId();

  const loginToStore = useAuthStore((state) => state.login);
  const fetchUserProfile = useUserStore((state) => state.fetchProfile);
  const showToast = useUIStore((state) => state.showToast);
  const triggerLoginSplash = useSplashStore((state) => state.triggerLoginSplash);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field touch state
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation errors
  const getEmailError = (): string | null => {
    if (!emailTouched) return null;
    if (!email.trim()) return 'Email address is required';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    return null;
  };

  const getPasswordError = (): string | null => {
    if (!passwordTouched) return null;
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const isFormValid =
    email.trim().length > 0 &&
    EMAIL_REGEX.test(email.trim()) &&
    password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setErrorMessage(null);

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.login({ email: email.trim(), password });
      loginToStore(res.token, res.user);

      // Trigger splash loader and sync profile
      triggerLoginSplash(res.user.name, () => {
        navigate('/');
        showToast(`Signed in as ${res.user.name}`);
      });

      // Background profile refresh
      fetchUserProfile().catch(() => {});
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFD] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-6">
        {/* Top Header & Brand Mark */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="scale-105">
            <Logo />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#1F1F1F] tracking-tight">
              Sign in to Noteeye
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Access your workspace, folders, and notes securely.
            </p>
          </div>
        </div>

        {/* Server Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={emailInputId}
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              id={emailInputId}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              aria-invalid={!!emailError}
              className={`w-full bg-[#F8FAFD] border px-4 py-2.5 rounded-2xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none ${
                emailError
                  ? 'border-rose-400 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-400'
                  : 'border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400'
              }`}
            />
            {emailError && (
              <span className="text-[11px] text-rose-600 font-medium px-1">
                {emailError}
              </span>
            )}
          </div>

          {/* Password with Eye Toggle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={passwordInputId}
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setPasswordTouched(true)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                aria-invalid={!!passwordError}
                className={`w-full bg-[#F8FAFD] border px-4 py-2.5 pr-11 rounded-2xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none ${
                  passwordError
                    ? 'border-rose-400 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-400'
                    : 'border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <span className="text-[11px] text-rose-600 font-medium px-1">
                {passwordError}
              </span>
            )}
          </div>

          {/* Solid Dark Pill Submit Action */}
          <button
            type="submit"
            disabled={isLoading || (!isFormValid && (emailTouched || passwordTouched))}
            className="mt-2 w-full bg-[#1F1F1F] text-white hover:bg-black font-semibold text-sm py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2.5">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Don't have an account?</span>
            <Link
              to="/register"
              className="font-semibold text-[#1F1F1F] hover:underline transition-all"
            >
              Create account
            </Link>
          </div>

          <Link
            to="/"
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Return to workspace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
