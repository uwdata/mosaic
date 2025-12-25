import { Header } from '@/components/panels/Header';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { BottomPanel } from '@/components/panels/BottomPanel';
import { Canvas } from '@/components/canvas/Canvas';
import { useUIState } from '@/core/state/store';

export default function App() {
  const { mode } = useUIState();

  // Present mode - full screen canvas only
  if (mode === 'present') {
    return (
      <div className="h-screen bg-surface-900">
        <Canvas />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-100">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas />
          <BottomPanel />
        </div>
        
        <RightPanel />
      </div>
    </div>
  );
}
