import type { ReactNode } from 'react';
import { BTN_BASE } from './constants';

interface EmptyCtaButtonProps {
  icon: ReactNode;
  label: string;
}

export function EmptyCtaButton({ icon, label }: EmptyCtaButtonProps) {
  return (
    <button type="button" className={BTN_BASE}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}
