import express from 'express';
import { submitFeedback } from '../controllers/feedbackController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();
// POST /api/feedback - Supports both authenticated users and guests
router.post('/', optionalAuthMiddleware, submitFeedback);
export default router;
