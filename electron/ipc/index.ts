import { registerAgentIpc } from './agents';
import { registerProjectIpc } from './projects';
import { registerRuntimeIpc } from './runtime';
import { registerManifestPiIpc } from './manifest-pi';

export const IPC = {
  AGENTS: {
    LIST: 'agents:list',
    GET: 'agents:get',
    CREATE: 'agents:create',
    DELETE: 'agents:delete',
    UPDATE_STATUS: 'agents:updateStatus',
    START: 'agents:start',
    STOP: 'agents:stop',
    RESTART: 'agents:restart',
    SEND: 'agents:send',
    GET_RUNTIME_STATE: 'agents:getRuntimeState',
    READ_SETTINGS: 'agents:readSettings',
    WRITE_SETTINGS: 'agents:writeSettings',
    ON_EVENT:    (id: string) => `agent:${id}:event`,
    ON_STATUS:   (id: string) => `agent:${id}:status`,
    ON_MESSAGES: (id: string) => `agent:${id}:messages`,
    ON_EXIT:     (id: string) => `agent:${id}:exit`,
    ON_SETTINGS_CHANGED: (id: string) => `settings:${id}:changed`,
  },
  PROJECTS: {
    LIST: 'projects:list',
    GET: 'projects:get',
    CREATE: 'projects:create',
  },
  MANIFEST_PI: {
    ENSURE_TEMPLATE: 'manifest-pi:ensureTemplate',
    CHECK_TEMPLATE:  'manifest-pi:checkTemplate',
  },
} as const;

export function registerIpc(): void {
  registerAgentIpc();
  registerProjectIpc();
  registerRuntimeIpc();
  registerManifestPiIpc();
}