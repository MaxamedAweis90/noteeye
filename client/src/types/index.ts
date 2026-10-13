export type ItemType = 'note' | 'checklist';

export type PastelColor = 'peach' | 'mint' | 'sky' | 'lavender' | 'rose' | 'yellow';
export type PastelThemeKey = PastelColor;

export interface PastelColorOption {
  key: PastelColor;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
}

export const PASTEL_PALETTE: PastelColorOption[] = [
  { key: 'peach', name: 'Warm Peach', hex: '#FDE3C9', bgClass: 'bg-[#FDE3C9]', borderClass: 'border-[#F8CBA6]' },
  { key: 'mint', name: 'Mint Sage', hex: '#C7F3DE', bgClass: 'bg-[#C7F3DE]', borderClass: 'border-[#A3E5C5]' },
  { key: 'sky', name: 'Soft Sky', hex: '#CEEBFD', bgClass: 'bg-[#CEEBFD]', borderClass: 'border-[#ADD9FA]' },
  { key: 'lavender', name: 'Soft Lavender', hex: '#E5DEFA', bgClass: 'bg-[#E5DEFA]', borderClass: 'border-[#CEC2F5]' },
  { key: 'rose', name: 'Rose Petal', hex: '#FCDDEC', bgClass: 'bg-[#FCDDEC]', borderClass: 'border-[#F7BEDE]' },
  { key: 'yellow', name: 'Buttercup Yellow', hex: '#FEF3C7', bgClass: 'bg-[#FEF3C7]', borderClass: 'border-[#FDE68A]' },
];

export const DEFAULT_PASTEL_COLOR = PASTEL_PALETTE[0].hex;

export const colorKeyToHex = (color: PastelColor | string): string => {
  const match = PASTEL_PALETTE.find((p) => p.key === color);
  return match ? match.hex : color;
};

const COLOR_HEX_ALIASES: Record<string, PastelColor> = {
  '#f7d8fa': 'lavender',
  '#d1f4d9': 'mint',
  '#fff3c4': 'yellow',
  '#fcd5ce': 'rose',
};

export const hexToColorKey = (hex: string): PastelColor => {
  if (!hex) return 'peach';
  const clean = hex.trim().toLowerCase();
  const match = PASTEL_PALETTE.find((p) => p.hex.toLowerCase() === clean);
  if (match) return match.key;
  if (COLOR_HEX_ALIASES[clean]) return COLOR_HEX_ALIASES[clean];
  return 'peach';
};

/**
 * Generates a valid 24-character hexadecimal MongoDB ObjectId
 * Prevents ID drift, URL route desync, and 400 Bad Request errors across client and server
 */
export const generateMongoId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
  return (timestamp + randomBytes).slice(0, 24);
};

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  isCompleted?: boolean; // Backward compatibility alias
}

export interface Note {
  id: string;
  userId?: string;
  title: string;
  body: string;
  content?: string; // Backward compatibility alias
  type: 'note' | 'checklist';
  checklistItems?: ChecklistItem[];
  color: PastelColor | string;
  folderId: string | null;
  isFavorite: boolean;
  isTrash: boolean;
  isDeleted?: boolean; // Backward compatibility alias
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId?: string;
  name: string;
  parentId: string | null; // null = root level
  isFavorite: boolean;
  isTrash: boolean;
  isDeleted?: boolean; // Backward compatibility alias
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClipboardItem = {
  type: 'note' | 'folder';
  id: string;
  action: 'copy' | 'cut';
  name?: string;
  items?: Array<{ type: 'note' | 'folder'; id: string; action: 'copy' | 'cut'; name?: string }>;
} | null;

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// Backward compatibility alias
export type Item = Note;

// Production clean initial states (strictly populated by authenticated user data)
export const STARTER_FOLDERS: Folder[] = [];
export const STARTER_NOTES: Note[] = [];
export const STARTER_ITEMS: Note[] = [];

export interface UserSettings {
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  settings: UserSettings;
  isScheduledForDeletion?: boolean;
  deletionScheduledAt?: string | null;
  recoveryPeriodDays?: number;
  remainingRecoveryDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSession {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | string;
  browserName: string;
  osName: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
  isMainDevice?: boolean;
}


