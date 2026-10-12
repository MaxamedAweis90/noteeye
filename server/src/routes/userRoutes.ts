import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  sendVerificationCode,
  verifyEmail,
  uploadAvatar,
  updateSettings,
  deleteAccount,
  recoverAccount,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All user profile and settings routes are authenticated
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/send-verification', sendVerificationCode);
router.post('/verify-email', verifyEmail);
router.post('/avatar', uploadAvatar);
router.put('/settings', updateSettings);
router.post('/delete-account', deleteAccount);
router.post('/recover-account', recoverAccount);

export default router;
