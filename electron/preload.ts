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
    readSettings:  (id) => ipcRenderer.invoke('agents:readSettings', id),
    writeSettings: (id, patch) => ipcRenderer.invoke('agents:writeSettings', id, patch),

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
});