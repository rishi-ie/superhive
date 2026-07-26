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
import {
  SettingsDivider,
  SettingsPanel,
  SettingsRow,
} from "../SettingsPrimitives";

type ThemeValue = "light" | "dark" | "system";
type DefaultViewValue = "last" | "home" | "projects";

const THEME_LABELS: Record<ThemeValue, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const DEFAULT_VIEW_LABELS: Record<DefaultViewValue, string> = {
  last: "Last agent",
  home: "Home",
  projects: "Projects",
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
        <Button type="button" variant="outline" size="sm">
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
  const [theme, setTheme] = React.useState<ThemeValue>("system");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [welcomeOnLaunch, setWelcomeOnLaunch] = React.useState(true);
  const [launchAtLogin, setLaunchAtLogin] = React.useState(false);
  const [defaultView, setDefaultView] = React.useState<DefaultViewValue>("last");
  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [desktopNotifs, setDesktopNotifs] = React.useState(true);
  const [notifSound, setNotifSound] = React.useState(false);
  const [mentionOnly, setMentionOnly] = React.useState(false);
  const [crashReports, setCrashReports] = React.useState(true);
  const [telemetry, setTelemetry] = React.useState(true);
  const [localOnly, setLocalOnly] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <SettingsPanel title="Appearance" description="Choose how Superhive looks and moves.">
        <SettingsRow title="Theme" description="Choose how Superhive looks.">
          <DropdownChoice value={theme} options={["light", "dark", "system"]} labels={THEME_LABELS} onChange={setTheme} />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Reduce motion" description="Minimize animations across the app.">
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} aria-label="Reduce motion" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Show welcome on launch" description="Display the welcome screen when no agent is open.">
          <Switch checked={welcomeOnLaunch} onCheckedChange={setWelcomeOnLaunch} aria-label="Show welcome on launch" />
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel title="Startup" description="Control how Superhive opens and updates.">
        <SettingsRow title="Launch at login" description="Open Superhive automatically when you sign in.">
          <Switch checked={launchAtLogin} onCheckedChange={setLaunchAtLogin} aria-label="Launch at login" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Default view" description="What to show when Superhive opens.">
          <DropdownChoice value={defaultView} options={["last", "home", "projects"]} labels={DEFAULT_VIEW_LABELS} onChange={setDefaultView} />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Auto-update" description="Install updates without prompting.">
          <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} aria-label="Auto-update" />
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel title="Notifications" description="Decide when Superhive gets your attention.">
        <SettingsRow title="Desktop notifications" description="Show a banner when an agent finishes.">
          <Switch checked={desktopNotifs} onCheckedChange={setDesktopNotifs} aria-label="Desktop notifications" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Notification sound" description="Play a sound with each notification.">
          <Switch checked={notifSound} onCheckedChange={setNotifSound} aria-label="Notification sound" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Mention only" description="Notify only when the agent needs input.">
          <Switch checked={mentionOnly} onCheckedChange={setMentionOnly} aria-label="Mention only" />
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel title="Privacy" description="Choose what Superhive can share.">
        <SettingsRow title="Send crash reports" description="Help improve stability by sharing crash logs.">
          <Switch checked={crashReports} onCheckedChange={setCrashReports} aria-label="Send crash reports" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Share usage analytics" description="Anonymous usage data to guide product decisions.">
          <Switch checked={telemetry} onCheckedChange={setTelemetry} aria-label="Share usage analytics" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow title="Local-only mode" description="Block all network requests from agents.">
          <Switch checked={localOnly} onCheckedChange={setLocalOnly} aria-label="Local-only mode" />
        </SettingsRow>
      </SettingsPanel>
    </div>
  );
}
