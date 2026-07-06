import { TooltipProvider } from '@/components/ui/tooltip';
import { Routes } from './pages/routes';

function App() {
  return (
    <TooltipProvider>
      <Routes />
    </TooltipProvider>
  );
}

export default App;
