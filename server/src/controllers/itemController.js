import mongoose from 'mongoose';
import { Item, Folder } from '../models/index.js';

/**
 * Get active items with optional filters
 * GET /api/items
 * Query parameters: folderId, type, q
 */
export const getItems = async (req, res, next) => {
  try {
    const { folderId, type, q } = req.query;

    const query = {
      userId: req.user.id,
      isDeleted: false,
    };

    // Filter by folder
    if (folderId !== undefined) {
      if (folderId === 'root' || folderId === 'null' || folderId === '') {
        query.folderId = null;
      } else if (mongoose.Types.ObjectId.isValid(folderId)) {
        query.folderId = folderId;
      } else {
        return res.status(400).json({ message: 'Invalid folderId format' });
      }
    }

    // Filter by type ('note' | 'checklist')
    if (type) {
      if (!['note', 'checklist'].includes(type)) {
        return res.status(400).json({ message: 'Invalid item type filter' });
      }
      query.type = type;
    }

    // Filter by search query (title search)
    if (q && q.trim()) {
      query.title = { $regex: q.trim(), $options: 'i' };
    }

    const items = await Item.find(query).sort({ updatedAt: -1 });

    return res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new item (note or checklist)
 * POST /api/items
 */
export const createItem = async (req, res, next) => {
  try {
    const { title, type, content, checklistItems, color, folderId } = req.body;

    if (!type || !['note', 'checklist'].includes(type)) {
      return res.status(400).json({
        message: 'Item type is required and must be either "note" or "checklist"',
      });
    }

    let resolvedFolderId = null;

    if (folderId && folderId !== 'root') {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return res.status(400).json({ message: 'Invalid folderId format' });
      }

      const folder = await Folder.findOne({
        _id: folderId,
        userId: req.user.id,
        isDeleted: false,
      });

      if (!folder) {
        return res.status(404).json({ message: 'Destination folder not found' });
      }

      resolvedFolderId = folder._id;
    }

    const item = await Item.create({
      userId: req.user.id,
      folderId: resolvedFolderId,
      type,
      title: title && title.trim() ? title.trim() : 'Untitled',
      content: type === 'note' ? (content || '') : '',
      checklistItems:
        type === 'checklist' && Array.isArray(checklistItems)
          ? checklistItems.map((ci) => ({
              text: ci.text ? ci.text.trim() : '',
              isCompleted: Boolean(ci.isCompleted),
            }))
          : [],
      color: color || '#FDE3C9',
    });

    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an item
 * PUT /api/items/:id
 */
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, type, content, checklistItems, color, folderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (title !== undefined) {
      item.title = title.trim() || 'Untitled';
    }

    if (type !== undefined) {
      if (!['note', 'checklist'].includes(type)) {
        return res.status(400).json({ message: 'Invalid item type' });
      }
      item.type = type;
    }

    if (content !== undefined) {
      item.content = content;
    }

    if (checklistItems !== undefined && Array.isArray(checklistItems)) {
      item.checklistItems = checklistItems.map((ci) => ({
        text: ci.text ? ci.text.trim() : '',
        isCompleted: Boolean(ci.isCompleted),
      }));
    }

    if (color !== undefined) {
      item.color = color;
    }

    if (folderId !== undefined) {
      if (folderId === 'root' || folderId === null || folderId === '') {
        item.folderId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(folderId)) {
          return res.status(400).json({ message: 'Invalid folderId format' });
        }

        const folder = await Folder.findOne({
          _id: folderId,
          userId: req.user.id,
          isDeleted: false,
        });

        if (!folder) {
          return res.status(404).json({ message: 'Target folder not found' });
        }

        item.folderId = folder._id;
      }
    }

    await item.save();

    return res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete an item
 * DELETE /api/items/:id
 */
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findOne({
      _id: id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.isDeleted = true;
    await item.save();

    return res.status(200).json({
      message: 'Item moved to trash',
      id: item._id,
    });
  } catch (error) {
    next(error);
  }
};
