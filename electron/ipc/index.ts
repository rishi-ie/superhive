import { registerAgentIpc } from './agents';
import { registerProjectIpc } from './projects';
import { registerRuntimeIpc } from './runtime';
import { registerAppIpc } from './app';
import { registerChannelsIpc } from './channels';
import { registerSettingsIpc } from './settings';

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
    ON_SETTINGS_CHANGED: (settings: string) => `settings:${settings}:changed`,
  },
  PROJECTS: {
    LIST: 'projects:list',
    GET: 'projects:get',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    ADD_AGENT: 'projects:addAgent',
  },
  APP: {
    GET_VERSION: 'app:get-version',
    INSTALL_UPDATE: 'app:install-update',
  },
  CHANNELS: {
    CREATE: 'channels:create',
    GET: 'channels:get',
    LIST: 'channels:list',
    APPEND_MESSAGE: 'channels:append-message',
    READ_MESSAGES: 'channels:read-messages',
  },
  SETTINGS: {
    GET_PROVIDERS: 'settings:get-providers',
    SET_PROVIDER: 'settings:set-provider',
    DELETE_PROVIDER: 'settings:delete-provider',
    ENSURE_PROVIDER_CATALOG: 'settings:ensure-provider-catalog',
    GET_MODELS: 'settings:get-models',
    SET_MODEL_ENABLED: 'settings:set-model-enabled',
    ADD_MODEL: 'settings:add-model',
    DELETE_MODEL: 'settings:delete-model',
    GET_ENABLED_MODELS: 'settings:get-enabled-models',
  },
} as const;

export function registerIpc(): void {
  registerAgentIpc();
  registerProjectIpc();
  registerRuntimeIpc();
  registerAppIpc();
  registerChannelsIpc();
  registerSettingsIpc();
}