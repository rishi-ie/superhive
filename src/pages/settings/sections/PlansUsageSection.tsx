import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/layout/right-sidebar/primitives/Segmented";
import { SETTINGS_PREVIEW_ACCOUNT } from "@/lib/settings-preview";
import { SettingsDivider, SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice, UsageMeter } from "./MockPrimitives";

type BillingCycle = "monthly" | "annual";
type Threshold = "50" | "80" | "100";
type LimitAction = "notify" | "pause" | "stop";

const INVOICES = [
  { date: "Jul 27, 2026", amount: "$20.00", status: "Paid" },
  { date: "Jun 27, 2026", amount: "$20.00", status: "Paid" },
  { date: "May 27, 2026", amount: "$20.00", status: "Paid" },
];

export function PlansUsageSection() {
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly");
  const [budget, setBudget] = React.useState("250");
  const [threshold, setThreshold] = React.useState<Threshold>("80");
  const [limitAction, setLimitAction] = React.useState<LimitAction>("notify");
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice>Subscription, invoices, and cost data are sample preview data.</PreviewNotice>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Subscription</h2>
        <SettingsPanel
          title={`${SETTINGS_PREVIEW_ACCOUNT.plan} plan`}
          description="Your plan is active and renews on Aug 27, 2026."
          action={<Badge>Active</Badge>}
          footer={<div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Unlimited local workspaces and priority support.</span><Button variant="outline" size="sm" onClick={() => setNotice("Plan management is a preview action.")}>Change plan</Button></div>}
        >
          <SettingsRow title="Billing cycle" description="Choose how the Pro plan renews.">
            <Segmented
              className="w-40"
              value={cycle}
              onValueChange={setCycle}
              options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Cancel plan" description="Your Pro access would remain available through the current billing period.">
            <Button variant="destructive" size="sm" onClick={() => setNotice("Cancellation is disabled in this preview.")}>Cancel plan</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Billing</h2>
        <SettingsPanel>
          <SettingsRow title="Payment method" description="Visa ending in 4242">
            <Button variant="outline" size="sm" onClick={() => setNotice("Payment methods are a preview action.")}>Manage</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Billing email" description={SETTINGS_PREVIEW_ACCOUNT.email}>
            <Button variant="outline" size="sm" onClick={() => setNotice("Billing email editing is a preview action.")}>Edit</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Tax information" description="Add business details to future invoices.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Tax information is a preview action.")}>Add</Button>
          </SettingsRow>
        </SettingsPanel>
        <SettingsPanel title="Invoices" description="Recent subscription invoices.">
          {INVOICES.map((invoice, index) => (
            <React.Fragment key={invoice.date}>
              <SettingsRow title={invoice.date} description={invoice.amount}>
                <div className="flex items-center gap-2"><Badge variant="secondary">{invoice.status}</Badge><Button variant="ghost" size="sm" onClick={() => setNotice("Invoice downloads are a preview action.")}>Download</Button></div>
              </SettingsRow>
              {index < INVOICES.length - 1 ? <SettingsDivider /> : null}
            </React.Fragment>
          ))}
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Plan usage</h2>
        <SettingsPanel>
          <div className="flex flex-col gap-5 px-(--card-spacing) py-1">
            <UsageMeter label="Active agents" used={4} total={10} />
            <UsageMeter label="Active projects" used={2} total={5} />
            <UsageMeter label="Concurrent agent runs" used={1} total={3} />
          </div>
          <SettingsDivider />
          <SettingsRow title="Premium capabilities" description="Project planning and specialist creation are available.">
            <Badge variant="secondary">Included</Badge>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">AI usage & limits</h2>
        <SettingsPanel
          title="Estimated provider spend"
          description="Estimates are based on local usage telemetry. Your provider invoice is authoritative."
          footer={<span className="text-xs text-muted-foreground">Current period: Jul 1–31, 2026</span>}
        >
          <div className="flex flex-col gap-5 px-(--card-spacing) py-1">
            <UsageMeter label="Monthly estimate" used={84} total={250} detail="$84 of $250" />
            <UsageMeter label="OpenAI" used={51} total={84} detail="$51 estimated" />
            <UsageMeter label="Anthropic" used={33} total={84} detail="$33 estimated" />
          </div>
          <SettingsDivider />
          <SettingsRow title="Monthly budget" description="Set a local estimate limit for new agent turns.">
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">$</span><Input aria-label="Monthly budget" className="w-20" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} /></div>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Alert threshold" description="Notify when the estimate reaches this budget percentage.">
            <Segmented
              className="w-36"
              value={threshold}
              onValueChange={setThreshold}
              options={[{ value: "50", label: "50%" }, { value: "80", label: "80%" }, { value: "100", label: "100%" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="At budget limit" description="What Superhive would do when the local estimate reaches the budget.">
            <Segmented
              className="w-60"
              value={limitAction}
              onValueChange={setLimitAction}
              options={[{ value: "notify", label: "Notify" }, { value: "pause", label: "Pause turns" }, { value: "stop", label: "Stop turns" }]}
            />
          </SettingsRow>
        </SettingsPanel>
        <SettingsPanel title="Budget overrides" description="Preview overrides for work that needs a different local limit.">
          <SettingsRow title="Frontend refactor" description="Project · $100 monthly estimate">
            <Button variant="outline" size="sm" onClick={() => setNotice("Project budget editing is a preview action.")}>Edit</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Research agent" description="Agent · $40 monthly estimate">
            <Button variant="outline" size="sm" onClick={() => setNotice("Agent budget editing is a preview action.")}>Edit</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
    </div>
  );
}
