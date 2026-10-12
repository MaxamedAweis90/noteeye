import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  softDeleteNote,
  restoreNote,
  deleteNoteForever,
  emptyTrashNotes,
  duplicateNote,
} from '../controllers/noteController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware across all note routes
router.use(authenticate);

// Empty trash route (MUST be placed before /:id parameter route)
router.delete('/trash/empty', emptyTrashNotes);

// Base CRUD routes
router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNoteForever);

// Trash lifecycle actions
router.patch('/:id/trash', softDeleteNote);
router.patch('/:id/restore', restoreNote);

// Duplication
router.post('/:id/duplicate', duplicateNote);

export default router;
