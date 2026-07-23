import { registerAgentIpc } from './agents';
import { registerProjectIpc } from './projects';
import { registerRuntimeIpc } from './runtime';
import { registerAppIpc } from './app';
import { registerSettingsIpc } from './settings';
import { registerMailboxIpc } from './mailbox';
import { registerTaskIpc } from './tasks';

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
    GET_PROJECTS: 'agents:getProjects',
    GET_MESSAGES: 'agents:get-messages',
    READ_SETTINGS: 'agents:readSettings',
    WRITE_SETTINGS: 'agents:writeSettings',
    // 4-file truth split: per-file IPC channels
    READ_MANAGE:      'agents:readManage',
    WRITE_MANAGE:     'agents:writeManage',
    READ_OVERVIEW:    'agents:readOverview',
    WRITE_OVERVIEW:   'agents:writeOverview',
    READ_INBOX_JSON:  'agents:readInboxFile',
    APPEND_INBOX:     'agents:appendInbox',
    MARK_INBOX_READ:  'agents:markInboxRead',
    CLEAR_INBOX:      'agents:clearInbox',
    REVEAL: 'agents:reveal',
    PERSIST_ASSISTANT_MESSAGE: 'agents:persistAssistantMessage',
    ON_EVENT:    (id: string) => `agent:${id}:event`,
    ON_STATUS:   (id: string) => `agent:${id}:status`,
    ON_MESSAGES: (id: string) => `agent:${id}:messages`,
    ON_EXIT:     (id: string) => `agent:${id}:exit`,
    ON_SETTINGS_CHANGED: (settings: string) => `settings:${settings}:changed`,
    ON_CREATED: (id: string) => `agent:${id}:created`,
    ON_CHANGED: 'agents:changed',
    // Gap 2: mailbox
    POST_TO_PROJECT: 'agents:post-to-project',
    ASK_MEMBER:      'agents:ask-member',
    READ_INBOX:      'agents:read-inbox',
    ACK_MESSAGE:     'agents:ack-message',
    ON_MAIL:         (id: string) => `agent:${id}:mail`,
  },
  PROJECTS: {
    LIST: 'projects:list',
    GET: 'projects:get',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    ADD_AGENT: 'projects:addAgent',
    REMOVE_AGENT: 'projects:removeAgent',
    REVEAL: 'projects:reveal',
    ON_CHANGED: 'projects:changed',
  },
  APP: {
    GET_VERSION: 'app:get-version',
    INSTALL_UPDATE: 'app:install-update',
  },
  SETTINGS: {
    GET_PROVIDERS: 'settings:get-providers',
    SET_PROVIDER: 'settings:set-provider',
    DELETE_PROVIDER: 'settings:delete-provider',
    GET_MODELS: 'settings:get-models',
    SET_MODEL_ENABLED: 'settings:set-model-enabled',
    ADD_MODEL: 'settings:add-model',
    DELETE_MODEL: 'settings:delete-model',
    GET_ENABLED_MODELS: 'settings:get-enabled-models',
    ON_MODEL_UPDATED: 'settings:model-updated',
  },
  // Gap 3: task queue
  TASKS: {
    LIST: 'tasks:list',
    GET: 'tasks:get',
    CREATE: 'tasks:create',
    UPDATE: 'tasks:update',
    DELETE: 'tasks:delete',
    ASSIGN: 'tasks:assign',
    CHANGE_STATUS: 'tasks:changeStatus',
    ON_CHANGED: 'tasks:changed',
  },
} as const;

export function registerIpc(): void {
  registerAgentIpc();
  registerProjectIpc();
  registerRuntimeIpc();
  registerAppIpc();
  registerSettingsIpc();
  registerMailboxIpc();
  registerTaskIpc();
}