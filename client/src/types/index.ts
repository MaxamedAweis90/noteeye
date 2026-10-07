export type ItemType = 'note' | 'checklist';

export type PastelThemeKey = 'peach' | 'mint' | 'lavender' | 'sky' | 'rose' | 'yellow';

export interface PastelColorOption {
  key: PastelThemeKey;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
}

export const PASTEL_PALETTE: PastelColorOption[] = [
  { key: 'peach', name: 'Warm Peach', hex: '#FDE3C9', bgClass: 'bg-[#FDE3C9]', borderClass: 'border-[#F8CBA6]' },
  { key: 'mint', name: 'Mint Sage', hex: '#C7F3DE', bgClass: 'bg-[#C7F3DE]', borderClass: 'border-[#A3E5C5]' },
  { key: 'lavender', name: 'Soft Lavender', hex: '#E5DEFA', bgClass: 'bg-[#E5DEFA]', borderClass: 'border-[#CEC2F5]' },
  { key: 'sky', name: 'Soft Sky', hex: '#CEEBFD', bgClass: 'bg-[#CEEBFD]', borderClass: 'border-[#ADD9FA]' },
  { key: 'rose', name: 'Rose Petal', hex: '#FCDDEC', bgClass: 'bg-[#FCDDEC]', borderClass: 'border-[#F7BEDE]' },
  { key: 'yellow', name: 'Buttercup Yellow', hex: '#FEF3C7', bgClass: 'bg-[#FEF3C7]', borderClass: 'border-[#FDE68A]' },
];

export const DEFAULT_PASTEL_COLOR = PASTEL_PALETTE[0].hex;

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null; // null = root level
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  userId: string;
  folderId: string | null; // null = root level
  type: ItemType;
  title: string;
  content?: string; // used if type === 'note'
  checklistItems?: ChecklistItem[]; // used if type === 'checklist'
  color: string; // pastel hex
  isDeleted: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// Starter seed data for immediate demonstration
export const STARTER_FOLDERS: Folder[] = [
  {
    id: 'folder-personal',
    userId: 'user-demo',
    name: 'Personal & Habits',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
  },
  {
    id: 'folder-work',
    userId: 'user-demo',
    name: 'Work & Projects',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-04-12T11:30:00Z',
    updatedAt: '2026-04-12T11:30:00Z',
  },
  {
    id: 'folder-reading',
    userId: 'user-demo',
    name: 'Reading & Ideas',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-04-15T14:15:00Z',
    updatedAt: '2026-04-15T14:15:00Z',
  },
];

export const STARTER_ITEMS: Item[] = [
  {
    id: 'item-1',
    userId: 'user-demo',
    folderId: 'folder-personal',
    type: 'checklist',
    title: 'Daily Morning Routine',
    color: '#FDE3C9', // Warm Peach
    isDeleted: false,
    createdAt: '2026-04-25T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
    checklistItems: [
      { id: 'cl-1', text: 'Drink 500ml lemon water', isCompleted: true },
      { id: 'cl-2', text: '15 mins mindfulness & stretching', isCompleted: true },
      { id: 'cl-3', text: 'Review daily top 3 priorities', isCompleted: false },
      { id: 'cl-4', text: '30 mins brisk walking outside', isCompleted: false },
    ],
  },
  {
    id: 'item-2',
    userId: 'user-demo',
    folderId: 'folder-work',
    type: 'note',
    title: 'Q2 Product Launch Strategy',
    color: '#C7F3DE', // Mint Sage
    isDeleted: false,
    createdAt: '2026-04-24T14:30:00Z',
    updatedAt: '2026-04-24T16:45:00Z',
    content:
      'Key focus areas for Q2:\n1. Complete Google Drive-style file hierarchy and pastel card interactions.\n2. Streamline customer feedback loop with automated surveys.\n3. Validate zero-latency note saving with optimistic UI updates.',
  },
  {
    id: 'item-3',
    userId: 'user-demo',
    folderId: 'folder-reading',
    type: 'note',
    title: 'Atomic Habits Book Quotes',
    color: '#E5DEFA', // Soft Lavender
    isDeleted: false,
    createdAt: '2026-04-22T19:20:00Z',
    updatedAt: '2026-04-22T19:20:00Z',
    content:
      '"You do not rise to the level of your goals. You fall to the level of your systems."\n\nFocus on 1% marginal improvements every day. Habits are the compound interest of self-improvement.',
  },
  {
    id: 'item-4',
    userId: 'user-demo',
    folderId: null, // Root level item
    type: 'checklist',
    title: 'Weekend Grocery Haul',
    color: '#CEEBFD', // Soft Sky
    isDeleted: false,
    createdAt: '2026-04-20T10:15:00Z',
    updatedAt: '2026-04-20T11:00:00Z',
    checklistItems: [
      { id: 'cl-5', text: 'Avocados & fresh sourdough bread', isCompleted: true },
      { id: 'cl-6', text: 'Greek yogurt & organic honey', isCompleted: true },
      { id: 'cl-7', text: 'Oat milk & Ethiopian light roast coffee', isCompleted: false },
      { id: 'cl-8', text: 'Dark chocolate 85%', isCompleted: false },
    ],
  },
  {
    id: 'item-5',
    userId: 'user-demo',
    folderId: null, // Root level item
    type: 'note',
    title: 'NoteEye Design Tokens',
    color: '#FCDDEC', // Rose Petal
    isDeleted: false,
    createdAt: '2026-04-18T16:00:00Z',
    updatedAt: '2026-04-18T16:00:00Z',
    content:
      'Design specs:\n- Shell: Slate-50 background, crisp white surfaces, indigo primary.\n- Note Cards: Rounded-3xl corners, 20-24px bold charcoal headings, circular floating action triggers.\n- Folders: Google Drive chip layout with item counters.',
  },
  {
    id: 'item-6',
    userId: 'user-demo',
    folderId: 'folder-work',
    type: 'checklist',
    title: 'Frontend Polish Checklist',
    color: '#FEF3C7', // Buttercup Yellow
    isDeleted: false,
    createdAt: '2026-04-16T12:00:00Z',
    updatedAt: '2026-04-16T15:10:00Z',
    checklistItems: [
      { id: 'cl-9', text: 'Audit WCAG AA color contrast on pastels', isCompleted: true },
      { id: 'cl-10', text: 'Ensure smooth breadcrumb folder navigation', isCompleted: true },
      { id: 'cl-11', text: 'Validate trash soft-delete and restore flows', isCompleted: false },
      { id: 'cl-12', text: 'Test mobile slide-over drawer responsiveness', isCompleted: false },
    ],
  },
];
