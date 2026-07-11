import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...props }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-gap-tight.5">
      <Label htmlFor={id}>
        {label}
        {props.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input id={id} {...props} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
