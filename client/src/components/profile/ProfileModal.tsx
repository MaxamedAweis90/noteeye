import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
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
  RotateCcw,
} from '@/components/ui/icons';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { authApi } from '../../api';
import { DeleteDialog } from '../modals/DeleteDialog';

/**
 * ProfileModal Component — Minimalist Humane Redesign
 * Full-screen popup covering entire viewport.
 * Header layout: Close 'X' pinned to TOP-LEFT, Screen Title pinned to TOP-RIGHT.
 * Minimalist, humane aesthetic:
 * - Crisp typography, warm white/slate canvases (#F8FAFD, #FFFFFF)
 * - Clean 1px borders, subtle pill buttons, no heavy neon gradients
 * - Complete business logic: avatar upload, email verification, stats, phone number
 */
export const ProfileModal: React.FC = () => {
  const isProfileOpen = useUIStore((state) => state.isProfileOpen);
  const closeProfileModal = useUIStore((state) => state.closeProfileModal);
  const showToast = useUIStore((state) => state.showToast);

  const user = useUserStore((state) => state.user);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const uploadAvatar = useUserStore((state) => state.uploadAvatar);
  const sendVerificationCode = useUserStore((state) => state.sendVerificationCode);
  const verifyEmail = useUserStore((state) => state.verifyEmail);
  const fetchProfile = useUserStore((state) => state.fetchProfile);

  const authStats = useAuthStore((state) => state.stats);
  const setStats = useAuthStore((state) => state.setStats);

  // Form states (local draft — nothing is persisted until Save)
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  // Avatar draft: pending new image (data URL, NOT uploaded yet) or pending removal
  const [avatarDraft, setAvatarDraft] = useState<
    { kind: 'new'; dataUrl: string; filename: string } | { kind: 'removed' } | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoveAvatarModalOpen, setIsRemoveAvatarModalOpen] = useState(false);

  // Verification flow state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeHint, setCodeHint] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDraft = () => {
    const u = useUserStore.getState().user;
    setName(u.name || '');
    setEmail(u.email || '');
    setPhoneNumber(u.phoneNumber || '');
    setAvatarDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Initialise the draft ONLY when the modal opens (background syncs must not clobber edits)
  useEffect(() => {
    if (isProfileOpen) {
      fetchProfile().then(resetDraft).catch(() => {});
      resetDraft();
      setIsVerifying(false);
      setVerificationCode('');
      setCodeHint(null);

      // Fetch stats
      authApi.getMe().then((res) => {
        if (res?.stats) setStats(res.stats);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileOpen]);

  const isDirty =
    name.trim() !== (user.name || '') ||
    email.trim() !== (user.email || '') ||
    phoneNumber.trim() !== (user.phoneNumber || '') ||
    avatarDraft !== null;

  const requestClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    resetDraft();
    closeProfileModal();
  };

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileOpen) {
        requestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileOpen, isDirty]);



  if (!isProfileOpen) return null;

  // Avatar initials helper
  const getInitials = (text: string) => {
    const parts = (text || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (text || '').slice(0, 2).toUpperCase() || 'UG';
  };

  // Avatar selection only stages a local preview — no upload until Save
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

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDraft({ kind: 'new', dataUrl: reader.result as string, filename: file.name });
    };
    reader.onerror = () => showToast('Error reading image file');
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarDraft({ kind: 'removed' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarPreview =
    avatarDraft?.kind === 'new' ? avatarDraft.dataUrl : avatarDraft?.kind === 'removed' ? '' : user.avatarUrl;

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

  // Persist the draft: avatar goes to Vercel Blob only now, then text fields
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    let ok = true;

    if (avatarDraft?.kind === 'new') {
      ok = await uploadAvatar(avatarDraft.dataUrl, avatarDraft.filename);
      if (ok) setAvatarDraft(null);
    }

    const fieldsChanged =
      name.trim() !== (user.name || '') ||
      email.trim() !== (user.email || '') ||
      phoneNumber.trim() !== (user.phoneNumber || '') ||
      avatarDraft?.kind === 'removed';

    if (ok && fieldsChanged) {
      ok = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        ...(avatarDraft?.kind === 'removed' ? { avatarUrl: '' } : {}),
      });
    }

    setIsSaving(false);
    if (ok) {
      setAvatarDraft(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Profile saved');
    } else {
      showToast('Error saving profile changes');
    }
  };

  const formattedMemberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <AnimatePresence>
      <motion.div
        key="profile-modal-screen"
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
              aria-label="Close Profile screen"
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
              Account
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
              Profile
            </h1>
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-6">
          {/* Section 1: Avatar Edit Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xl select-none">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(name || user.name)}</span>
                  )}
                </div>

                {isSaving && avatarDraft?.kind === 'new' && (
                  <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-xs flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100">
                  {user.name || 'User'}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {user.email || 'No email provided'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {avatarDraft?.kind === 'new'
                    ? 'New image selected — click Save Changes to upload'
                    : avatarDraft?.kind === 'removed'
                    ? 'Avatar will be removed when you save'
                    : 'Vercel Blob cloud storage'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload new image</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setIsRemoveAvatarModalOpen(true)}
                  disabled={isSaving}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Personal Information Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                Personal Information
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Update your display name, primary email, and telephone number.
              </p>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
                required
              />
            </div>

            {/* Email Address with In-Place Verification */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Email Address</span>
                </label>

                {user.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
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
                  className="flex-1 bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
                  required
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
                <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                      Enter 6-Digit Code
                    </span>
                    {codeHint && (
                      <span className="font-mono text-[11px] bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-950 dark:text-amber-200 font-bold">
                        Code: {codeHint}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    A code was sent to <strong>{email}</strong>. Enter it below to verify.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-32 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-center font-mono tracking-widest text-sm font-bold text-amber-950 dark:text-amber-200 focus:outline-none"
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
                      className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 px-3.5 py-2 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <span className="mr-auto text-[11px] text-slate-400 dark:text-slate-500">
                {isDirty ? 'You have unsaved changes' : 'All changes saved'}
              </span>
              <button
                type="button"
                onClick={resetDraft}
                disabled={!isDirty || isSaving}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="px-5 py-2 rounded-xl bg-[#1F1F1F] dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          {/* Section 3: Account Statistics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
              Account Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#1F1F1F] dark:text-slate-100">
                    {authStats?.totalNotes ?? 12}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Notes
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <FolderIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#1F1F1F] dark:text-slate-100">
                    {authStats?.totalFolders ?? 4}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Active Folders
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1F1F1F] dark:text-slate-100 mt-1">
                    {formattedMemberSince}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Member Since
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Remove Avatar Confirmation Dialog */}
      <DeleteDialog
        isOpen={isRemoveAvatarModalOpen}
        onClose={() => setIsRemoveAvatarModalOpen(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Profile Photo?"
        description="Are you sure you want to remove your profile photo? Your avatar will revert to your default initials."
        confirmLabel="Remove Photo"
      />
    </AnimatePresence>
  );
};

export default ProfileModal;
