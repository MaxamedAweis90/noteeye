import * as React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bold,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Cloud,
  CloudOff,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Italic,
  KeyRound,
  Keyboard,
  Laptop,
  LayoutGrid,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Minimize2,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  MousePointer2,
  Palette,
  Pause,
  PenTool,
  Pencil,
  Phone,
  Play,
  Plus,
  Quote,
  Redo,
  RefreshCw,
  Repeat,
  RotateCcw,
  Scissors,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sliders,
  SlidersHorizontal,
  SlidersVertical,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Strikethrough,
  Table,
  Tablet,
  Tag,
  Trash,
  Trash2,
  TriangleAlert,
  Type,
  Underline,
  Undo,
  User,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type IconProps = LucideProps;
export type { LucideIcon };

/**
 * Custom Noteeye Brand Mark Icon (SVG)
 * Conforms strictly to standard IconProps
 */
export const LogoIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 46"
      fill="none"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        fill="#863bff"
        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      />
    </svg>
  )
);
LogoIcon.displayName = 'LogoIcon';

/**
 * Custom IdeaSpark Icon (SVG)
 */
export const IdeaSparkIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
);
IdeaSparkIcon.displayName = 'IdeaSparkIcon';

/**
 * Custom Handwriting Curve Icon (SVG)
 */
export const HandwritingIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2.5, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 220 60"
      fill="none"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        d="M4 38 C 20 6, 34 58, 50 30 S 78 10, 92 34 S 120 56, 136 28 S 170 8, 184 32 S 206 44, 216 24"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
);
HandwritingIcon.displayName = 'HandwritingIcon';

/**
 * Social Platform SVGs
 */
export const GitHubIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 19 19"
      fill="currentColor"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844"
      />
    </svg>
  )
);
GitHubIcon.displayName = 'GitHubIcon';

export const XSocialIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 19 19"
      fill="currentColor"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.893 1.98c.052.072 1.245 1.769 2.653 3.77l2.892 4.114c.183.261.333.48.333.486s-.068.089-.152.183l-.522.593-.765.867-3.597 4.087c-.375.426-.734.834-.798.905a1 1 0 0 0-.118.148c0 .01.236.017.664.017h.663l.729-.83c.4-.457.796-.906.879-.999a692 692 0 0 0 1.794-2.038c.034-.037.301-.34.594-.675l.551-.624.345-.392a7 7 0 0 1 .34-.374c.006 0 .93 1.306 2.052 2.903l2.084 2.965.045.063h2.275c1.87 0 2.273-.003 2.266-.021-.008-.02-1.098-1.572-3.894-5.547-2.013-2.862-2.28-3.246-2.273-3.266.008-.019.282-.332 2.085-2.38l2-2.274 1.567-1.782c.022-.028-.016-.03-.65-.03h-.674l-.3.342a871 871 0 0 1-1.782 2.025c-.067.075-.405.458-.75.852a100 100 0 0 1-.803.91c-.148.172-.299.344-.99 1.127-.304.343-.32.358-.345.327-.015-.019-.904-1.282-1.976-2.808L6.365 1.85H1.8zm1.782.91 8.078 11.294c.772 1.08 1.413 1.973 1.425 1.984.016.017.241.02 1.05.017l1.03-.004-2.694-3.766L7.796 5.75 5.722 2.852l-1.039-.004-1.039-.004z"
      />
    </svg>
  )
);
XSocialIcon.displayName = 'XSocialIcon';

export const DiscordIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 20 19"
      fill="currentColor"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82" />
    </svg>
  )
);
DiscordIcon.displayName = 'DiscordIcon';

export const BlueskyIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 16 17"
      fill="currentColor"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path d="M7.75 7.735c-.693-1.348-2.58-3.86-4.334-5.097-1.68-1.187-2.32-.981-2.74-.79C.188 2.065.1 2.812.1 3.251s.241 3.602.398 4.13c.52 1.744 2.367 2.333 4.07 2.145-2.495.37-4.71 1.278-1.805 4.512 3.196 3.309 4.38-.71 4.987-2.746.608 2.036 1.307 5.91 4.93 2.746 2.72-2.746.747-4.143-1.747-4.512 1.702.189 3.55-.4 4.07-2.145.156-.528.397-3.691.397-4.13s-.088-1.186-.575-1.406c-.42-.19-1.06-.395-2.741.79-1.755 1.24-3.64 3.752-4.334 5.099" />
    </svg>
  )
);
BlueskyIcon.displayName = 'BlueskyIcon';

/**
 * Common Icon Name Aliases for seamless drop-in refactoring
 */
