const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('./store');
const SSHManager = require('./ssh-manager');
const cryptoUtil = require('./crypto');

const isDev = process.argv.includes('--dev');
const appIconPath = path.join(__dirname, '..', 'assets', 'appicon.png');
let mainWindow = null;
const store = new Store();
const sshManager = new SSHManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Shellon',
    icon: appIconPath,
    backgroundColor: '#0d1117',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    sshManager.disconnectAll();
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.shellon.app');
  }
  createWindow();
});

app.on('window-all-closed', () => {
  sshManager.disconnectAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

// Clipboard
ipcMain.handle('clipboard:writeText', (_, text) => {
  clipboard.writeText(text);
  return true;
});
ipcMain.handle('clipboard:readText', () => clipboard.readText());

// Data store
ipcMain.handle('store:getAll', () => store.getAll());
ipcMain.handle('store:saveAll', (_, data) => store.saveAll(data));
ipcMain.handle('store:getSettings', () => store.getSettings());
ipcMain.handle('store:saveSettings', (_, settings) => store.saveSettings(settings));

// Encrypted backup
ipcMain.handle('backup:export', async (_, { filePath, payload, password }) => {
  const envelope = cryptoUtil.encryptWithPassword(JSON.stringify(payload), password);
  await fs.promises.writeFile(filePath, JSON.stringify(envelope, null, 2), 'utf8');
  return true;
});

ipcMain.handle('backup:import', async (_, { filePath, password }) => {
  const raw = await fs.promises.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (cryptoUtil.isPlainExportPayload(parsed)) {
    return parsed;
  }

  if (!password) {
    throw new Error('Şifreli yedek için şifre gerekli');
  }

  const plaintext = cryptoUtil.decryptWithPassword(parsed, password);
  return JSON.parse(plaintext);
});

// File dialogs
ipcMain.handle('dialog:openFile', async (_, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'Private Keys', extensions: ['pem', 'ppk', 'key', ''] }
    ],
    ...options
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  return fs.promises.readFile(filePath, 'utf8');
});

ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
  await fs.promises.writeFile(filePath, content, 'utf8');
  return true;
});

// SSH
ipcMain.handle('ssh:connect', async (_, config) => {
  return sshManager.connect(config);
});

ipcMain.handle('ssh:disconnect', async (_, sessionId) => {
  return sshManager.disconnect(sessionId);
});

ipcMain.handle('ssh:write', async (_, sessionId, data) => {
  return sshManager.write(sessionId, data);
});

ipcMain.handle('ssh:resize', async (_, sessionId, cols, rows) => {
  return sshManager.resize(sessionId, cols, rows);
});

// SFTP
ipcMain.handle('sftp:list', async (_, sessionId, remotePath) => {
  return sshManager.sftpList(sessionId, remotePath);
});

ipcMain.handle('sftp:download', async (_, sessionId, remotePath, localPath) => {
  return sshManager.sftpDownload(sessionId, remotePath, localPath);
});

ipcMain.handle('sftp:upload', async (_, sessionId, localPath, remotePath) => {
  return sshManager.sftpUpload(sessionId, localPath, remotePath);
});

ipcMain.handle('sftp:mkdir', async (_, sessionId, remotePath) => {
  return sshManager.sftpMkdir(sessionId, remotePath);
});

ipcMain.handle('sftp:delete', async (_, sessionId, remotePath, isDir) => {
  return sshManager.sftpDelete(sessionId, remotePath, isDir);
});

ipcMain.handle('sftp:rename', async (_, sessionId, oldPath, newPath) => {
  return sshManager.sftpRename(sessionId, oldPath, newPath);
});

// Port forwarding
ipcMain.handle('ssh:forwardPort', async (_, sessionId, config) => {
  return sshManager.forwardPort(sessionId, config);
});

ipcMain.handle('ssh:stopForward', async (_, sessionId, forwardId) => {
  return sshManager.stopForward(sessionId, forwardId);
});

// Forward SSH events to renderer
function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

sshManager.on('data', (sessionId, data) => sendToRenderer('ssh:data', sessionId, data));
sshManager.on('close', (sessionId) => sendToRenderer('ssh:close', sessionId));
sshManager.on('error', (sessionId, error) => sendToRenderer('ssh:error', sessionId, error));
