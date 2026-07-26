import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/layout/right-sidebar/primitives/Segmented";
import {
  SettingsDivider,
  SettingsPanel,
  SettingsRow,
} from "../SettingsPrimitives";

type FileOpenDestination = "vscode" | "system";
type Language = "english" | "system";
type TerminalLocation = "bottom" | "right";

const FILE_DESTINATION_LABELS: Record<FileOpenDestination, string> = {
  vscode: "VS Code",
  system: "System default",
};

const LANGUAGE_LABELS: Record<Language, string> = {
  english: "English",
  system: "System default",
};

function DropdownChoice<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  onChange: (value: T) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="min-w-36 justify-between">
          {labels?.[value] ?? value}
          <Icon icon={CaretDownIcon} data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {labels?.[option] ?? option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GeneralSection() {
  const [defaultPermissions, setDefaultPermissions] = React.useState(true);
  const [autoReview, setAutoReview] = React.useState(true);
  const [fullAccess, setFullAccess] = React.useState(true);
  const [fileDestination, setFileDestination] = React.useState<FileOpenDestination>("vscode");
  const [language, setLanguage] = React.useState<Language>("english");
  const [showInMenuBar, setShowInMenuBar] = React.useState(true);
  const [showBottomPanel, setShowBottomPanel] = React.useState(true);
  const [terminalLocation, setTerminalLocation] = React.useState<TerminalLocation>("bottom");
  const [preventSleep, setPreventSleep] = React.useState(false);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Permissions</h2>
        <SettingsPanel>
          <SettingsRow title="Default agent permissions" description="Allow new agents to read and edit files in their workspace. They can request additional access when needed.">
            <Switch checked={defaultPermissions} onCheckedChange={setDefaultPermissions} aria-label="Default agent permissions" />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Automatically review access requests" description="Let Superhive review requests for additional access before asking you. Automatic reviews can make mistakes.">
            <Switch checked={autoReview} onCheckedChange={setAutoReview} aria-label="Automatically review access requests" />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Full access" description="Allow agents to edit files outside their workspace and run networked commands without approval. This increases the risk of unintended changes or data exposure.">
            <Switch checked={fullAccess} onCheckedChange={setFullAccess} aria-label="Full access" />
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">General</h2>
        <SettingsPanel>
          <SettingsRow title="Default file open destination" description="Choose where files and folders open by default.">
            <DropdownChoice value={fileDestination} options={["vscode", "system"]} labels={FILE_DESTINATION_LABELS} onChange={setFileDestination} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Language" description="Choose the language used in the Superhive interface.">
            <DropdownChoice value={language} options={["english", "system"]} labels={LANGUAGE_LABELS} onChange={setLanguage} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Show in menu bar" description="Keep Superhive available in the menu bar when the main window is closed.">
            <Switch checked={showInMenuBar} onCheckedChange={setShowInMenuBar} aria-label="Show in menu bar" />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Bottom panel" description="Show the bottom-panel control in the app header.">
            <Switch checked={showBottomPanel} onCheckedChange={setShowBottomPanel} aria-label="Bottom panel" />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Default terminal location" description="Choose where terminal shortcuts and environment actions open terminal tabs.">
            <Segmented
              className="w-36"
              value={terminalLocation}
              onValueChange={setTerminalLocation}
              options={[{ value: "bottom", label: "Bottom" }, { value: "right", label: "Right" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Prevent sleep while running" description="Keep your computer awake while Superhive is running an agent task.">
            <Switch checked={preventSleep} onCheckedChange={setPreventSleep} aria-label="Prevent sleep while running" />
          </SettingsRow>
        </SettingsPanel>
      </section>
    </div>
  );
}
