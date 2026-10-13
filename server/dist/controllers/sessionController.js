import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
/**
 * Get all active login sessions for the authenticated user.
 * GET /api/sessions
 */
export const getSessions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const currentTokenHash = req.tokenHash;
        const rawSessions = await Session.find({
            userId: new mongoose.Types.ObjectId(userId),
        })
            .sort({ lastActiveAt: -1 })
            .lean();
        const formattedSessions = rawSessions.map((s) => ({
            id: s._id.toString(),
            deviceType: s.deviceType || 'desktop',
            browserName: s.browserName || 'Unknown Browser',
            osName: s.osName || 'Unknown OS',
            ipAddress: s.ipAddress || 'Unknown IP',
            lastActiveAt: s.lastActiveAt || s.createdAt || new Date(),
            createdAt: s.createdAt || new Date(),
            // Identify whether this session document matches the token currently making this request
            isCurrent: Boolean(currentTokenHash && s.tokenHash === currentTokenHash),
            isMainDevice: Boolean(s.isMainDevice),
        }));
        res.status(200).json({
            sessions: formattedSessions,
            total: formattedSessions.length,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Remove/revoke a specific session by ID (logging out that device).
 * DELETE /api/sessions/:id
 */
export const deleteSession = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const sessionId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            res.status(400).json({ message: 'Invalid session ID format' });
            return;
        }
        const deletedSession = await Session.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(sessionId),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!deletedSession) {
            res.status(404).json({ message: 'Session not found or already revoked' });
            return;
        }
        // =========================================================================
        // [FUTURE FEATURE HOOK]: Automated Security Email Notification
        // =========================================================================
        // When a device session is terminated, send an alert email to the user:
        //
        // async function triggerDeviceRevocationEmail(userEmail: string, session: any) {
        //   await sendEmail({
        //     to: userEmail,
        //     subject: 'Noteeye Security Alert: A device was signed out',
        //     template: 'session-revoked',
        //     context: {
        //       device: `${session.deviceType} (${session.osName})`,
        //       browser: session.browserName,
        //       ip: session.ipAddress,
        //       timestamp: new Date().toISOString(),
        //     },
        //   });
        // }
        // if (req.user?.email) {
        //   triggerDeviceRevocationEmail(req.user.email, deletedSession).catch(console.error);
        // }
        // =========================================================================
        const isCurrentRevoked = Boolean(req.tokenHash && deletedSession.tokenHash === req.tokenHash);
        res.status(200).json({
            message: isCurrentRevoked
                ? 'Current device session logged out'
                : 'Device session successfully removed',
            revokedId: sessionId,
            isCurrentRevoked,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Revoke all other active sessions except the current device.
 * POST /api/sessions/revoke-others
 */
export const revokeOtherSessions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const currentTokenHash = req.tokenHash;
        if (!userId || !currentTokenHash) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await Session.deleteMany({
            userId: new mongoose.Types.ObjectId(userId),
            tokenHash: { $ne: currentTokenHash },
        });
        res.status(200).json({
            message: 'All other active sessions revoked successfully',
            revokedCount: result.deletedCount,
        });
    }
    catch (error) {
        next(error);
    }
};
// =============================================================================
// [FUTURE FEATURE HOOK: Upcoming: Requires Email Verification]
// Mock server controller function to promote a session as the Primary/Main Device.
// =============================================================================
/*
export const setMainDevice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    // 1. Verify two-factor email verification code
    // const { verificationCode } = req.body;
    // await verifyTwoFactorEmailCode(userId, verificationCode);

    // 2. Clear previous main device designation
    // await Session.updateMany({ userId }, { isMainDevice: false });

    // 3. Mark selected session as main device
    // const updated = await Session.findOneAndUpdate(
    //   { _id: sessionId, userId },
    //   { isMainDevice: true },
    //   { new: true }
    // );

    res.status(501).json({
      message: 'Upcoming feature: Promoting a main device requires two-factor email verification.',
    });
  } catch (error) {
    next(error);
  }
};
*/
