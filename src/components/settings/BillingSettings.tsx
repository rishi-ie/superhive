/**
 * Billing & Plans — current plan, tier grid, Meta-hive agent stepper, payment method.
 */
import { useState } from 'react';
import { CheckCircle2, CreditCard, Minus, Plus } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SettingSection } from './shared/SettingSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { PlanTier } from '@/data/settings/interface';

type BillingPeriod = 'monthly' | 'yearly';

const META_HIVE_MIN = 1;
const META_HIVE_MAX = 50;
const YEARLY_DISCOUNT = 0.8;

type TierDef = {
  tier: Exclude<PlanTier, 'enterprise'>;
  name: string;
  monthly: number;
  yearly: number;
  seats: number;
  tagline: string;
  features: string[];
  ctaLabel: string;
  mostPopular?: boolean;
};

const TIERS: TierDef[] = [
  {
    tier: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    seats: 1,
    tagline: 'Try Superhive with a single agent.',
    features: [
      '1 digital employee (BYOK)',
      '1 workspace, 1 project',
      'Basic chat with your agent',
    ],
    ctaLabel: 'Start Free',
  },
  {
    tier: 'pro',
    name: 'Superhive Pro',
    monthly: 49,
    yearly: 39,
    seats: 10,
    tagline: 'Your workspace, an agent you can talk to.',
    features: [
      'Up to 10 employees (BYOK)',
      'Workspace-as-Agent',
      'All Superhive surfaces unlocked',
    ],
    ctaLabel: 'Get Started',
  },
  {
    tier: 'meta-hive',
    name: 'Meta-hive',
    monthly: 99,
    yearly: 79,
    seats: 50,
    tagline: 'Run your entire company on autopilot.',
    features: [
      'MetaHive Autopilot (exclusive)',
      'Fully configured cloud agents',
      'Model routers & fallbacks',
    ],
    ctaLabel: 'Get Started',
    mostPopular: true,
  },
];

const ENTERPRISE_FEATURES = [
  'Custom requirements — built around your team',
  'Dedicated support — direct line to engineering',
  'Volume pricing — discounts for large teams',
  'Compliance & security — SOC 2, SSO, audit support',
];

function getPrice(monthly: number, period: BillingPeriod): number {
  return period === 'yearly' ? Math.round(monthly * YEARLY_DISCOUNT) : monthly;
}

function getSuffix(period: BillingPeriod, perAgent = false): string {
  if (perAgent) {
    return period === 'yearly' ? 'agent/mo, billed yearly' : 'agent/month';
  }
  if (period === 'yearly') return 'mo, billed yearly';
  return 'month';
}

function getMetaHiveTotal(agents: number, period: BillingPeriod): number {
  return agents * getPrice(99, period);
}

/* ─── Plan Card ─────────────────────────────────────────────────────── */

type PlanCardProps = {
  def: TierDef;
  isCurrent: boolean;
  billingPeriod: BillingPeriod;
  onSelect: (tier: TierDef['tier']) => void;
};

function PlanCard({ def, isCurrent, billingPeriod, onSelect }: PlanCardProps) {
  const price = getPrice(def.monthly, billingPeriod);
  const suffix = getSuffix(billingPeriod, def.tier === 'meta-hive');
  const isUpgrade = price > 0;

  return (
    <div
      className={`
        relative flex flex-col rounded-md border p-4
        ${def.mostPopular ? 'border-accent ring-2 ring-accent/20' : 'border-border'}
        ${isCurrent ? 'bg-accent/5 border-accent/60' : 'bg-card'}
      `}
    >
      {def.mostPopular && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-block bg-accent text-highlight-foreground text-[9px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide">
            Most Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <Badge variant="active" className="absolute top-2 right-2 text-[9px] gap-1">
          <CheckCircle2 size={9} strokeWidth={STROKE_WIDTH} />
          Current
        </Badge>
      )}

      <div className="flex flex-col gap-1 mb-3">
        <span className="text-sm font-semibold text-foreground">{def.name}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-foreground font-fustat tabular-nums">
            {price === 0 ? 'Free' : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-xs text-muted-foreground">/{suffix}</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {def.tagline}
        </p>
      </div>

      <div className="border-t border-border/60 pt-3 mb-3 space-y-1.5 flex-1">
        {def.features.map((f) => (
          <div key={f} className="flex items-start gap-1.5">
            <CheckCircle2
              size={12}
              strokeWidth={STROKE_WIDTH}
              className="text-accent shrink-0 mt-0.5"
            />
            <span className="text-[11px] text-muted-foreground leading-snug">{f}</span>
          </div>
        ))}
      </div>

      {isCurrent ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="w-full mt-auto h-8 text-[11px]"
        >
          Current Plan
        </Button>
      ) : (
        <Button
          variant={def.mostPopular ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(def.tier)}
          className="w-full mt-auto h-8 text-[11px]"
        >
          {isUpgrade ? 'Upgrade' : 'Downgrade'}
        </Button>
      )}
    </div>
  );
}

