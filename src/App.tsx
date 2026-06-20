import { useState } from 'react';
import { Dashboard } from './screens/Dashboard';
import { Settings } from './screens/Settings';

export type Page = 'main' | 'settings';

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 340;
const MIN_LEFT_WIDTH = 180;
const MAX_LEFT_WIDTH = 400;
const MIN_RIGHT_WIDTH = 200;
const MAX_RIGHT_WIDTH = 500;

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

  if (page === 'settings') {
    return <Settings onBack={() => setPage('main')} />;
  }

  return (
    <Dashboard
      leftWidth={leftWidth}
      rightWidth={rightWidth}
      onLeftWidthChange={handleLeftWidthChange}
      onRightWidthChange={handleRightWidthChange}
      onNavigate={handleNavigate}
    />
  );
}

export default App;
