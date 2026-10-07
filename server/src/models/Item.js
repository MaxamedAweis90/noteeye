import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Checklist item text is required'],
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['note', 'checklist'],
        message: '{VALUE} is not a valid item type (expected "note" or "checklist")',
      },
      required: [true, 'Item type is required'],
    },
    title: {
      type: String,
      trim: true,
      default: 'Untitled',
    },
    content: {
      type: String,
      default: '',
    },
    checklistItems: {
      type: [checklistItemSchema],
      default: [],
    },
    color: {
      type: String,
      default: '#FDE3C9',
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user items within folders and trash filtering
itemSchema.index({ userId: 1, folderId: 1, isDeleted: 1 });

// Text index for searching notes and checklists by title
itemSchema.index({ title: 'text' });

const Item = mongoose.model('Item', itemSchema);

export default Item;
