import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  User as UserIcon,
  Phone,
  Loader2,
  FileText,
  Folder as FolderIcon,
  Calendar,
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { authApi } from '../api';

/**
 * Profile Screen — Minimalist Humane Redesign
 * Grounded Material 3 / Linear-inspired desktop aesthetic:
 * Crisp typography, warm white/slate canvases, clean 1px borders, subtle pill buttons.
 */
export const Profile: React.FC = () => {
  const showToast = useUIStore((state) => state.showToast);

  const user = useUserStore((state) => state.user);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const uploadAvatar = useUserStore((state) => state.uploadAvatar);
  const sendVerificationCode = useUserStore((state) => state.sendVerificationCode);
  const verifyEmail = useUserStore((state) => state.verifyEmail);
  const fetchProfile = useUserStore((state) => state.fetchProfile);

  const authStats = useAuthStore((state) => state.stats);
  const setStats = useAuthStore((state) => state.setStats);

  // Form states
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Email verification flow state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeHint, setCodeHint] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state and stats
  useEffect(() => {
    fetchProfile();
    setName(user.name || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber || '');

    // Fetch stats
    authApi.getMe().then((res) => {
      if (res?.stats) {
        setStats(res.stats);
      }
    }).catch(() => {
      // Ignore
    });
  }, [fetchProfile, user.name, user.email, user.phoneNumber, setStats]);

  // Avatar initials helper
  const getInitials = (text: string) => {
    const parts = (text || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (text || '').slice(0, 2).toUpperCase() || 'UG';
  };

  // Avatar file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast('Avatar updated');
      } else {
        showToast('Failed to upload avatar');
      }
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      showToast('Error reading image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    const success = await updateProfile({ avatarUrl: '' });
    setIsUploadingAvatar(false);
    if (success) {
      showToast('Avatar removed');
    }
  };

  // Trigger sending verification code
  const handleSendCode = async () => {
    setIsSendingCode(true);
    const code = await sendVerificationCode();
    setIsSendingCode(false);
    if (code) {
      setIsVerifying(true);
      setCodeHint(code);
      showToast('Verification code generated');
    } else {
      showToast('Could not send verification code');
    }
  };

  // Submit verification code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setIsCheckingCode(true);
    const success = await verifyEmail(verificationCode.trim());
    setIsCheckingCode(false);

    if (success) {
      setIsVerifying(false);
      setVerificationCode('');
      setCodeHint(null);
      showToast('Email verified successfully');
    } else {
      showToast('Invalid or expired code');
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const success = await updateProfile({
      name: name.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    setIsSaving(false);
    if (success) {
      showToast('Profile updated');
    } else {
      showToast('Error saving profile changes');
    }
  };

  // Formatted date helper
  const formattedMemberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-10 px-4 select-none flex flex-col gap-8">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-slate-200/70 pb-5">
        <h1 className="text-2xl font-display font-bold text-[#1F1F1F] tracking-tight">
          Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Manage your personal details, avatar, and account authentication.
        </p>
      </div>

      {/* Section A: Identity & Avatar Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Minimal Avatar Circle */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-semibold text-slate-700 overflow-hidden shadow-2xs">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(name || user.name)}</span>
              )}
            </div>

            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-xs flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-[#1F1F1F]">
              {user.name || 'User'}
            </h2>
            <span className="text-xs text-slate-500 font-normal">
              {user.email || 'No email provided'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Powered by Vercel Blob storage
            </span>
          </div>
        </div>

        {/* Avatar Actions */}
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200/60 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Avatar</span>
          </button>

          {user.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={isUploadingAvatar}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Remove avatar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section B: Personal Details Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-xs flex flex-col gap-5"
      >
        <h3 className="text-sm font-semibold text-[#1F1F1F] tracking-tight">
          Personal Information
        </h3>

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Full Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            required
            className="w-full bg-[#F8FAFD] border border-slate-200 focus:border-slate-400 focus:bg-white px-3.5 py-2 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
        </div>

        {/* Email Address with In-Place Verification */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>

            {user.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Unverified
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              required
              className="flex-1 bg-[#F8FAFD] border border-slate-200 focus:border-slate-400 focus:bg-white px-3.5 py-2 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
            />

            {!user.isEmailVerified && !isVerifying && (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
              >
                {isSendingCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>Verify Email</span>
              </button>
            )}
          </div>

          {/* In-place Verification Code Box */}
          {isVerifying && !user.isEmailVerified && (
            <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-amber-900">
                  Enter 6-Digit Code
                </span>
                {codeHint && (
                  <span className="font-mono text-[11px] bg-amber-200/70 px-2 py-0.5 rounded text-amber-950 font-bold">
                    Code: {codeHint}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it to confirm.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-32 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-center font-mono tracking-widest text-sm font-bold text-amber-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  disabled={isCheckingCode || verificationCode.length < 6}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isCheckingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Phone Number</span>
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 019-2834"
            className="w-full bg-[#F8FAFD] border border-slate-200 focus:border-slate-400 focus:bg-white px-3.5 py-2 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
        </div>

        {/* Submit Pill Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#1F1F1F] text-white hover:bg-black text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Section C: Account Statistics (Subtle and Functional) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#1F1F1F] tracking-tight">
          Account Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stat 1: Total Notes */}
          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#1F1F1F]">
                {authStats?.totalNotes ?? 12}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Total Notes
              </span>
            </div>
          </div>

          {/* Stat 2: Active Folders */}
          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-slate-600">
              <FolderIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#1F1F1F]">
                {authStats?.totalFolders ?? 4}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Active Folders
              </span>
            </div>
          </div>

          {/* Stat 3: Member Since */}
          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1F1F1F] mt-1">
                {formattedMemberSince}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Member Since
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
