import { useState, useEffect } from 'react';
import { Icon } from '@/components/common/Icon';
import { useAppStore } from '@/core/state/store';
import { mosaicConnector } from '@/core/mosaic/connector';
import type { WidgetSpec, TableInfo } from '@/types';

interface PropertiesPanelProps {
  widget: WidgetSpec;
}

export function PropertiesPanel({ widget }: PropertiesPanelProps) {
  const { updateWidget, removeWidget, duplicateWidget } = useAppStore();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (widget.data.table) {
      loadTableInfo(widget.data.table);
    }
  }, [widget.data.table]);

  const loadTables = async () => {
    if (!mosaicConnector.isInitialized()) return;
    try {
      const tableNames = await mosaicConnector.getTables();
      const tableInfos = await Promise.all(
        tableNames.map((name) => mosaicConnector.getTableInfo(name))
      );
      setTables(tableInfos);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadTableInfo = async (tableName: string) => {
    if (!mosaicConnector.isInitialized()) return;
    try {
      const info = await mosaicConnector.getTableInfo(tableName);
      setSelectedTable(info);
    } catch (err) {
      console.error('Failed to load table info:', err);
    }
  };

  const handleTableChange = (tableName: string) => {
    updateWidget(widget.id, {
      data: { ...widget.data, table: tableName },
    });
  };

  const handleFieldChange = (encoding: string, field: string) => {
    updateWidget(widget.id, {
      visual: {
        ...widget.visual,
        [encoding]: field ? { field } : undefined,
      },
    });
  };

  const columns = selectedTable?.columns || [];
  const numericColumns = columns.filter((c) =>
    ['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT', 'DECIMAL'].some((t) =>
      c.type.toUpperCase().includes(t)
    )
  );
  const categoricalColumns = columns.filter((c) =>
    ['VARCHAR', 'TEXT', 'STRING'].some((t) => c.type.toUpperCase().includes(t))
  );

  return (
    <div className="p-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={widget.title || ''}
            onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
            className="text-sm font-medium text-surface-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-mosaic-500 rounded px-1 -ml-1"
            placeholder="Widget title"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateWidget(widget.id)}
            className="p-1.5 hover:bg-surface-100 rounded"
            title="Duplicate"
          >
            <Icon name="copy" size={14} className="text-surface-500" />
          </button>
          <button
            onClick={() => removeWidget(widget.id)}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Icon name="delete" size={14} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Widget Type Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-mosaic-50 text-mosaic-700 text-xs font-medium rounded">
          {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)}
        </span>
      </div>

      {/* Data Configuration */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wide mb-2">
          Data
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="label">Table</label>
            <select
              value={widget.data.table || ''}
              onChange={(e) => handleTableChange(e.target.value)}
              className="select"
            >
              <option value="">Select a table...</option>
              {tables.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.name} ({table.rowCount?.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Encoding */}
      {widget.data.table && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wide mb-2">
            Encoding
          </h3>
          
          <div className="space-y-3">
            {/* X Axis */}
            {['scatter', 'bar', 'line', 'area', 'histogram'].includes(widget.type) && (
              <div>
                <label className="label">X Axis</label>
                <select
                  value={widget.visual.x?.field || ''}
                  onChange={(e) => handleFieldChange('x', e.target.value)}
                  className="select"
                >
                  <option value="">Select field...</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Y Axis */}
            {['scatter', 'bar', 'line', 'area'].includes(widget.type) && (
              <div>
                <label className="label">Y Axis</label>
                <select
                  value={widget.visual.y?.field || ''}
                  onChange={(e) => handleFieldChange('y', e.target.value)}
                  className="select"
                >
                  <option value="">Select field...</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Color */}
            {['scatter', 'bar', 'line', 'heatmap'].includes(widget.type) && (
              <div>
                <label className="label">Color</label>
                <select
                  value={widget.visual.color?.field || ''}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="select"
                >
                  <option value="">None</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size (for scatter) */}
            {widget.type === 'scatter' && (
              <div>
                <label className="label">Size</label>
                <select
                  value={widget.visual.size?.field || ''}
                  onChange={(e) => handleFieldChange('size', e.target.value)}
                  className="select"
                >
                  <option value="">Fixed</option>
                  {numericColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Position */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wide mb-2">
          Position
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">X</label>
            <input
              type="number"
              value={widget.position.x}
              onChange={(e) =>
                updateWidget(widget.id, {
                  position: { ...widget.position, x: parseInt(e.target.value) || 0 },
                })
              }
              className="input"
              min={0}
              max={23}
            />
          </div>
          <div>
            <label className="label">Y</label>
            <input
              type="number"
              value={widget.position.y}
              onChange={(e) =>
                updateWidget(widget.id, {
                  position: { ...widget.position, y: parseInt(e.target.value) || 0 },
                })
              }
              className="input"
              min={0}
            />
          </div>
          <div>
            <label className="label">Width</label>
            <input
              type="number"
              value={widget.position.width}
              onChange={(e) =>
                updateWidget(widget.id, {
                  position: { ...widget.position, width: parseInt(e.target.value) || 1 },
                })
              }
              className="input"
              min={1}
              max={24}
            />
          </div>
          <div>
            <label className="label">Height</label>
            <input
              type="number"
              value={widget.position.height}
              onChange={(e) =>
                updateWidget(widget.id, {
                  position: { ...widget.position, height: parseInt(e.target.value) || 1 },
                })
              }
              className="input"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Widget ID */}
      <div className="pt-3 border-t border-surface-200">
        <p className="text-xs text-surface-400">
          ID: <code className="font-mono">{widget.id.slice(0, 8)}...</code>
        </p>
      </div>
    </div>
  );
}
