import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PasswordInput } from '@/components/common/PasswordInput';
import { cn } from '@/lib/utils';

export interface MultiToggleProviderRow {
  id: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  defaultValue?: string;
}

interface MultiToggleProviderFieldProps {
  heading: string;
  description: React.ReactNode;
  defaultEnabled?: boolean;
  rows: MultiToggleProviderRow[];
}

export function MultiToggleProviderField({
  heading,
  description,
  defaultEnabled = false,
  rows,
}: MultiToggleProviderFieldProps) {
  const [enabled, setEnabled] = React.useState(defaultEnabled);
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const r of rows) init[r.id] = r.defaultValue ?? '';
    return init;
  });

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
      <CardContent className="flex flex-col gap-3">
        <div className="text-xs text-muted-foreground">{description}</div>
        <div className="flex flex-col">
          {rows.map((row, idx) => (
            <React.Fragment key={row.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div
                className={cn(
                  'grid grid-cols-[140px_1fr] items-center gap-4 py-1',
                  !enabled && 'opacity-50',
                )}
                data-disabled={!enabled}
              >
                <Label htmlFor={`mt-${row.id}`} className="text-xs text-muted-foreground">
                  {row.label}
                </Label>
                {row.secret ? (
                  <PasswordInput
                    id={`mt-${row.id}`}
                    value={values[row.id] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [row.id]: e.target.value }))}
                    placeholder={row.placeholder}
                    disabled={!enabled}
                  />
                ) : (
                  <Input
                    id={`mt-${row.id}`}
                    value={values[row.id] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [row.id]: e.target.value }))}
                    placeholder={row.placeholder}
                    disabled={!enabled}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
