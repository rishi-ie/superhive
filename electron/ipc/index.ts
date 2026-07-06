import { registerAgentIpc } from './agents';
import { registerProjectIpc } from './projects';
import { registerRuntimeIpc } from './runtime';
import { registerManifestPiIpc } from './manifest-pi';

export function registerIpc(): void {
  registerAgentIpc();
  registerProjectIpc();
  registerRuntimeIpc();
  registerManifestPiIpc();
}