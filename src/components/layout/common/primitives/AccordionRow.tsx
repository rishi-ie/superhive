import type { MouseEventHandler, ReactNode } from 'react';
import { BTN_BASE } from './constants';

interface AccordionRowProps {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function AccordionRow({ icon, label, trailing, onClick }: AccordionRowProps) {
  return (
    <button type="button" className={BTN_BASE} onClick={onClick}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}
