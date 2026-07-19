import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { CaretDownIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-card-elevated py-1">{children}</div>;
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-stack px-6 py-[10px]">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function SettingsDivider() {
  return <div className="mx-6 h-px bg-border/50" />;
}

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
  const label = labels?.[value] ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 cursor-default items-center gap-list-item rounded-button border border-border bg-background px-button-x text-xs transition-colors hover:bg-muted">
        <span>{label}</span>
        <Icon icon={CaretDownIcon} className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as T)}
        >
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt} value={opt}>
              {labels?.[opt] ?? opt}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SectionHeader title="General" />
        <SettingsCard>
          <SettingsRow
            title="Theme"
            description="Choose how Superhive looks."
          >
            <DropdownChoice<ThemeValue>
              value={theme}
              options={["light", "dark", "system"]}
              labels={THEME_LABELS}
              onChange={setTheme}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Reduce motion"
            description="Minimize animations across the app."
          >
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              aria-label="Reduce motion"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Show welcome on launch"
            description="Display the welcome screen when no agent is open."
          >
            <Switch
              checked={welcomeOnLaunch}
              onCheckedChange={setWelcomeOnLaunch}
              aria-label="Show welcome on launch"
            />
          </SettingsRow>
        </SettingsCard>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="Startup" />
        <SettingsCard>
          <SettingsRow
            title="Launch at login"
            description="Open Superhive automatically when you sign in."
          >
            <Switch
              checked={launchAtLogin}
              onCheckedChange={setLaunchAtLogin}
              aria-label="Launch at login"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Default view"
            description="What to show when Superhive opens."
          >
            <DropdownChoice<DefaultViewValue>
              value={defaultView}
              options={["last", "home", "projects"]}
              labels={DEFAULT_VIEW_LABELS}
              onChange={setDefaultView}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Auto-update"
            description="Install updates without prompting."
          >
            <Switch
              checked={autoUpdate}
              onCheckedChange={setAutoUpdate}
              aria-label="Auto-update"
            />
          </SettingsRow>
        </SettingsCard>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="Notifications" />
        <SettingsCard>
          <SettingsRow
            title="Desktop notifications"
            description="Show a banner when an agent finishes."
          >
            <Switch
              checked={desktopNotifs}
              onCheckedChange={setDesktopNotifs}
              aria-label="Desktop notifications"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Notification sound"
            description="Play a sound with each notification."
          >
            <Switch
              checked={notifSound}
              onCheckedChange={setNotifSound}
              aria-label="Notification sound"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Mention only"
            description="Notify only when the agent needs input."
          >
            <Switch
              checked={mentionOnly}
              onCheckedChange={setMentionOnly}
              aria-label="Mention only"
            />
          </SettingsRow>
        </SettingsCard>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="Privacy" />
        <SettingsCard>
          <SettingsRow
            title="Send crash reports"
            description="Help improve stability by sharing crash logs."
          >
            <Switch
              checked={crashReports}
              onCheckedChange={setCrashReports}
              aria-label="Send crash reports"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Share usage analytics"
            description="Anonymous usage data to guide product decisions."
          >
            <Switch
              checked={telemetry}
              onCheckedChange={setTelemetry}
              aria-label="Share usage analytics"
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            title="Local-only mode"
            description="Block all network requests from agents."
          >
            <Switch
              checked={localOnly}
              onCheckedChange={setLocalOnly}
              aria-label="Local-only mode"
            />
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  );
}