/* ─── Enterprise Card ─────────────────────────────────────────────── */

type EnterpriseCardProps = {
  onContact: () => void;
};

function EnterpriseCard({ onContact }: EnterpriseCardProps) {
  return (
    <div className="relative flex flex-col lg:flex-row rounded-md border border-border bg-card overflow-hidden">
      {/* Left column */}
      <div className="flex flex-col gap-2 p-6 lg:w-1/3 lg:border-r lg:border-border">
        <span className="text-[10px] font-fustat text-muted-foreground/60 uppercase tracking-widest">
          Enterprise
        </span>
        <div className="text-2xl font-semibold text-foreground font-fustat tracking-tight">
          Custom
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
          For teams with custom requirements. Tailored to what your team actually needs.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onContact}
          className="w-full lg:w-auto h-8 text-[11px]"
        >
          Contact sales
        </Button>
      </div>

      {/* Right column */}
      <div className="grid grid-cols-2 gap-4 p-6 lg:w-2/3">
        {ENTERPRISE_FEATURES.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <CheckCircle2
              size={13}
              strokeWidth={STROKE_WIDTH}
              className="text-accent shrink-0 mt-0.5"
            />
            <span className="text-xs text-muted-foreground leading-snug">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Meta-hive Agents Stepper ────────────────────────────────────── */

type MetaHiveStepperProps = {
  agents: number;
  billingPeriod: BillingPeriod;
  onChange: (n: number) => void;
};

function MetaHiveStepper({ agents, billingPeriod, onChange }: MetaHiveStepperProps) {
  const total = getMetaHiveTotal(agents, billingPeriod);
  const unitPrice = getPrice(99, billingPeriod);
  const suffix = billingPeriod === 'yearly' ? 'agent/mo, billed yearly' : 'agent/month';

  return (
    <div className="rounded-md border border-accent/40 bg-accent/5 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground">Meta-hive agents</span>
          <span className="text-[11px] text-muted-foreground">
            Configure how many cloud agents run your workforce.
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-sm font-semibold text-foreground font-fustat tabular-nums">
            {agents} agent{agents !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {agents} × ${unitPrice}/{suffix.replace('agent/', '')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(META_HIVE_MIN, agents - 1))}
          disabled={agents <= META_HIVE_MIN}
          className="h-8 w-8 p-0"
        >
          <Minus size={12} strokeWidth={STROKE_WIDTH} />
        </Button>

        <div className="flex-1 flex items-center justify-center">
          <span className="text-base font-semibold text-foreground font-fustat tabular-nums min-w-[2ch] text-center">
            {agents}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(META_HIVE_MAX, agents + 1))}
          disabled={agents >= META_HIVE_MAX}
          className="h-8 w-8 p-0"
        >
          <Plus size={12} strokeWidth={STROKE_WIDTH} />
        </Button>

        <div className="flex-1 text-right">
          <span className="text-sm font-semibold text-foreground font-fustat tabular-nums">
            ${total}
          </span>
          <span className="text-[10px] text-muted-foreground ml-1">/mo</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Min 1 · Max 50</span>
        {billingPeriod === 'yearly' && (
          <span className="text-[10px] text-accent font-medium">
            Save 20% with yearly billing
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */

const BILLING_OPTIONS = [
  { value: 'monthly' as BillingPeriod, label: 'Monthly' },
  {
    value: 'yearly' as BillingPeriod,
    label: 'Yearly',
    icon: (
      <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm font-medium">
        Save 20%
      </span>
    ),
  },
];

/**
 * Billing & Plans page — manage subscription plan and payment method.
 */
export function BillingSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const plan = settings.billing.plan;
  const pm = settings.billing.paymentMethod;

  const metaHiveAgents = plan.metaHiveAgents ?? 3;

  const currentPrice = (() => {
    if (plan.tier === 'free') return 0;
    if (plan.tier === 'enterprise') return null;
    if (plan.tier === 'meta-hive') {
      return getMetaHiveTotal(metaHiveAgents, billingPeriod);
    }
    return getPrice(49, billingPeriod);
  })();

  const currentSuffix = (() => {
    if (plan.tier === 'free') return 'forever';
    if (plan.tier === 'enterprise') return '';
    if (plan.tier === 'meta-hive') return getSuffix(billingPeriod, true);
    return getSuffix(billingPeriod);
  })();

  const handlePlanChange = (tier: Exclude<PlanTier, 'enterprise'>) => {
    const tierDef = TIERS.find((t) => t.tier === tier)!;
    const newPlan = {
      ...plan,
      tier,
      name: tierDef.name,
      priceMonthly: tierDef.monthly,
      metaHiveAgents: tier === 'meta-hive' ? metaHiveAgents : undefined,
    };
    update('billing', { plan: newPlan });
    setBillingPeriod('monthly');
    toast({ title: `Upgraded to ${tierDef.name}` });
  };

  const handleMetaHiveAgents = (n: number) => {
    const newPlan = { ...plan, metaHiveAgents: n };
    update('billing', { plan: newPlan });
  };

  const showMetaHiveStepper = plan.tier === 'meta-hive';

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Billing & Plans"
        description="Manage your subscription plan, pricing period, and payment method."
      />

      {/* Current Plan + Billing Toggle */}
      <SettingSection title="Current Plan">
        <Card className="border-accent/30 bg-card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: plan info */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">{plan.name}</span>
                  <Badge variant="active" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  {plan.tier === 'enterprise' ? (
                    <span className="text-2xl font-semibold text-foreground font-fustat">Custom</span>
                  ) : currentPrice !== null ? (
                    <>
                      <span className="text-2xl font-semibold text-foreground font-fustat tabular-nums">
                        ${currentPrice}
                      </span>
                      <span className="text-sm text-muted-foreground">/ {currentSuffix}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-foreground font-fustat">Free</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{plan.includedQuota}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    {plan.tier === 'meta-hive'
                      ? `${metaHiveAgents} agent${metaHiveAgents !== 1 ? 's' : ''}`
                      : `${plan.seats} seat${plan.seats !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Right: billing period toggle */}
              {plan.tier !== 'free' && plan.tier !== 'enterprise' && (
                <div className="shrink-0">
                  <SegmentedControl
                    options={BILLING_OPTIONS}
                    value={billingPeriod}
                    onChange={(v) => setBillingPeriod(v as BillingPeriod)}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </SettingSection>

      {/* All Plans grid */}
      <SettingSection title="All Plans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIERS.map((def) => (
            <PlanCard
              key={def.tier}
              def={def}
              isCurrent={plan.tier === def.tier}
              billingPeriod={billingPeriod}
              onSelect={handlePlanChange}
            />
          ))}
        </div>
      </SettingSection>

      {/* Meta-hive agents stepper */}
      {showMetaHiveStepper && (
        <SettingSection title="Agents">
          <MetaHiveStepper
            agents={metaHiveAgents}
            billingPeriod={billingPeriod}
            onChange={handleMetaHiveAgents}
          />
        </SettingSection>
      )}

      {/* Enterprise full-span */}
      <SettingSection title="">
        <EnterpriseCard onContact={() => toast({ title: 'Contact sales (coming soon)' })} />
      </SettingSection>

      {/* Payment Method */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: 'Update card (coming soon)' })}
              >
                Update
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">No payment method on file.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: 'Add card (coming soon)' })}
              >
                Add card
              </Button>
            </CardContent>
          </Card>
        )}
      </SettingSection>

          </div>
  );
}
