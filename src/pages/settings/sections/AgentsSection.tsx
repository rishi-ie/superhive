import * as React from "react";
import { Segmented } from "@/components/layout/right-sidebar/primitives/Segmented";
import { Switch } from "@/components/ui/switch";
import { SettingsDivider, SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

type Thinking = "concise" | "balanced" | "thorough";
type Access = "chat" | "files" | "terminal";
type Queue = "all" | "one";

const STARTER_SKILLS = ["Plan work", "Ask for clarification", "Review changes"];

export function AgentsSection() {
  const [thinking, setThinking] = React.useState<Thinking>("balanced");
  const [access, setAccess] = React.useState<Access>("terminal");
  const [queue, setQueue] = React.useState<Queue>("all");
  const [retry, setRetry] = React.useState(true);
  const [context, setContext] = React.useState(true);
  const [skills, setSkills] = React.useState(() => new Set(STARTER_SKILLS));

  const toggleSkill = (skill: string) => {
    setSkills((current) => {
      const next = new Set(current);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">New agent defaults</h2>
        <SettingsPanel footer={<span className="text-xs text-muted-foreground">These defaults apply only to agents created after you save them.</span>}>
          <SettingsRow title="Thinking level" description="How much thought new agents apply by default.">
            <Segmented
              className="w-56"
              value={thinking}
              onValueChange={setThinking}
              options={[{ value: "concise", label: "Concise" }, { value: "balanced", label: "Balanced" }, { value: "thorough", label: "Thorough" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Workspace access" description="What new agents can do in their workspace.">
            <Segmented
              className="w-56"
              value={access}
              onValueChange={setAccess}
              options={[{ value: "chat", label: "Chat only" }, { value: "files", label: "Files" }, { value: "terminal", label: "Files + terminal" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Retry failed turns" description="Try a turn again when a provider request fails.">
            <Switch checked={retry} onCheckedChange={setRetry} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Manage long context" description="Compact context automatically when it gets full.">
            <Switch checked={context} onCheckedChange={setContext} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Incoming messages" description="How new agents process queued requests.">
            <Segmented
              className="w-40"
              value={queue}
              onValueChange={setQueue}
              options={[{ value: "all", label: "All" }, { value: "one", label: "One at a time" }]}
            />
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Starter skills</h2>
        <SettingsPanel footer={<span className="text-xs text-muted-foreground">Skills are enabled for newly created agents and can be changed per agent later.</span>}>
          {STARTER_SKILLS.map((skill, index) => (
            <React.Fragment key={skill}>
              <SettingsRow title={skill} description="Included in new agents by default.">
                <Switch checked={skills.has(skill)} onCheckedChange={() => toggleSkill(skill)} />
              </SettingsRow>
              {index < STARTER_SKILLS.length - 1 ? <SettingsDivider /> : null}
            </React.Fragment>
          ))}
        </SettingsPanel>
      </section>
    </div>
  );
}
