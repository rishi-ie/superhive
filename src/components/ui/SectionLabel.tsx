/**
 * Small uppercase section label used to group items within a stats panel.
 * @param children - Label content
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-wider font-medium text-muted-foreground">{children}</span>
  );
}
