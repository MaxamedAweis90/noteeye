import mongoose from 'mongoose';
import { Note } from '../models/Note.js';
import { Folder } from '../models/Folder.js';
/**
 * Instant Search across Notes and Folders
 * GET /api/search?q=...&limit=...
 */
export const searchAll = async (req, res, next) => {
    try {
        const { q, limit } = req.query;
        const queryStr = typeof q === 'string' ? q.trim() : '';
        if (!queryStr) {
            res.status(200).json({
                folders: [],
                notes: [],
                results: [],
                total: 0,
            });
            return;
        }
        const maxResults = limit ? parseInt(limit, 10) : 50;
        const regex = new RegExp(queryStr, 'i');
        const userId = req.user?.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: 'Valid user session required' });
            return;
        }
        const baseFilter = {
            userId: new mongoose.Types.ObjectId(userId),
            isTrash: false,
        };
        const [matchingFolders, matchingNotes] = await Promise.all([
            Folder.find({
                ...baseFilter,
                name: { $regex: regex },
            })
                .sort({ updatedAt: -1 })
                .limit(maxResults),
            Note.find({
                ...baseFilter,
                $or: [{ title: { $regex: regex } }, { body: { $regex: regex } }],
            })
                .sort({ updatedAt: -1 })
                .limit(maxResults),
        ]);
        const combinedResults = [
            ...matchingFolders.map((f) => ({
                type: 'folder',
                id: f._id.toString(),
                name: f.name,
                parentId: f.parentId ? f.parentId.toString() : null,
                isFavorite: f.isFavorite,
                updatedAt: f.updatedAt.toISOString(),
            })),
            ...matchingNotes.map((n) => ({
                type: 'note',
                id: n._id.toString(),
                title: n.title,
                body: n.body,
                noteType: n.type,
                color: n.color,
                folderId: n.folderId ? n.folderId.toString() : null,
                isFavorite: n.isFavorite,
                updatedAt: n.updatedAt.toISOString(),
            })),
        ].slice(0, maxResults);
        res.status(200).json({
            folders: matchingFolders,
            notes: matchingNotes,
            results: combinedResults,
            total: matchingFolders.length + matchingNotes.length,
        });
    }
    catch (error) {
        next(error);
    }
};
