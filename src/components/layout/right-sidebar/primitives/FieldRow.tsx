import type { ReactNode } from 'react';

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FieldRow({ label, htmlFor, children, className }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-gap-tight">
      <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </label>
      <div className={className}>{children}</div>
    </div>
  );
}
