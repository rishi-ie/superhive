import { type ReactNode } from 'react';
import { useDoubleClick } from '@/lib/use-double-click';

type MaximizeOnDoubleClickProps = {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export function MaximizeOnDoubleClick({ children, className = '', onClick }: MaximizeOnDoubleClickProps) {
  const { onClick: handleClick } = useDoubleClick({
    onDoubleClick: () => {
      window.electron?.toggleMaximize();
    },
  });

  return (
    <div
      className={className}
      onClick={(e) => {
        handleClick(e);
        onClick?.(e);
      }}
    >
      {children}
    </div>
  );
}
