import type { MouseEventHandler, ReactNode } from 'react';
import { BTN_BASE } from './constants';

interface EmptyCtaButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function EmptyCtaButton({ icon, label, onClick }: EmptyCtaButtonProps) {
  return (
    <button type="button" className={BTN_BASE} onClick={onClick}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}