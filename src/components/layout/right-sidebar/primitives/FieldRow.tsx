import type { ReactNode } from 'react';

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FieldRow({ label, htmlFor, children, className }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </label>
      <div className={className}>{children}</div>
    </div>
  );
}
