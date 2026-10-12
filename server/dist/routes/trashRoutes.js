import { Router } from 'express';
import { getTrash, emptyAllTrash, restoreTrashItem } from '../controllers/trashController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', getTrash);
router.delete('/empty', emptyAllTrash);
router.patch('/:id/restore', restoreTrashItem);
export default router;
