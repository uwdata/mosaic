import { Icon } from '@/components/common/Icon';
import { useAppStore, useUIState, useSelectedWidget } from '@/core/state/store';
import { PropertiesPanel } from '@/features/widget-builder/PropertiesPanel';

export function RightPanel() {
  const { rightPanelOpen, rightPanelTab } = useUIState();
  const { toggleRightPanel, setRightPanelTab } = useAppStore();
  const selectedWidget = useSelectedWidget();

  if (!rightPanelOpen) {
    return (
      <div className="w-10 bg-white border-l border-surface-200 flex flex-col items-center py-2 gap-2">
        <button
          onClick={toggleRightPanel}
          className="p-2 hover:bg-surface-100 rounded transition-colors"
          title="Expand panel"
        >
          <Icon name="chevronLeft" size={16} className="text-surface-500" />
        </button>
        <div className="h-px w-6 bg-surface-200 my-1" />
        <button
          onClick={() => { toggleRightPanel(); setRightPanelTab('properties'); }}
          className={`p-2 rounded transition-colors ${
            rightPanelTab === 'properties' ? 'bg-mosaic-100 text-mosaic-600' : 'hover:bg-surface-100 text-surface-500'
          }`}
          title="Properties"
        >
          <Icon name="settings" size={16} />
        </button>
        <button
          onClick={() => { toggleRightPanel(); setRightPanelTab('links'); }}
          className={`p-2 rounded transition-colors ${
            rightPanelTab === 'links' ? 'bg-mosaic-100 text-mosaic-600' : 'hover:bg-surface-100 text-surface-500'
          }`}
          title="Links"
        >
          <Icon name="link" size={16} />
        </button>
        <button
          onClick={() => { toggleRightPanel(); setRightPanelTab('style'); }}
          className={`p-2 rounded transition-colors ${
            rightPanelTab === 'style' ? 'bg-mosaic-100 text-mosaic-600' : 'hover:bg-surface-100 text-surface-500'
          }`}
          title="Style"
        >
          <Icon name="palette" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-surface-200 flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRightPanelTab('properties')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              rightPanelTab === 'properties'
                ? 'bg-mosaic-100 text-mosaic-700'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Icon name="settings" size={14} />
            Properties
          </button>
          <button
            onClick={() => setRightPanelTab('links')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              rightPanelTab === 'links'
                ? 'bg-mosaic-100 text-mosaic-700'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Icon name="link" size={14} />
            Links
          </button>
          <button
            onClick={() => setRightPanelTab('style')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              rightPanelTab === 'style'
                ? 'bg-mosaic-100 text-mosaic-700'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Icon name="palette" size={14} />
            Style
          </button>
        </div>
        <button
          onClick={toggleRightPanel}
          className="p-1 hover:bg-surface-100 rounded transition-colors"
        >
          <Icon name="chevronRight" size={16} className="text-surface-500" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedWidget ? (
          <div className="p-4 text-center text-surface-500 text-sm">
            <Icon name="info" size={24} className="mx-auto mb-2 text-surface-400" />
            <p>Select a widget to edit its properties</p>
          </div>
        ) : rightPanelTab === 'properties' ? (
          <PropertiesPanel widget={selectedWidget} />
        ) : rightPanelTab === 'links' ? (
          <LinksPanel widget={selectedWidget} />
        ) : (
          <StylePanel widget={selectedWidget} />
        )}
      </div>
    </div>
  );
}

function LinksPanel({ widget }: { widget: { id: string } }) {
  return (
    <div className="p-3">
      <p className="text-xs text-surface-500 mb-3">
        Configure how this widget interacts with others.
      </p>
      <div className="space-y-3">
        <div>
          <label className="label">Selection</label>
          <select className="select">
            <option value="">None</option>
            <option value="brush">Brush Selection</option>
            <option value="click">Click Selection</option>
          </select>
        </div>
        <div>
          <label className="label">Filter By</label>
          <select className="select">
            <option value="">None</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-surface-400 mt-4">
        Widget ID: {widget.id.slice(0, 8)}...
      </p>
    </div>
  );
}

function StylePanel({ widget }: { widget: { id: string; style?: { backgroundColor?: string } } }) {
  const { updateWidget } = useAppStore();

  return (
    <div className="p-3">
      <p className="text-xs text-surface-500 mb-3">
        Customize the appearance of this widget.
      </p>
      <div className="space-y-3">
        <div>
          <label className="label">Background Color</label>
          <input
            type="color"
            value={widget.style?.backgroundColor || '#ffffff'}
            onChange={(e) =>
              updateWidget(widget.id, {
                style: { ...widget.style, backgroundColor: e.target.value },
              })
            }
            className="w-full h-8 rounded border border-surface-300 cursor-pointer"
          />
        </div>
        <div>
          <label className="label">Border Radius</label>
          <input
            type="range"
            min="0"
            max="24"
            defaultValue="8"
            className="w-full"
          />
        </div>
        <div>
          <label className="label">Padding</label>
          <input
            type="range"
            min="0"
            max="32"
            defaultValue="16"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
