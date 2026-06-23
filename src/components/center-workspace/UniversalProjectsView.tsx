import { Layers } from 'lucide-react';

type UniversalProjectsViewProps = {
  onProjectSelect?: (id: string, workspaceId: string) => void;
};

export function UniversalProjectsView({ onProjectSelect }: UniversalProjectsViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">All Projects</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Universal projects view — coming soon</p>
      </div>
      <div className="flex-1 px-6 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <Layers size={16} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Placeholder</p>
              <p className="text-xs text-muted-foreground">Projects list coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
