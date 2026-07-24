export function RightStatusBar() {
  return (
    <div className="relative h-full w-[320px] flex-shrink-0">
      <aside
        aria-label="Status panel"
        className="absolute left-0 right-0 top-14 h-1/2 overflow-hidden border-l border-y border-sidebar-border bg-sidebar-bg"
      >
        {/* content lands in a follow-up change */}
      </aside>
    </div>
  );
}
