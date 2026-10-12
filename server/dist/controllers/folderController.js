import mongoose from 'mongoose';
import { Folder } from '../models/Folder.js';
import { Note } from '../models/Note.js';
/**
 * Recursively retrieves all descendant subfolder IDs starting from a root folder ID
 * Strictly scoped to the authenticated user
 */
export const getAllDescendantFolderIds = async (rootId, userId) => {
    const allIds = [rootId];
    let frontier = [rootId];
    while (frontier.length > 0) {
        const query = {
            parentId: { $in: frontier },
        };
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.userId = new mongoose.Types.ObjectId(userId);
        }
        const children = await Folder.find(query).select('_id');
        if (children.length === 0)
            break;
        const childIds = children.map((c) => c._id);
        allIds.push(...childIds);
        frontier = childIds;
    }
    return allIds;
};
/**
 * List all active folders with active notesCount aggregation
 * GET /api/folders
 * Query: parentId (optional, filter for specific nesting or 'root')
 */
export const getFolders = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: 'Valid user session required' });
            return;
        }
        const { parentId, isTrash, isFavorite } = req.query;
        const matchQuery = {
            userId: new mongoose.Types.ObjectId(userId),
        };
        if (isTrash === 'all') {
            // Return both active and trash
        }
        else if (isTrash !== undefined) {
            matchQuery.isTrash = isTrash === 'true';
        }
        else {
            matchQuery.isTrash = false;
        }
        if (parentId !== undefined) {
            if (parentId === 'root' || parentId === 'null' || parentId === '') {
                matchQuery.parentId = null;
            }
            else if (mongoose.Types.ObjectId.isValid(parentId)) {
                matchQuery.parentId = new mongoose.Types.ObjectId(parentId);
            }
            else {
                res.status(400).json({ message: 'Invalid parentId format' });
                return;
            }
        }
        if (isFavorite !== undefined) {
            matchQuery.isFavorite = isFavorite === 'true';
        }
        // Aggregation pipeline to join active notes and calculate notesCount
        const foldersWithCounts = await Folder.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'notes',
                    let: { currentFolderId: '$_id', currentUserId: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$folderId', '$$currentFolderId'] },
                                        { $eq: ['$userId', '$$currentUserId'] },
                                        { $eq: ['$isTrash', false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'activeNotes',
                },
            },
            {
                $addFields: {
                    notesCount: { $size: '$activeNotes' },
                    id: { $toString: '$_id' },
                    isDeleted: '$isTrash',
                },
            },
            {
                $project: {
                    activeNotes: 0,
                    __v: 0,
                },
            },
            {
                $sort: { isFavorite: -1, name: 1, createdAt: -1 },
            },
        ]);
        // Format output with string IDs
        const formattedFolders = foldersWithCounts.map((f) => ({
            ...f,
            id: f._id.toString(),
            parentId: f.parentId ? f.parentId.toString() : null,
            userId: f.userId ? f.userId.toString() : null,
            _id: undefined,
        }));
        res.status(200).json({
            folders: formattedFolders,
            total: formattedFolders.length,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get folder by ID (strictly isolated to owner)
 * GET /api/folders/:id
 */
export const getFolderById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const folder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }
        res.status(200).json({ folder });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Create a new folder (strictly bound to owner)
 * POST /api/folders
 */
export const createFolder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { name, parentId = null } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Folder name is required' });
            return;
        }
        let resolvedParentId = null;
        if (parentId && parentId !== 'root' && parentId !== 'null') {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                res.status(400).json({ message: 'Invalid parentId format' });
                return;
            }
            // Verify parent belongs to user
            const parentFolder = await Folder.findOne({
                _id: new mongoose.Types.ObjectId(parentId),
                userId: new mongoose.Types.ObjectId(userId),
            });
            if (!parentFolder) {
                res.status(404).json({ message: 'Parent folder not found or unauthorized' });
                return;
            }
            resolvedParentId = new mongoose.Types.ObjectId(parentId);
        }
        const newFolder = new Folder({
            userId: new mongoose.Types.ObjectId(userId),
            name: name.trim(),
            parentId: resolvedParentId,
            isFavorite: false,
            isTrash: false,
            deletedAt: null,
        });
        await newFolder.save();
        res.status(201).json({ folder: newFolder });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Rename or toggle favorite or update parent of folder (strictly isolated to owner)
 * PATCH /api/folders/:id
 */
export const updateFolder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        const { name, isFavorite, parentId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const folder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }
        if (name !== undefined) {
            const trimmed = name.trim();
            if (!trimmed) {
                res.status(400).json({ message: 'Folder name cannot be empty' });
                return;
            }
            folder.name = trimmed;
        }
        if (isFavorite !== undefined) {
            folder.isFavorite = Boolean(isFavorite);
        }
        // Move folder with cycle prevention
        if (parentId !== undefined) {
            if (parentId === null || parentId === 'root' || parentId === 'null' || parentId === '') {
                folder.parentId = null;
            }
            else if (mongoose.Types.ObjectId.isValid(parentId)) {
                const targetParentId = new mongoose.Types.ObjectId(parentId);
                // Verify destination parent belongs to user
                const targetParentFolder = await Folder.findOne({
                    _id: targetParentId,
                    userId: new mongoose.Types.ObjectId(userId),
                });
                if (!targetParentFolder) {
                    res.status(404).json({ message: 'Destination folder not found or unauthorized' });
                    return;
                }
                // Cycle prevention: folder cannot be moved into itself or any descendant
                const descendantIds = await getAllDescendantFolderIds(folder._id, userId);
                const isDescendant = descendantIds.some((dId) => dId.equals(targetParentId));
                if (isDescendant) {
                    res.status(400).json({
                        message: 'Invalid folder move: Cannot move a folder into itself or its subfolder',
                    });
                    return;
                }
                folder.parentId = targetParentId;
            }
            else {
                res.status(400).json({ message: 'Invalid parentId format' });
                return;
            }
        }
        await folder.save();
        res.status(200).json({ folder });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Soft-delete folder and cascadingly soft-delete all child subfolders and notes (strictly isolated to owner)
 * PATCH /api/folders/:id/trash
 */
