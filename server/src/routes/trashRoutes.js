import { Router } from 'express';
import {
  getTrash,
  restoreFromTrash,
  permanentlyDelete,
} from '../controllers/trashController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all trash routes
router.use(authenticate);

router.get('/', getTrash);
router.post('/:id/restore', restoreFromTrash);
router.delete('/:id/permanent', permanentlyDelete);

export default router;
