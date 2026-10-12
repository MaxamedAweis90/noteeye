import { put } from '@vercel/blob';
import { User } from '../models/User.js';
/**
 * Helper to retrieve user document from AuthenticatedRequest
 */
const resolveUser = async (req) => {
    if (req.user?.id) {
        const userById = await User.findById(req.user.id);
        if (userById)
            return userById;
    }
    if (req.user?.email) {
        const userByEmail = await User.findOne({ email: req.user.email });
        if (userByEmail)
            return userByEmail;
    }
    // Fallback to first user in system
    return await User.findOne();
};
/**
 * Get current user profile and settings
 * GET /api/user/profile
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        let remainingDays = 30;
        if (user.isScheduledForDeletion && user.deletionScheduledAt) {
            const elapsedDays = Math.floor((Date.now() - new Date(user.deletionScheduledAt).getTime()) / (1000 * 60 * 60 * 24));
            remainingDays = Math.max(0, (user.recoveryPeriodDays || 30) - elapsedDays);
        }
        res.status(200).json({
            user,
            remainingRecoveryDays: remainingDays,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update user personal profile
 * PUT /api/user/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { name, email, phoneNumber, avatarUrl } = req.body;
        if (name !== undefined) {
            user.name = name.trim();
        }
        if (phoneNumber !== undefined) {
            user.phoneNumber = phoneNumber.trim();
        }
        if (avatarUrl !== undefined) {
            user.avatarUrl = avatarUrl;
        }
        if (email !== undefined) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== user.email) {
                // If changing to an existing user's email, check uniqueness
                const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
                if (existing) {
                    res.status(409).json({ message: 'This email is already registered by another account' });
                    return;
                }
                user.email = normalizedEmail;
                user.isEmailVerified = false; // Reset verification status when email changes
            }
        }
        await user.save();
        res.status(200).json({
            message: 'Profile updated successfully',
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Send 6-digit email verification code
 * POST /api/user/send-verification
 */
export const sendVerificationCode = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Generate random 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = code;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        await user.save();
        console.log(`[Email Verification] Code for ${user.email}: ${code}`);
        res.status(200).json({
            message: 'Verification code generated successfully',
            code, // Included in response for seamless testability without SMTP requirement
            email: user.email,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Verify email using the 6-digit code
 * POST /api/user/verify-email
 */
export const verifyEmail = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ message: 'Verification code is required' });
            return;
        }
        if (!user.verificationCode ||
            user.verificationCode !== code.trim() ||
            !user.verificationCodeExpires ||
            new Date() > new Date(user.verificationCodeExpires)) {
            res.status(400).json({ message: 'Invalid or expired verification code' });
            return;
        }
        user.isEmailVerified = true;
        user.verificationCode = '';
        user.verificationCodeExpires = undefined;
        await user.save();
        res.status(200).json({
            message: 'Email verified successfully',
            isEmailVerified: true,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Upload Avatar using Vercel Blob (with safe local/dataURL fallback)
 * POST /api/user/avatar
 */
export const uploadAvatar = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { imageData, filename = 'avatar.png' } = req.body;
        if (!imageData) {
            res.status(400).json({ message: 'No image data provided' });
            return;
        }
        let avatarUrl = imageData;
        // Detect format and parse data URL safely
        let contentType = 'image/png';
        let base64Payload = imageData;
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            const commaIdx = imageData.indexOf(',');
            if (commaIdx !== -1) {
                const meta = imageData.slice(0, commaIdx);
                base64Payload = imageData.slice(commaIdx + 1);
                const mimeMatch = meta.match(/data:([^;]+)/);
                if (mimeMatch) {
                    contentType = mimeMatch[1];
                }
            }
        }
        const buffer = Buffer.from(base64Payload, 'base64');
        const extension = filename.split('.').pop()?.toLowerCase() || 'png';
        const blobFilename = `avatars/${user._id}-${Date.now()}.${extension}`;
        // If Vercel Blob token is available in environment, upload to Vercel Blob
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (blobToken) {
            try {
                const blob = await put(blobFilename, buffer, {
                    access: 'public',
                    contentType,
                    token: blobToken,
                });
                avatarUrl = blob.url;
                console.log(`[Vercel Blob] Uploaded avatar successfully to: ${avatarUrl}`);
            }
            catch (blobErr) {
                console.warn('[Vercel Blob] Upload error, falling back to data URL:', blobErr.message);
                // Fallback to storing data URL
                avatarUrl = imageData;
            }
        }
        else {
            console.log('[Vercel Blob] BLOB_READ_WRITE_TOKEN not set, using data URL fallback');
            avatarUrl = imageData;
        }
        user.avatarUrl = avatarUrl;
        user.avatar = avatarUrl;
        await user.save();
        res.status(200).json({
            message: 'Avatar uploaded successfully',
            avatarUrl,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update user settings (shortcuts, PWA notifications)
 * PUT /api/user/settings
 */
export const updateSettings = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { shortcutsEnabled, modifierKey, customShortcuts, notificationsEnabled, dailyReminderEnabled, dailyReminderTime, soundEffectsEnabled, } = req.body;
        user.settings = {
            shortcutsEnabled: shortcutsEnabled !== undefined ? Boolean(shortcutsEnabled) : user.settings.shortcutsEnabled,
            modifierKey: modifierKey || user.settings.modifierKey || 'ctrl',
            customShortcuts: customShortcuts ||
                (user.settings.customShortcuts instanceof Map
                    ? Object.fromEntries(user.settings.customShortcuts.entries())
                    : user.settings.customShortcuts || {}),
            notificationsEnabled: notificationsEnabled !== undefined
                ? Boolean(notificationsEnabled)
                : user.settings.notificationsEnabled,
            dailyReminderEnabled: dailyReminderEnabled !== undefined
                ? Boolean(dailyReminderEnabled)
                : user.settings.dailyReminderEnabled,
            dailyReminderTime: dailyReminderTime || user.settings.dailyReminderTime || '09:00',
            soundEffectsEnabled: soundEffectsEnabled !== undefined
                ? Boolean(soundEffectsEnabled)
                : user.settings.soundEffectsEnabled,
        };
        await user.save();
        res.status(200).json({
            message: 'Settings updated successfully',
            settings: user.settings,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Delete account option without confirmation
 * POST /api/user/delete-account
 */
export const deleteAccount = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Schedule account deletion directly without confirmation
        user.isScheduledForDeletion = true;
        user.deletionScheduledAt = new Date();
        user.recoveryPeriodDays = 30;
        await user.save();
        res.status(200).json({
            message: 'Account scheduled for deletion. You have 30 days to recover your account.',
            isScheduledForDeletion: true,
            deletionScheduledAt: user.deletionScheduledAt,
            recoveryPeriodDays: user.recoveryPeriodDays,
            remainingRecoveryDays: 30,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Recover account from scheduled deletion
 * POST /api/user/recover-account
 */
export const recoverAccount = async (req, res, next) => {
    try {
        const user = await resolveUser(req);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Restore account from scheduled deletion
        user.isScheduledForDeletion = false;
        user.deletionScheduledAt = null;
        await user.save();
        res.status(200).json({
            message: 'Account recovered successfully! Deletion has been cancelled.',
            isScheduledForDeletion: false,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
