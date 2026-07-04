const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  agents: {
    list:   () => ipcRenderer.invoke('agents:list'),
    get:    (id: string) => ipcRenderer.invoke('agents:get', id),
    create: (data: { name: string; role?: string; status?: string }) =>
             ipcRenderer.invoke('agents:create', data),
  },
  projects: {
    list:   () => ipcRenderer.invoke('projects:list'),
    get:    (id: string) => ipcRenderer.invoke('projects:get', id),
    create: (data: { name: string; description?: string }) =>
             ipcRenderer.invoke('projects:create', data),
  },
});