export {
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  AlignCenter as AlignCenterIcon,
  AlignLeft as AlignLeftIcon,
  AlignRight as AlignRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUpDown as ArrowUpDownIcon,
  Bell as BellIcon,
  Bold as BoldIcon,
  Calendar as CalendarIcon,
  Camera as CameraIcon,
  Check as CheckIcon,
  CheckCircle2 as CheckCircle2Icon,
  CheckSquare as CheckSquareIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  Clipboard as ClipboardIcon,
  Clock as ClockIcon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Copy as CopyIcon,
  CornerDownLeft as CornerDownLeftIcon,
  CornerDownRight as CornerDownRightIcon,
  Database as DatabaseIcon,
  Download as DownloadIcon,
  Edit3 as Edit3Icon,
  ExternalLink as ExternalLinkIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  FileCheck as FileCheckIcon,
  FileText as FileTextIcon,
  Filter as FilterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  FolderPlus as FolderPlusIcon,
  Hash as HashIcon,
  Heading1 as Heading1Icon,
  Heading2 as Heading2Icon,
  Heading3 as Heading3Icon,
  Heart as HeartIcon,
  HelpCircle as HelpCircleIcon,
  Home as HomeIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Italic as ItalicIcon,
  KeyRound as KeyRoundIcon,
  Keyboard as KeyboardIcon,
  Laptop as LaptopIcon,
  LayoutGrid as LayoutGridIcon,
  Lightbulb as LightbulbIcon,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Loader2 as Loader2Icon,
  Lock as LockIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  Maximize2 as Maximize2Icon,
  Menu as MenuIcon,
  MessageCircle as MessageCircleIcon,
  MessageSquarePlus as MessageSquarePlusIcon,
  Minimize2 as Minimize2Icon,
  Minus as MinusIcon,
  Moon as MoonIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  MousePointer2 as MousePointer2Icon,
  Palette as PaletteIcon,
  Pause as PauseIcon,
  PenTool as PenToolIcon,
  Pencil as PencilIcon,
  Phone as PhoneIcon,
  Play as PlayIcon,
  Plus as PlusIcon,
  Quote as QuoteIcon,
  Redo as RedoIcon,
  RefreshCw as RefreshCwIcon,
  Repeat as RepeatIcon,
  RotateCcw as RotateCcwIcon,
  Scissors as ScissorsIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  ShieldAlert as ShieldAlertIcon,
  Sliders as SlidersIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  SlidersVertical as SlidersVerticalIcon,
  Smartphone as SmartphoneIcon,
  Sparkles as SparklesIcon,
  Square as SquareIcon,
  Star as StarIcon,
  Strikethrough as StrikethroughIcon,
  Table as TableIcon,
  Tablet as TabletIcon,
  Tag as TagIcon,
  Trash as TrashIcon,
  Trash2 as Trash2Icon,
  TriangleAlert as TriangleAlertIcon,
  Type as TypeIcon,
  Underline as UnderlineIcon,
  Undo as UndoIcon,
  User as UserIcon,
  Users as UsersIcon,
  Volume2 as Volume2Icon,
  X as XIcon,
  Zap as ZapIcon,
};

/**
 * Direct named exports of all Lucide Icons for transparent backward compatibility
 */
export {
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bold,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Cloud,
  CloudOff,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Italic,
  KeyRound,
  Keyboard,
  Laptop,
  LayoutGrid,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Minimize2,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  MousePointer2,
  Palette,
  Pause,
  PenTool,
  Pencil,
  Phone,
  Play,
  Plus,
  Quote,
  Redo,
  RefreshCw,
  Repeat,
  RotateCcw,
  Scissors,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sliders,
  SlidersHorizontal,
  SlidersVertical,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Strikethrough,
  Table,
  Tablet,
  Tag,
  Trash,
  Trash2,
  TriangleAlert,
  Type,
  Underline,
  Undo,
  User,
  Users,
  Volume2,
  X,
  Zap,
};

/**
 * Centralized `Icons` Dictionary containing all project icons & brand SVGs
 */
export const Icons = {
  // Brand & Custom SVGs
  Logo: LogoIcon,
  IdeaSpark: IdeaSparkIcon,
  Handwriting: HandwritingIcon,
  GitHub: GitHubIcon,
  XSocial: XSocialIcon,
  Discord: DiscordIcon,
  Bluesky: BlueskyIcon,

  // Lucide Icons
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bold,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Cloud,
  CloudOff,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Italic,
  KeyRound,
  Keyboard,
  Laptop,
  LayoutGrid,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Minimize2,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  MousePointer2,
  Palette,
  Pause,
  PenTool,
  Pencil,
  Phone,
  Play,
  Plus,
  Quote,
  Redo,
  RefreshCw,
  Repeat,
  RotateCcw,
  Scissors,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sliders,
  SlidersHorizontal,
  SlidersVertical,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Strikethrough,
  Table,
  Tablet,
  Tag,
  Trash,
  Trash2,
  TriangleAlert,
  Type,
  Underline,
  Undo,
  User,
  Users,
  Volume2,
  X,
  Zap,
} as const;

export default Icons;
