import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes } from "./routes/routes";

function App() {
  return (
    <TooltipProvider>
      <Routes />
    </TooltipProvider>
  );
}

export default App;
