export interface UniversalTicket {
  id: string;
  title: string;
  projectName: string;
  workspaceId: string;
  status: string;
  priority: string;
  type: string;
  assignee: string | null;
  archivedAt?: string;
}
