/**
 * Billing & Plans — current plan card, payment method, upgrade flow.
 */
import { useState } from 'react';
import { CheckCircle2, CreditCard, X } from 'lucide-react';
import { SettingSection } from './shared/SettingSection';
import { ResetSection } from './shared/ResetSection';
import { Button } from '@/components/ui/Button';
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
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Billing & Plans</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage your subscription plan and payment method.</p>
      </div>

      <SettingSection
        title="Current Plan"
        description="Your active Superhive subscription."
      >
        <div className="rounded-lg border border-chart-1/40 bg-gradient-to-br from-chart-1/10 to-chart-1/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-foreground">{plan.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-1/20 px-2 py-0.5 text-[10px] font-medium text-chart-1 uppercase tracking-wider">
                  <CheckCircle2 size={10} />
                  Active
                </span>
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
              <Button variant="solid" size="md" onClick={() => setShowUpgradeModal(true)}>
                Upgrade plan
              </Button>
            )}
          </div>
        </div>
      </SettingSection>

      <SettingSection title="All Plans">
        <div className="grid grid-cols-3 gap-3">
          {PLAN_TIERS.map(t => {
            const isCurrent = t.tier === plan.tier;
            return (
              <div
                key={t.tier}
                className={`relative flex flex-col rounded-lg border p-4 ${
                  isCurrent
                    ? 'border-chart-1/60 bg-chart-1/5'
                    : 'border-border/40 bg-card/30'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 rounded-full bg-chart-1/20 px-1.5 py-0.5 text-[9px] font-medium text-chart-1 uppercase tracking-wider">
                    Current
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-foreground font-fustat tabular-nums">${t.priceMonthly}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1 flex-1">
                  <div className="text-xs text-muted-foreground">{t.includedQuota}</div>
                  <div className="text-xs text-muted-foreground">{t.seats} seat{t.seats !== 1 ? 's' : ''}</div>
                </div>
                {!isCurrent && t.canUpgrade && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpgrade(t.tier)}
                    className="mt-4 self-start"
                  >
                    {t.priceMonthly > plan.priceMonthly ? 'Upgrade' : 'Downgrade'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title="Payment Method"
        description="Your stored payment method for Superhive subscriptions."
      >
        {pm ? (
          <div className="border border-border/40 rounded-md p-4 flex items-center justify-between gap-4">
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
          </div>
        ) : (
          <div className="border border-dashed border-border/40 rounded-md p-4 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">No payment method on file.</span>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Add card (coming soon)' })}>
              Add card
            </Button>
          </div>
        )}
      </SettingSection>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-sidebar border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Upgrade your plan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a plan to upgrade to.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              {PLAN_TIERS.filter(t => t.tier !== plan.tier && t.canUpgrade).map(t => (
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
            <div className="px-5 py-3 border-t border-border bg-card/30">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <ResetSection domain="billing" />
      </div>
    </div>
  );
}
