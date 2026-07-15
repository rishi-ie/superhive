// @ts-nocheck
// ============================================================
// IPC BRIDGE — exposes window.api to the renderer (contextBridge)
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, cb) {
  const listener = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('api', {
  agents: {
    list:    () => ipcRenderer.invoke('agents:list'),
    get:     (id) => ipcRenderer.invoke('agents:get', id),
    create:  (data) => ipcRenderer.invoke('agents:create', data),
    delete:  (id) => ipcRenderer.invoke('agents:delete', id),
    updateStatus: (id, status, lastError) =>
      ipcRenderer.invoke('agents:updateStatus', id, status, lastError),

    start:    (id) => ipcRenderer.invoke('agents:start', id),
    stop:     (id) => ipcRenderer.invoke('agents:stop', id),
    restart:  (id) => ipcRenderer.invoke('agents:restart', id),
    send:     (id, message) => ipcRenderer.invoke('agents:send', id, message),
    getRuntimeState: (id) => ipcRenderer.invoke('agents:getRuntimeState', id),
    getProjects:   (id) => ipcRenderer.invoke('agents:getProjects', id),
    getMessages:   (id) => ipcRenderer.invoke('agents:get-messages', id),
    editMessage:   (id, messageId, text) => ipcRenderer.invoke('agents:edit-message', id, messageId, text),
    regenerate:    (id, fromMessageId) => ipcRenderer.invoke('agents:regenerate', id, fromMessageId),
    deleteMessage: (id, messageId) => ipcRenderer.invoke('agents:delete-message', id, messageId),
    readSettings:  (id) => ipcRenderer.invoke('agents:readSettings', id),
    writeSettings: (id, patch) => ipcRenderer.invoke('agents:writeSettings', id, patch),
    reveal:        (id) => ipcRenderer.invoke('agents:reveal', id),
    forkFromSettings: (sourceAgentId, data) =>
      ipcRenderer.invoke('agents:forkFromSettings', sourceAgentId, data),

    // `agent:${id}:event` forwards every `AdapterEvent` variant. The full
    // discriminated union now spans (per implementation.md Phase 1.1):
    //   - Lifecycle: boot-step, ready, error, usage
    //   - Message I/O: message-start, text-delta, message-end
    //   - Thinking: thinking-start, thinking-delta, thinking-end
    //   - Tool calls (assistant-side): tool-call-start, tool-call-delta, tool-call-end
    //   - Tool execution (host-side): tool-execution-start, tool-execution-update, tool-execution-end
    //   - Compaction: compaction-start, compaction-end
    //   - Retry: auto-retry-start, auto-retry-end
    //   - Attachments: image-attachment, branch-summary
    //   - Diagnostics: log
    onEvent:    (id, cb) => subscribe(`agent:${id}:event`,    cb),
    onStatus:   (id, cb) => subscribe(`agent:${id}:status`,   cb),
    onMessages: (id, cb) => subscribe(`agent:${id}:messages`, cb),
    onExit:     (id, cb) => subscribe(`agent:${id}:exit`,     cb),
    onSettingsChanged: (id, cb) => subscribe(`settings:${id}:changed`, cb),
  },
  projects: {
    list:   () => ipcRenderer.invoke('projects:list'),
    get:    (id) => ipcRenderer.invoke('projects:get', id),
    create: (data) => ipcRenderer.invoke('projects:create', data),
    update: (id, data) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    addAgent: (projectId, agentId) => ipcRenderer.invoke('projects:addAgent', projectId, agentId),
    removeAgent: (projectId, agentId) => ipcRenderer.invoke('projects:removeAgent', projectId, agentId),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    onUpdateAvailable: (cb) => subscribe('app:update-available', cb),
    onUpdateDownloaded: (cb) => subscribe('app:update-downloaded', cb),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
  },
  channels: {
    create: (input) => ipcRenderer.invoke('channels:create', input),
    get: (id) => ipcRenderer.invoke('channels:get', id),
    list: () => ipcRenderer.invoke('channels:list'),
    appendMessage: (channelId, message) =>
      ipcRenderer.invoke('channels:append-message', channelId, message),
    readMessages: (channelId) => ipcRenderer.invoke('channels:read-messages', channelId),
  },
  settings: {
    getProviders: () => ipcRenderer.invoke('settings:get-providers'),
    setProvider: (input) => ipcRenderer.invoke('settings:set-provider', input),
    deleteProvider: (name) => ipcRenderer.invoke('settings:delete-provider', name),
    ensureProviderCatalog: (input) =>
      ipcRenderer.invoke('settings:ensure-provider-catalog', input),
    getModels: () => ipcRenderer.invoke('settings:get-models'),
    setModelEnabled: (id, enabled) =>
      ipcRenderer.invoke('settings:set-model-enabled', id, enabled),
    addModel: (input) => ipcRenderer.invoke('settings:add-model', input),
    deleteModel: (id) => ipcRenderer.invoke('settings:delete-model', id),
    getEnabledModels: () => ipcRenderer.invoke('settings:get-enabled-models'),

    // `settings:model-updated` fires when the main process auto-fills a
    // ModelEntry's contextWindow from superhive-pi-telemetry (Pi's model
    // registry → HARDCODED_CONTEXT_WINDOWS fallback). Only emitted when the
    // row's previous contextWindow was undefined.
    onModelUpdated: (cb) => subscribe('settings:model-updated', cb),
  },
});