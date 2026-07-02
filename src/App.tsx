/**
 * Root shell — toggles between main Dashboard and Settings screen.
 * Handles resizable panel width state for left nav and right auxiliary.
 */
import { useState, useEffect } from 'react';
import {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  MIN_LEFT_WIDTH,
  MAX_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  MAX_RIGHT_WIDTH,
  TITLEBAR_Y_MAC_PX,
} from '@/lib/constants';
import { Dashboard } from '@/pages/Dashboard';
import { Settings } from '@/pages/Settings';
import { ToastProvider } from '@/toasts/context';
import { SettingsProvider } from './lib/settings-context';
import { TooltipProvider } from './components/ui/TooltipProvider';

export type Page = 'main' | 'settings';
export type SettingsSectionId = string;

/**
 * Root shell component — renders Dashboard or Settings based on page state.
 */
function App() {
  const [page, setPage] = useState<Page>('main');
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);

  const handleLeftWidthChange = (width: number) => {
    setLeftWidth(Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, width)));
  };

  const handleRightWidthChange = (width: number) => {
    setRightWidth(Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, width)));
  };

  const handleNavigate = (target: Page) => {
    setPage(target);
  };

  const handleBack = () => setPage('main');

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
    document.documentElement.style.setProperty(
      '--titlebar-y',
      isMac ? `${TITLEBAR_Y_MAC_PX}px` : '0px'
    );
  }, []);

  // ─── Translate Cmd+. and the "open keyboard shortcuts" shortcut into navigation ───
  // The shortcut manager in Dashboard handles the actual key detection. When
  // those shortcuts fire, `pendingSettingsSection` is set on the Dashboard and
  // it dispatches a CustomEvent on window. Settings listens (see Settings.tsx).
  // App just renders one or the other.
  return (
    <SettingsProvider>
      <TooltipProvider>
        <ToastProvider>
          {page === 'settings' ? (
            <Settings onBack={handleBack} />
          ) : (
            <Dashboard
              page={page}
              leftWidth={leftWidth}
              rightWidth={rightWidth}
              onLeftWidthChange={handleLeftWidthChange}
              onRightWidthChange={handleRightWidthChange}
              onNavigate={handleNavigate}
            />
          )}
        </ToastProvider>
      </TooltipProvider>
    </SettingsProvider>
  );
}

export default App;
