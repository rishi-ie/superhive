/**
 * Billing & Plans — current plan card, payment method, upgrade flow.
 */
import { useState } from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { SettingSection } from './shared/SettingSection';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

const PLAN_TIERS = [
  { tier: 'free' as const, name: 'Free', priceMonthly: 0, includedQuota: '5 agent-hours / month', seats: 1, canUpgrade: true },
  { tier: 'pro' as const, name: 'Pro', priceMonthly: 49, includedQuota: '50 agent-hours / month', seats: 5, canUpgrade: true },
  { tier: 'enterprise' as const, name: 'Enterprise', priceMonthly: 199, includedQuota: 'Unlimited agent-hours', seats: 25, canUpgrade: false },
];

/**
 * Billing & Plans page — manage your subscription plan and payment method.
 */
export function BillingSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plan = settings.billing.plan;
  const pm = settings.billing.paymentMethod;

  const handleUpgrade = (tier: typeof PLAN_TIERS[number]['tier']) => {
    const t = PLAN_TIERS.find(p => p.tier === tier)!;
    update('billing', {
      plan: {
        ...plan,
        tier,
        name: t.name,
        priceMonthly: t.priceMonthly,
        includedQuota: t.includedQuota,
        seats: t.seats,
        canUpgrade: t.canUpgrade,
      },
    });
    setShowUpgradeModal(false);
    toast({ title: `Upgraded to ${t.name}` });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Billing & Plans"
        description="Manage your subscription plan and payment method."
      />

      <SettingSection
        title="Current Plan"
        description="Your active Superhive subscription."
      >
        <Card className="border-chart-1/40 bg-gradient-to-br from-chart-1/10 to-chart-1/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-foreground">{plan.name}</span>
                  <Badge variant="active" className="gap-1">
                    <CheckCircle2 size={10} />
                    Active
                  </Badge>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-foreground font-fustat tabular-nums">${plan.priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{plan.includedQuota}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{plan.seats} seat{plan.seats !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {plan.canUpgrade && (
                <Button variant="default" size="md" onClick={() => setShowUpgradeModal(true)}>
                  Upgrade plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </SettingSection>

      <SettingSection title="All Plans">
        <div className="grid grid-cols-3 gap-3">
          {PLAN_TIERS.map(t => {
            const isCurrent = t.tier === plan.tier;
            return (
              <Card
                key={t.tier}
                className={`relative flex flex-col ${isCurrent ? 'border-chart-1/60 bg-chart-1/5' : 'border-border/40 bg-card/30'}`}
              >
                {isCurrent && (
                  <Badge variant="active" className="absolute top-2 right-2">
                    Current
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-foreground font-fustat tabular-nums">${t.priceMonthly}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 flex-1">
                  <div className="text-xs text-muted-foreground">{t.includedQuota}</div>
                  <div className="text-xs text-muted-foreground">{t.seats} seat{t.seats !== 1 ? 's' : ''}</div>
                </CardContent>
                {!isCurrent && t.canUpgrade && (
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpgrade(t.tier)}
                      className="self-start"
                    >
                      {t.priceMonthly > plan.priceMonthly ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title="Payment Method"
        description="Your stored payment method for Superhive subscriptions."
      >
        {pm ? (
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md border border-border bg-card flex items-center justify-center">
                  <CreditCard size={18} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {pm.brand} ending in {pm.last4}
                  </span>
                  <span className="text-xs text-muted-foreground">Expires {pm.expiry}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Update card (coming soon)' })}>
                Update
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">No payment method on file.</span>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Add card (coming soon)' })}>
                Add card
              </Button>
            </CardContent>
          </Card>
        )}
      </SettingSection>

      <Dialog open={showUpgradeModal} onOpenChange={(o) => !o && setShowUpgradeModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade your plan</DialogTitle>
            <DialogDescription>Choose a plan to upgrade to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {PLAN_TIERS.filter((t) => t.tier !== plan.tier && t.canUpgrade).map((t) => (
              <button
                key={t.tier}
                type="button"
                onClick={() => handleUpgrade(t.tier)}
                className="w-full flex items-center justify-between rounded-md border border-border px-4 py-3 hover:border-chart-1/40 hover:bg-chart-1/5 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{t.includedQuota}</span>
                </div>
                <span className="text-sm font-medium text-foreground tabular-nums">${t.priceMonthly}/mo</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpgradeModal(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="billing" />
      </div>
    </div>
  );
}
