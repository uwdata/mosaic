import { Icon, type IconName } from '@/components/common/Icon';
import { useAppStore } from '@/core/state/store';
import type { WidgetType, WidgetSpec } from '@/types';

interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: IconName;
  category: 'charts' | 'tables' | 'controls' | 'info';
  description: string;
  defaultSize: { width: number; height: number };
}

const widgetDefinitions: WidgetDefinition[] = [
  // Charts
  {
    type: 'scatter',
    label: 'Scatter Plot',
    icon: 'scatterChart',
    category: 'charts',
    description: 'Show relationships between two variables',
    defaultSize: { width: 6, height: 6 },
  },
  {
    type: 'bar',
    label: 'Bar Chart',
    icon: 'barChart',
    category: 'charts',
    description: 'Compare values across categories',
    defaultSize: { width: 6, height: 5 },
  },
  {
    type: 'line',
    label: 'Line Chart',
    icon: 'lineChart',
    category: 'charts',
    description: 'Show trends over time',
    defaultSize: { width: 8, height: 5 },
  },
  {
    type: 'area',
    label: 'Area Chart',
    icon: 'trending',
    category: 'charts',
    description: 'Show cumulative values over time',
    defaultSize: { width: 8, height: 5 },
  },
  {
    type: 'histogram',
    label: 'Histogram',
    icon: 'barChart',
    category: 'charts',
    description: 'Show distribution of values',
    defaultSize: { width: 6, height: 5 },
  },
  {
    type: 'heatmap',
    label: 'Heatmap',
    icon: 'grid',
    category: 'charts',
    description: 'Show density or correlation',
    defaultSize: { width: 6, height: 6 },
  },
  // Tables
  {
    type: 'table',
    label: 'Data Table',
    icon: 'table',
    category: 'tables',
    description: 'Display data in rows and columns',
    defaultSize: { width: 8, height: 6 },
  },
  // Controls
  {
    type: 'slider',
    label: 'Range Slider',
    icon: 'sliders',
    category: 'controls',
    description: 'Filter by numeric range',
    defaultSize: { width: 6, height: 2 },
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: 'filter',
    category: 'controls',
    description: 'Select from options',
    defaultSize: { width: 4, height: 2 },
  },
  // Info
  {
    type: 'metric',
    label: 'Metric Card',
    icon: 'hash',
    category: 'info',
    description: 'Display a single value',
    defaultSize: { width: 3, height: 2 },
  },
  {
    type: 'text',
    label: 'Text Block',
    icon: 'type',
    category: 'info',
    description: 'Add text or markdown',
    defaultSize: { width: 4, height: 2 },
  },
];

const categories = [
  { id: 'charts', label: 'Charts', icon: 'barChart' as IconName },
  { id: 'tables', label: 'Tables', icon: 'table' as IconName },
  { id: 'controls', label: 'Controls', icon: 'sliders' as IconName },
  { id: 'info', label: 'Info', icon: 'info' as IconName },
];

export function WidgetPalette() {
  const { addWidget } = useAppStore();
  const widgets = useAppStore((state) => state.project.widgets);

  const handleAddWidget = (def: WidgetDefinition) => {
    // Calculate position to avoid overlap
    const existingPositions = widgets.map((w) => ({ x: w.position.x, y: w.position.y }));
    let x = 0;
    let y = 0;
    
    // Find first available position
    while (existingPositions.some((p) => p.x === x && p.y === y)) {
      x += 1;
      if (x >= 24 - def.defaultSize.width) {
        x = 0;
        y += 1;
      }
    }

    const widget: WidgetSpec = {
      id: crypto.randomUUID(),
      type: def.type,
      title: def.label,
      position: {
        x,
        y,
        width: def.defaultSize.width,
        height: def.defaultSize.height,
      },
      data: {
        source: '',
        table: '',
      },
      visual: {},
      bindings: {},
    };

    addWidget(widget);
  };

  return (
    <div className="p-3">
      <div className="mb-3">
        <div className="relative">
          <Icon
            name="search"
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400"
          />
          <input
            type="text"
            placeholder="Search widgets..."
            className="input pl-8"
          />
        </div>
      </div>

      {categories.map((category) => {
        const categoryWidgets = widgetDefinitions.filter(
          (w) => w.category === category.id
        );

        return (
          <div key={category.id} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={category.icon} size={14} className="text-surface-500" />
              <span className="text-xs font-medium text-surface-600 uppercase tracking-wide">
                {category.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryWidgets.map((def) => (
                <WidgetCard
                  key={def.type}
                  definition={def}
                  onAdd={() => handleAddWidget(def)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WidgetCard({
  definition,
  onAdd,
}: {
  definition: WidgetDefinition;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="widget-card p-3 text-left group"
      title={definition.description}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 bg-mosaic-50 rounded text-mosaic-600 group-hover:bg-mosaic-100 transition-colors">
          <Icon name={definition.icon} size={14} />
        </div>
      </div>
      <div className="text-xs font-medium text-surface-700">{definition.label}</div>
      <div className="text-[10px] text-surface-400 line-clamp-1">
        {definition.description}
      </div>
    </button>
  );
}
