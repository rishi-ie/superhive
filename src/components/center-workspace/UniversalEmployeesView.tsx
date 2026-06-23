type UniversalEmployeesViewProps = {
  onEmployeeSelect?: (id: string) => void;
};

export function UniversalEmployeesView({ onEmployeeSelect }: UniversalEmployeesViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">All Employees</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Universal employees view — coming soon</p>
      </div>
      <div className="flex-1 px-6 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <p className="text-sm font-medium text-foreground">Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
