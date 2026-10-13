import mongoose, { Schema } from 'mongoose';
const FeedbackSchema = new Schema({
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
}, { timestamps: true });
export const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback;
