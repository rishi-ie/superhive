import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldRow } from "../primitives/FieldRow";
import { Segmented } from "../primitives/Segmented";
import type { SettingsSectionProps } from "./registry";

const MODEL_PROVIDERS = [
  { value: "minimax", label: "MiniMax" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google" },
  { value: "deepseek", label: "DeepSeek" },
];

const THINKING_OPTIONS: { value: "low" | "medium" | "high"; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function ModelManageSection({ settings, patch }: SettingsSectionProps) {
  const provider = settings.model?.provider ?? "minimax";
  const modelName = settings.model?.name ?? "";
  const thinkingLevel = (settings.runtime?.thinkingLevel as "low" | "medium" | "high") ?? "medium";

  return (
    <div className="flex flex-col gap-3 py-1">
      <FieldRow label="Provider">
        <Select
          value={provider}
          onValueChange={(v) => patch("model", { provider: v, name: modelName })}
        >
          <SelectTrigger className="h-7 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Model Name" htmlFor="modelName">
        <Input
          id="modelName"
          className="h-7 text-sm"
          value={modelName}
          onChange={(e) => patch("model", { provider, name: e.target.value })}
          placeholder="e.g. MiniMax-Text-01"
        />
      </FieldRow>
      <FieldRow label="Thinking Level">
        <Segmented
          options={THINKING_OPTIONS}
          value={thinkingLevel}
          onValueChange={(v) =>
            patch("runtime", { ...settings.runtime, thinkingLevel: v })
          }
          className="w-full"
        />
      </FieldRow>
    </div>
  );
}
