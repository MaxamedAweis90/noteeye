import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Note } from '../models/Note.js';
import { Folder } from '../models/Folder.js';
import { hashToken, getClientIp, parseUserAgent } from '../utils/userAgent.js';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-noteeye-2026';
/**
 * Seed initial user if not already existing
 * Specified by user:
 * name: 'ugaas'
 * email: 'maxamedaweys90@gmail.com'
 * password: 'ugaas1234'
 */
export const seedInitialUser = async () => {
    try {
        const existing = await User.findOne({ email: 'maxamedaweys90@gmail.com' });
        if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('ugaas1234', salt);
            const user = new User({
                name: 'ugaas',
                email: 'maxamedaweys90@gmail.com',
                passwordHash,
            });
            await user.save();
            console.log('[Seed] Successfully seeded initial user: ugaas (maxamedaweys90@gmail.com)');
        }
    }
    catch (err) {
        console.error('[Seed] Initial user seed check error:', err.message);
    }
};
/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(409).json({ message: 'An account with this email already exists' });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = new User({
            name: (name || 'New User').trim(),
            email: normalizedEmail,
            passwordHash,
        });
        await user.save();
        const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, {
            expiresIn: '30d',
        });
        // Record initial active session in MongoDB
        try {
            const tokenHash = hashToken(token);
            const ipAddress = getClientIp(req);
            const { deviceType, browserName, osName } = parseUserAgent(req.headers['user-agent']);
            await Session.create({
                userId: user._id,
                tokenHash,
                ipAddress,
                deviceType,
                browserName,
                osName,
                lastActiveAt: new Date(),
            });
        }
        catch (sessionErr) {
            console.warn('[authController] Failed to record registration session:', sessionErr?.message);
        }
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Login existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, {
            expiresIn: '30d',
        });
        // Record new active login session in MongoDB
        try {
            const tokenHash = hashToken(token);
            const ipAddress = getClientIp(req);
            const { deviceType, browserName, osName } = parseUserAgent(req.headers['user-agent']);
            await Session.create({
                userId: user._id,
                tokenHash,
                ipAddress,
                deviceType,
                browserName,
                osName,
                lastActiveAt: new Date(),
            });
        }
        catch (sessionErr) {
            console.warn('[authController] Failed to record login session:', sessionErr?.message);
        }
        res.status(200).json({
            message: 'Welcome back to Noteeye',
            token,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get current authenticated user profile + statistics
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required. Please sign in.' });
            return;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(401).json({ message: 'User account not found or has been removed.' });
            return;
        }
        // Scoped account statistics for the authenticated user
        const [totalNotes, totalFolders] = await Promise.all([
            Note.countDocuments({ userId: user._id, isTrash: false }),
            Folder.countDocuments({ userId: user._id, isTrash: false }),
        ]);
        const stats = {
            totalNotes,
            totalFolders,
            memberSince: user.createdAt,
        };
        res.status(200).json({
            user,
            stats,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update user display name or avatar
 * PATCH /api/auth/update-profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const { name, avatar, avatarUrl } = req.body;
        if (name !== undefined) {
            user.name = name.trim();
        }
        if (avatar !== undefined) {
            user.avatarUrl = avatar;
        }
        if (avatarUrl !== undefined) {
            user.avatarUrl = avatarUrl;
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
 * Change user password
 * PATCH /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters long' });
            return;
        }
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password does not match' });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Logout user from current device (deletes active session)
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
    try {
        if (req.tokenHash && req.user?.id) {
            await Session.findOneAndDelete({
                tokenHash: req.tokenHash,
                userId: req.user.id,
            });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
