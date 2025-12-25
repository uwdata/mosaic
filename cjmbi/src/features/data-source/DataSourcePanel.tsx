import { useState, useCallback } from 'react';
import { Icon } from '@/components/common/Icon';
import { useAppStore, useDataSources } from '@/core/state/store';
import { mosaicConnector } from '@/core/mosaic/connector';
import type { DataSource, TableInfo } from '@/types';

export function DataSourcePanel() {
  const dataSources = useDataSources();
  const { addDataSource, removeDataSource, updateDataSourceStatus } = useAppStore();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mosaicConnector.initialize({ type: 'wasm' });
      
      const source: DataSource = {
        id: crypto.randomUUID(),
        name: 'DuckDB (WASM)',
        type: 'wasm',
        config: {},
        status: 'connected',
      };
      addDataSource(source);
      
      // Refresh tables
      await refreshTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setLoading(false);
    }
  }, [addDataSource]);

  const refreshTables = useCallback(async () => {
    try {
      const tableNames = await mosaicConnector.getTables();
      const tableInfos = await Promise.all(
        tableNames.map((name) => mosaicConnector.getTableInfo(name))
      );
      setTables(tableInfos);
    } catch (err) {
      console.error('Failed to refresh tables:', err);
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure connector is initialized
      if (!mosaicConnector.isInitialized()) {
        await mosaicConnector.initialize({ type: 'wasm' });
        const source: DataSource = {
          id: crypto.randomUUID(),
          name: 'DuckDB (WASM)',
          type: 'wasm',
          config: {},
          status: 'connected',
        };
        addDataSource(source);
      }

      const tableName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Create object URL for the file
      const url = URL.createObjectURL(file);

      if (ext === 'csv') {
        await mosaicConnector.loadCSV(tableName, url);
      } else if (ext === 'parquet') {
        await mosaicConnector.loadParquet(tableName, url);
      } else if (ext === 'json') {
        await mosaicConnector.loadJSON(tableName, url);
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      URL.revokeObjectURL(url);
      await refreshTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }

    // Reset input
    e.target.value = '';
  }, [addDataSource, refreshTables]);

  const handleLoadSampleData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!mosaicConnector.isInitialized()) {
        await mosaicConnector.initialize({ type: 'wasm' });
        const source: DataSource = {
          id: crypto.randomUUID(),
          name: 'DuckDB (WASM)',
          type: 'wasm',
          config: {},
          status: 'connected',
        };
        addDataSource(source);
      }

      // Create sample weather data directly
      await mosaicConnector.exec(`DROP TABLE IF EXISTS weather`);
      await mosaicConnector.exec(`
        CREATE TABLE weather (
          date DATE,
          precipitation DOUBLE,
          temp_max DOUBLE,
          temp_min DOUBLE,
          wind DOUBLE,
          weather VARCHAR
        )
      `);
      
      // Insert sample data
      const sampleData = [
        "('2012-01-01', 0.0, 12.8, 5.0, 4.7, 'drizzle')",
        "('2012-01-02', 10.9, 10.6, 2.8, 4.5, 'rain')",
        "('2012-01-03', 0.8, 11.7, 7.2, 2.3, 'rain')",
        "('2012-01-04', 20.3, 12.2, 5.6, 4.7, 'rain')",
        "('2012-01-05', 1.3, 8.9, 2.8, 6.1, 'rain')",
        "('2012-01-06', 2.5, 4.4, 2.2, 2.2, 'rain')",
        "('2012-01-07', 0.0, 7.2, 2.8, 2.3, 'rain')",
        "('2012-01-08', 0.0, 10.0, 2.8, 2.0, 'sun')",
        "('2012-01-09', 4.3, 9.4, 5.0, 3.4, 'rain')",
        "('2012-01-10', 1.0, 6.1, 0.6, 3.4, 'rain')",
        "('2012-01-11', 0.0, 6.1, -1.1, 5.1, 'sun')",
        "('2012-01-12', 0.0, 6.1, -1.7, 1.9, 'sun')",
        "('2012-01-13', 0.0, 5.0, -2.8, 1.3, 'sun')",
        "('2012-01-14', 4.1, 4.4, 0.6, 5.3, 'snow')",
        "('2012-01-15', 5.3, 1.1, -3.3, 3.2, 'snow')",
        "('2012-01-16', 2.5, 1.7, -2.8, 5.0, 'snow')",
        "('2012-01-17', 8.1, 3.3, 0.0, 5.6, 'snow')",
        "('2012-01-18', 19.8, 0.0, -2.8, 5.0, 'snow')",
        "('2012-01-19', 15.2, -1.1, -2.8, 1.6, 'snow')",
        "('2012-01-20', 13.5, 7.2, -1.1, 2.3, 'snow')",
        "('2012-02-01', 0.0, 11.1, 3.9, 2.4, 'sun')",
        "('2012-02-02', 0.0, 12.2, 3.3, 1.5, 'sun')",
        "('2012-02-03', 0.0, 13.3, 2.8, 2.1, 'sun')",
        "('2012-02-04', 0.0, 12.8, 5.0, 2.9, 'fog')",
        "('2012-02-05', 0.0, 10.6, 5.6, 3.2, 'fog')",
        "('2012-03-01', 0.0, 11.7, 3.3, 2.5, 'sun')",
        "('2012-03-02', 0.0, 13.9, 3.9, 2.0, 'sun')",
        "('2012-03-03', 0.0, 15.0, 5.0, 3.1, 'sun')",
        "('2012-03-04', 2.5, 12.2, 6.7, 4.2, 'rain')",
        "('2012-03-05', 5.1, 10.0, 5.6, 5.5, 'rain')",
        "('2012-04-01', 0.0, 16.1, 6.1, 3.0, 'sun')",
        "('2012-04-02', 0.0, 17.8, 7.2, 2.8, 'sun')",
        "('2012-04-03', 0.0, 18.9, 8.3, 2.5, 'sun')",
        "('2012-04-04', 1.3, 15.0, 8.9, 4.1, 'rain')",
        "('2012-04-05', 3.8, 13.3, 7.8, 5.2, 'rain')",
        "('2012-05-01', 0.0, 20.0, 10.0, 2.2, 'sun')",
        "('2012-05-02', 0.0, 22.2, 11.1, 2.0, 'sun')",
        "('2012-05-03', 0.0, 23.3, 12.2, 1.8, 'sun')",
        "('2012-05-04', 0.0, 21.7, 11.7, 2.5, 'sun')",
        "('2012-05-05', 0.5, 18.9, 10.6, 3.5, 'drizzle')",
        "('2012-06-01', 0.0, 25.0, 13.3, 2.0, 'sun')",
        "('2012-06-02', 0.0, 26.7, 14.4, 1.8, 'sun')",
        "('2012-06-03', 0.0, 27.8, 15.0, 1.5, 'sun')",
        "('2012-06-04', 0.0, 28.9, 15.6, 1.2, 'sun')",
        "('2012-06-05', 0.0, 30.0, 16.1, 1.0, 'sun')",
        "('2012-07-01', 0.0, 28.3, 16.7, 2.5, 'sun')",
        "('2012-07-02', 0.0, 29.4, 17.2, 2.2, 'sun')",
        "('2012-07-03', 0.0, 30.6, 17.8, 2.0, 'sun')",
        "('2012-07-04', 0.0, 31.7, 18.3, 1.8, 'sun')",
        "('2012-07-05', 0.0, 32.2, 18.9, 1.5, 'sun')"
      ];
      
      await mosaicConnector.exec(`INSERT INTO weather VALUES ${sampleData.join(', ')}`);

      await refreshTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
  }, [addDataSource, refreshTables]);

  const handleDropTable = useCallback(async (tableName: string) => {
    try {
      await mosaicConnector.dropTable(tableName);
      await refreshTables();
    } catch (err) {
      console.error('Failed to drop table:', err);
    }
  }, [refreshTables]);

  return (
    <div className="p-3">
      {/* Connection Status */}
      {dataSources.length === 0 ? (
        <div className="mb-4">
          <div className="text-center py-6 bg-surface-50 rounded-lg border border-dashed border-surface-300">
            <Icon name="database" size={32} className="mx-auto mb-2 text-surface-400" />
            <p className="text-sm text-surface-600 mb-3">No data source connected</p>
            <button
              onClick={handleInitialize}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Icon name="loading" size={14} className="animate-spin mr-1" />
                  Connecting...
                </>
              ) : (
                'Connect DuckDB'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-800">{source.name}</span>
              </div>
              <button
                onClick={() => removeDataSource(source.id)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <Icon name="close" size={14} className="text-green-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <Icon name="alert" size={14} />
            {error}
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-4">
        <label className="label">Load Data</label>
        <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-surface-300 rounded-lg cursor-pointer hover:border-mosaic-400 hover:bg-mosaic-50 transition-colors">
            <Icon name="upload" size={16} className="text-surface-500" />
            <span className="text-sm text-surface-600">Upload File</span>
            <input
              type="file"
              accept=".csv,.parquet,.json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>
        <p className="text-xs text-surface-400 mt-1">
          Supports CSV, Parquet, JSON
        </p>
      </div>

      {/* Sample Data */}
      <div className="mb-4">
        <button
          onClick={handleLoadSampleData}
          disabled={loading}
          className="w-full btn btn-secondary text-xs"
        >
          <Icon name="download" size={14} className="mr-1" />
          Load Sample Data (Weather)
        </button>
      </div>

      {/* Tables List */}
      {tables.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Tables</label>
            <button
              onClick={refreshTables}
              className="p-1 hover:bg-surface-100 rounded"
              title="Refresh"
            >
              <Icon name="refresh" size={14} className="text-surface-500" />
            </button>
          </div>
          <div className="space-y-2">
            {tables.map((table) => (
              <TableItem
                key={table.name}
                table={table}
                onDrop={() => handleDropTable(table.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TableItem({ table, onDrop }: { table: TableInfo; onDrop: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-2 bg-surface-50 cursor-pointer hover:bg-surface-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon
            name={expanded ? 'chevronDown' : 'chevronRight'}
            size={14}
            className="text-surface-400"
          />
          <Icon name="table" size={14} className="text-mosaic-500" />
          <span className="text-sm font-medium text-surface-700">{table.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">
            {table.rowCount?.toLocaleString()} rows
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrop();
            }}
            className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
            title="Drop table"
          >
            <Icon name="delete" size={12} className="text-red-500" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-2 border-t border-surface-200 bg-white">
          <div className="space-y-1">
            {table.columns.map((col) => (
              <div
                key={col.name}
                className="flex items-center justify-between text-xs py-1 px-2 hover:bg-surface-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={getColumnIcon(col.type)}
                    size={12}
                    className="text-surface-400"
                  />
                  <span className="text-surface-700">{col.name}</span>
                </div>
                <span className="text-surface-400 font-mono">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getColumnIcon(type: string): 'hash' | 'type' | 'activity' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('decimal')) {
    return 'hash';
  }
  if (lowerType.includes('date') || lowerType.includes('time')) {
    return 'activity';
  }
  return 'type';
}
