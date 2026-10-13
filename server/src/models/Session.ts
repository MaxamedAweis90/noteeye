import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserName: string;
  osName: string;
  lastActiveAt: Date;
  isMainDevice: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for active session'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash identifier is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop',
    },
    browserName: {
      type: String,
      default: 'Unknown Browser',
      trim: true,
    },
    osName: {
      type: String,
      default: 'Unknown OS',
      trim: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isMainDevice: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        // Exclude internal tokenHash from default client serialization for security
        delete ret.tokenHash;
        return ret;
      },
    },
  }
);

// Compound index for querying user sessions sorted by most recent activity
sessionSchema.index({ userId: 1, lastActiveAt: -1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
