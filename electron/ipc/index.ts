import { registerAgentIpc } from './agents';
import { registerProjectIpc } from './projects';

export function registerIpc(): void {
  registerAgentIpc();
  registerProjectIpc();
}
