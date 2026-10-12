import { Router } from 'express';
import { getFolders, getFolderById, createFolder, updateFolder, softDeleteFolder, restoreFolder, deleteFolderForever, getBreadcrumbs, duplicateFolder, } from '../controllers/folderController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// Apply authentication middleware
router.use(authenticate);
// Base folder CRUD routes
router.get('/', getFolders);
router.post('/', createFolder);
router.get('/:id', getFolderById);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolderForever);
// Hierarchy Breadcrumbs
router.get('/:id/breadcrumbs', getBreadcrumbs);
// Trash lifecycle actions
router.patch('/:id/trash', softDeleteFolder);
router.patch('/:id/restore', restoreFolder);
// Duplication
router.post('/:id/duplicate', duplicateFolder);
export default router;
