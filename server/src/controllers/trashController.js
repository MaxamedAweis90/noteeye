import mongoose from 'mongoose';
import { Folder, Item } from '../models/index.js';

/**
 * Get all soft-deleted folders and items for current user
 * GET /api/trash
 */
export const getTrash = async (req, res, next) => {
  try {
    const [folders, items] = await Promise.all([
      Folder.find({ userId: req.user.id, isDeleted: true }).sort({ updatedAt: -1 }),
      Item.find({ userId: req.user.id, isDeleted: true }).sort({ updatedAt: -1 }),
    ]);

    return res.status(200).json({
      folders,
      items,
      totalCount: folders.length + items.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a folder or item from trash
 * POST /api/trash/:id/restore
 */
export const restoreFromTrash = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if target is a deleted folder
    const folder = await Folder.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: true,
    });

    if (folder) {
      // If parent folder was deleted or missing, move restored folder to root
      if (folder.parentId) {
        const parent = await Folder.findOne({
          _id: folder.parentId,
          userId: req.user.id,
        });
        if (!parent || parent.isDeleted) {
          folder.parentId = null;
        }
      }

      folder.isDeleted = false;
      await folder.save();

      // Also restore items directly inside this folder
      await Item.updateMany(
        { folderId: folder._id, userId: req.user.id, isDeleted: true },
        { isDeleted: false }
      );

      return res.status(200).json({
        message: 'Folder and contents restored successfully',
        type: 'folder',
        data: folder,
      });
    }

    // Check if target is a deleted item
    const item = await Item.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: true,
    });

    if (item) {
      // If containing folder is deleted or missing, restore item to root
      if (item.folderId) {
        const parentFolder = await Folder.findOne({
          _id: item.folderId,
          userId: req.user.id,
        });
        if (!parentFolder || parentFolder.isDeleted) {
          item.folderId = null;
        }
      }

      item.isDeleted = false;
      await item.save();

      return res.status(200).json({
        message: 'Item restored successfully',
        type: 'item',
        data: item,
      });
    }

    return res.status(404).json({ message: 'Deleted folder or item not found in trash' });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete a folder or item
 * DELETE /api/trash/:id/permanent
 */
export const permanentlyDelete = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Try deleting item first
    const deletedItem = await Item.findOneAndDelete({
      _id: id,
      userId: req.user.id,
      isDeleted: true,
    });

    if (deletedItem) {
      return res.status(200).json({
        message: 'Item permanently deleted',
        type: 'item',
        id: deletedItem._id,
      });
    }

    // Try deleting folder
    const deletedFolder = await Folder.findOneAndDelete({
      _id: id,
      userId: req.user.id,
      isDeleted: true,
    });

    if (deletedFolder) {
      // Permanently remove nested items and child folders
      await Item.deleteMany({ folderId: deletedFolder._id, userId: req.user.id });
      await Folder.deleteMany({ parentId: deletedFolder._id, userId: req.user.id });

      return res.status(200).json({
        message: 'Folder and nested contents permanently deleted',
        type: 'folder',
        id: deletedFolder._id,
      });
    }

    return res.status(404).json({ message: 'Item or folder not found in trash' });
  } catch (error) {
    next(error);
  }
};
