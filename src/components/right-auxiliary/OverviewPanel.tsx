import { TrendingUp, TrendingDown } from 'lucide-react';
import { overviewStats } from '@/data/mock/right-panel';
import { STROKE_WIDTH } from '@/lib/constants';

export function OverviewPanel() {
  return (
    <div className="p-3 space-y-4">
      <div className="space-y-3">
        {overviewStats.map((stat) => (
          <div key={stat.id} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              {stat.change && (
                <span className={`flex items-center gap-0.5 text-[10px] ${stat.positive ? 'text-chart-2' : 'text-chart-1'}`}>
                  {stat.positive ? (
                    <TrendingUp size={10} strokeWidth={STROKE_WIDTH} />
                  ) : (
                    <TrendingDown size={10} strokeWidth={STROKE_WIDTH} />
                  )}
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-xl font-semibold text-foreground mt-1">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="text-xs font-medium text-foreground mb-2">Recent Activity</div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground">Ava Chen</span> completed "Ship v2.4 release"
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground">Marcus Webb</span> opened PR #143
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground">Priya Sharma</span> deployed to staging
          </div>
        </div>
      </div>
    </div>
  );
}
