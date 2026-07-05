import { User, Palette, KeyRound } from "lucide-react";

export interface SettingsSection {
  id: string;
  label: string;
  icon: typeof User;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", label: "General", icon: Palette },
  { id: "account", label: "Account", icon: User },
  { id: "api", label: "API Keys", icon: KeyRound },
];
