import type { NavigateFunction } from 'react-router-dom';

export function selectAgent(navigate: NavigateFunction, id: string): void {
  navigate(`/agents/${id}`);
}