export const softDeleteFolder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const targetFolder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!targetFolder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }
        const now = new Date();
        // Recursively find all child subfolder IDs belonging to user
        const allFolderIds = await getAllDescendantFolderIds(targetFolder._id, userId);
        // Cascading soft-delete to all subfolders
        await Folder.updateMany({
            _id: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        }, { $set: { isTrash: true, deletedAt: now } });
        // Cascading soft-delete to all notes in these folders
        await Note.updateMany({
            folderId: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        }, { $set: { isTrash: true, deletedAt: now } });
        res.status(200).json({
            message: 'Folder and contents moved to trash',
            folderId: id,
            affectedFolderCount: allFolderIds.length,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Restore folder and cascadingly restore all child subfolders and notes (strictly isolated to owner)
 * PATCH /api/folders/:id/restore
 */
export const restoreFolder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const targetFolder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!targetFolder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }
        // If original parent was also deleted or missing, attach restored folder to root
        if (targetFolder.parentId) {
            const parent = await Folder.findOne({
                _id: targetFolder.parentId,
                userId: new mongoose.Types.ObjectId(userId),
            });
            if (!parent || parent.isTrash) {
                targetFolder.parentId = null;
                await targetFolder.save();
            }
        }
        const allFolderIds = await getAllDescendantFolderIds(targetFolder._id, userId);
        // Restore folders
        await Folder.updateMany({
            _id: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        }, { $set: { isTrash: false, deletedAt: null } });
        // Restore notes inside these folders
        await Note.updateMany({
            folderId: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        }, { $set: { isTrash: false, deletedAt: null } });
        res.status(200).json({
            message: 'Folder and contents restored from trash',
            folderId: id,
            affectedFolderCount: allFolderIds.length,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Permanently delete folder and all child subfolders and notes (strictly isolated to owner)
 * DELETE /api/folders/:id
 */
export const deleteFolderForever = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const targetFolder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!targetFolder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }
        const allFolderIds = await getAllDescendantFolderIds(targetFolder._id, userId);
        // Permanently remove notes inside these folders
        await Note.deleteMany({
            folderId: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        });
        // Permanently delete folders
        const deleteResult = await Folder.deleteMany({
            _id: { $in: allFolderIds },
            userId: new mongoose.Types.ObjectId(userId),
        });
        res.status(200).json({
            message: 'Folder and contents permanently deleted',
            deletedFolderCount: deleteResult.deletedCount,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get recursive breadcrumbs array from root down to targeted folder (strictly isolated to owner)
 * GET /api/folders/:id/breadcrumbs
 */
export const getBreadcrumbs = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const breadcrumbs = [];
        let currentId = new mongoose.Types.ObjectId(id);
        const visited = new Set();
        while (currentId && !visited.has(currentId.toString())) {
            visited.add(currentId.toString());
            const folder = await Folder.findOne({
                _id: currentId,
                userId: new mongoose.Types.ObjectId(userId),
            }).select('name parentId');
            if (!folder)
                break;
            breadcrumbs.unshift({ id: folder._id.toString(), name: folder.name });
            currentId = folder.parentId;
        }
        res.status(200).json({ breadcrumbs });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Duplicate folder (strictly isolated to owner)
 * POST /api/folders/:id/duplicate
 */
export const duplicateFolder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        const { targetParentId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid folder ID format' });
            return;
        }
        const sourceFolder = await Folder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if (!sourceFolder) {
            res.status(404).json({ message: 'Source folder not found' });
            return;
        }
        let parent = sourceFolder.parentId;
        if (targetParentId !== undefined) {
            if (targetParentId === null || targetParentId === 'root' || targetParentId === 'null') {
                parent = null;
            }
            else if (mongoose.Types.ObjectId.isValid(targetParentId)) {
                const targetParentFolder = await Folder.findOne({
                    _id: new mongoose.Types.ObjectId(targetParentId),
                    userId: new mongoose.Types.ObjectId(userId),
                });
                if (!targetParentFolder) {
                    res.status(404).json({ message: 'Destination folder not found or unauthorized' });
                    return;
                }
                parent = new mongoose.Types.ObjectId(targetParentId);
            }
        }
        const newFolder = new Folder({
            userId: new mongoose.Types.ObjectId(userId),
            name: `${sourceFolder.name} (Copy)`,
            parentId: parent,
            isFavorite: false,
            isTrash: false,
            deletedAt: null,
        });
        await newFolder.save();
        res.status(201).json({ folder: newFolder });
    }
    catch (error) {
        next(error);
    }
};
