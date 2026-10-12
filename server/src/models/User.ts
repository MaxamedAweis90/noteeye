import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserSettings {
  shortcutsEnabled: boolean;
  modifierKey: string;
  customShortcuts: Record<string, string>;
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  soundEffectsEnabled: boolean;
  defaultNoteColor?: string;
  defaultNoteType?: 'note' | 'checklist';
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  passwordHash: string;
  avatarUrl?: string;
  avatar?: string;
  avatarBlobUrl?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  settings: IUserSettings;
  isScheduledForDeletion: boolean;
  deletionScheduledAt?: Date | null;
  recoveryPeriodDays: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      default: 'ugaas',
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    avatarBlobUrl: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: '',
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    settings: {
      shortcutsEnabled: {
        type: Boolean,
        default: true,
      },
      modifierKey: {
        type: String,
        default: 'ctrl',
      },
      customShortcuts: {
        type: Map,
        of: String,
        default: {
          quickSearch: 'ctrl+k',
          newNote: 'ctrl+n',
          newFolder: 'ctrl+shift+f',
          toggleInspector: 'ctrl+i',
          undo: 'ctrl+z',
          redo: 'ctrl+shift+z',
          delete: 'delete',
        },
      },
      notificationsEnabled: {
        type: Boolean,
        default: false,
      },
      dailyReminderEnabled: {
        type: Boolean,
        default: false,
      },
      dailyReminderTime: {
        type: String,
        default: '09:00',
      },
      soundEffectsEnabled: {
        type: Boolean,
        default: true,
      },
      defaultNoteColor: {
        type: String,
        default: 'peach',
      },
      defaultNoteType: {
        type: String,
        enum: ['note', 'checklist'],
        default: 'note',
      },
    },
    isScheduledForDeletion: {
      type: Boolean,
      default: false,
    },
    deletionScheduledAt: {
      type: Date,
      default: null,
    },
    recoveryPeriodDays: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.avatar = ret.avatarUrl || '';
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.password;
        delete ret.verificationCode;
        return ret;
      },
    },
  }
);

// Virtual for avatar compatibility
userSchema.virtual('avatar').get(function () {
  return this.avatarUrl || '';
}).set(function (val: string) {
  this.avatarUrl = val;
});

// Virtual for setting plain password
userSchema.virtual('password').set(function (password: string) {
  (this as any)._plainPassword = password;
});

// Pre-save hook: Hash password if plain password was set or modified
userSchema.pre('save', async function (next) {
  const plainPassword = (this as any)._plainPassword;
  if (plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(plainPassword, salt);
    (this as any)._plainPassword = undefined;
  }
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
