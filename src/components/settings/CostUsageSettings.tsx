/**
 * Cost & Usage — usage breakdown chart (working) + budget/spend controls (disabled coming soon).
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/lib/toast-context';
import { Download, Lock } from 'lucide-react';
import { listCostUsage } from '@/data/cost-usage/store';


function UsageChart({ data }: { data: { date: string; cost: number }[] }) {
  const max = Math.max(...data.map(d => d.cost), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px] h-32 px-1">
        {data.map((d, i) => {
          const height = Math.max((d.cost / max) * 100, 3);
          return (
            <div
              key={i}
              className="flex-1 rounded-sm bg-chart-1/60 hover:bg-chart-1 transition-colors group relative cursor-default"
              style={{ height: `${height}%` }}
            >
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-md px-2 py-1 text-[10px] text-foreground whitespace-nowrap pointer-events-none z-10 shadow-lg">
                <span className="font-medium">${d.cost.toFixed(2)}</span>
                <span className="text-muted-foreground ml-1.5">{d.date}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        <span className="text-[10px] text-muted-foreground">{data[0]?.date}</span>
        <span className="text-[10px] text-muted-foreground">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}


/**
 * Cost & Usage page — spending controls and usage breakdown.
 */
export function CostUsageSettings() {
  const toast = useToast();
  const [budgetCap, setBudgetCap] = useState(500);
  const [perAgentLimit, setPerAgentLimit] = useState(100);
  const [spendAlertPercent, setSpendAlertPercent] = useState(80);
  const [spendAlertEnabled, setSpendAlertEnabled] = useState(true);
  const [resetDay, setResetDay] = useState(1);

  const usageData = listCostUsage();
  const totalCost = usageData.reduce((s, d) => s + d.cost, 0);
  const avgCost = totalCost / usageData.length;
  const peakCost = Math.max(...usageData.map(d => d.cost));

  const handleExportCsv = () => {
    const rows = [['Date', 'Cost', 'Agent ID', 'Workspace ID'], ...usageData.map(d => [d.date, d.cost.toFixed(2), '', ''])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'superhive-usage.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Usage data exported' });
  };

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Cost & Usage</h2>
        <p className="mt-2 text-sm text-muted-foreground">Monitor agent spending and configure budget limits.</p>
      </div>

      <SettingSection
        title="Usage (Last 30 Days)"
        description={`Daily agent spend across all workspaces.`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={`$${totalCost.toFixed(2)}`} sub={`${usageData.length} active days`} />
            <StatCard label="Average" value={`$${avgCost.toFixed(2)}`} sub="per active day" />
            <StatCard label="Peak" value={`$${peakCost.toFixed(2)}`} sub={`on ${usageData.find(d => d.cost === peakCost)?.date}`} />
          </div>
          <UsageChart data={usageData} />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="size-2 rounded-sm bg-chart-1" />
              Daily spend
            </div>
            <Button variant="ghost" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download size={12} />
              Export CSV
            </Button>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title="Budget Limits"
        description="Set spending caps to control costs across your workspace."
      >
        <div className="relative">
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground uppercase tracking-wider z-10">
            <Lock size={9} />
            Coming soon
          </div>
          <div className="space-y-3 opacity-50 pointer-events-none">
            <SettingRow
              label="Monthly budget cap"
              description="Hard cap on total agent spend per month. Agents pause when reached."
              control={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <TextInput
                    type="number"
                    value={String(budgetCap)}
                    onChange={e => setBudgetCap(parseInt(e.target.value) || 0)}
                    disabled
                    className="w-24"
                  />
                </div>
              }
            />
            <SettingRow
              label="Per-agent spending limit"
              description="Maximum amount any single agent can spend per month."
              control={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <TextInput
                    type="number"
                    value={String(perAgentLimit)}
                    onChange={e => setPerAgentLimit(parseInt(e.target.value) || 0)}
                    disabled
                    className="w-24"
                  />
                </div>
              }
            />
            <SettingRow
              label="Budget reset cycle"
              description="Day of month when the budget counter resets."
                  control={
                    <div className="flex items-center gap-2">
                      <TextInput
                        type="number"
                        value={String(resetDay)}
                        onChange={e => setResetDay(parseInt(e.target.value) || 1)}
                        disabled
                        className="w-16"
                      />
                      <span className="text-xs text-muted-foreground">of each month</span>
                    </div>
                  }
            />
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title="Spend Alerts"
        description="Get notified when spending approaches your budget threshold."
      >
        <div className="relative">
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground uppercase tracking-wider z-10">
            <Lock size={9} />
            Coming soon
          </div>
          <div className="space-y-3 opacity-50 pointer-events-none">
            <SettingRow
              label="Enable spend alerts"
              description="Receive an in-app notification when spending crosses the alert threshold."
              control={
                <Toggle
                  checked={spendAlertEnabled}
                  onChange={setSpendAlertEnabled}
                  size="sm"
                  disabled
                />
              }
            />
            <SettingRow
              label="Alert threshold"
              description="Percentage of monthly budget at which to trigger the alert."
              control={
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    value={String(spendAlertPercent)}
                    onChange={e => setSpendAlertPercent(parseInt(e.target.value) || 80)}
                    disabled
                    className="w-16"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              }
            />
          </div>
        </div>
      </SettingSection>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="costUsage" />
      </div>
    </div>
  );
}
