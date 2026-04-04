const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Navigation bridge for native menu
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (_, id) => callback(id));
  },

  // Credential storage — encrypted via OS keychain through safeStorage
  credentials: {
    get:   (key)  => ipcRenderer.invoke('cred:get', key),
    set:   (map)  => ipcRenderer.invoke('cred:set', map),
    clear: ()     => ipcRenderer.invoke('cred:clear'),
  },
});
