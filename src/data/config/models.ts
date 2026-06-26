import { Sparkles, Cpu, Smartphone, Bot } from 'lucide-react';

export const models = [
  { id: 'claude', label: 'Claude', icon: Sparkles },
  { id: 'codex', label: 'Codex', icon: Cpu },
  { id: 'opencode', label: 'OpenCode', icon: Smartphone },
  { id: 'copilot', label: 'Copilot', icon: Bot },
] as const;

export const MODEL_LABELS = ['Auto', 'Claude', 'Codex', 'OpenCode', 'Copilot'] as const;
