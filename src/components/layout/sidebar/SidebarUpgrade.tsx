import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SidebarUpgrade() {
  return (
    <Card className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        <Shield className="size-4 text-foreground/80" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground/90">
          Upgrade to a Pro account
        </span>
      </div>
    </Card>
  );
}
