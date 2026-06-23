import type { ReactNode, HTMLAttributes } from 'react';

type UniversalListCardProps = HTMLAttributes<HTMLDivElement> & {
  onClick?: () => void;
  selected?: boolean;
  children: ReactNode;
};

export function UniversalListCard({ onClick, selected, children, className = '', ...rest }: UniversalListCardProps) {
  const baseClasses = 'rounded-lg border bg-card transition-colors';
  const borderClasses = selected ? 'border-chart-1' : 'border-border hover:border-border/80';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${borderClasses} p-3 w-full text-left ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${borderClasses} p-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}
