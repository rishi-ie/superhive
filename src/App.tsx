/**
 * Root shell — toggles between Dashboard and Settings screen.
 */
import { useState } from 'react';
import { Dashboard } from './screens/Dashboard';
import { Settings } from './screens/Settings';
import { ToastProvider } from '@/lib/toast-context';
import { SettingsProvider } from '@/lib/settings-context';

export type Page = 'dashboard' | 'settings';

/**
 * Root shell component — renders Dashboard or Settings based on page state.
 */
function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <SettingsProvider>
      <ToastProvider>
        {page === 'dashboard' ? (
          <Dashboard onOpenSettings={() => setPage('settings')} />
        ) : (
          <Settings />
        )}
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;
