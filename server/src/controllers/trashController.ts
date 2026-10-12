import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Note } from '../models/Note.js';
import { Folder } from '../models/Folder.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getAllDescendantFolderIds } from './folderController.js';

/**
 * Get all trashed folders and notes
 * GET /api/trash
 */
export const getTrash = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = { isTrash: true };
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      filter.userId = new mongoose.Types.ObjectId(req.user.id);
    }

    const [folders, notes] = await Promise.all([
      Folder.find(filter).sort({ deletedAt: -1, updatedAt: -1 }),
      Note.find(filter).sort({ deletedAt: -1, updatedAt: -1 }),
    ]);

    res.status(200).json({
      folders,
      notes,
      totalCount: folders.length + notes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Empty all trash (permanently hard-deletes all trashed folders and notes)
 * DELETE /api/trash/empty
 */
export const emptyAllTrash = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = { isTrash: true };
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      filter.userId = new mongoose.Types.ObjectId(req.user.id);
    }

    const [deletedNotesResult, deletedFoldersResult] = await Promise.all([
      Note.deleteMany(filter),
      Folder.deleteMany(filter),
    ]);

    res.status(200).json({
      message: 'All trash permanently emptied',
      deletedNotesCount: deletedNotesResult.deletedCount,
      deletedFoldersCount: deletedFoldersResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore an item (either note or folder) by ID
 * PATCH /api/trash/:id/restore
 */
export const restoreTrashItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    // Try finding in Notes first
    const note = await Note.findById(id);
    if (note && note.isTrash) {
      note.isTrash = false;
      note.deletedAt = null;
      await note.save();
      res.status(200).json({ message: 'Note restored', type: 'note', item: note });
      return;
    }

    // Try finding in Folders
    const folder = await Folder.findById(id);
    if (folder && folder.isTrash) {
      if (folder.parentId) {
        const parent = await Folder.findById(folder.parentId);
        if (!parent || parent.isTrash) {
          folder.parentId = null;
        }
      }
      folder.isTrash = false;
      folder.deletedAt = null;
      await folder.save();

      const allFolderIds = await getAllDescendantFolderIds(folder._id as mongoose.Types.ObjectId, req.user?.id);
      await Folder.updateMany(
        { _id: { $in: allFolderIds } },
        { $set: { isTrash: false, deletedAt: null } }
      );
      await Note.updateMany(
        { folderId: { $in: allFolderIds } },
        { $set: { isTrash: false, deletedAt: null } }
      );

      res.status(200).json({ message: 'Folder restored', type: 'folder', item: folder });
      return;
    }

    res.status(404).json({ message: 'Trashed item not found' });
  } catch (error) {
    next(error);
  }
};
