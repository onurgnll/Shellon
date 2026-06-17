const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shellon', {
  // Window
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Clipboard
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  readClipboard: () => ipcRenderer.invoke('clipboard:readText'),

  // Store
  getAll: () => ipcRenderer.invoke('store:getAll'),
  saveAll: (data) => ipcRenderer.invoke('store:saveAll', data),
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('store:saveSettings', settings),

  // Backup
  exportBackup: (filePath, payload, password) =>
    ipcRenderer.invoke('backup:export', { filePath, payload, password }),
  importBackup: (filePath, password) =>
    ipcRenderer.invoke('backup:import', { filePath, password }),

  // Dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),

  // SSH
  sshConnect: (config) => ipcRenderer.invoke('ssh:connect', config),
  sshDisconnect: (sessionId) => ipcRenderer.invoke('ssh:disconnect', sessionId),
  sshWrite: (sessionId, data) => ipcRenderer.invoke('ssh:write', sessionId, data),
  sshResize: (sessionId, cols, rows) => ipcRenderer.invoke('ssh:resize', sessionId, cols, rows),

  // SFTP
  sftpList: (sessionId, path) => ipcRenderer.invoke('sftp:list', sessionId, path),
  sftpDownload: (sessionId, remote, local) => ipcRenderer.invoke('sftp:download', sessionId, remote, local),
  sftpUpload: (sessionId, local, remote) => ipcRenderer.invoke('sftp:upload', sessionId, local, remote),
  sftpMkdir: (sessionId, path) => ipcRenderer.invoke('sftp:mkdir', sessionId, path),
  sftpDelete: (sessionId, path, isDir) => ipcRenderer.invoke('sftp:delete', sessionId, path, isDir),
  sftpRename: (sessionId, oldPath, newPath) => ipcRenderer.invoke('sftp:rename', sessionId, oldPath, newPath),

  // Port forwarding
  forwardPort: (sessionId, config) => ipcRenderer.invoke('ssh:forwardPort', sessionId, config),
  stopForward: (sessionId, forwardId) => ipcRenderer.invoke('ssh:stopForward', sessionId, forwardId),

  // Events
  onSshData: (callback) => {
    const handler = (_, sessionId, data) => callback(sessionId, data);
    ipcRenderer.on('ssh:data', handler);
    return () => ipcRenderer.removeListener('ssh:data', handler);
  },
  onSshClose: (callback) => {
    const handler = (_, sessionId) => callback(sessionId);
    ipcRenderer.on('ssh:close', handler);
    return () => ipcRenderer.removeListener('ssh:close', handler);
  },
  onSshError: (callback) => {
    const handler = (_, sessionId, error) => callback(sessionId, error);
    ipcRenderer.on('ssh:error', handler);
    return () => ipcRenderer.removeListener('ssh:error', handler);
  }
});
