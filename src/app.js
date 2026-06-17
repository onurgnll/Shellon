// Shellon - Main Application
(() => {
  'use strict';

  const api = window.shellon;

  // State
  let data = { folders: [], connections: [], snippets: [], keys: [], commandHistory: [] };
  let settings = {};
  let tabs = [];
  let activeTabId = null;
  let contextTarget = null;
  let selectedColor = '#58a6ff';
  let authType = 'password';
  let currentSftpPath = '/';
  let currentSftpSession = null;
  let currentHomeFolderId = '';
  let rightPanelOpen = true;
  let bottomPanelHeight = 280;

  const HOME_TAB_ID = 'home';
  const MIN_BOTTOM_PANEL_HEIGHT = 120;
  const MAX_BOTTOM_PANEL_RATIO = 0.75;
  const MAX_COMMAND_HISTORY = 100;

  function isHomeTab(tab) {
    return tab?.type === 'home' || tab?.id === HOME_TAB_ID;
  }

  function getConnectionTabs() {
    return tabs.filter((t) => !isHomeTab(t));
  }

  function getActiveConnectionTab() {
    const tab = tabs.find((t) => t.id === activeTabId);
    return isHomeTab(tab) ? null : tab;
  }

  function initTabs() {
    tabs = [{ id: HOME_TAB_ID, type: 'home', label: 'Home' }];
    activeTabId = HOME_TAB_ID;
    renderTabs();
    switchTab(HOME_TAB_ID);
  }

  const terminalThemes = {
    termius: {
      background: '#0d1117', foreground: '#e6edf3', cursor: '#58a6ff',
      selectionBackground: '#388bfd40',
      black: '#484f58', red: '#f85149', green: '#3fb950', yellow: '#d29922',
      blue: '#58a6ff', magenta: '#bc8cff', cyan: '#39d353', white: '#e6edf3',
      brightBlack: '#6e7681', brightRed: '#ff7b72', brightGreen: '#56d364',
      brightYellow: '#e3b341', brightBlue: '#79b8ff', brightMagenta: '#d2a8ff',
      brightCyan: '#56d364', brightWhite: '#ffffff'
    },
    dracula: {
      background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2',
      selectionBackground: '#44475a',
      black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
      blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
      brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
      brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
      brightCyan: '#a4ffff', brightWhite: '#ffffff'
    },
    monokai: {
      background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f0',
      selectionBackground: '#49483e',
      black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
      blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2',
      brightBlack: '#75715e', brightRed: '#f92672', brightGreen: '#a6e22e',
      brightYellow: '#e6db74', brightBlue: '#66d9ef', brightMagenta: '#ae81ff',
      brightCyan: '#a1efe4', brightWhite: '#f9f8f5'
    },
    'solarized-dark': {
      background: '#002b36', foreground: '#839496', cursor: '#839496',
      selectionBackground: '#073642',
      black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
      blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
      brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#586e75',
      brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
      brightCyan: '#93a1a1', brightWhite: '#fdf6e3'
    },
    'one-dark': {
      background: '#282c34', foreground: '#abb2bf', cursor: '#abb2bf',
      selectionBackground: '#3e4451',
      black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
      blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
      brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379',
      brightYellow: '#e5c07b', brightBlue: '#61afef', brightMagenta: '#c678dd',
      brightCyan: '#56b6c2', brightWhite: '#ffffff'
    },
    'gruvbox-dark': {
      background: '#282828', foreground: '#ebdbb2', cursor: '#ebdbb2',
      selectionBackground: '#504945',
      black: '#282828', red: '#fb4934', green: '#b8bb26', yellow: '#fabd2f',
      blue: '#83a598', magenta: '#d3869b', cyan: '#8ec07c', white: '#ebdbb2',
      brightBlack: '#928374', brightRed: '#fb4934', brightGreen: '#b8bb26',
      brightYellow: '#fabd2f', brightBlue: '#83a598', brightMagenta: '#d3869b',
      brightCyan: '#8ec07c', brightWhite: '#fbf1c7'
    },
    'github-dark': {
      background: '#0d1117', foreground: '#c9d1d9', cursor: '#c9d1d9',
      selectionBackground: '#264f78',
      black: '#484f58', red: '#ff7b72', green: '#3fb950', yellow: '#d29922',
      blue: '#58a6ff', magenta: '#bc8cff', cyan: '#39c5cf', white: '#c9d1d9',
      brightBlack: '#6e7681', brightRed: '#ffa198', brightGreen: '#56d364',
      brightYellow: '#e3b341', brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd', brightWhite: '#ffffff'
    },
    light: {
      background: '#ffffff', foreground: '#1f2328', cursor: '#1f2328',
      selectionBackground: '#0969da26',
      black: '#24292f', red: '#cf222e', green: '#116329', yellow: '#4d2d00',
      blue: '#0969da', magenta: '#8250df', cyan: '#1b7c83', white: '#6e7781',
      brightBlack: '#57606a', brightRed: '#a40e26', brightGreen: '#116329',
      brightYellow: '#633c01', brightBlue: '#0550ae', brightMagenta: '#8250df',
      brightCyan: '#0969da', brightWhite: '#1f2328'
    }
  };

  const FONT_OPTIONS = {
    cascadia: { label: 'Cascadia Code', value: "'Cascadia Code', 'Cascadia Mono', Consolas, monospace" },
    consolas: { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
    fira: { label: 'Fira Code', value: "'Fira Code', monospace" },
    jetbrains: { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    source: { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    ibm: { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
    roboto: { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
    courier: { label: 'Courier New', value: "'Courier New', Courier, monospace" },
    lucida: { label: 'Lucida Console', value: "'Lucida Console', Monaco, monospace" },
    monospace: { label: 'Sistem Monospace', value: "ui-monospace, 'Cascadia Code', Consolas, 'Courier New', monospace" }
  };

  function getTerminalTheme(name) {
    return terminalThemes[name] || terminalThemes.termius;
  }

  function resolveFontFamily(keyOrValue) {
    if (FONT_OPTIONS[keyOrValue]) return FONT_OPTIONS[keyOrValue].value;
    const entry = Object.values(FONT_OPTIONS).find((f) => f.value === keyOrValue);
    if (entry) return entry.value;
    if (typeof keyOrValue === 'string' && keyOrValue.includes(',')) return keyOrValue;
    return FONT_OPTIONS.cascadia.value;
  }

  function getFontKey(keyOrValue) {
    if (FONT_OPTIONS[keyOrValue]) return keyOrValue;
    const entry = Object.entries(FONT_OPTIONS).find(([, f]) => f.value === keyOrValue);
    return entry ? entry[0] : 'cascadia';
  }

  function populateFontSelect() {
    const select = $('#setting-font-family');
    if (!select) return;
    select.innerHTML = Object.entries(FONT_OPTIONS).map(([key, { label }]) =>
      `<option value="${key}">${label}</option>`
    ).join('');
  }

  function updateFontPreview() {
    const preview = $('#font-preview');
    const box = $('#font-preview-box');
    if (!preview) return;

    const fontKey = $('#setting-font-family')?.value || getFontKey(settings.fontFamily);
    const fontSize = parseInt($('#setting-font-size')?.value) || settings.fontSize || 14;
    const terminalThemeName = $('#setting-terminal-theme')?.value || settings.terminalTheme || 'termius';
    const theme = getTerminalTheme(terminalThemeName);

    preview.style.fontFamily = resolveFontFamily(fontKey);
    preview.style.fontSize = fontSize + 'px';
    preview.style.color = theme.foreground;
    if (box) {
      box.style.background = theme.background;
      box.style.borderColor = theme.brightBlack || theme.black || 'var(--border)';
    }
  }

  function applyTerminalSettings(tab) {
    if (!tab?.terminal) return;
    const theme = getTerminalTheme(settings.terminalTheme);
    const fontSize = parseInt(settings.fontSize) || 14;
    const fontFamily = resolveFontFamily(settings.fontFamily);

    tab.terminal.options.theme = { ...theme };
    tab.terminal.options.fontSize = fontSize;
    tab.terminal.options.fontFamily = fontFamily;
    if (tab.terminal.rows > 0) {
      tab.terminal.refresh(0, tab.terminal.rows - 1);
    }
    fitTerminal(tab);
  }

  // Utilities
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showToast(message, type = 'info') {
    let container = $('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  let cryptoModalResolver = null;

  function showModal(id) { $(`#${id}`).style.display = 'flex'; }
  function hideModal(id) {
    if (id === 'crypto-modal' && cryptoModalResolver) {
      const resolve = cryptoModalResolver;
      cryptoModalResolver = null;
      resolve(null);
    }
    const el = $(`#${id}`);
    if (el) el.style.display = 'none';
  }

  function promptBackupPassword({ title, hint, confirm = false }) {
    return new Promise((resolve) => {
      cryptoModalResolver = resolve;
      $('#crypto-modal-title').textContent = title;
      $('#crypto-modal-hint').textContent = hint;
      $('#crypto-password').value = '';
      $('#crypto-password-confirm').value = '';
      $('#crypto-confirm-group').style.display = confirm ? 'block' : 'none';
      resetPasswordToggles();
      showModal('crypto-modal');
      setTimeout(() => $('#crypto-password').focus(), 0);
    });
  }

  function submitBackupPassword() {
    const password = $('#crypto-password').value;
    const needsConfirm = $('#crypto-confirm-group').style.display !== 'none';

    if (!password) {
      showToast('Şifre gerekli', 'error');
      return;
    }
    if (needsConfirm && password !== $('#crypto-password-confirm').value) {
      showToast('Şifreler eşleşmiyor', 'error');
      return;
    }

    const resolve = cryptoModalResolver;
    cryptoModalResolver = null;
    hideModal('crypto-modal');
    if (resolve) resolve(password);
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  async function saveData() {
    await api.saveAll(data);
  }

  // Data Loading
  async function loadData() {
    data = await api.getAll();
    settings = await api.getSettings();
    if (!data.folders) data.folders = [];
    if (!data.connections) data.connections = [];
    if (!data.snippets) data.snippets = [];
    if (!data.keys) data.keys = [];
    if (!data.commandHistory) data.commandHistory = [];
    const historyBefore = data.commandHistory.length;
    data.commandHistory = data.commandHistory.filter((h) => isValidHistoryCommand(h.command));
    if (data.commandHistory.length !== historyBefore) {
      await saveData();
    }
    renderHostsTree();
    renderHomeView();
    applySettings();
  }

  function applySettings() {
    const appTheme = settings.appTheme || settings.theme || 'dark';
    document.documentElement.setAttribute('data-app-theme', appTheme);
    if (settings.bottomPanelHeight) {
      setBottomPanelHeight(settings.bottomPanelHeight, false);
    }
    getConnectionTabs().forEach(applyTerminalSettings);
  }

  function setBottomPanelHeight(height, fitActive = true) {
    const maxHeight = Math.floor(window.innerHeight * MAX_BOTTOM_PANEL_RATIO);
    bottomPanelHeight = Math.min(maxHeight, Math.max(MIN_BOTTOM_PANEL_HEIGHT, height));
    const panel = $('#bottom-panel');
    if (panel) panel.style.height = `${bottomPanelHeight}px`;
    if (fitActive) {
      const tab = getActiveConnectionTab();
      if (tab) fitTerminal(tab);
    }
  }

  function initBottomPanelResize() {
    const handle = $('#panel-resize-handle');
    const panel = $('#bottom-panel');
    if (!handle || !panel) return;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = panel.offsetHeight;
      handle.classList.add('dragging');
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      const onMove = (ev) => {
        const delta = startY - ev.clientY;
        setBottomPanelHeight(startHeight + delta);
      };

      const onUp = async () => {
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        settings.bottomPanelHeight = bottomPanelHeight;
        await api.saveSettings(settings);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    window.addEventListener('resize', () => {
      if ($('#bottom-panel')?.style.display !== 'none') {
        setBottomPanelHeight(bottomPanelHeight, true);
      }
    });
  }

  function showBottomPanel() {
    setBottomPanelHeight(settings.bottomPanelHeight || bottomPanelHeight, true);
    $('#bottom-panel').style.display = 'flex';
  }

  // Drag & Drop — move connections to folders
  let isDraggingConnection = false;

  async function moveConnectionToFolder(connId, folderId) {
    const conn = data.connections.find((c) => c.id === connId);
    if (!conn) return;

    const targetFolderId = folderId || '';
    if ((conn.folderId || '') === targetFolderId) return;

    conn.folderId = targetFolderId;
    await saveData();

    const folderName = targetFolderId
      ? data.folders.find((f) => f.id === targetFolderId)?.name
      : null;

    renderHostsTree($('#search-input')?.value || '');
    showToast(
      folderName
        ? `"${conn.label}" → ${folderName} klasörüne taşındı`
        : `"${conn.label}" anasayfaya taşındı`,
      'success'
    );
  }

  function clearDropTargets() {
    $$('.drop-target').forEach((el) => el.classList.remove('drop-target'));
  }

  function onDragStart(e, el) {
    const connId = el.dataset.connId;
    if (!connId) return;
    isDraggingConnection = true;
    e.dataTransfer.setData('text/conn-id', connId);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('is-dragging');
    $('#root-drop-zone')?.classList.add('visible');
  }

  function onDragEnd(el) {
    isDraggingConnection = false;
    el.classList.remove('is-dragging');
    $('#root-drop-zone')?.classList.remove('visible');
    clearDropTargets();
  }

  function bindDropTarget(el, folderId) {
    if (!el || el.dataset.dropBound) return;
    el.dataset.dropBound = '1';

    el.addEventListener('dragover', (e) => {
      if (!isDraggingConnection) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      clearDropTargets();
      el.classList.add('drop-target');
    });

    el.addEventListener('dragleave', (e) => {
      if (!el.contains(e.relatedTarget)) {
        el.classList.remove('drop-target');
      }
    });

    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('drop-target');
      const connId = e.dataTransfer.getData('text/conn-id');
      if (connId) await moveConnectionToFolder(connId, folderId);
    });
  }

  function bindDraggableConnections(selector) {
    $$(selector).forEach((el) => {
      el.setAttribute('draggable', 'true');

      el.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        onDragStart(e, el);
      });

      el.addEventListener('dragend', () => onDragEnd(el));
    });
  }

  function bindAllDropTargets() {
    $$('.folder-header:not([data-drop-bound])').forEach((el) => bindDropTarget(el, el.dataset.folderId));
    $$('.folder-children:not([data-drop-bound])').forEach((el) => bindDropTarget(el, el.dataset.folderId));
    $$('.home-card.folder-card:not([data-drop-bound])').forEach((el) => bindDropTarget(el, el.dataset.folderId));
    const rootZone = $('#root-drop-zone');
    if (rootZone && !rootZone.dataset.dropBound) bindDropTarget(rootZone, '');
    const rootNav = $('#sidebar-root-nav');
    if (rootNav && !rootNav.dataset.dropBound) bindDropTarget(rootNav, '');
    $$('.breadcrumb-item[data-folder-id=""]:not([data-drop-bound])').forEach((el) => bindDropTarget(el, ''));
  }

  function initDragDrop() {
    const sidebarNav = $('.sidebar-nav');
    if (sidebarNav && !sidebarNav.dataset.dndInit) {
      sidebarNav.dataset.dndInit = '1';
      sidebarNav.addEventListener('dragover', (e) => {
        const target = e.target.closest('.folder-header, .folder-children, #root-drop-zone, #sidebar-root-nav');
        if (!target || !isDraggingConnection) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
    }

    const homeView = $('#home-view');
    if (homeView && !homeView.dataset.dndInit) {
      homeView.dataset.dndInit = '1';
      homeView.addEventListener('dragover', (e) => {
        const target = e.target.closest('.home-card.folder-card, .breadcrumb-item[data-folder-id=""]');
        if (!target || !isDraggingConnection) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
    }
  }

  // Hosts Tree Rendering
  function navigateToFolder(folderId, { switchHome = true } = {}) {
    currentHomeFolderId = folderId || '';
    renderHomeView();
    updateSidebarFolderState();
    if (switchHome && activeTabId !== HOME_TAB_ID) {
      switchTab(HOME_TAB_ID);
    }
  }

  function updateSidebarFolderState() {
    const rootNav = $('#sidebar-root-nav');
    if (rootNav) {
      rootNav.classList.toggle('active', !currentHomeFolderId);
    }

    $$('.folder-header').forEach((el) => {
      const isActive = el.dataset.folderId === currentHomeFolderId;
      el.classList.toggle('active', isActive);
      if (isActive) {
        el.classList.remove('collapsed');
        el.nextElementSibling?.classList.remove('collapsed');
      }
    });
  }

  function renderHostsTree(filter = '') {
    const tree = $('#hosts-tree');
    const q = filter.toLowerCase();
    tree.innerHTML = '';

    const rootConnections = data.connections.filter(
      (c) => !c.folderId && (!q || c.label.toLowerCase().includes(q) || c.host.toLowerCase().includes(q))
    );

    data.folders.forEach((folder) => {
      const folderConns = data.connections.filter(
        (c) => c.folderId === folder.id && (!q || c.label.toLowerCase().includes(q) || c.host.toLowerCase().includes(q))
      );
      if (q && folderConns.length === 0 && !folder.name.toLowerCase().includes(q)) return;

      const folderEl = document.createElement('div');
      folderEl.className = 'tree-folder';
      folderEl.innerHTML = `
        <div class="folder-header${currentHomeFolderId === folder.id ? ' active' : ''}" data-folder-id="${folder.id}">
          <button type="button" class="folder-toggle" title="Genişlet/Daralt" aria-label="Genişlet/Daralt">
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="${folder.color || '#58a6ff'}" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          <span class="folder-name">${escapeHtml(folder.name)}</span>
          <span class="folder-count">${folderConns.length}</span>
        </div>
        <div class="folder-children" data-folder-id="${folder.id}">
          ${folderConns.map((c) => renderHostItem(c)).join('')}
        </div>
      `;
      tree.appendChild(folderEl);
    });

    rootConnections.forEach((conn) => {
      const el = document.createElement('div');
      el.innerHTML = renderHostItem(conn);
      tree.appendChild(el.firstElementChild);
    });

    if (tree.children.length === 0) {
      tree.innerHTML = '<div class="empty-state">Henüz bağlantı yok.<br>Yeni bir bağlantı ekleyin.</div>';
    }

    bindTreeEvents();
    renderHomeView();
    updateSidebarFolderState();
  }

  function renderHomeView() {
    const grid = $('#home-grid');
    const breadcrumb = $('#home-breadcrumb');
    if (!grid) return;

    grid.innerHTML = '';
    breadcrumb.innerHTML = '';

    const crumbs = [{ id: '', name: 'Anasayfa' }];
    if (currentHomeFolderId) {
      const folder = data.folders.find((f) => f.id === currentHomeFolderId);
      if (folder) crumbs.push({ id: folder.id, name: folder.name });
      else currentHomeFolderId = '';
    }

    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-sep';
        sep.textContent = '/';
        breadcrumb.appendChild(sep);
      }
      const btn = document.createElement('button');
      btn.className = `breadcrumb-item${i === crumbs.length - 1 ? ' active' : ''}`;
      btn.dataset.folderId = crumb.id;
      btn.textContent = crumb.name;
      btn.addEventListener('click', () => {
        navigateToFolder(crumb.id, { switchHome: true });
      });
      breadcrumb.appendChild(btn);
    });

    const folders = currentHomeFolderId
      ? []
      : data.folders;

    const connections = data.connections.filter(
      (c) => (c.folderId || '') === currentHomeFolderId
    );

    folders.forEach((folder) => {
      const count = data.connections.filter((c) => c.folderId === folder.id).length;
      const card = document.createElement('div');
      card.className = 'home-card folder-card';
      card.style.setProperty('--card-accent', folder.color || '#58a6ff');
      card.dataset.folderId = folder.id;
      card.innerHTML = `
        <div class="home-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </div>
        <div class="home-card-title">${escapeHtml(folder.name)}</div>
        <div class="home-card-meta">${count} bağlantı</div>
        <div class="home-card-footer">
          <span>Klasör</span>
          <span>→</span>
        </div>
      `;
      grid.appendChild(card);
    });

    connections.forEach((conn) => {
      const isConnected = getConnectionTabs().some((t) => t.connectionId === conn.id && t.connected);
      const card = document.createElement('div');
      card.className = `home-card connection-card${isConnected ? ' connected' : ''}`;
      card.dataset.connId = conn.id;
      card.innerHTML = `
        <div class="home-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div class="home-card-title">${escapeHtml(conn.label)}</div>
        <div class="home-card-meta">${escapeHtml(conn.username)}@${escapeHtml(conn.host)}:${conn.port || 22}</div>
        <div class="home-card-footer">
          <span>${isConnected ? '● Bağlı' : 'SSH'}</span>
          <span>Çift tıkla</span>
        </div>
      `;
      grid.appendChild(card);
    });

    if (folders.length === 0 && connections.length === 0) {
      const title = currentHomeFolderId ? 'Bu klasör boş' : 'Henüz bağlantı yok';
      const desc = currentHomeFolderId
        ? 'Bu klasöre bağlantı ekleyin veya anasayfaya dönün.'
        : 'Başlamak için bir klasör veya bağlantı oluşturun.';
      grid.innerHTML = `
        <div class="home-empty">
          <h3>${title}</h3>
          <p>${desc}</p>
          <div class="home-actions" style="justify-content:center">
            ${!currentHomeFolderId ? '<button class="btn secondary sm" id="home-empty-folder">+ Klasör</button>' : ''}
            <button class="btn primary sm" id="home-empty-connection">+ Bağlantı</button>
          </div>
        </div>
      `;
      $('#home-empty-folder')?.addEventListener('click', () => openFolderModal());
      $('#home-empty-connection')?.addEventListener('click', () => {
        openConnectionModal();
        if (currentHomeFolderId) {
          setTimeout(() => { $('#conn-folder').value = currentHomeFolderId; }, 0);
        }
      });
    }

    bindHomeEvents();
    bindDraggableConnections('.home-card.connection-card');
    bindAllDropTargets();
  }

  function bindHomeEvents() {
    $$('.home-card.folder-card').forEach((el) => {
      el.addEventListener('click', () => {
        if (isDraggingConnection) return;
        navigateToFolder(el.dataset.folderId, { switchHome: false });
      });
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openFolderModal(el.dataset.folderId);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, { type: 'folder', id: el.dataset.folderId });
      });
    });

    $$('.home-card.connection-card').forEach((el) => {
      el.addEventListener('dblclick', () => connectToHost(el.dataset.connId));
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, { type: 'connection', id: el.dataset.connId });
      });
    });
  }

  function showHomeTab() {
    switchTab(HOME_TAB_ID);
  }

  function renderHostItem(conn) {
    const isConnected = getConnectionTabs().some((t) => t.connectionId === conn.id && t.connected);
    return `
      <div class="host-item ${isConnected ? 'connected' : ''}" data-conn-id="${conn.id}" data-type="connection">
        <span class="status-dot"></span>
        <svg class="host-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <div>
          <div class="host-label">${escapeHtml(conn.label)}</div>
          <div class="host-addr">${escapeHtml(conn.username)}@${escapeHtml(conn.host)}:${conn.port || 22}</div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function bindTreeEvents() {
    $$('.folder-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const header = btn.closest('.folder-header');
        if (!header) return;
        header.classList.toggle('collapsed');
        const children = header.nextElementSibling;
        if (children) children.classList.toggle('collapsed');
      });
    });

    $$('.folder-header').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.folder-toggle')) return;
        if (e.detail === 2) {
          openFolderModal(el.dataset.folderId);
          return;
        }
        navigateToFolder(el.dataset.folderId);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, { type: 'folder', id: el.dataset.folderId });
      });
    });

    $$('.host-item').forEach((el) => {
      el.addEventListener('dblclick', () => connectToHost(el.dataset.connId));
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, { type: 'connection', id: el.dataset.connId });
      });
    });

    bindDraggableConnections('.host-item');
    bindAllDropTargets();
  }

  // Context Menu
  function showContextMenu(e, target) {
    contextTarget = target;
    const menu = $('#context-menu');
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    const sftpItem = menu.querySelector('[data-action="sftp"]');
    const forwardItem = menu.querySelector('[data-action="forward"]');
    if (target.type === 'folder') {
      sftpItem.style.display = 'none';
      forwardItem.style.display = 'none';
      menu.querySelector('[data-action="connect"]').style.display = 'none';
      menu.querySelector('[data-action="duplicate"]').style.display = 'none';
    } else {
      sftpItem.style.display = '';
      forwardItem.style.display = '';
      menu.querySelector('[data-action="connect"]').style.display = '';
      menu.querySelector('[data-action="duplicate"]').style.display = '';
    }
  }

  function hideContextMenu() {
    $('#context-menu').style.display = 'none';
    contextTarget = null;
  }

  // Folder Management
  function openFolderModal(folderId = null) {
    const folder = folderId ? data.folders.find((f) => f.id === folderId) : null;
    $('#folder-modal-title').textContent = folder ? 'Klasörü Düzenle' : 'Yeni Klasör';
    $('#folder-id').value = folder?.id || '';
    $('#folder-name').value = folder?.name || '';
    selectedColor = folder?.color || '#58a6ff';
    $$('.color-option').forEach((el) => {
      el.classList.toggle('active', el.dataset.color === selectedColor);
    });
    $('#btn-delete-folder').style.display = folder ? 'block' : 'none';
    showModal('folder-modal');
    $('#folder-name').focus();
  }

  async function saveFolder() {
    const name = $('#folder-name').value.trim();
    if (!name) return;
    const id = $('#folder-id').value;

    if (id) {
      const folder = data.folders.find((f) => f.id === id);
      if (folder) {
        folder.name = name;
        folder.color = selectedColor;
      }
    } else {
      data.folders.push({ id: uuid(), name, color: selectedColor, createdAt: Date.now() });
    }

    await saveData();
    renderHostsTree();
    renderHomeView();
    hideModal('folder-modal');
    showToast('Klasör kaydedildi', 'success');
  }

  async function deleteFolder() {
    const id = $('#folder-id').value;
    if (!id) return;
    if (currentHomeFolderId === id) currentHomeFolderId = '';
    data.connections.forEach((c) => { if (c.folderId === id) c.folderId = ''; });
    data.folders = data.folders.filter((f) => f.id !== id);
    await saveData();
    renderHostsTree();
    renderHomeView();
    hideModal('folder-modal');
    showToast('Klasör silindi', 'info');
  }

  // Connection Management
  function populateFolderSelect() {
    const select = $('#conn-folder');
    select.innerHTML = '<option value="">Anasayfa (klasörsüz)</option>';
    data.folders.forEach((f) => {
      select.innerHTML += `<option value="${f.id}">${escapeHtml(f.name)}</option>`;
    });
  }

  function populateKeySelect() {
    const select = $('#conn-key-select');
    select.innerHTML = '<option value="">Dosyadan seç...</option>';
    data.keys.forEach((k) => {
      select.innerHTML += `<option value="${k.id}">${escapeHtml(k.name)}</option>`;
    });
  }

  function openConnectionModal(connId = null) {
    populateFolderSelect();
    populateKeySelect();
    const conn = connId ? data.connections.find((c) => c.id === connId) : null;
    $('#connection-modal-title').textContent = conn ? 'Bağlantıyı Düzenle' : 'Yeni Bağlantı';
    $('#conn-id').value = conn?.id || '';
    $('#conn-label').value = conn?.label || '';
    $('#conn-folder').value = conn?.folderId || '';
    $('#conn-host').value = conn?.host || '';
    $('#conn-port').value = conn?.port || settings.defaultPort || 22;
    $('#conn-username').value = conn?.username || '';
    $('#conn-password').value = conn?.password || '';
    $('#conn-key-path').value = conn?.privateKeyPath || '';
    $('#conn-passphrase').value = conn?.passphrase || '';
    const matchingKey = data.keys.find((k) => k.path === conn?.privateKeyPath);
    $('#conn-key-select').value = matchingKey?.id || '';
    $('#conn-notes').value = conn?.notes || '';
    authType = conn?.authType || 'password';
    setAuthTab(authType);
    $('#btn-delete-connection').style.display = conn ? 'block' : 'none';
    resetPasswordToggles();
    showModal('connection-modal');
    $('#conn-label').focus();
  }

  function setAuthTab(type) {
    authType = type;
    $$('.auth-tab').forEach((el) => el.classList.toggle('active', el.dataset.auth === type));
    $('#auth-password').style.display = type === 'password' ? 'block' : 'none';
    $('#auth-key').style.display = type === 'key' ? 'block' : 'none';
  }

  function getConnectionFormData() {
    return {
      id: $('#conn-id').value || uuid(),
      label: $('#conn-label').value.trim(),
      folderId: $('#conn-folder').value,
      host: $('#conn-host').value.trim(),
      port: parseInt($('#conn-port').value) || 22,
      username: $('#conn-username').value.trim(),
      authType,
      password: authType === 'password' ? $('#conn-password').value : '',
      privateKeyPath: authType === 'key' ? $('#conn-key-path').value : '',
      passphrase: authType === 'key' ? $('#conn-passphrase').value : '',
      notes: $('#conn-notes').value.trim(),
      createdAt: Date.now()
    };
  }

  async function saveConnection() {
    const conn = getConnectionFormData();
    if (!conn.label || !conn.host || !conn.username) {
      showToast('Lütfen gerekli alanları doldurun', 'error');
      return;
    }
    if (conn.authType === 'password' && !conn.password) {
      showToast('Şifre ile giriş için şifre gerekli', 'error');
      return;
    }
    if (conn.authType === 'key' && !conn.privateKeyPath) {
      showToast('SSH anahtarı ile giriş için anahtar dosyası seçin', 'error');
      return;
    }

    const existing = data.connections.findIndex((c) => c.id === conn.id);
    if (existing >= 0) {
      conn.createdAt = data.connections[existing].createdAt;
      data.connections[existing] = conn;
    } else {
      data.connections.push(conn);
    }

    await saveData();
    renderHostsTree();
    renderHomeView();
    hideModal('connection-modal');
    showToast('Bağlantı kaydedildi', 'success');
    return conn;
  }

  async function deleteConnection() {
    const id = $('#conn-id').value;
    if (!id) return;
    data.connections = data.connections.filter((c) => c.id !== id);
    await saveData();
    renderHostsTree();
    renderHomeView();
    hideModal('connection-modal');
    showToast('Bağlantı silindi', 'info');
  }

  // SSH Connection & Tabs
  async function connectToHost(connId, options = {}) {
    const { forSftp = false } = options;
    const conn = data.connections.find((c) => c.id === connId);
    if (!conn) return null;

    const stayOnTabId = forSftp ? activeTabId : null;

    const tabId = uuid();
    const tab = {
      id: tabId,
      type: 'connection',
      connectionId: connId,
      label: conn.label,
      sessionId: null,
      connected: false,
      connecting: true,
      terminal: null,
      fitAddon: null,
      forwards: [],
      inputBuffer: ''
    };
    tabs.push(tab);
    renderTabs();
    createTerminalPane(tab);

    if (!forSftp) {
      switchTab(tabId);
    }

    try {
      const result = await api.sshConnect({
        host: conn.host,
        port: conn.port || 22,
        username: conn.username,
        authType: conn.authType || 'password',
        password: conn.password,
        privateKeyPath: conn.privateKeyPath,
        passphrase: conn.passphrase,
        keepAlive: settings.keepAliveInterval || 30,
        cols: tab.terminal?.cols || 80,
        rows: tab.terminal?.rows || 24
      });

      tab.sessionId = result.sessionId;
      tab.connected = true;
      tab.connecting = false;
      tab.inputBuffer = '';
      tab.inBracketedPaste = false;
      tab.ignoreInputTracking = false;
      removeConnectingOverlay(tabId);
      renderTabs();
      renderHostsTree();
      renderHomeView();
      fitTerminal(tab);

      if (forSftp) {
        await openSftpPanel(tab);
        if (stayOnTabId) switchTab(stayOnTabId);
        showToast(`SFTP: ${conn.label}`, 'success');
      } else {
        showToast(`${conn.label} bağlantısı kuruldu`, 'success');
      }

      return tab;
    } catch (err) {
      tab.connecting = false;
      tab.connected = false;
      removeConnectingOverlay(tabId);
      if (tab.terminal) {
        tab.terminal.writeln(`\r\n\x1b[31mBağlantı hatası: ${err.message}\x1b[0m`);
      }
      if (!forSftp) {
        showToast(`Bağlantı hatası: ${err.message}`, 'error');
      } else {
        showToast(`SFTP bağlantı hatası: ${err.message}`, 'error');
        if (stayOnTabId) switchTab(stayOnTabId);
      }
      return null;
    }
  }

  async function openSftpFromContext(connId) {
    const existingTab = getConnectionTabs().find(
      (t) => t.connectionId === connId && t.connected && t.sessionId
    );
    if (existingTab) {
      await openSftpPanel(existingTab);
      return;
    }
    await connectToHost(connId, { forSftp: true });
  }

  function fitTerminal(tab) {
    if (!tab?.fitAddon || !tab?.terminal) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tab.fitAddon.fit();
        if (tab.sessionId) {
          api.sshResize(tab.sessionId, tab.terminal.cols, tab.terminal.rows);
        }
      });
    });
  }

  function bindTerminalClipboard(tab, terminal) {
    const terminalEl = terminal.element;
    if (!terminalEl || tab.clipboardBound) return;
    tab.clipboardBound = true;

    terminalEl.addEventListener('mouseup', () => {
      const selection = terminal.getSelection();
      if (selection) {
        api.writeClipboard(selection);
      }
    });

    terminalEl.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      if (!tab.sessionId) return;

      try {
        const text = await api.readClipboard();
        if (text) {
          tab.ignoreInputTracking = true;
          api.sshWrite(tab.sessionId, text.replace(/\r?\n/g, '\r'));
          setTimeout(() => { tab.ignoreInputTracking = false; }, 0);
        }
      } catch {
        showToast('Panoya erişilemedi', 'error');
      }
    });
  }

  function createTerminalPane(tab) {
    const container = $('#terminals-container');

    const pane = document.createElement('div');
    pane.className = 'terminal-pane';
    pane.id = `pane-${tab.id}`;
    pane.innerHTML = `
      <div class="connecting-overlay" id="connecting-${tab.id}">
        <div class="spinner"></div>
      </div>
      <div class="terminal-toolbar">
        <button class="icon-btn sm" title="SFTP" data-action="sftp-tab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
        <button class="icon-btn sm" title="Yeniden Bağlan" data-action="reconnect-tab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
      <div id="term-${tab.id}" class="terminal-host"></div>
    `;
    container.appendChild(pane);

    const termEl = $(`#term-${tab.id}`);
    const terminal = new Terminal({
      theme: { ...getTerminalTheme(settings.terminalTheme) },
      fontSize: parseInt(settings.fontSize) || 14,
      fontFamily: resolveFontFamily(settings.fontFamily),
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowTransparency: true
    });

    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(termEl);
    bindTerminalClipboard(tab, terminal);

    fitTerminal(tab);

    terminal.onData((d) => {
      if (tab.sessionId) api.sshWrite(tab.sessionId, d);
      trackTerminalInput(tab, d);
    });

    const resizeObserver = new ResizeObserver(() => fitTerminal(tab));
    resizeObserver.observe(pane);

    tab.terminal = terminal;
    tab.fitAddon = fitAddon;
    tab.resizeObserver = resizeObserver;

    pane.querySelector('[data-action="sftp-tab"]')?.addEventListener('click', () => openSftpPanel(tab));
    pane.querySelector('[data-action="reconnect-tab"]')?.addEventListener('click', () => {
      if (tab.connectionId) connectToHost(tab.connectionId);
    });
  }

  function removeConnectingOverlay(tabId) {
    const overlay = $(`#connecting-${tabId}`);
    if (overlay) overlay.remove();
  }

  function renderTabs() {
    const tabsEl = $('#tabs');
    tabsEl.innerHTML = tabs.map((tab) => {
      if (isHomeTab(tab)) {
        return `
          <div class="tab tab-home ${tab.id === activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="tab-label">Home</span>
          </div>
        `;
      }
      return `
        <div class="tab ${tab.id === activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
          ${tab.connected ? '<span class="tab-status"></span>' : '<span class="tab-status disconnected"></span>'}
          <span class="tab-label">${escapeHtml(tab.label)}</span>
          <button class="tab-close" data-close-tab="${tab.id}">&times;</button>
        </div>
      `;
    }).join('');

    tabsEl.querySelectorAll('.tab').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close')) return;
        switchTab(el.dataset.tabId);
      });

      el.addEventListener('auxclick', (e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        closeTab(el.dataset.tabId);
      });
    });

    tabsEl.querySelectorAll('[data-close-tab]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(el.dataset.closeTab);
      });
    });
  }

  function switchTab(tabId) {
    activeTabId = tabId;
    const tab = tabs.find((t) => t.id === tabId);

    if (isHomeTab(tab)) {
      $('#home-view').style.display = 'flex';
      $('#terminals-container').style.display = 'none';
      $$('.terminal-pane').forEach((el) => el.classList.remove('active'));
      renderHomeView();
      updateSidebarFolderState();
    } else {
      $('#home-view').style.display = 'none';
      $('#terminals-container').style.display = 'block';
      $$('.terminal-pane').forEach((el) => el.classList.remove('active'));
      const pane = $(`#pane-${tabId}`);
      if (pane) pane.classList.add('active');
      fitTerminal(tab);
    }

    renderTabs();
  }

  async function closeTab(tabId) {
    if (tabId === HOME_TAB_ID) return;

    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.sessionId) {
      await api.sshDisconnect(tab.sessionId);
    }
    if (tab.terminal) tab.terminal.dispose();
    if (tab.resizeObserver) tab.resizeObserver.disconnect();

    const pane = $(`#pane-${tabId}`);
    if (pane) pane.remove();

    tabs = tabs.filter((t) => t.id !== tabId);

    if (activeTabId === tabId) {
      const remaining = getConnectionTabs();
      switchTab(remaining.length ? remaining[remaining.length - 1].id : HOME_TAB_ID);
    }

    if (getConnectionTabs().length === 0) {
      $('#terminals-container').style.display = 'none';
    }

    renderTabs();
    renderHostsTree();
    renderHomeView();
  }

  // SFTP Panel
  async function openSftpPanel(tab) {
    if (!tab?.sessionId) {
      showToast('Önce bir bağlantı kurun', 'error');
      return;
    }
    currentSftpSession = tab.sessionId;
    currentSftpPath = '/';
    showBottomPanel();
    $$('.panel-tab').forEach((el) => el.classList.toggle('active', el.dataset.panel === 'sftp'));
    await renderSftpBrowser();
  }

  async function renderSftpBrowser() {
    const content = $('#panel-content');
    content.innerHTML = `
      <div class="sftp-toolbar">
        <button class="btn secondary sm" id="sftp-up">↑ Üst</button>
        <button class="btn secondary sm" id="sftp-refresh">↻ Yenile</button>
        <button class="btn secondary sm" id="sftp-mkdir">+ Klasör</button>
        <button class="btn secondary sm" id="sftp-upload">↑ Yükle</button>
        <div class="sftp-path" id="sftp-path-display">${escapeHtml(currentSftpPath)}</div>
      </div>
      <div id="sftp-files"><div class="spinner" style="margin:20px auto"></div></div>
    `;

    $('#sftp-up')?.addEventListener('click', () => {
      const parts = currentSftpPath.split('/').filter(Boolean);
      parts.pop();
      currentSftpPath = '/' + parts.join('/');
      if (currentSftpPath !== '/' && !currentSftpPath.endsWith('/')) currentSftpPath = currentSftpPath || '/';
      renderSftpBrowser();
    });

    $('#sftp-refresh')?.addEventListener('click', () => renderSftpBrowser());
    $('#sftp-mkdir')?.addEventListener('click', async () => {
      const name = prompt('Klasör adı:');
      if (!name) return;
      try {
        const path = currentSftpPath === '/' ? `/${name}` : `${currentSftpPath}/${name}`;
        await api.sftpMkdir(currentSftpSession, path);
        showToast('Klasör oluşturuldu', 'success');
        renderSftpBrowser();
      } catch (err) {
        showToast(`Hata: ${err.message}`, 'error');
      }
    });

    $('#sftp-upload')?.addEventListener('click', async () => {
      const localPath = await api.openFile({ filters: [{ name: 'All', extensions: ['*'] }] });
      if (!localPath) return;
      const fileName = localPath.split(/[/\\]/).pop();
      const remotePath = currentSftpPath === '/' ? `/${fileName}` : `${currentSftpPath}/${fileName}`;
      try {
        await api.sftpUpload(currentSftpSession, localPath, remotePath);
        showToast('Dosya yüklendi', 'success');
        renderSftpBrowser();
      } catch (err) {
        showToast(`Yükleme hatası: ${err.message}`, 'error');
      }
    });

    try {
      const items = await api.sftpList(currentSftpSession, currentSftpPath);
      const filesEl = $('#sftp-files');
      if (items.length === 0) {
        filesEl.innerHTML = '<div class="empty-state">Klasör boş</div>';
        return;
      }

      filesEl.innerHTML = `
        <table class="sftp-table">
          <thead><tr><th>Ad</th><th>Boyut</th><th>İzinler</th><th>Değiştirilme</th><th></th></tr></thead>
          <tbody>
            ${items.map((item) => `
              <tr data-name="${escapeHtml(item.name)}" data-is-dir="${item.isDirectory}">
                <td>${item.isDirectory ? '📁' : '📄'} ${escapeHtml(item.name)}</td>
                <td class="file-size">${item.isDirectory ? '-' : formatSize(item.size)}</td>
                <td>${item.permissions}</td>
                <td class="file-date">${formatDate(item.modified)}</td>
                <td>
                  ${!item.isDirectory ? '<button class="btn secondary sm sftp-dl">İndir</button>' : ''}
                  <button class="btn danger sm sftp-del">Sil</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      filesEl.querySelectorAll('tr[data-name]').forEach((row) => {
        const name = row.dataset.name;
        const isDir = row.dataset.isDir === 'true';

        row.addEventListener('dblclick', () => {
          if (isDir) {
            currentSftpPath = currentSftpPath === '/' ? `/${name}` : `${currentSftpPath}/${name}`;
            renderSftpBrowser();
          }
        });

        row.querySelector('.sftp-dl')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          const remotePath = currentSftpPath === '/' ? `/${name}` : `${currentSftpPath}/${name}`;
          const localPath = await api.saveFile({ defaultPath: name });
          if (!localPath) return;
          try {
            await api.sftpDownload(currentSftpSession, remotePath, localPath);
            showToast('Dosya indirildi', 'success');
          } catch (err) {
            showToast(`İndirme hatası: ${err.message}`, 'error');
          }
        });

        row.querySelector('.sftp-del')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(`"${name}" silinsin mi?`)) return;
          const remotePath = currentSftpPath === '/' ? `/${name}` : `${currentSftpPath}/${name}`;
          try {
            await api.sftpDelete(currentSftpSession, remotePath, isDir);
            showToast('Silindi', 'success');
            renderSftpBrowser();
          } catch (err) {
            showToast(`Silme hatası: ${err.message}`, 'error');
          }
        });
      });
    } catch (err) {
      $('#sftp-files').innerHTML = `<div class="empty-state">Hata: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Port Forwarding Panel
  function renderPortForwardPanel() {
    const tab = getActiveConnectionTab();
    const content = $('#panel-content');
    content.innerHTML = `
      <div class="forward-form">
        <div class="form-group">
          <label>Tip</label>
          <select id="fwd-type">
            <option value="local">Local (-L)</option>
            <option value="remote">Remote (-R)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Yerel Port</label>
          <input type="number" id="fwd-local-port" value="8080" min="1" max="65535">
        </div>
        <div class="form-group">
          <label>Uzak Host:Port</label>
          <input type="text" id="fwd-remote" value="127.0.0.1:3306" placeholder="host:port">
        </div>
        <button class="btn primary sm" id="fwd-start">Başlat</button>
      </div>
      <div class="forward-list" id="forward-list">
        ${tab?.forwards?.length ? tab.forwards.map((f) => `
          <div class="forward-item" data-fwd-id="${f.id}">
            <span class="forward-status">● Aktif</span>
            <span class="forward-info">${f.type === 'local' ? 'Local' : 'Remote'} :${f.localPort} → ${f.remoteHost}:${f.remotePort}</span>
            <button class="btn danger sm fwd-stop">Durdur</button>
          </div>
        `).join('') : '<div class="empty-state">Aktif port yönlendirme yok</div>'}
      </div>
    `;

    $('#fwd-start')?.addEventListener('click', async () => {
      if (!tab?.sessionId) {
        showToast('Önce bir bağlantı kurun', 'error');
        return;
      }
      const type = $('#fwd-type').value;
      const localPort = parseInt($('#fwd-local-port').value);
      const remoteParts = $('#fwd-remote').value.split(':');
      const remoteHost = remoteParts[0] || '127.0.0.1';
      const remotePort = parseInt(remoteParts[1]) || 80;

      try {
        const result = await api.forwardPort(tab.sessionId, { type, localPort, remoteHost, remotePort });
        tab.forwards.push({ id: result.forwardId, type, localPort, remoteHost, remotePort });
        showToast(`Port yönlendirme başlatıldı: :${localPort}`, 'success');
        renderPortForwardPanel();
      } catch (err) {
        showToast(`Hata: ${err.message}`, 'error');
      }
    });

    content.querySelectorAll('.fwd-stop').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const item = btn.closest('.forward-item');
        const fwdId = item.dataset.fwdId;
        await api.stopForward(tab.sessionId, fwdId);
        tab.forwards = tab.forwards.filter((f) => f.id !== fwdId);
        showToast('Port yönlendirme durduruldu', 'info');
        renderPortForwardPanel();
      });
    });
  }

  // Snippets & Command History (Right Panel)
  function isValidHistoryCommand(command) {
    const cmd = command.trim();
    if (!cmd || cmd.length > 500) return false;

    if (/^(https?:\/\/|www\.)/i.test(cmd)) return false;
    if (/^\*+\s/.test(cmd)) return false;
    if (/^(welcome to|documentation:|management:|support:|system information|news:|ipv4 address for)/i.test(cmd)) return false;
    if (/expanded security maintenance|software packages|kubernetes|microk8s|ubuntu\.com/i.test(cmd)) return false;

    // Uzun düz metin satırları (MOTD / banner) genelde komut değildir
    if (cmd.length > 80 && /[a-zçğıöşü]{4,}\s+[a-zçğıöşü]{4,}\s+[a-zçğıöşü]{4,}/i.test(cmd)) return false;

    return true;
  }

  function trackTerminalInput(tab, data) {
    if (!tab.inputBuffer) tab.inputBuffer = '';
    if (tab.ignoreInputTracking) return;

    if (data.includes('\x1b[200~')) tab.inBracketedPaste = true;
    if (tab.inBracketedPaste) {
      if (data.includes('\x1b[201~')) tab.inBracketedPaste = false;
      return;
    }

    // Yapıştırma / toplu sunucu metni — geçmişe yazma
    if ((data.length > 20 && (data.includes('\n') || data.includes('\r'))) || data.length > 200) {
      return;
    }

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const code = char.charCodeAt(0);

      if (char === '\r' || char === '\n') {
        const cmd = tab.inputBuffer.trim();
        if (cmd) addCommandHistory(cmd, tab.label);
        tab.inputBuffer = '';
      } else if (char === '\x7f' || char === '\b') {
        tab.inputBuffer = tab.inputBuffer.slice(0, -1);
      } else if (char === '\x03') {
        tab.inputBuffer = '';
      } else if (char === '\x15') {
        tab.inputBuffer = '';
      } else if (code === 27) {
        while (i + 1 < data.length && data.charCodeAt(i + 1) >= 0x40 && data.charCodeAt(i + 1) <= 0x7e) {
          i++;
        }
      } else if (code >= 32 && code !== 127) {
        tab.inputBuffer += char;
      }
    }
  }

  async function addCommandHistory(command, hostLabel = '', { force = false } = {}) {
    const trimmed = command.trim();
    if (!trimmed) return;
    if (!force && !isValidHistoryCommand(trimmed)) return;

    const entry = {
      id: uuid(),
      command: trimmed,
      hostLabel: hostLabel || 'Terminal',
      timestamp: Date.now()
    };

    data.commandHistory = data.commandHistory.filter((h) => h.command !== entry.command || h.hostLabel !== entry.hostLabel);
    data.commandHistory.unshift(entry);
    if (data.commandHistory.length > MAX_COMMAND_HISTORY) {
      data.commandHistory = data.commandHistory.slice(0, MAX_COMMAND_HISTORY);
    }

    await saveData();
    renderRightPanel();
  }

  function runCommandInActiveTab(command, recordHistory = true) {
    const tab = getActiveConnectionTab();
    if (!tab?.sessionId) {
      showToast('Aktif bir terminal bağlantısı yok', 'error');
      return false;
    }
    api.sshWrite(tab.sessionId, command + '\n');
    if (recordHistory) addCommandHistory(command, tab.label, { force: true });
    return true;
  }

  function toggleRightPanel(force) {
    rightPanelOpen = typeof force === 'boolean' ? force : !rightPanelOpen;
    const panel = $('#right-panel');
    const btn = $('#btn-toggle-snippets');
    if (panel) panel.classList.toggle('hidden', !rightPanelOpen);
    if (btn) btn.classList.toggle('active', rightPanelOpen);

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab) fitTerminal(activeTab);
  }

  function renderRightPanel() {
    renderPanelSnippets();
    renderPanelHistory();
  }

  function renderPanelSnippets() {
    const list = $('#panel-snippets-list');
    if (!list) return;

    if (data.snippets.length === 0) {
      list.innerHTML = '<div class="panel-empty">Henüz snippet yok.<br>+ ile yeni snippet ekleyin.</div>';
      return;
    }

    list.innerHTML = data.snippets.map((s) => `
      <div class="panel-snippet-card" data-snippet-id="${s.id}">
        <button class="snippet-edit" data-edit-snippet="${s.id}" title="Düzenle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <div class="snippet-name">${escapeHtml(s.name)}</div>
        <div class="snippet-cmd">${escapeHtml(s.command)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.panel-snippet-card').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.snippet-edit')) return;
        const snippet = data.snippets.find((s) => s.id === el.dataset.snippetId);
        if (snippet && runCommandInActiveTab(snippet.command)) {
          showToast(`Çalıştırıldı: ${snippet.name}`, 'success');
        }
      });
    });

    list.querySelectorAll('[data-edit-snippet]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const snippet = data.snippets.find((s) => s.id === btn.dataset.editSnippet);
        if (!snippet) return;
        openSnippetEditor(snippet);
      });
    });
  }

  async function clearCommandHistory() {
    if (!data.commandHistory?.length) return;
    data.commandHistory = [];
    await saveData();
    renderRightPanel();
    showToast('Komut geçmişi temizlendi', 'info');
  }

  function updateHistoryClearButton() {
    const btn = $('#btn-clear-command-history');
    if (!btn) return;
    btn.disabled = !data.commandHistory?.length;
  }

  function renderPanelHistory() {
    const list = $('#panel-command-history');
    if (!list) return;

    if (!data.commandHistory?.length) {
      list.innerHTML = '<div class="panel-empty">Henüz komut geçmişi yok.<br>Terminalde yazdığınız komutlar burada görünür.</div>';
      updateHistoryClearButton();
      return;
    }

    list.innerHTML = data.commandHistory.map((h) => `
      <div class="panel-history-item" data-history-id="${h.id}">
        <div class="history-meta">
          <span class="history-host">${escapeHtml(h.hostLabel || 'Terminal')}</span>
          <span class="history-time">${formatHistoryTime(h.timestamp)}</span>
        </div>
        <div class="history-cmd">${escapeHtml(h.command)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.panel-history-item').forEach((el) => {
      el.addEventListener('click', () => {
        const entry = data.commandHistory.find((h) => h.id === el.dataset.historyId);
        if (entry && runCommandInActiveTab(entry.command)) {
          showToast('Komut tekrar çalıştırıldı', 'info');
        }
      });
    });

    updateHistoryClearButton();
  }

  function formatHistoryTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function openSnippetEditor(snippet = null) {
    $('#snippet-editor').style.display = 'block';
    $('#snippet-id').value = snippet?.id || '';
    $('#snippet-name').value = snippet?.name || '';
    $('#snippet-command').value = snippet?.command || '';
    showModal('snippets-modal');
  }

  function renderSnippets() {
    const list = $('#snippets-list');
    if (!list) return;
    if (data.snippets.length === 0) {
      list.innerHTML = '<div class="empty-state">Henüz snippet yok</div>';
      return;
    }
    list.innerHTML = data.snippets.map((s) => `
      <div class="snippet-item" data-snippet-id="${s.id}">
        <strong>${escapeHtml(s.name)}</strong>
        <span class="snippet-cmd">${escapeHtml(s.command)}</span>
      </div>
    `).join('');

    list.querySelectorAll('.snippet-item').forEach((el) => {
      el.addEventListener('click', () => {
        const snippet = data.snippets.find((s) => s.id === el.dataset.snippetId);
        if (!snippet) return;
        $('#snippet-editor').style.display = 'block';
        $('#snippet-id').value = snippet.id;
        $('#snippet-name').value = snippet.name;
        $('#snippet-command').value = snippet.command;
      });
      el.addEventListener('dblclick', () => {
        const snippet = data.snippets.find((s) => s.id === el.dataset.snippetId);
        if (snippet && runCommandInActiveTab(snippet.command)) {
          hideModal('snippets-modal');
          showToast(`Snippet çalıştırıldı: ${snippet.name}`, 'success');
        }
      });
    });
    renderRightPanel();
  }

  // Keys
  function renderKeys() {
    const list = $('#keys-list');
    if (data.keys.length === 0) {
      list.innerHTML = '<div class="empty-state">Henüz SSH anahtarı yok</div>';
      return;
    }
    list.innerHTML = data.keys.map((k) => `
      <div class="key-item" data-key-id="${k.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
        <strong>${escapeHtml(k.name)}</strong>
        <span class="snippet-cmd">${escapeHtml(k.path)}</span>
      </div>
    `).join('');

    list.querySelectorAll('.key-item').forEach((el) => {
      el.addEventListener('click', () => {
        const key = data.keys.find((k) => k.id === el.dataset.keyId);
        if (!key) return;
        $('#key-editor').style.display = 'block';
        $('#key-id').value = key.id;
        $('#key-name').value = key.name;
        $('#key-path').value = key.path;
      });
    });
  }

  // Export / Import
  const EXPORT_VERSION = 1;

  function buildExportPayload() {
    return {
      version: EXPORT_VERSION,
      app: 'shellon',
      exportedAt: new Date().toISOString(),
      folders: data.folders.map((f) => ({ ...f })),
      connections: data.connections.map((c) => ({ ...c }))
    };
  }

  function validateImportPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Geçersiz dosya formatı');
    }
    if (!Array.isArray(payload.folders) || !Array.isArray(payload.connections)) {
      throw new Error('Dosyada klasör veya bağlantı listesi bulunamadı');
    }
    return payload;
  }

  function mergeImportedData(imported) {
    const folderIdMap = new Map();
    let addedFolders = 0;
    let updatedFolders = 0;
    let addedConnections = 0;
    let updatedConnections = 0;

    imported.folders.forEach((folder) => {
      if (!folder?.id || !folder?.name) return;
      const existing = data.folders.find((f) => f.id === folder.id);
      if (existing) {
        existing.name = folder.name;
        existing.color = folder.color || existing.color;
        folderIdMap.set(folder.id, existing.id);
        updatedFolders++;
      } else {
        const newFolder = {
          id: folder.id,
          name: folder.name,
          color: folder.color || '#58a6ff',
          createdAt: folder.createdAt || Date.now()
        };
        data.folders.push(newFolder);
        folderIdMap.set(folder.id, newFolder.id);
        addedFolders++;
      }
    });

    imported.connections.forEach((conn) => {
      if (!conn?.host || !conn?.username) return;

      let folderId = conn.folderId || '';
      if (folderId && folderIdMap.has(folderId)) {
        folderId = folderIdMap.get(folderId);
      } else if (folderId && !data.folders.some((f) => f.id === folderId)) {
        folderId = '';
      }

      const normalized = {
        id: conn.id || uuid(),
        label: conn.label || `${conn.username}@${conn.host}`,
        folderId,
        host: conn.host,
        port: conn.port || 22,
        username: conn.username,
        authType: conn.authType || 'password',
        password: conn.password || '',
        privateKeyPath: conn.privateKeyPath || '',
        passphrase: conn.passphrase || '',
        notes: conn.notes || '',
        createdAt: conn.createdAt || Date.now()
      };

      const byId = data.connections.find((c) => c.id === normalized.id);
      const byHost = data.connections.find(
        (c) => c.host === normalized.host && c.username === normalized.username && (c.port || 22) === normalized.port
      );

      if (byId) {
        Object.assign(byId, normalized);
        updatedConnections++;
      } else if (byHost) {
        Object.assign(byHost, normalized, { id: byHost.id });
        updatedConnections++;
      } else {
        data.connections.push(normalized);
        addedConnections++;
      }
    });

    return { addedFolders, updatedFolders, addedConnections, updatedConnections };
  }

  function replaceImportedData(imported) {
    data.folders = imported.folders
      .filter((f) => f?.id && f?.name)
      .map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color || '#58a6ff',
        createdAt: f.createdAt || Date.now()
      }));

    const folderIds = new Set(data.folders.map((f) => f.id));
    data.connections = imported.connections
      .filter((c) => c?.host && c?.username)
      .map((c) => ({
        id: c.id || uuid(),
        label: c.label || `${c.username}@${c.host}`,
        folderId: c.folderId && folderIds.has(c.folderId) ? c.folderId : '',
        host: c.host,
        port: c.port || 22,
        username: c.username,
        authType: c.authType || 'password',
        password: c.password || '',
        privateKeyPath: c.privateKeyPath || '',
        passphrase: c.passphrase || '',
        notes: c.notes || '',
        createdAt: c.createdAt || Date.now()
      }));

    return {
      addedFolders: data.folders.length,
      updatedFolders: 0,
      addedConnections: data.connections.length,
      updatedConnections: 0
    };
  }

  async function exportHosts() {
    const password = await promptBackupPassword({
      title: 'Dışa Aktarma Şifresi',
      hint: 'Yedek dosyasını korumak için bir şifre belirleyin. Import sırasında bu şifre gerekecek.',
      confirm: true
    });
    if (!password) return;

    const date = new Date().toISOString().slice(0, 10);
    const filePath = await api.saveFile({
      defaultPath: `shellon-hosts-${date}.shellon`,
      filters: [
        { name: 'Shellon Şifreli Yedek', extensions: ['shellon'] },
        { name: 'JSON', extensions: ['json'] }
      ]
    });
    if (!filePath) return;

    try {
      const payload = buildExportPayload();
      await api.exportBackup(filePath, payload, password);
      showToast(
        `${payload.folders.length} klasör, ${payload.connections.length} bağlantı şifreli olarak dışa aktarıldı`,
        'success'
      );
    } catch (err) {
      showToast(`Dışa aktarma hatası: ${err.message}`, 'error');
    }
  }

  async function importHosts() {
    const filePath = await api.openFile({
      filters: [
        { name: 'Shellon Şifreli Yedek', extensions: ['shellon', 'json'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ]
    });
    if (!filePath) return;

    let imported;
    try {
      const raw = await api.readFile(filePath);
      const parsed = JSON.parse(raw);
      const needsPassword = parsed?.encrypted && parsed?.format === 'shellon-export';

      if (needsPassword) {
        const password = await promptBackupPassword({
          title: 'İçe Aktarma Şifresi',
          hint: 'Yedek dosyasını oluştururken belirlediğiniz şifreyi girin.',
          confirm: false
        });
        if (!password) return;
        imported = validateImportPayload(await api.importBackup(filePath, password));
      } else {
        imported = validateImportPayload(await api.importBackup(filePath, ''));
      }
    } catch (err) {
      showToast(`Import hatası: ${err.message}`, 'error');
      return;
    }

    const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';

    if (mode === 'replace') {
      const folderCount = data.folders.length;
      const connCount = data.connections.length;
      const msg = `Mevcut ${folderCount} klasör ve ${connCount} bağlantı silinip dosyadaki verilerle değiştirilecek. Emin misiniz?`;
      if (!confirm(msg)) return;
    }

    const stats = mode === 'replace'
      ? replaceImportedData(imported)
      : mergeImportedData(imported);

    await saveData();
    renderHostsTree($('#search-input')?.value || '');

    showToast(
      `Import tamamlandı: ${stats.addedFolders} klasör, ${stats.addedConnections} bağlantı eklendi` +
      (stats.updatedFolders || stats.updatedConnections
        ? `, ${stats.updatedFolders} klasör ve ${stats.updatedConnections} bağlantı güncellendi`
        : ''),
      'success'
    );
  }

  // Settings
  function openSettingsModal() {
    populateFontSelect();
    $('#setting-app-theme').value = settings.appTheme || settings.theme || 'dark';
    $('#setting-terminal-theme').value = settings.terminalTheme || 'termius';
    $('#setting-font-family').value = getFontKey(settings.fontFamily);
    $('#setting-font-size').value = settings.fontSize || 14;
    $('#setting-keepalive').value = settings.keepAliveInterval || 30;
    $('#setting-confirm-close').checked = settings.confirmOnClose !== false;
    $('#setting-auto-reconnect').checked = settings.autoReconnect || false;
    updateFontPreview();
    showModal('settings-modal');
  }

  async function saveSettingsForm() {
    settings = {
      ...settings,
      appTheme: $('#setting-app-theme').value,
      theme: $('#setting-app-theme').value,
      terminalTheme: $('#setting-terminal-theme').value,
      fontFamily: $('#setting-font-family').value,
      fontSize: parseInt($('#setting-font-size').value) || 14,
      keepAliveInterval: parseInt($('#setting-keepalive').value) || 30,
      confirmOnClose: $('#setting-confirm-close').checked,
      autoReconnect: $('#setting-auto-reconnect').checked
    };
    await api.saveSettings(settings);
    applySettings();
    hideModal('settings-modal');
    showToast('Ayarlar kaydedildi', 'success');
  }

  function bindSettingsPreview() {
    ['setting-font-family', 'setting-font-size', 'setting-terminal-theme'].forEach((id) => {
      $(`#${id}`)?.addEventListener('change', updateFontPreview);
      $(`#${id}`)?.addEventListener('input', updateFontPreview);
    });
    $('#setting-app-theme')?.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-app-theme', e.target.value);
    });
  }

  // SSH Event Handlers
  function setupSshEvents() {
    api.onSshData((sessionId, data) => {
      const tab = tabs.find((t) => t.sessionId === sessionId);
      if (tab?.terminal) tab.terminal.write(data);
    });

    api.onSshClose((sessionId) => {
      const tab = tabs.find((t) => t.sessionId === sessionId);
      if (tab) {
        tab.connected = false;
        tab.sessionId = null;
        if (tab.terminal) {
          tab.terminal.writeln('\r\n\x1b[33m[Bağlantı kapatıldı]\x1b[0m');
        }
        renderTabs();
        renderHostsTree();
        renderHomeView();

        if (settings.autoReconnect && tab.connectionId) {
          setTimeout(() => connectToHost(tab.connectionId), 2000);
        }
      }
    });

    api.onSshError((sessionId, error) => {
      const tab = tabs.find((t) => t.sessionId === sessionId);
      if (tab?.terminal) {
        tab.terminal.writeln(`\r\n\x1b[31m[Hata: ${error}]\x1b[0m`);
      }
    });
  }

  function bindPasswordToggles() {
    $$('.password-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.password-field')?.querySelector('input');
        if (!input) return;

        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.classList.toggle('visible', show);
        btn.title = show ? 'Gizle' : 'Göster';
        btn.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
      });
    });
  }

  function resetPasswordToggles() {
    $$('.password-field input').forEach((input) => {
      input.type = 'password';
    });
    $$('.password-toggle').forEach((btn) => {
      btn.classList.remove('visible');
      btn.title = 'Göster';
      btn.setAttribute('aria-label', 'Şifreyi göster');
    });
  }

  // Event Bindings
  function bindEvents() {
    // Window controls
    $('#btn-minimize').addEventListener('click', () => api.minimize());
    $('#btn-maximize').addEventListener('click', () => api.maximize());
    $('#btn-close').addEventListener('click', () => api.close());

    // Sidebar
    $('#btn-new-folder').addEventListener('click', () => openFolderModal());
    $('#btn-new-connection').addEventListener('click', () => openConnectionModal());
    $('#sidebar-root-nav')?.addEventListener('click', () => navigateToFolder(''));
    $('#search-input').addEventListener('input', (e) => renderHostsTree(e.target.value));

    // Welcome screen
    $('#welcome-new-connection').addEventListener('click', () => {
      openConnectionModal();
      if (currentHomeFolderId) {
        setTimeout(() => { $('#conn-folder').value = currentHomeFolderId; }, 0);
      }
    });
    $('#welcome-new-folder').addEventListener('click', () => openFolderModal());

    // Footer buttons
    $('#btn-snippets').addEventListener('click', () => toggleRightPanel());
    $('#btn-toggle-snippets').addEventListener('click', () => toggleRightPanel());
    $('#btn-close-right-panel').addEventListener('click', () => toggleRightPanel(false));
    $('#btn-panel-add-snippet').addEventListener('click', () => openSnippetEditor());
    $('#btn-clear-command-history')?.addEventListener('click', clearCommandHistory);
    $('#btn-keys').addEventListener('click', () => { renderKeys(); showModal('keys-modal'); });
    $('#btn-settings').addEventListener('click', openSettingsModal);

    // Folder modal
    $('#btn-save-folder').addEventListener('click', saveFolder);
    $('#btn-delete-folder').addEventListener('click', deleteFolder);
    $$('.color-option').forEach((el) => {
      el.addEventListener('click', () => {
        selectedColor = el.dataset.color;
        $$('.color-option').forEach((c) => c.classList.remove('active'));
        el.classList.add('active');
      });
    });

    // Connection modal
    $$('.auth-tab').forEach((el) => {
      el.addEventListener('click', () => setAuthTab(el.dataset.auth));
    });
    $('#btn-save-connection').addEventListener('click', saveConnection);
    $('#btn-connect-now').addEventListener('click', async () => {
      const conn = await saveConnection();
      if (conn) connectToHost(conn.id);
    });
    $('#btn-delete-connection').addEventListener('click', deleteConnection);
    $('#btn-browse-key').addEventListener('click', async () => {
      const path = await api.openFile();
      if (path) $('#conn-key-path').value = path;
    });
    $('#conn-key-select').addEventListener('change', (e) => {
      const key = data.keys.find((k) => k.id === e.target.value);
      if (key) $('#conn-key-path').value = key.path;
    });

    // Snippets
    $('#btn-new-snippet').addEventListener('click', () => openSnippetEditor());
    $('#btn-save-snippet').addEventListener('click', async () => {
      const id = $('#snippet-id').value || uuid();
      const name = $('#snippet-name').value.trim();
      const command = $('#snippet-command').value.trim();
      if (!name || !command) return;
      const idx = data.snippets.findIndex((s) => s.id === id);
      const snippet = { id, name, command };
      if (idx >= 0) data.snippets[idx] = snippet;
      else data.snippets.push(snippet);
      await saveData();
      renderSnippets();
      renderRightPanel();
      showToast('Snippet kaydedildi', 'success');
    });
    $('#btn-delete-snippet').addEventListener('click', async () => {
      const id = $('#snippet-id').value;
      if (!id) return;
      data.snippets = data.snippets.filter((s) => s.id !== id);
      await saveData();
      $('#snippet-editor').style.display = 'none';
      renderSnippets();
      renderRightPanel();
    });

    // Keys
    $('#btn-new-key').addEventListener('click', () => {
      $('#key-editor').style.display = 'block';
      $('#key-id').value = '';
      $('#key-name').value = '';
      $('#key-path').value = '';
    });
    $('#btn-browse-key-file').addEventListener('click', async () => {
      const path = await api.openFile();
      if (path) $('#key-path').value = path;
    });
    $('#btn-save-key').addEventListener('click', async () => {
      const id = $('#key-id').value || uuid();
      const name = $('#key-name').value.trim();
      const path = $('#key-path').value.trim();
      if (!name || !path) return;
      const idx = data.keys.findIndex((k) => k.id === id);
      const key = { id, name, path };
      if (idx >= 0) data.keys[idx] = key;
      else data.keys.push(key);
      await saveData();
      renderKeys();
      showToast('Anahtar kaydedildi', 'success');
    });
    $('#btn-delete-key').addEventListener('click', async () => {
      const id = $('#key-id').value;
      if (!id) return;
      data.keys = data.keys.filter((k) => k.id !== id);
      await saveData();
      $('#key-editor').style.display = 'none';
      renderKeys();
    });

    // Settings
    bindSettingsPreview();
    initBottomPanelResize();
    $('#btn-export-hosts').addEventListener('click', exportHosts);
    $('#btn-import-hosts').addEventListener('click', importHosts);
    $('#crypto-modal-confirm').addEventListener('click', submitBackupPassword);
    $('#crypto-password')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBackupPassword();
    });
    $('#btn-save-settings').addEventListener('click', saveSettingsForm);
    $$('[data-close="settings-modal"]').forEach((el) => {
      el.addEventListener('click', () => applySettings());
    });
    $('#settings-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') applySettings();
    });

    // Bottom panel
    $$('.panel-tab').forEach((el) => {
      el.addEventListener('click', () => {
        $$('.panel-tab').forEach((t) => t.classList.remove('active'));
        el.classList.add('active');
        if (el.dataset.panel === 'sftp') renderSftpBrowser();
        else if (el.dataset.panel === 'forward') renderPortForwardPanel();
      });
    });
    $('#btn-close-panel').addEventListener('click', () => {
      $('#bottom-panel').style.display = 'none';
    });

    // Modal close buttons
    $$('[data-close]').forEach((el) => {
      el.addEventListener('click', () => hideModal(el.dataset.close));
    });
    $$('.modal-overlay').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target === el) hideModal(el.id);
      });
    });

    // Context menu
    document.addEventListener('click', hideContextMenu);
    $$('.context-item').forEach((el) => {
      el.addEventListener('click', () => {
        if (!contextTarget) return;
        const action = el.dataset.action;

        if (action === 'connect' && contextTarget.type === 'connection') {
          connectToHost(contextTarget.id);
        } else if (action === 'edit') {
          if (contextTarget.type === 'connection') openConnectionModal(contextTarget.id);
          else openFolderModal(contextTarget.id);
        } else if (action === 'duplicate' && contextTarget.type === 'connection') {
          const conn = data.connections.find((c) => c.id === contextTarget.id);
          if (conn) {
            const copy = { ...conn, id: uuid(), label: conn.label + ' (kopya)' };
            data.connections.push(copy);
            saveData().then(() => { renderHostsTree(); renderHomeView(); });
          }
        } else if (action === 'sftp' && contextTarget.type === 'connection') {
          openSftpFromContext(contextTarget.id);
        } else if (action === 'forward' && contextTarget.type === 'connection') {
          const tab = getConnectionTabs().find((t) => t.connectionId === contextTarget.id && t.connected);
          if (tab) {
            showBottomPanel();
            $$('.panel-tab').forEach((t) => t.classList.toggle('active', t.dataset.panel === 'forward'));
            renderPortForwardPanel();
          } else {
            showToast('Önce bağlantı kurun', 'error');
          }
        } else if (action === 'delete') {
          if (contextTarget.type === 'connection') {
            data.connections = data.connections.filter((c) => c.id !== contextTarget.id);
            saveData().then(() => { renderHostsTree(); renderHomeView(); });
          } else {
            data.connections.forEach((c) => { if (c.folderId === contextTarget.id) c.folderId = ''; });
            data.folders = data.folders.filter((f) => f.id !== contextTarget.id);
            saveData().then(() => { renderHostsTree(); renderHomeView(); });
          }
        }
        hideContextMenu();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        openConnectionModal();
      }
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeTabId && activeTabId !== HOME_TAB_ID) closeTab(activeTabId);
      }
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        openSettingsModal();
      }
    });
  }

  // Init
  async function init() {
    bindEvents();
    bindPasswordToggles();
    setupSshEvents();
    initDragDrop();
    populateFontSelect();
    await loadData();
    initTabs();
    toggleRightPanel(true);
    renderRightPanel();
  }

  init();
})();
