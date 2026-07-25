import { ModelPicker } from "@/components/layout/composer/ModelPicker/ModelPicker";
import type { SettingsSectionProps } from "./registry";

export function ModelSection({ agentId }: SettingsSectionProps) {
  return <div className="py-1"><ModelPicker agentId={agentId} /></div>;
}
