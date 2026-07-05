import type { NavigateFunction } from "react-router-dom";

export function goToSettingsSection(
  navigate: NavigateFunction,
  section: string
): void {
  navigate(`/settings/${section}`);
}
