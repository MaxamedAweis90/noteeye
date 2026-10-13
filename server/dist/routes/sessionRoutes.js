import { Router } from 'express';
import { getSessions, deleteSession, revokeOtherSessions, } from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// All session routes require strict authentication
router.use(authMiddleware);
// GET /api/sessions - List all active sessions
router.get('/', getSessions);
// DELETE /api/sessions/:id - Revoke specific session (logs out device)
router.delete('/:id', deleteSession);
// POST /api/sessions/revoke-others - Revoke all sessions except the current one
router.post('/revoke-others', revokeOtherSessions);
export default router;
