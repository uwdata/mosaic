import { Icon } from '@/components/common/Icon';
import { useAppStore, useUIState, usePerformance } from '@/core/state/store';

export function BottomPanel() {
  const { bottomPanelOpen, bottomPanelTab } = useUIState();
  const { toggleBottomPanel, setBottomPanelTab } = useAppStore();
  const performance = usePerformance();

  return (
    <div className={`bg-white border-t border-surface-200 transition-all duration-200 ${
      bottomPanelOpen ? 'h-52' : 'h-8'
    }`}>
      {/* Panel Header / Status Bar */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBottomPanel}
            className="p-1 hover:bg-surface-100 rounded transition-colors"
          >
            <Icon
              name={bottomPanelOpen ? 'chevronDown' : 'chevronUp'}
              size={14}
              className="text-surface-500"
            />
          </button>
          
          {bottomPanelOpen && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBottomPanelTab('queries')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  bottomPanelTab === 'queries'
                    ? 'bg-mosaic-100 text-mosaic-700'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                Queries
              </button>
              <button
                onClick={() => setBottomPanelTab('data')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  bottomPanelTab === 'data'
                    ? 'bg-mosaic-100 text-mosaic-700'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                Data
              </button>
              <button
                onClick={() => setBottomPanelTab('performance')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  bottomPanelTab === 'performance'
                    ? 'bg-mosaic-100 text-mosaic-700'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                Performance
              </button>
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 text-xs text-surface-500">
          <div className="flex items-center gap-1">
            <Icon name="zap" size={12} className="text-green-500" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="database" size={12} />
            <span>Queries: {performance.queryCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="activity" size={12} />
            <span>Rows: {formatNumber(performance.rowsProcessed)}</span>
          </div>
          {performance.lastQueryTime !== undefined && (
            <div className="flex items-center gap-1">
              <Icon name="trending" size={12} />
              <span>Last: {performance.lastQueryTime}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {bottomPanelOpen && (
        <div className="h-[calc(100%-2rem)] overflow-auto p-3">
          {bottomPanelTab === 'queries' && <QueriesTab />}
          {bottomPanelTab === 'data' && <DataTab />}
          {bottomPanelTab === 'performance' && <PerformanceTab />}
        </div>
      )}
    </div>
  );
}

function QueriesTab() {
  return (
    <div className="font-mono text-xs">
      <p className="text-surface-500 mb-2">Query log will appear here...</p>
      <div className="bg-surface-50 rounded p-2 border border-surface-200">
        <code className="text-surface-600">
          -- No queries executed yet
        </code>
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div className="text-xs">
      <p className="text-surface-500">
        Select a widget to preview its data, or load a data source to explore tables.
      </p>
    </div>
  );
}

function PerformanceTab() {
  const performance = usePerformance();
  const { resetPerformance } = useAppStore();

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-surface-700">Performance Metrics</h3>
        <button
          onClick={resetPerformance}
          className="text-mosaic-600 hover:text-mosaic-700"
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Queries"
          value={performance.queryCount}
          icon="database"
        />
        <MetricCard
          label="Total Time"
          value={`${performance.totalQueryTime}ms`}
          icon="activity"
        />
        <MetricCard
          label="Cache Hits"
          value={performance.cacheHits}
          icon="zap"
        />
        <MetricCard
          label="Rows Processed"
          value={formatNumber(performance.rowsProcessed)}
          icon="table"
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: 'database' | 'activity' | 'zap' | 'table' }) {
  return (
    <div className="bg-surface-50 rounded-lg p-3 border border-surface-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} size={14} className="text-surface-400" />
        <span className="text-surface-500">{label}</span>
      </div>
      <div className="text-lg font-semibold text-surface-800">{value}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}
