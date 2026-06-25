/**
 * Wrapper that triggers window maximize on double-click and forwards onClick.
 */
import { type ReactNode } from 'react';
import { useDoubleClick } from '@/lib/use-double-click';

type MaximizeOnDoubleClickProps = {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

/**
 * Wrapper that triggers window maximize on double-click and forwards onClick.
 * @param children - Child elements
 * @param className - Additional CSS classes
 * @param onClick - Optional click handler
 */
export function MaximizeOnDoubleClick({ children, className = '', onClick }: MaximizeOnDoubleClickProps) {
  const { onClick: handleClick } = useDoubleClick({
    onDoubleClick: () => {
      (window.electron as { toggleMaximize?: () => void })?.toggleMaximize?.();
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
