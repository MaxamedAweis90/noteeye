import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import Feedback from '../models/Feedback.js';

/**
 * Submit User Feedback / Bug Report / Feature Request
 * POST /api/feedback
 */
export const submitFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { templateType, subject, message, userEmail, systemMeta } = req.body;

    if (!subject || !subject.trim()) {
      res.status(400).json({ message: 'Subject is required.' });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({ message: 'Report message content is required.' });
      return;
    }

    const userId = req.user?.id || undefined;
    const email = (userEmail && userEmail.trim()) || req.user?.email || undefined;

    const feedback = await Feedback.create({
      userId,
      userEmail: email,
      templateType: templateType || 'general',
      subject: subject.trim(),
      message: message.trim(),
      systemMeta,
      status: 'new',
    });

    console.log(
      `[Feedback Log] New report received: [${feedback.templateType.toUpperCase()}] "${feedback.subject}" from: ${
        email || (userId ? `User(${userId})` : 'Anonymous')
      }`
    );

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been received and logged.',
      feedbackId: feedback._id,
    });
  } catch (error: any) {
    console.error('[Feedback Controller Error]', error);
    res.status(500).json({
      message: error.message || 'Failed to submit feedback. Please try again.',
    });
  }
};
