import { Router } from 'express';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/folderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all folder routes
router.use(authenticate);

router.get('/', getFolders);
router.post('/', createFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
