/**
 * Per-domain reset button — shows only when the domain has been modified from defaults.
 */
import { Button } from '@/components/ui/Button';
import { DEFAULT_SETTINGS } from '@/data/settings/interface';
import { useSettings } from '@/lib/settings-context';
import type { Settings } from '@/data/settings/interface';

type ResetSectionProps<K extends keyof Settings = keyof Settings> = {
  domain: K;
  label?: string;
};

/**
 * @param domain - Which settings domain to reset (e.g. 'appearance', 'notifications')
 * @param label - Optional button label; defaults to 'Reset section'
 */
export function ResetSection<K extends keyof Settings>({ domain, label = 'Reset section' }: ResetSectionProps<K>) {
  const { settings, update } = useSettings();

  const isModified = JSON.stringify(settings[domain]) !== JSON.stringify(DEFAULT_SETTINGS[domain]);

  if (!isModified) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => update(domain, DEFAULT_SETTINGS[domain])}
      className="text-muted-foreground hover:text-destructive"
    >
      {label}
    </Button>
  );
}
