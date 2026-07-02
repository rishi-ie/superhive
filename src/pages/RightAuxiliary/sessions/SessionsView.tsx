/**
 * SessionsView — stub. Chat sessions are replaced by terminal.
 */
type SessionsViewProps = {
  onThreadSelect?: (threadId: string) => void;
};

export function SessionsView({}: SessionsViewProps) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm px-4 text-center">
      Sessions are replaced by the terminal view. Select an agent tab to start a session.
    </div>
  );
}
