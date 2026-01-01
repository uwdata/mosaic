import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { mosaicConnector } from '@/core/mosaic/connector';
import type { WidgetSpec } from '@/types';

interface WidgetRendererProps {
  widget: WidgetSpec;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case 'scatter':
      return <ScatterPlotWidget widget={widget} />;
    case 'bar':
      return <BarChartWidget widget={widget} />;
    case 'line':
      return <LineChartWidget widget={widget} />;
    case 'table':
      return <TableWidget widget={widget} />;
    case 'metric':
      return <MetricWidget widget={widget} />;
    case 'text':
      return <TextWidget widget={widget} />;
    case 'histogram':
      return <HistogramWidget widget={widget} />;
    case 'slider':
      return <SliderWidget widget={widget} />;
    case 'dropdown':
      return <DropdownWidget widget={widget} />;
    default:
      return <PlaceholderWidget widget={widget} />;
  }
}

function PlaceholderWidget({ widget }: { widget: WidgetSpec }) {
  return (
    <div className="h-full flex items-center justify-center bg-surface-50 rounded">
      <div className="text-center">
        <Icon name="layoutGrid" size={24} className="mx-auto mb-2 text-surface-400" />
        <p className="text-xs text-surface-500">{widget.type}</p>
        {!widget.data.table && (
          <p className="text-xs text-surface-400 mt-1">No data configured</p>
        )}
      </div>
    </div>
  );
}

function ScatterPlotWidget({ widget }: { widget: WidgetSpec }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (widget.data.table && widget.visual.x?.field && widget.visual.y?.field) {
      loadData();
    }
  }, [widget.data.table, widget.visual.x?.field, widget.visual.y?.field]);

  const loadData = async () => {
    if (!mosaicConnector.isInitialized()) return;
    setLoading(true);
    try {
      const result = await mosaicConnector.query(
        `SELECT "${widget.visual.x?.field}", "${widget.visual.y?.field}" 
         FROM "${widget.data.table}" 
         LIMIT 1000`
      );
      setData(result as Record<string, unknown>[]);
    } catch (err) {
      console.error('Failed to load scatter data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!widget.data.table || !widget.visual.x?.field || !widget.visual.y?.field) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-50 rounded">
        <div className="text-center p-4">
          <Icon name="scatterChart" size={24} className="mx-auto mb-2 text-surface-400" />
          <p className="text-xs text-surface-500">Configure X and Y fields</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Icon name="loading" size={24} className="animate-spin text-mosaic-500" />
      </div>
    );
  }

  // Simple SVG scatter plot
  const xField = widget.visual.x.field;
  const yField = widget.visual.y.field;
  const xValues = data.map((d) => Number(d[xField]) || 0);
  const yValues = data.map((d) => Number(d[yField]) || 0);
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const padding = 30;

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
        {/* Axes */}
        <line x1={padding} y1={200 - padding} x2={300 - padding} y2={200 - padding} stroke="#e4e4e7" />
        <line x1={padding} y1={padding} x2={padding} y2={200 - padding} stroke="#e4e4e7" />
        
        {/* Points */}
        {data.slice(0, 500).map((d, i) => {
          const x = padding + ((Number(d[xField]) - xMin) / (xMax - xMin || 1)) * (300 - 2 * padding);
          const y = 200 - padding - ((Number(d[yField]) - yMin) / (yMax - yMin || 1)) * (200 - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="#0ea5e9"
              opacity={0.6}
            />
          );
        })}
        
        {/* Labels */}
        <text x={150} y={195} textAnchor="middle" fontSize={10} fill="#71717a">{xField}</text>
        <text x={10} y={100} textAnchor="middle" fontSize={10} fill="#71717a" transform="rotate(-90, 10, 100)">{yField}</text>
      </svg>
    </div>
  );
}

