# Shellon

**English** | [Türkçe](README.tr.md)

**Shellon** is a modern SSH terminal and connection manager for Windows. Organize servers in folders, connect with a single click, and combine terminal, SFTP, and port forwarding in one interface.

Connection data is stored only on your computer — nothing is sent to the cloud. Local data is encrypted with AES-256-GCM; backup files are protected with a password you choose.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/Electron-33-47848F)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Connection management
- Organize hosts in folders with drag-and-drop
- Password or SSH key authentication
- Saved key management
- Search, edit, and duplicate connections
- Encrypted export / import (`.shellon`)

### Terminal
- Full terminal emulation powered by xterm.js
- Multiple tabs; middle-click to close a tab
- Select to copy, right-click to paste
- Multiple terminal themes and font options
- Snippets and command history panel

### Remote server tools
- SFTP file manager (upload, download, delete, create folders)
- Local and remote port forwarding
- Keep-alive and automatic reconnection

### Security
- Local data files encrypted with **AES-256-GCM**
- Encryption key protected by **Windows DPAPI** (`safeStorage`)
- Export files encrypted with **PBKDF2 + AES-256-GCM**

---

## Shortcuts

| Action | Shortcut / Behavior |
|--------|---------------------|
| New connection | `Ctrl+T` |
| Close tab | `Ctrl+W` or middle-click on tab |
| Settings | `Ctrl+,` |
| Connect | Double-click a host |
| Context menu | Right-click |
| Copy in terminal | Select text with mouse |
| Paste in terminal | Right-click |

---

## Tech stack

- [Electron](https://www.electronjs.org/) 33
- [ssh2](https://github.com/mscdex/ssh2) — SSH / SFTP
- [xterm.js](https://xtermjs.org/) — Terminal emulation
- [electron-builder](https://www.electron.build/) — Windows packaging

---

## Data storage

| File | Location | Description |
|------|----------|-------------|
| Connections, snippets | `%APPDATA%\shellon\shellon-data.json` | Encrypted |
| Settings | `%APPDATA%\shellon\shellon-settings.json` | Encrypted |
| Encryption key | `%APPDATA%\shellon\.shellon-key` | DPAPI-protected |

Export backups use the `.shellon` extension and require your password on import.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Installation

### Requirements

- Windows 10 / 11 (x64)
- [Node.js](https://nodejs.org/) 18 or later
- npm

### Development setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/USER/shellon.git
cd shellon
npm install
```

Run the app:

```bash
npm start
```

Development mode (DevTools enabled):

```bash
npm run dev
```

### Building Windows installers

Setup wizard (recommended):

```bash
npm run build:setup
```

Output: `dist/Shellon Setup 1.0.0.exe`

Setup + portable together:

```bash
npm run build
```

Portable only:

```bash
npm run build:portable
```

Output: `dist/Shellon 1.0.0.exe`

### End-user installation

1. Run `Shellon Setup 1.0.0.exe`
2. Complete the setup wizard
3. Launch **Shellon** from the desktop or Start menu

> If the app is not code-signed, Windows SmartScreen may show a warning. Choose **More info** → **Run anyway**.

### First steps

1. Click **+** in the sidebar to add a new connection
2. Enter host, username, and password or SSH key
3. Save and double-click the host to connect
