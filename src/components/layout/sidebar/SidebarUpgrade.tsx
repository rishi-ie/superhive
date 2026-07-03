import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SidebarUpgrade() {
  return (
    <Card className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent">
        <Shield className="size-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">
          Upgrade to a Pro account
        </span>
      </div>
    </Card>
  );
}