function BarChartWidget({ widget }: { widget: WidgetSpec }) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (widget.data.table && widget.visual.x?.field) {
      loadData();
    }
  }, [widget.data.table, widget.visual.x?.field, widget.visual.y?.field]);

  const loadData = async () => {
    if (!mosaicConnector.isInitialized()) return;
    setLoading(true);
    try {
      const yField = widget.visual.y?.field;
      const xField = widget.visual.x?.field;
      
      let query: string;
      if (yField) {
        query = `SELECT "${xField}" as category, SUM("${yField}") as value 
                 FROM "${widget.data.table}" 
                 GROUP BY "${xField}" 
                 ORDER BY value DESC 
                 LIMIT 20`;
      } else {
        query = `SELECT "${xField}" as category, COUNT(*) as value 
                 FROM "${widget.data.table}" 
                 GROUP BY "${xField}" 
                 ORDER BY value DESC 
                 LIMIT 20`;
      }
      
      const result = await mosaicConnector.query(query);
      setData(result as Record<string, unknown>[]);
    } catch (err) {
      console.error('Failed to load bar data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!widget.data.table || !widget.visual.x?.field) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-50 rounded">
        <div className="text-center p-4">
          <Icon name="barChart" size={24} className="mx-auto mb-2 text-surface-400" />
          <p className="text-xs text-surface-500">Configure X field</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Icon name="loading" size={24} className="animate-spin text-mosaic-500" />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0));

  return (
    <div className="h-full w-full overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const barHeight = ((Number(d.value) || 0) / maxValue) * 150;
          const barWidth = Math.max(8, (280 / data.length) - 4);
          const x = 20 + i * (barWidth + 4);
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={180 - barHeight}
                width={barWidth}
                height={barHeight}
                fill="#0ea5e9"
                rx={2}
              />
              <text
                x={x + barWidth / 2}
                y={190}
                textAnchor="middle"
                fontSize={8}
                fill="#71717a"
                className="truncate"
              >
                {String(d.category).slice(0, 6)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChartWidget({ widget }: { widget: WidgetSpec }) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (widget.data.table && widget.visual.x?.field && widget.visual.y?.field) {
      loadData();
    }
  }, [widget.data.table, widget.visual.x?.field, widget.visual.y?.field]);

  const loadData = async () => {
    if (!mosaicConnector.isInitialized()) return;
    setLoading(true);
    try {
      const result = await mosaicConnector.query(
        `SELECT "${widget.visual.x?.field}" as x, "${widget.visual.y?.field}" as y 
         FROM "${widget.data.table}" 
         ORDER BY "${widget.visual.x?.field}"
         LIMIT 100`
      );
      setData(result as Record<string, unknown>[]);
    } catch (err) {
      console.error('Failed to load line data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!widget.data.table || !widget.visual.x?.field || !widget.visual.y?.field) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-50 rounded">
        <div className="text-center p-4">
          <Icon name="lineChart" size={24} className="mx-auto mb-2 text-surface-400" />
          <p className="text-xs text-surface-500">Configure X and Y fields</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Icon name="loading" size={24} className="animate-spin text-mosaic-500" />
      </div>
    );
  }

  const yValues = data.map((d) => Number(d.y) || 0);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const padding = 30;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (300 - 2 * padding);
    const y = 200 - padding - ((Number(d.y) - yMin) / (yMax - yMin || 1)) * (200 - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-full w-full">
      <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
        <line x1={padding} y1={200 - padding} x2={300 - padding} y2={200 - padding} stroke="#e4e4e7" />
        <line x1={padding} y1={padding} x2={padding} y2={200 - padding} stroke="#e4e4e7" />
        <polyline
          points={points}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

function HistogramWidget({ widget }: { widget: WidgetSpec }) {
  return (
    <div className="h-full flex items-center justify-center bg-surface-50 rounded">
      <div className="text-center p-4">
        <Icon name="barChart" size={24} className="mx-auto mb-2 text-surface-400" />
        <p className="text-xs text-surface-500">Histogram</p>
        {!widget.data.table && (
          <p className="text-xs text-surface-400 mt-1">Configure data source</p>
        )}
      </div>
    </div>
  );
}

function TableWidget({ widget }: { widget: WidgetSpec }) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (widget.data.table) {
      loadData();
    }
  }, [widget.data.table]);

  const loadData = async () => {
    if (!mosaicConnector.isInitialized()) return;
    setLoading(true);
    try {
      const result = await mosaicConnector.getTablePreview(widget.data.table!, 50);
      setData(result);
      if (result.length > 0) {
        setColumns(Object.keys(result[0]));
      }
    } catch (err) {
      console.error('Failed to load table data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!widget.data.table) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-50 rounded">
        <div className="text-center p-4">
          <Icon name="table" size={24} className="mx-auto mb-2 text-surface-400" />
          <p className="text-xs text-surface-500">Select a table</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Icon name="loading" size={24} className="animate-spin text-mosaic-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="bg-surface-50 sticky top-0">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-2 py-1 text-left font-medium text-surface-600 border-b border-surface-200">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-surface-50">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1 text-surface-700 border-b border-surface-100 truncate max-w-[150px]">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricWidget({ widget }: { widget: WidgetSpec }) {
  const [value, setValue] = useState<string | number>('--');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (widget.data.table && widget.visual.y?.field) {
      loadData();
    }
  }, [widget.data.table, widget.visual.y?.field]);

  const loadData = async () => {
    if (!mosaicConnector.isInitialized()) return;
    setLoading(true);
    try {
      const aggregate = widget.visual.y?.aggregate || 'count';
      const field = widget.visual.y?.field;
      
      let query: string;
      if (aggregate === 'count') {
        query = `SELECT COUNT(*) as value FROM "${widget.data.table}"`;
      } else {
        query = `SELECT ${aggregate.toUpperCase()}("${field}") as value FROM "${widget.data.table}"`;
      }
      
      const result = await mosaicConnector.query<{ value: number }>(query);
      setValue(result[0]?.value ?? '--');
    } catch (err) {
      console.error('Failed to load metric:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {loading ? (
        <Icon name="loading" size={24} className="animate-spin text-mosaic-500" />
      ) : (
        <>
          <div className="text-2xl font-bold text-surface-800">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {widget.visual.y?.field && (
            <div className="text-xs text-surface-500 mt-1">
              {widget.visual.y.aggregate || 'count'} of {widget.visual.y.field}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TextWidget({ widget }: { widget: WidgetSpec }) {
  return (
    <div className="h-full p-2">
      <p className="text-sm text-surface-700">
        {widget.title || 'Text block - click to edit'}
      </p>
    </div>
  );
}

function SliderWidget({ widget }: { widget: WidgetSpec }) {
  return (
    <div className="h-full flex flex-col justify-center px-2">
      <label className="text-xs text-surface-600 mb-1">{widget.title || 'Range'}</label>
      <input type="range" className="w-full" />
      <div className="flex justify-between text-xs text-surface-400 mt-1">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

function DropdownWidget({ widget }: { widget: WidgetSpec }) {
  return (
    <div className="h-full flex flex-col justify-center px-2">
      <label className="text-xs text-surface-600 mb-1">{widget.title || 'Select'}</label>
      <select className="select">
        <option>All</option>
      </select>
    </div>
  );
}
