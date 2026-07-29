import type { OverviewData } from "@/models/component";
import { workerStatusSections } from "./worker-status-sections";

interface OverviewSectionProps {
  data: OverviewData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  return (
    <div className="flex flex-col gap-stack py-button-y">
      {workerStatusSections.list().map(({ id, Component }) => (
        <Component key={id} data={data} />
      ))}
    </div>
  );
}
