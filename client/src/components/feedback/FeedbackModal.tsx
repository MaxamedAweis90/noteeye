import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Loader2, Send } from '@/components/ui/icons';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { feedbackApi, type SubmitFeedbackPayload } from '../../api';

type FeedbackType = 'bug' | 'feature' | 'sync' | 'general' | 'custom';

interface FeedbackOption {
  value: FeedbackType;
  label: string;
  defaultTitle: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { value: 'bug', label: 'Bug Report', defaultTitle: 'Bug Report' },
  { value: 'feature', label: 'Feature Request', defaultTitle: 'Feature Request' },
  { value: 'sync', label: 'Sync / Performance Issue', defaultTitle: 'Sync / Performance Issue' },
  { value: 'general', label: 'General Feedback', defaultTitle: 'General Feedback' },
  { value: 'custom', label: 'Custom Message', defaultTitle: 'Custom Message' },
];

const FEEDBACK_TIPS: Record<FeedbackType, string> = {
  bug: `Please describe:
• What happened and what you expected
• Steps to reproduce the issue
• Any error message you saw`,
  feature: `Please describe:
• The feature you would like to see
• The workflow or problem it solves
• Any thoughts on how it should work`,
  sync: `Please describe:
• What didn't sync properly (notes, checklists, folders)
• Devices you were using (e.g. Phone, Laptop)
• Did this happen once or does it happen repeatedly?`,
  general: `Please share:
• What you enjoy about Noteeye
• Anything that feels slow, confusing, or needs polish
• Suggestions or ideas for future updates`,
  custom: `Write your message or inquiry here...`,
};

/**
 * FeedbackModal Component
 * Clean, strictly minimalist feedback & report dialog.
 * - Dropdown category selector
 * - Dynamic non-editable tip in textarea that disappears when user writes
 * - Subject field only appears when "Custom Message" is selected
 * - Standard native email client support
 */
export const FeedbackModal: React.FC = () => {
  const isFeedbackOpen = useUIStore((state) => state.isFeedbackOpen);
  const closeFeedbackModal = useUIStore((state) => state.closeFeedbackModal);
  const showToast = useUIStore((state) => state.showToast);

  const user = useUserStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [customSubject, setCustomSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill user email if signed in
  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user?.email]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFeedbackOpen) {
        closeFeedbackModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedbackOpen, closeFeedbackModal]);

  if (!isFeedbackOpen) return null;

  // Compute final subject
  const selectedOption = FEEDBACK_OPTIONS.find((opt) => opt.value === feedbackType);
  const finalSubject =
    feedbackType === 'custom'
      ? customSubject.trim() || 'Custom Feedback'
      : selectedOption?.defaultTitle || 'User Feedback';

  // In-app submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (feedbackType === 'custom' && !customSubject.trim()) {
      showToast('Please enter a subject for your custom message.');
      return;
    }

    if (!message.trim()) {
      showToast('Please enter your feedback message.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: SubmitFeedbackPayload = {
        templateType: feedbackType,
        subject: finalSubject,
        message: message.trim(),
        userEmail: userEmail.trim() || undefined,
      };

      await feedbackApi.submitFeedback(payload);

      showToast('Thank you! Your feedback has been sent.');
      closeFeedbackModal();

      // Reset fields
      setFeedbackType('bug');
      setCustomSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message || 'Could not send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open native email app
  const handleOpenEmailApp = () => {
    const recipient = 'support@noteeye.app';
    const emailSubject = encodeURIComponent(finalSubject);
    const emailBody = encodeURIComponent(message.trim() || '');
    window.location.href = `mailto:${recipient}?subject=${emailSubject}&body=${emailBody}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        key="feedback-modal-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-[#F8FAFD] dark:bg-[#0B0F17] flex flex-col overflow-y-auto custom-scrollbar select-none text-slate-800 dark:text-slate-100 transition-colors duration-200"
      >
        {/* Sticky Top Header Bar: Close 'X' + Esc Hint on TOP-LEFT, Title on TOP-RIGHT */}
        <header className="sticky top-0 z-30 bg-[#F8FAFD]/95 dark:bg-[#0B0F17]/95 backdrop-blur-sm px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800">
          {/* Top-Left: Close X Button + Desktop Esc Hint */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeFeedbackModal}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs"
              aria-label="Close Feedback screen"
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
              Help
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F] dark:text-white tracking-tight">
              Feedback
            </h1>
          </div>
        </header>

        {/* Minimalist Centered Container */}
        <div className="flex-1 max-w-lg mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-white">Send Feedback</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Let us know about an issue, request a feature, or share your thoughts.
            </p>
          </div>

          {/* Minimalist Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 sm:p-6 flex flex-col gap-4.5 select-text"
          >
            {/* 1. Category Dropdown */}
            <div className="flex flex-col gap-1.5 select-none">
              <label htmlFor="feedback-category" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <div className="relative">
                <select
                  id="feedback-category"
                  value={feedbackType}
                  onChange={(e) => {
                    setFeedbackType(e.target.value as FeedbackType);
                  }}
                  className="w-full h-10 px-3.5 pr-8 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-[#1F1F1F] dark:text-slate-100 font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors cursor-pointer appearance-none"
                >
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* 2. Custom Subject Input (ONLY shown when Custom Message is selected) */}
            {feedbackType === 'custom' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-subject" className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                  Subject
                </label>
                <input
                  id="feedback-subject"
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter message subject..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors font-medium"
                  required
                />
              </div>
            )}

            {/* 3. Message Textarea with Non-Editable Disappearing Tip */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-message" className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                Message
              </label>
              <div className="relative">
                <textarea
                  id="feedback-message"
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-[#1F1F1F] dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors leading-relaxed resize-y custom-scrollbar"
                  required
                />

                {/* Non-editable tip overlay: disappears immediately when user types */}
                {!message && (
                  <div
                    aria-hidden="true"
                    className="absolute top-3 left-3.5 right-3.5 pointer-events-none text-xs sm:text-sm text-slate-400 dark:text-slate-500 whitespace-pre-line leading-relaxed select-none"
                  >
                    {FEEDBACK_TIPS[feedbackType]}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Reply Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-email" className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                Your Email <span className="text-slate-400 dark:text-slate-500 font-normal">(optional, for replies)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={isAuthenticated ? 'Your account email' : 'you@example.com'}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            {/* 5. Clean Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 select-none">
              <button
                type="button"
                onClick={handleOpenEmailApp}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                or send via email client
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-xs active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
                <span>Send Feedback</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackModal;
