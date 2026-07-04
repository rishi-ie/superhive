import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/use-agents';
import { useProjects } from '@/hooks/use-projects';

type PickerMode = 'agent' | 'project';

interface PickerContextValue {
  open: boolean;
  mode: PickerMode | null;
  selectedAgentId: string | null;
  selectedProjectId: string | null;
  selectedAgentName: string | null;
  selectedProjectName: string | null;
  openPicker: (mode: PickerMode) => void;
  closePicker: () => void;
  selectAgent: (id: string) => void;
  selectProject: (id: string) => void;
}

const PickerContext = createContext<PickerContextValue | null>(null);

export function PickerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();

  const selectedAgentName = useMemo(
    () => agents.find((a) => a.id === selectedAgentId)?.name ?? null,
    [agents, selectedAgentId]
  );

  const selectedProjectName = useMemo(
    () => projects.find((p) => p.id === selectedProjectId)?.name ?? null,
    [projects, selectedProjectId]
  );

  const openPicker = useCallback((m: PickerMode) => {
    setMode(m);
    setOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setOpen(false);
    setMode(null);
  }, []);

  const selectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    setSelectedProjectId(null);
    setOpen(false);
    setMode(null);
    navigate('/agents');
  }, [navigate]);

  const selectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    setSelectedAgentId(null);
    setOpen(false);
    setMode(null);
    navigate('/projects');
  }, [navigate]);

  return (
    <PickerContext.Provider
      value={{
        open,
        mode,
        selectedAgentId,
        selectedProjectId,
        selectedAgentName,
        selectedProjectName,
        openPicker,
        closePicker,
        selectAgent,
        selectProject,
      }}
    >
      {children}
    </PickerContext.Provider>
  );
}

export function usePicker(): PickerContextValue {
  const ctx = useContext(PickerContext);
  if (!ctx) throw new Error('usePicker must be used inside <PickerProvider>');
  return ctx;
}
