// ============================================================
// IPC BRIDGE — exposes window.api to the renderer (contextBridge)
//
// The exposed object's shape is the canonical `ElectronAPI` type from
// `src/types/electron.d.ts` (Step 4 type home). Removing `@ts-nocheck`
// here makes drift between the bridge and the renderer contract a
// build error, so a missing method (like the 8 that hid the Manage
// tab bug) can't recur.
// ============================================================
import type { ElectronAPI } from '@/types/electron'

const { contextBridge, ipcRenderer } = require('electron')

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_event: unknown, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api: ElectronAPI = {
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
    readSettings:  (id) => ipcRenderer.invoke('agents:readSettings', id),
    writeSettings: (id, patch) => ipcRenderer.invoke('agents:writeSettings', id, patch),
    // 4-file truth split — per-file channels. Each reads or writes a
    // single sibling file under <agentDir>/. truth migrates the legacy
    // Superhive-pi-*.json on first launch; these channels always operate
    // on the new layout.
    readManage:    (id) => ipcRenderer.invoke('agents:readManage', id),
    writeManage:   (id, patch) => ipcRenderer.invoke('agents:writeManage', id, patch),
    readOverview:  (id) => ipcRenderer.invoke('agents:readOverview', id),
    writeOverview: (id, patch) => ipcRenderer.invoke('agents:writeOverview', id, patch),
    readInbox:     (id) => ipcRenderer.invoke('agents:readInboxFile', id),
    appendInbox:   (id, input) => ipcRenderer.invoke('agents:appendInbox', id, input),
    markInboxRead: (id, inboxId, answeredWith) =>
      ipcRenderer.invoke('agents:markInboxRead', id, inboxId, answeredWith),
    clearInbox:    (id, status) => ipcRenderer.invoke('agents:clearInbox', id, status),
    reveal:        (id) => ipcRenderer.invoke('agents:reveal', id),
    persistAssistantMessage: (id, message) =>
      ipcRenderer.invoke('agents:persistAssistantMessage', id, message),

    spawnFromTemplate: (input) =>
      ipcRenderer.invoke('agents:spawn-from-template', input),

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
    onCreated: (id, cb) => subscribe(`agent:${id}:created`, cb),
    // `agents:changed` is broadcast by `agents-fs-watcher` after every
    // reconcile pass (boot + every debounced fs event). Consumers re-fetch
    // via `agents.list()` to pull the current state of `db.agents.json`,
    // which the watcher keeps in sync with the filesystem.
    onChanged: (cb) => subscribe('agents:changed', cb),
  },
  projects: {
    list:   () => ipcRenderer.invoke('projects:list'),
    get:    (id) => ipcRenderer.invoke('projects:get', id),
    create: (data) => ipcRenderer.invoke('projects:create', data),
    update: (id, data) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    addAgent: (projectId, agentId) => ipcRenderer.invoke('projects:addAgent', projectId, agentId),
    removeAgent: (projectId, agentId) => ipcRenderer.invoke('projects:removeAgent', projectId, agentId),
    reveal: (id) => ipcRenderer.invoke('projects:reveal', id),
    onChanged: (cb) => subscribe('projects:changed', cb),
    // `projects:folder-missing` carries the list of project rows that were
    // hard-deleted because their folder vanished (Finder delete, move,
    // unmounted drive). The toast hook consumes this to surface one toast
    // per deletion. Separate channel from `projects:changed` so list
    // re-fetch logic doesn't have to inspect payloads.
    onFolderMissing: (cb) => subscribe('projects:folder-missing', cb),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    onUpdateAvailable: (cb) => subscribe('app:update-available', cb),
    onUpdateDownloaded: (cb) => subscribe('app:update-downloaded', cb),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
  },
  settings: {
    getProviders: () => ipcRenderer.invoke('settings:get-providers'),
    setProvider: (input) => ipcRenderer.invoke('settings:set-provider', input),
    deleteProvider: (name) => ipcRenderer.invoke('settings:delete-provider', name),
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
  tasks: {
    list:   (filter) => ipcRenderer.invoke('tasks:list', filter),
    get:    (id) => ipcRenderer.invoke('tasks:get', id),
    create: (data) => ipcRenderer.invoke('tasks:create', data),
    update: (id, patch) => ipcRenderer.invoke('tasks:update', id, patch),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    assign: (taskId, agentId) => ipcRenderer.invoke('tasks:assign', taskId, agentId),
    changeStatus: (taskId, status, outcome) => ipcRenderer.invoke('tasks:changeStatus', taskId, status, outcome),
    // `tasks:changed` is broadcast by the tasks fs-watcher on every
    // db.tasks.json write. Consumers re-fetch via `tasks.list()`.
    onChanged: (cb) => subscribe('tasks:changed', cb),
  },
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    get: (id) => ipcRenderer.invoke('templates:get', id),
    openFolder: () => ipcRenderer.invoke('templates:open-folder'),
  },
}

contextBridge.exposeInMainWorld('api', api)
