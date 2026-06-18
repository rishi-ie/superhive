import { FileText, GitBranch, MessageCircle } from 'lucide-react';

export const rightPanelTabs = [
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'changes', label: 'Changes', icon: GitBranch },
  { id: 'review', label: 'Review', icon: MessageCircle },
] as const;
