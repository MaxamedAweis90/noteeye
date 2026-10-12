import mongoose, { Schema } from 'mongoose';
const checklistItemSchema = new Schema({
    id: {
        type: String,
        default: () => `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    },
    text: {
        type: String,
        required: [true, 'Checklist item text is required'],
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
}, {
    _id: false,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.isCompleted = ret.completed; // Backward compatibility alias
            return ret;
        },
    },
});
// Virtual for isCompleted on checklist item
checklistItemSchema.virtual('isCompleted').get(function () {
    return this.completed;
});
const noteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Note must belong to an authenticated user'],
        index: true,
    },
    title: {
        type: String,
        trim: true,
        default: 'Untitled',
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        enum: {
            values: ['note', 'checklist'],
            message: '{VALUE} is not a valid note type (expected "note" or "checklist")',
        },
        default: 'note',
    },
    checklistItems: {
        type: [checklistItemSchema],
        default: [],
    },
    color: {
        type: String,
        enum: {
            values: ['peach', 'mint', 'sky', 'lavender', 'rose', 'yellow'],
            message: '{VALUE} is not a valid pastel color',
        },
        default: 'peach',
    },
    folderId: {
        type: Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
        index: true,
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    isTrash: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            ret.folderId = ret.folderId ? ret.folderId.toString() : null;
            if (ret.userId)
                ret.userId = ret.userId.toString();
            ret.content = ret.body; // Backward compatibility alias
            ret.isDeleted = ret.isTrash; // Backward compatibility alias
            if (Array.isArray(ret.checklistItems)) {
                ret.checklistItems = ret.checklistItems.map((ci) => ({
                    ...ci,
                    isCompleted: ci.completed,
                }));
            }
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// Virtuals for backward compatibility
noteSchema.virtual('content').get(function () {
    return this.body;
});
noteSchema.virtual('isDeleted').get(function () {
    return this.isTrash;
});
// Compound indexes scoped with userId for high-performance multi-tenant isolation
noteSchema.index({ userId: 1, isTrash: 1, isFavorite: 1 });
noteSchema.index({ userId: 1, folderId: 1 });
noteSchema.index({ userId: 1, isTrash: 1 });
noteSchema.index({ userId: 1, title: 'text', body: 'text' });
// Automatic TTL index on deletedAt: 30-day auto-purge for trashed items (30 days = 2592000s)
noteSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { isTrash: true } });
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export default Note;
