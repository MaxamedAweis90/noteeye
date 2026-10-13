import jwt from 'jsonwebtoken';
import { Session } from '../models/Session.js';
import { hashToken, getClientIp, parseUserAgent } from '../utils/userAgent.js';
export const AuthenticatedRequest = {};
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-noteeye-2026';
/**
 * Production JWT + Active Session Verification Middleware
 * 1. Validates JWT signature and expiration.
 * 2. Matches client token against active MongoDB Session records.
 * 3. Enforces real-time session revocation: deleted sessions fail with 401.
 * 4. Updates lastActiveAt and IP on active sessions.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (!decoded || !decoded.id) {
                    res.status(401).json({ message: 'Malformed authorization token.' });
                    return;
                }
                const tokenHash = hashToken(token);
                let session = await Session.findOne({ tokenHash, userId: decoded.id });
                if (session) {
                    // Throttled lastActiveAt update: update at most once every 60 seconds to avoid excessive DB writes
                    const now = Date.now();
                    const lastActiveTime = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
                    if (now - lastActiveTime > 60_000) {
                        session.lastActiveAt = new Date();
                        const currentIp = getClientIp(req);
                        if (currentIp && currentIp !== 'Unknown IP') {
                            session.ipAddress = currentIp;
                        }
                        await session.save().catch((err) => console.warn('[Session Middleware] Failed to update lastActiveAt:', err?.message));
                    }
                    req.user = { id: decoded.id, email: decoded.email };
                    req.session = session;
                    req.sessionId = session._id.toString();
                    req.tokenHash = tokenHash;
                    return next();
                }
                // Session not found in database: check if user has any sessions recorded
                const totalUserSessions = await Session.countDocuments({ userId: decoded.id });
                if (totalUserSessions === 0) {
                    // Auto-register session for existing legacy JWT tokens (zero-downtime migration)
                    const { deviceType, browserName, osName } = parseUserAgent(req.headers['user-agent']);
                    const ipAddress = getClientIp(req);
                    session = await Session.create({
                        userId: decoded.id,
                        tokenHash,
                        ipAddress,
                        deviceType,
                        browserName,
                        osName,
                        lastActiveAt: new Date(),
                    });
                    req.user = { id: decoded.id, email: decoded.email };
                    req.session = session;
                    req.sessionId = session._id.toString();
                    req.tokenHash = tokenHash;
                    return next();
                }
                // If user has other sessions recorded, but this token's session is missing, it was revoked!
                res.status(401).json({
                    message: 'Session has been revoked or expired. Please sign in again.',
                });
                return;
            }
            catch (err) {
                res.status(401).json({ message: 'Invalid or expired authorization token.' });
                return;
            }
        }
    }
    res.status(401).json({ message: 'Authentication required. Please sign in to continue.' });
};
/**
 * Optional Authentication Middleware
 * If a valid JWT token is provided, attaches req.user without blocking guest requests.
 */
export const optionalAuthMiddleware = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.id) {
                    req.user = { id: decoded.id, email: decoded.email };
                }
            }
            catch {
                // Ignore token errors for optional auth
            }
        }
    }
    next();
};
export const authenticate = authMiddleware;
export default authMiddleware;
