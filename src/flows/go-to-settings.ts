import type { NavigateFunction } from "react-router-dom";

export function goToSettings(navigate: NavigateFunction): void {
  navigate("/settings");
}
