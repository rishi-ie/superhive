import * as React from 'react';
import { PasswordInput } from '@/components/common/PasswordInput';

interface ProviderKeyFieldProps {
  heading: string;
  description: React.ReactNode;
  placeholder: string;
  defaultValue?: string;
}

export function ProviderKeyField({
  heading,
  description,
  placeholder,
  defaultValue = '',
}: ProviderKeyFieldProps) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">{heading}</h3>
      <div className="text-xs text-muted-foreground">{description}</div>
      <PasswordInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={heading}
      />
    </div>
  );
}
