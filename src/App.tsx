import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/providers/query-provider';
import { PickerProvider } from '@/providers/picker-provider';
import { CommandPicker } from '@/components/picker/CommandPicker';
import { Routes } from './routes/routes';

function App() {
  return (
    <QueryProvider>
      <PickerProvider>
        <TooltipProvider>
          <Routes />
          <CommandPicker />
        </TooltipProvider>
      </PickerProvider>
    </QueryProvider>
  );
}

export default App;
