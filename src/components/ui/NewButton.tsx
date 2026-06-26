/**
 * Create/new action button — thin wrapper around Button with a plus icon.
 */
import { Plus } from 'lucide-react';
import { Button } from './Button';

export type NewButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
};

/**
 * Create/new action button with plus icon.
 * @param label - Button label text
 * @param onClick - Click handler
 * @param className - Additional CSS classes
 */
export function NewButton({ label, onClick, className = '' }: NewButtonProps) {
  return (
    <Button
      variant="default"
      onClick={onClick}
      className={className}
    >
      <Plus size={12} strokeWidth={2} />
      {label}
    </Button>
  );
}
