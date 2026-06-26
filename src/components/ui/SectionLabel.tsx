/**
 * Small section label used to group items within a stats panel or settings row.
 */

/**
 * @param children - Label content
 * @param uppercase - Render in uppercase with tracking (default true)
 * @param size - Font size: sm (10px) or md (11px, default)
 */
export function SectionLabel({ children, uppercase = true, size = 'md' }: { children: React.ReactNode; uppercase?: boolean; size?: 'sm' | 'md' }) {
  return (
    <span className={`font-medium text-muted-foreground ${uppercase ? 'uppercase tracking-wider' : ''} ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'}`}>
      {children}
    </span>
  );
}
