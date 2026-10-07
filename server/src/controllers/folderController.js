import mongoose from 'mongoose';
import { Folder, Item } from '../models/index.js';

/**
 * Get active folders for current user
 * GET /api/folders
 * Query: ?parentId= (ObjectId or 'root')
 */
export const getFolders = async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const query = {
      userId: req.user.id,
      isDeleted: false,
    };

    if (parentId !== undefined) {
      if (parentId === 'root' || parentId === 'null' || parentId === '') {
        query.parentId = null;
      } else if (mongoose.Types.ObjectId.isValid(parentId)) {
        query.parentId = parentId;
      } else {
        return res.status(400).json({ message: 'Invalid parentId format' });
      }
    }

    const folders = await Folder.find(query).sort({ name: 1, createdAt: -1 });

    return res.status(200).json({ folders });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new folder
 * POST /api/folders
 */
export const createFolder = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    let resolvedParentId = null;

    if (parentId && parentId !== 'root') {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: 'Invalid parentId format' });
      }

      const parentFolder = await Folder.findOne({
        _id: parentId,
        userId: req.user.id,
        isDeleted: false,
      });

      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }

      resolvedParentId = parentFolder._id;
    }

    const folder = await Folder.create({
      userId: req.user.id,
      name: name.trim(),
      parentId: resolvedParentId,
    });

    return res.status(201).json({ folder });
  } catch (error) {
    next(error);
  }
};

/**
 * Update folder name or move parent
 * PATCH /api/folders/:id
 */
export const updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const folder = await Folder.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Folder name cannot be empty' });
      }
      folder.name = name.trim();
    }

    if (parentId !== undefined) {
      if (parentId === 'root' || parentId === null || parentId === '') {
        folder.parentId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
          return res.status(400).json({ message: 'Invalid parentId format' });
        }
        if (parentId.toString() === id.toString()) {
          return res.status(400).json({ message: 'A folder cannot be its own parent' });
        }

        const parentFolder = await Folder.findOne({
          _id: parentId,
          userId: req.user.id,
          isDeleted: false,
        });

        if (!parentFolder) {
          return res.status(404).json({ message: 'Target parent folder not found' });
        }

        folder.parentId = parentFolder._id;
      }
    }

    await folder.save();

    return res.status(200).json({ folder });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete folder and cascade to its items & child folders
 * DELETE /api/folders/:id
 */
export const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const folder = await Folder.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Soft delete the folder
    folder.isDeleted = true;
    await folder.save();

    // Recursive cascade helper to soft-delete subfolders and items
    const cascadeSoftDelete = async (parentFolderId) => {
      const subfolders = await Folder.find({ parentId: parentFolderId, userId: req.user.id });
      for (const sub of subfolders) {
        if (!sub.isDeleted) {
          sub.isDeleted = true;
          await sub.save();
          await cascadeSoftDelete(sub._id);
        }
      }
      await Item.updateMany(
        { folderId: parentFolderId, userId: req.user.id },
        { isDeleted: true }
      );
    };

    await cascadeSoftDelete(folder._id);

    return res.status(200).json({
      message: 'Folder and contents moved to trash',
      id: folder._id,
    });
  } catch (error) {
    next(error);
  }
};
