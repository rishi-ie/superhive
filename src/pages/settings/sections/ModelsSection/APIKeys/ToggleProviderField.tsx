import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ToggleProviderFieldProps {
  heading: string;
  description: React.ReactNode;
  inputPlaceholder: string;
  defaultEnabled?: boolean;
  defaultValue?: string;
}

export function ToggleProviderField({
  heading,
  description,
  inputPlaceholder,
  defaultEnabled = false,
  defaultValue = '',
}: ToggleProviderFieldProps) {
  const [enabled, setEnabled] = React.useState(defaultEnabled);
  const [value, setValue] = React.useState(defaultValue);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
        <h3 className="text-sm font-medium text-foreground">{heading}</h3>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label={`Toggle ${heading}`}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">{description}</div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={!enabled}
          aria-label={heading}
          className={cn(!enabled && 'opacity-50')}
        />
      </CardContent>
    </Card>
  );
}
