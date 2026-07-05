import type { ReactNode } from 'react';
import { BTN_BASE } from './constants';

interface AccordionRowProps {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}

export function AccordionRow({ icon, label, trailing }: AccordionRowProps) {
  return (
    <button type="button" className={BTN_BASE}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}
