const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { app, safeStorage } = require('electron');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const SALT_LEN = 16;
const KEY_LEN = 32;
const PBKDF2_ITERS = 310000;
const ENVELOPE_VERSION = 1;
const EXPORT_FORMAT = 'shellon-export';
const KEY_FILE = '.shellon-key';

function getMachineFallbackKey() {
  return crypto.pbkdf2Sync(
    `${os.hostname()}:${os.userInfo().username}:shellon`,
    'shellon-fallback-v1',
    100000,
    KEY_LEN,
    'sha256'
  );
}

function getAppKey() {
  const keyPath = path.join(app.getPath('userData'), KEY_FILE);

  if (fs.existsSync(keyPath)) {
    const blob = fs.readFileSync(keyPath);
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return Buffer.from(safeStorage.decryptString(blob), 'hex');
      } catch {
        throw new Error('Uygulama şifre anahtarı okunamadı');
      }
    }
    try {
      return Buffer.from(blob.toString('utf8'), 'hex');
    } catch {
      return getMachineFallbackKey();
    }
  }

  const key = crypto.randomBytes(KEY_LEN);
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(keyPath, safeStorage.encryptString(key.toString('hex')));
  } else {
    fs.writeFileSync(keyPath, key.toString('hex'), 'utf8');
  }
  return key;
}

function encryptWithKey(plaintext, key) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    version: ENVELOPE_VERSION,
    encrypted: true,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decryptWithKey(envelope, key) {
  if (!envelope?.encrypted || !envelope.iv || !envelope.tag || !envelope.data) {
    throw new Error('Geçersiz şifreli veri formatı');
  }

  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const data = Buffer.from(envelope.data, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function encryptWithPassword(plaintext, password) {
  if (!password) {
    throw new Error('Şifre gerekli');
  }

  const salt = crypto.randomBytes(SALT_LEN);
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERS, KEY_LEN, 'sha256');
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    format: EXPORT_FORMAT,
    version: ENVELOPE_VERSION,
    encrypted: true,
    kdf: 'pbkdf2-sha256',
    iterations: PBKDF2_ITERS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decryptWithPassword(envelope, password) {
  if (!password) {
    throw new Error('Şifre gerekli');
  }

  if (!envelope?.encrypted) {
    throw new Error('Dosya şifreli değil');
  }

  const salt = Buffer.from(envelope.salt, 'base64');
  const iterations = envelope.iterations || PBKDF2_ITERS;
  const key = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, 'sha256');
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const data = Buffer.from(envelope.data, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Yanlış şifre veya bozuk yedek dosyası');
  }
}

function isEncryptedEnvelope(parsed) {
  return Boolean(parsed?.encrypted && parsed?.data && parsed?.iv && parsed?.tag);
}

function isPlainDataFile(parsed) {
  return parsed && typeof parsed === 'object' && !parsed.encrypted &&
    (Array.isArray(parsed.folders) || Array.isArray(parsed.connections) ||
      parsed.keepAliveInterval !== undefined || parsed.theme !== undefined);
}

function isPlainExportPayload(parsed) {
  return parsed && typeof parsed === 'object' && !parsed.encrypted &&
    Array.isArray(parsed.folders) && Array.isArray(parsed.connections);
}

function readEncryptedFile(filePath, key) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (isEncryptedEnvelope(parsed)) {
    return JSON.parse(decryptWithKey(parsed, key));
  }

  if (isPlainDataFile(parsed)) {
    return parsed;
  }

  throw new Error('Tanınmayan veri dosyası formatı');
}

function writeEncryptedFile(filePath, data, key) {
  const envelope = encryptWithKey(JSON.stringify(data), key);
  fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf8');
}

module.exports = {
  getAppKey,
  encryptWithPassword,
  decryptWithPassword,
  isEncryptedEnvelope,
  isPlainDataFile,
  isPlainExportPayload,
  readEncryptedFile,
  writeEncryptedFile
};
