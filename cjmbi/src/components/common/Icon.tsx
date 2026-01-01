import {
  Database,
  LayoutGrid,
  Settings,
  Link,
  Palette,
  Play,
  Eye,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  X,
  Check,
  Search,
  Upload,
  Download,
  Save,
  FolderOpen,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  BarChart3,
  LineChart,
  ScatterChart,
  Table,
  Type,
  Hash,
  Sliders,
  ListFilter,
  Layers,
  Zap,
  RefreshCw,
  AlertCircle,
  Info,
  HelpCircle,
  Loader2,
  GripVertical,
  Move,
  Lock,
  Unlock,
  EyeOff,
  FileJson,
  FileCode,
  Image,
  PieChart,
  Activity,
  TrendingUp,
  Grid3X3,
} from 'lucide-react';

export const Icons = {
  // Navigation & Layout
  database: Database,
  layoutGrid: LayoutGrid,
  settings: Settings,
  link: Link,
  palette: Palette,
  layers: Layers,
  grid: Grid3X3,
  
  // Actions
  play: Play,
  eye: Eye,
  eyeOff: EyeOff,
  maximize: Maximize2,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  search: Search,
  upload: Upload,
  download: Download,
  save: Save,
  open: FolderOpen,
  delete: Trash2,
  copy: Copy,
  edit: Edit,
  more: MoreVertical,
  refresh: RefreshCw,
  
  // Chevrons
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  
  // Charts
  barChart: BarChart3,
  lineChart: LineChart,
  scatterChart: ScatterChart,
  pieChart: PieChart,
  activity: Activity,
  trending: TrendingUp,
  
  // Data
  table: Table,
  type: Type,
  hash: Hash,
  
  // Controls
  sliders: Sliders,
  filter: ListFilter,
  
  // Status
  zap: Zap,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,
  loading: Loader2,
  
  // Drag & Drop
  grip: GripVertical,
  move: Move,
  lock: Lock,
  unlock: Unlock,
  
  // Files
  fileJson: FileJson,
  fileCode: FileCode,
  image: Image,
};

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className = '' }: IconProps) {
  const IconComponent = Icons[name];
  return <IconComponent size={size} className={className} />;
}
