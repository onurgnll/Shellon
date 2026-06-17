const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const cryptoUtil = require('./crypto');

class Store {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'shellon-data.json');
    this.settingsPath = path.join(userDataPath, 'shellon-settings.json');
    this.appKey = cryptoUtil.getAppKey();
    this._migrateLegacyFiles(userDataPath);
    this._ensureDefaults();
    this._migratePlaintextFiles();
  }

  _migrateLegacyFiles(userDataPath) {
    const legacyFiles = [
      ['terminalus-data.json', 'shellon-data.json'],
      ['terminalus-settings.json', 'shellon-settings.json']
    ];

    legacyFiles.forEach(([oldName, newName]) => {
      const oldPath = path.join(userDataPath, oldName);
      const newPath = path.join(userDataPath, newName);
      if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
      }
    });
  }

  _readRaw(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return null;
    }
  }

  _migratePlaintextFiles() {
    [this.dataPath, this.settingsPath].forEach((filePath) => {
      if (!fs.existsSync(filePath)) return;
      const parsed = this._readRaw(filePath);
      if (!parsed || cryptoUtil.isEncryptedEnvelope(parsed)) return;

      if (cryptoUtil.isPlainDataFile(parsed)) {
        cryptoUtil.writeEncryptedFile(filePath, parsed, this.appKey);
      }
    });
  }

  _ensureDefaults() {
    if (!fs.existsSync(this.dataPath)) {
      this.saveAll({
        folders: [],
        connections: [],
        snippets: [],
        keys: [],
        commandHistory: []
      });
    }
    if (!fs.existsSync(this.settingsPath)) {
      this.saveSettings({
        theme: 'dark',
        appTheme: 'dark',
        fontSize: 14,
        fontFamily: 'cascadia',
        terminalTheme: 'termius',
        keepAliveInterval: 30,
        defaultPort: 22,
        confirmOnClose: true,
        autoReconnect: false,
        bottomPanelHeight: 280
      });
    }
  }

  _read(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      return cryptoUtil.readEncryptedFile(filePath, this.appKey);
    } catch {
      return null;
    }
  }

  _write(filePath, data) {
    cryptoUtil.writeEncryptedFile(filePath, data, this.appKey);
    return data;
  }

  getAll() {
    return this._read(this.dataPath);
  }

  saveAll(data) {
    this._write(this.dataPath, data);
    return data;
  }

  getSettings() {
    return this._read(this.settingsPath);
  }

  saveSettings(settings) {
    this._write(this.settingsPath, settings);
    return settings;
  }
}

module.exports = Store;
