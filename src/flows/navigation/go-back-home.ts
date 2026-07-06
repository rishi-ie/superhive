import type { NavigateFunction } from "react-router-dom";

export function goBackHome(navigate: NavigateFunction): void {
  navigate("/");
}
