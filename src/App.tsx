import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/providers/query-provider';
import { Routes } from './routes/routes';

function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Routes />
      </TooltipProvider>
    </QueryProvider>
  );
}

export default App;
