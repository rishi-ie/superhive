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
} from '@/lib/constants';
import { Dashboard } from './screens/Dashboard';
import { Settings } from './screens/Settings';
import { ToastProvider } from './lib/toast-context';
import { SettingsProvider } from './lib/settings-context';

export type Page = 'main' | 'settings';

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

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
    document.documentElement.style.setProperty('--titlebar-y', isMac ? '28px' : '0px');
  }, []);

  return (
    <SettingsProvider>
      <ToastProvider>
        {page === 'settings' ? (
          <Settings onBack={() => setPage('main')} />
        ) : (
          <Dashboard
            leftWidth={leftWidth}
            rightWidth={rightWidth}
            onLeftWidthChange={handleLeftWidthChange}
            onRightWidthChange={handleRightWidthChange}
            onNavigate={handleNavigate}
          />
        )}
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;
