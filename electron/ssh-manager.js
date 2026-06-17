const { Client, utils: { parseKey } } = require('ssh2');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

function formatSshError(err, config = {}) {
  const message = err?.message || 'Bilinmeyen SSH hatası';

  if (message.includes('All configured authentication methods failed')) {
    if (config.authType === 'key') {
      return 'Kimlik doğrulama başarısız. Kullanıcı adı, SSH anahtarı veya passphrase hatalı olabilir.';
    }
    return 'Kimlik doğrulama başarısız. Kullanıcı adı veya şifre hatalı olabilir.';
  }
  if (message.includes('Timed out') || message.includes('ETIMEDOUT')) {
    return 'Bağlantı zaman aşımına uğradı. Host ve port bilgisini kontrol edin.';
  }
  if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
    return 'Sunucu bulunamadı. Host adresini kontrol edin.';
  }
  if (message.includes('ECONNREFUSED')) {
    return 'Bağlantı reddedildi. SSH servisi çalışıyor mu ve port doğru mu kontrol edin.';
  }

  return message;
}

class SSHManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.forwards = new Map();
  }

  _buildSshConfig(config) {
    const sshConfig = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      readyTimeout: 20000,
      keepaliveInterval: (config.keepAlive || 30) * 1000
    };

    const authType = config.authType || 'password';
    const useKey = authType === 'key' || Boolean(config.privateKeyPath);

    if (useKey) {
      if (!config.privateKeyPath) {
        throw new Error('SSH anahtarı seçilmedi. Bağlantı ayarlarından anahtar dosyası belirleyin.');
      }

      const keyPath = path.resolve(config.privateKeyPath);
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Anahtar dosyası bulunamadı: ${config.privateKeyPath}`);
      }

      const keyContent = fs.readFileSync(keyPath, 'utf8');
      if (keyContent.includes('PuTTY-User-Key-File')) {
        throw new Error('PuTTY (.ppk) formatı desteklenmiyor. PuTTYgen ile OpenSSH formatına dönüştürün.');
      }

      const parsedKey = parseKey(keyContent, config.passphrase || undefined);
      if (parsedKey instanceof Error) {
        throw new Error(`SSH anahtarı okunamadı: ${parsedKey.message}. Passphrase doğru mu kontrol edin.`);
      }

      sshConfig.privateKey = keyContent;
      if (config.passphrase) {
        sshConfig.passphrase = config.passphrase;
      }
      return sshConfig;
    }

    if (!config.password) {
      throw new Error('Şifre girilmedi. Bağlantıyı düzenleyip şifreyi ekleyin.');
    }

    sshConfig.password = config.password;
    return sshConfig;
  }

  connect(config) {
    return new Promise((resolve, reject) => {
      const sessionId = uuidv4();
      const client = new Client();
      let sshConfig;

      try {
        sshConfig = this._buildSshConfig(config);
      } catch (err) {
        reject(err);
        return;
      }

      client.on('ready', () => {
        client.shell(
          {
            term: 'xterm-256color',
            cols: config.cols || 80,
            rows: config.rows || 24
          },
          (err, stream) => {
            if (err) {
              client.end();
              reject(err);
              return;
            }

            const session = {
              id: sessionId,
              client,
              stream,
              config,
              sftp: null,
              forwards: new Map()
            };

            stream.on('data', (data) => {
              this.emit('data', sessionId, data.toString('utf8'));
            });

            stream.on('close', () => {
              this.emit('close', sessionId);
              this._cleanupSession(sessionId);
            });

            stream.stderr.on('data', (data) => {
              this.emit('data', sessionId, data.toString('utf8'));
            });

            this.sessions.set(sessionId, session);
            resolve({ sessionId, success: true });
          }
        );
      });

      client.on('error', (err) => {
        const message = formatSshError(err, config);
        this.emit('error', sessionId, message);
        reject(new Error(message));
      });

      client.on('close', () => {
        this.emit('close', sessionId);
        this._cleanupSession(sessionId);
      });

      client.connect(sshConfig);
    });
  }

  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session?.stream) {
      session.stream.write(data);
      return true;
    }
    return false;
  }

  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session?.stream) {
      session.stream.setWindow(rows, cols, 0, 0);
      return true;
    }
    return false;
  }

  disconnect(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      for (const [, forward] of session.forwards) {
        forward.server?.close();
      }
      session.client.end();
      this._cleanupSession(sessionId);
      return true;
    }
    return false;
  }

  disconnectAll() {
    for (const sessionId of this.sessions.keys()) {
      this.disconnect(sessionId);
    }
  }

  _cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      for (const [, forward] of session.forwards) {
        forward.server?.close();
      }
      this.sessions.delete(sessionId);
    }
  }

  _getSftp(sessionId) {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        reject(new Error('Oturum bulunamadı'));
        return;
      }
      if (session.sftp) {
        resolve(session.sftp);
        return;
      }
      session.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        session.sftp = sftp;
        resolve(sftp);
      });
    });
  }

  async sftpList(sessionId, remotePath) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath || '.', (err, list) => {
        if (err) {
          reject(err);
          return;
        }
        const items = list.map((item) => ({
          name: item.filename,
          isDirectory: (item.attrs.mode & 0o40000) === 0o40000,
          size: item.attrs.size,
          modified: item.attrs.mtime * 1000,
          permissions: this._formatPermissions(item.attrs.mode)
        }));
        items.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        resolve(items);
      });
    });
  }

  async sftpDownload(sessionId, remotePath, localPath) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async sftpUpload(sessionId, localPath, remotePath) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async sftpMkdir(sessionId, remotePath) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async sftpDelete(sessionId, remotePath, isDir) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      const method = isDir ? 'rmdir' : 'unlink';
      sftp[method](remotePath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async sftpRename(sessionId, oldPath, newPath) {
    const sftp = await this._getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  forwardPort(sessionId, config) {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        reject(new Error('Oturum bulunamadı'));
        return;
      }

      const forwardId = uuidv4();
      const { type, localPort, remoteHost, remotePort } = config;

      if (type === 'local') {
        const server = net.createServer((socket) => {
          session.client.forwardOut(
            socket.remoteAddress || '127.0.0.1',
            socket.remotePort || 0,
            remoteHost || '127.0.0.1',
            remotePort,
            (err, stream) => {
              if (err) {
                socket.end();
                return;
              }
              socket.pipe(stream).pipe(socket);
            }
          );
        });

        server.listen(localPort, '127.0.0.1', () => {
          session.forwards.set(forwardId, { server, config });
          resolve({ forwardId, localPort });
        });

        server.on('error', reject);
      } else if (type === 'remote') {
        session.client.forwardIn('127.0.0.1', localPort, (err) => {
          if (err) {
            reject(err);
            return;
          }
          session.forwards.set(forwardId, { config });
          resolve({ forwardId, localPort });
        });
      } else {
        reject(new Error('Geçersiz port yönlendirme tipi'));
      }
    });
  }

  stopForward(sessionId, forwardId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    const forward = session.forwards.get(forwardId);
    if (forward) {
      forward.server?.close();
      session.forwards.delete(forwardId);
      return true;
    }
    return false;
  }

  _formatPermissions(mode) {
    const types = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    return (
      types[(mode >> 6) & 7] +
      types[(mode >> 3) & 7] +
      types[mode & 7]
    );
  }
}

module.exports = SSHManager;
