import { Icon } from '@/components/common/Icon';
import { useAppStore, useUIState, useDataSources } from '@/core/state/store';
import { DataSourcePanel } from '@/features/data-source/DataSourcePanel';
import { WidgetPalette } from '@/features/widget-builder/WidgetPalette';

export function LeftPanel() {
  const { leftPanelOpen, leftPanelTab } = useUIState();
  const { toggleLeftPanel, setLeftPanelTab } = useAppStore();
  const dataSources = useDataSources();

  if (!leftPanelOpen) {
    return (
      <div className="w-10 bg-white border-r border-surface-200 flex flex-col items-center py-2 gap-2">
        <button
          onClick={toggleLeftPanel}
          className="p-2 hover:bg-surface-100 rounded transition-colors"
          title="Expand panel"
        >
          <Icon name="chevronRight" size={16} className="text-surface-500" />
        </button>
        <div className="h-px w-6 bg-surface-200 my-1" />
        <button
          onClick={() => { toggleLeftPanel(); setLeftPanelTab('data'); }}
          className={`p-2 rounded transition-colors ${
            leftPanelTab === 'data' ? 'bg-mosaic-100 text-mosaic-600' : 'hover:bg-surface-100 text-surface-500'
          }`}
          title="Data Sources"
        >
          <Icon name="database" size={16} />
        </button>
        <button
          onClick={() => { toggleLeftPanel(); setLeftPanelTab('widgets'); }}
          className={`p-2 rounded transition-colors ${
            leftPanelTab === 'widgets' ? 'bg-mosaic-100 text-mosaic-600' : 'hover:bg-surface-100 text-surface-500'
          }`}
          title="Widgets"
        >
          <Icon name="layoutGrid" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-surface-200 flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftPanelTab('data')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              leftPanelTab === 'data'
                ? 'bg-mosaic-100 text-mosaic-700'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Icon name="database" size={14} />
            Data
            {dataSources.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-mosaic-500 text-white text-[10px] rounded-full">
                {dataSources.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setLeftPanelTab('widgets')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              leftPanelTab === 'widgets'
                ? 'bg-mosaic-100 text-mosaic-700'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Icon name="layoutGrid" size={14} />
            Widgets
          </button>
        </div>
        <button
          onClick={toggleLeftPanel}
          className="p-1 hover:bg-surface-100 rounded transition-colors"
        >
          <Icon name="chevronLeft" size={16} className="text-surface-500" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {leftPanelTab === 'data' ? <DataSourcePanel /> : <WidgetPalette />}
      </div>
    </div>
  );
}
