import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  isFavorite: boolean;
  isTrash: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Folder must belong to an authenticated user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [120, 'Folder name cannot exceed 120 characters'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.parentId = ret.parentId ? ret.parentId.toString() : null;
        if (ret.userId) ret.userId = ret.userId.toString();
        ret.isDeleted = ret.isTrash; // Backward-compatibility alias
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Backward compatibility virtual for isDeleted
folderSchema.virtual('isDeleted').get(function (this: IFolder) {
  return this.isTrash;
});

// Compound indexes scoped with userId for high-performance multi-tenant isolation
folderSchema.index({ userId: 1, isTrash: 1 });
folderSchema.index({ userId: 1, parentId: 1 });

// Automatic TTL index on deletedAt: 30-day auto-purge for trashed items (30 days = 2592000s)
folderSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 2592000, partialFilterExpression: { isTrash: true } }
);

export const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', folderSchema);

export default Folder;
