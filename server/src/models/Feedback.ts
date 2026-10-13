import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  templateType: 'bug' | 'feature' | 'sync' | 'general' | 'custom';
  subject: string;
  message: string;
  systemMeta?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    screenResolution?: string;
    appVersion?: string;
  };
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    userEmail: { type: String, trim: true, lowercase: true, required: false },
    templateType: {
      type: String,
      enum: ['bug', 'feature', 'sync', 'general', 'custom'],
      default: 'general',
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    systemMeta: {
      browser: { type: String },
      os: { type: String },
      deviceType: { type: String },
      screenResolution: { type: String },
      appVersion: { type: String },
    },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'resolved'],
      default: 'new',
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default Feedback;
