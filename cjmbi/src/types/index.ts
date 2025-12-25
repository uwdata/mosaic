// Widget Types
export type WidgetType = 
  | 'scatter'
  | 'bar'
  | 'line'
  | 'area'
  | 'heatmap'
  | 'histogram'
  | 'table'
  | 'metric'
  | 'slider'
  | 'dropdown'
  | 'text';

export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DataConfiguration {
  source: string;
  table?: string;
  query?: string;
  columns?: string[];
}

export interface VisualEncoding {
  x?: FieldEncoding;
  y?: FieldEncoding;
  color?: FieldEncoding;
  size?: FieldEncoding;
  opacity?: FieldEncoding;
  label?: FieldEncoding;
}

export interface FieldEncoding {
  field: string;
  type?: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
  aggregate?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median';
  bin?: boolean | { maxbins?: number };
  scale?: ScaleConfig;
  title?: string;
}

export interface ScaleConfig {
  domain?: [number, number] | string[];
  range?: [number, number] | string[];
  type?: 'linear' | 'log' | 'sqrt' | 'band' | 'point' | 'time';
}

export interface InteractionBindings {
  selection?: string;
  param?: string;
  filterBy?: string;
  highlight?: string;
}

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title?: string;
  position: GridPosition;
  data: DataConfiguration;
  visual: VisualEncoding;
  bindings: InteractionBindings;
  style?: WidgetStyle;
}

export interface WidgetStyle {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  showTitle?: boolean;
  showBorder?: boolean;
}

// Data Source Types
export type DataSourceType = 'wasm' | 'socket' | 'rest' | 'file';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
}

export interface DataSourceConfig {
  url?: string;
  port?: number;
  database?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
}

// Linking Types
export type LinkType = 'selection' | 'param' | 'filter' | 'highlight';

export interface Link {
  id: string;
  type: LinkType;
  source: string;
  target: string;
  config?: LinkConfig;
}

export interface LinkConfig {
  propagation?: 'immediate' | 'debounced' | 'manual';
  debounceMs?: number;
  condition?: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  dataSources: DataSource[];
  widgets: WidgetSpec[];
  links: Link[];
  params: ParamDefinition[];
  selections: SelectionDefinition[];
  settings: ProjectSettings;
}

export interface ParamDefinition {
  name: string;
  value: unknown;
  type: 'number' | 'string' | 'boolean' | 'array';
}

export interface SelectionDefinition {
  name: string;
  type: 'single' | 'union' | 'intersect' | 'crossfilter';
}

export interface ProjectSettings {
  gridColumns: number;
  gridRowHeight: number;
  snapToGrid: boolean;
  showGrid: boolean;
  theme: 'light' | 'dark';
}

// UI State Types
export type EditorMode = 'design' | 'preview' | 'present';

export interface UIState {
  mode: EditorMode;
  selectedWidgetId: string | null;
  hoveredWidgetId: string | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  leftPanelTab: 'data' | 'widgets';
  rightPanelTab: 'properties' | 'links' | 'style';
  bottomPanelTab: 'queries' | 'data' | 'performance';
  zoom: number;
}

// Performance Types
export interface PerformanceMetrics {
  queryCount: number;
  totalQueryTime: number;
  cacheHits: number;
  cacheMisses: number;
  rowsProcessed: number;
  lastQueryTime?: number;
}
