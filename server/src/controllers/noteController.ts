import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Note } from '../models/Note.js';
import { Folder } from '../models/Folder.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Get notes with optional filters (strictly scoped to authenticated user)
 * GET /api/notes
 * Query filters: folderId, isFavorite, isTrash, type, color, q
 */
export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Valid user session required' });
      return;
    }

    const { folderId, isFavorite, isTrash, type, color, q } = req.query;

    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (isTrash === 'all') {
      // Return both active and trash
    } else if (isTrash !== undefined) {
      filter.isTrash = isTrash === 'true';
    } else {
      filter.isTrash = false;
    }

    // Filter by folder
    if (folderId !== undefined) {
      if (folderId === 'root' || folderId === 'null' || folderId === '') {
        filter.folderId = null;
      } else if (mongoose.Types.ObjectId.isValid(folderId as string)) {
        filter.folderId = new mongoose.Types.ObjectId(folderId as string);
      } else {
        res.status(400).json({ message: 'Invalid folderId format' });
        return;
      }
    }

    // Filter by isFavorite
    if (isFavorite !== undefined) {
      filter.isFavorite = isFavorite === 'true';
    }

    // Filter by type ('note' | 'checklist')
    if (type && ['note', 'checklist'].includes(type as string)) {
      filter.type = type;
    }

    // Filter by pastel color
    if (color && ['peach', 'mint', 'sky', 'lavender', 'rose', 'yellow'].includes(color as string)) {
      filter.color = color;
    }

    // Filter by text search query
    if (q && typeof q === 'string' && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    const notes = await Note.find(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      notes,
      total: notes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single note by ID (strictly isolated to owner)
 * GET /api/notes/:id
 */
export const getNoteById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({ note });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new note or checklist
 * POST /api/notes
 */
export const createNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const {
      id,
      title,
      body,
      content,
      type = 'note',
      checklistItems = [],
      color = 'peach',
      folderId = null,
      isFavorite = false,
    } = req.body;

    const noteBody = body !== undefined ? body : content !== undefined ? content : '';

    let resolvedFolderId: mongoose.Types.ObjectId | null = null;
    if (folderId && folderId !== 'root' && folderId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        res.status(400).json({ message: 'Invalid folderId format' });
        return;
      }

      // Verify that the target folder belongs to the same user
      const folderExists = await Folder.findOne({
        _id: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!folderExists) {
        res.status(404).json({ message: 'Target folder not found or unauthorized' });
        return;
      }

      resolvedFolderId = new mongoose.Types.ObjectId(folderId);
    }

    const customId = id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : undefined;
    const newNote = new Note({
      ...(customId ? { _id: customId } : {}),
      userId: new mongoose.Types.ObjectId(userId),
      title: title ? title.trim() : 'Untitled',
      body: noteBody,
      type: ['note', 'checklist'].includes(type) ? type : 'note',
      checklistItems: Array.isArray(checklistItems)
        ? checklistItems.map((ci: any) => ({
            id: ci.id || `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: ci.text || '',
            completed: Boolean(ci.completed ?? ci.isCompleted),
          }))
        : [],
      color: ['peach', 'mint', 'sky', 'lavender', 'rose', 'yellow'].includes(color)
        ? color
        : 'peach',
      folderId: resolvedFolderId,
      isFavorite: Boolean(isFavorite),
      isTrash: false,
      deletedAt: null,
    });

    await newNote.save();

    res.status(201).json({ note: newNote });
  } catch (error) {
    next(error);
  }
};

/**
 * Partial update note (strictly isolated to owner)
 * PATCH /api/notes/:id
 */
export const updateNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const {
      title,
      body,
      content,
      type,
      checklistItems,
      color,
      folderId,
      isFavorite,
    } = req.body;

    const updates: Record<string, any> = {};

    if (title !== undefined) updates.title = title.trim();
    if (body !== undefined) updates.body = body;
    else if (content !== undefined) updates.body = content;

    if (type !== undefined && ['note', 'checklist'].includes(type)) {
      updates.type = type;
    }

    if (checklistItems !== undefined && Array.isArray(checklistItems)) {
      updates.checklistItems = checklistItems.map((ci: any) => ({
        id: ci.id || `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: ci.text || '',
        completed: Boolean(ci.completed ?? ci.isCompleted),
      }));
    }

    if (color !== undefined && ['peach', 'mint', 'sky', 'lavender', 'rose', 'yellow'].includes(color)) {
      updates.color = color;
    }

    if (folderId !== undefined) {
      if (folderId === null || folderId === 'root' || folderId === 'null' || folderId === '') {
        updates.folderId = null;
      } else if (mongoose.Types.ObjectId.isValid(folderId)) {
        // Verify target folder belongs to the user
        const targetFolder = await Folder.findOne({
          _id: new mongoose.Types.ObjectId(folderId),
          userId: new mongoose.Types.ObjectId(userId),
        });
        if (!targetFolder) {
          res.status(404).json({ message: 'Target folder not found or unauthorized' });
          return;
        }
        updates.folderId = new mongoose.Types.ObjectId(folderId);
      } else {
        res.status(400).json({ message: 'Invalid folderId format' });
        return;
      }
    }

    if (isFavorite !== undefined) {
      updates.isFavorite = Boolean(isFavorite);
    }

    const updatedNote = await Note.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedNote) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({ note: updatedNote });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete note to trash (strictly isolated to owner)
 * PATCH /api/notes/:id/trash
 */
export const softDeleteNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { isTrash: true, deletedAt: new Date() },
      { new: true }
    );

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({
      message: 'Note moved to trash',
      note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore note from trash (strictly isolated to owner)
 * PATCH /api/notes/:id/restore
 */
export const restoreNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { isTrash: false, deletedAt: null },
      { new: true }
    );

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({
      message: 'Note restored from trash',
      note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete note from database (strictly isolated to owner)
 * DELETE /api/notes/:id
 */
export const deleteNoteForever = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({
      message: 'Note permanently deleted',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hard-delete all notes where isTrash === true (strictly isolated to owner)
 * DELETE /api/notes/trash/empty
 */
export const emptyTrashNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const result = await Note.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      isTrash: true,
    });

    res.status(200).json({
      message: 'Trash notes emptied successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate a note (strictly isolated to owner)
 * POST /api/notes/:id/duplicate
 */
export const duplicateNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const { destinationFolderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const sourceNote = await Note.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!sourceNote) {
      res.status(404).json({ message: 'Source note not found' });
      return;
    }

    let targetFolder = sourceNote.folderId;
    if (destinationFolderId !== undefined) {
      if (destinationFolderId === null || destinationFolderId === 'root' || destinationFolderId === 'null') {
        targetFolder = null;
      } else if (mongoose.Types.ObjectId.isValid(destinationFolderId)) {
        const destFolderExists = await Folder.findOne({
          _id: new mongoose.Types.ObjectId(destinationFolderId),
          userId: new mongoose.Types.ObjectId(userId),
        });
        if (!destFolderExists) {
          res.status(404).json({ message: 'Destination folder not found or unauthorized' });
          return;
        }
        targetFolder = new mongoose.Types.ObjectId(destinationFolderId);
      }
    }

    const duplicated = new Note({
      userId: new mongoose.Types.ObjectId(userId),
      title: `${sourceNote.title} (Copy)`,
      body: sourceNote.body,
      type: sourceNote.type,
      checklistItems: sourceNote.checklistItems.map((ci) => ({
        id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: ci.text,
        completed: ci.completed,
      })),
      color: sourceNote.color,
      folderId: targetFolder,
      isFavorite: false,
      isTrash: false,
      deletedAt: null,
    });

    await duplicated.save();

    res.status(201).json({ note: duplicated });
  } catch (error) {
    next(error);
  }
};
