import { Icon } from '@/components/common/Icon';
import { useAppStore, useUIState } from '@/core/state/store';
import type { EditorMode } from '@/types';

const modeConfig: Record<EditorMode, { label: string; icon: 'edit' | 'eye' | 'maximize' }> = {
  design: { label: 'Design', icon: 'edit' },
  preview: { label: 'Preview', icon: 'eye' },
  present: { label: 'Present', icon: 'maximize' },
};

export function Header() {
  const { mode } = useUIState();
  const { setMode, exportProject, loadProject, resetProject } = useAppStore();
  const projectName = useAppStore((state) => state.project.name);
  const setProjectName = useAppStore((state) => state.setProjectName);

  const handleExport = () => {
    const project = exportProject();
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const project = JSON.parse(text);
          loadProject(project);
        } catch (err) {
          console.error('Failed to parse project file:', err);
          alert('Invalid project file');
        }
      }
    };
    input.click();
  };

  return (
    <header className="h-12 bg-surface-900 text-white flex items-center justify-between px-4 border-b border-surface-700">
      {/* Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/mosaic.svg" alt="Mosaic" className="w-6 h-6" />
          <span className="font-semibold text-sm">CJMBI</span>
        </div>
        
        <div className="h-4 w-px bg-surface-600" />
        
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent border-none text-sm text-surface-300 hover:text-white focus:text-white focus:outline-none px-2 py-1 rounded hover:bg-surface-800 focus:bg-surface-800 transition-colors"
        />
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
        {(Object.keys(modeConfig) as EditorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-mosaic-500 text-white'
                : 'text-surface-400 hover:text-white hover:bg-surface-700'
            }`}
          >
            <Icon name={modeConfig[m].icon} size={14} />
            {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-white hover:bg-surface-800 rounded transition-colors"
        >
          <Icon name="open" size={14} />
          Open
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-white hover:bg-surface-800 rounded transition-colors"
        >
          <Icon name="save" size={14} />
          Save
        </button>
        
        <button
          onClick={resetProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-white hover:bg-surface-800 rounded transition-colors"
        >
          <Icon name="refresh" size={14} />
          New
        </button>
      </div>
    </header>
  );
}
