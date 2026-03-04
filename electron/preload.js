const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database configuration
  getDbConfig: () => ipcRenderer.invoke('get-db-config'),
  setDbConfig: (config) => ipcRenderer.invoke('set-db-config', config),
  testDbConnection: (dbUrl) => ipcRenderer.invoke('test-db-connection', dbUrl),
  
  // App paths
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Auto-updater
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  
  // WhatsApp Integration
  whatsapp: {
    initialize: () => ipcRenderer.invoke('whatsapp:initialize'),
    getStatus: () => ipcRenderer.invoke('whatsapp:get-status'),
    getQRCode: () => ipcRenderer.invoke('whatsapp:get-qr-code'),
    disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
    reconnect: () => ipcRenderer.invoke('whatsapp:reconnect'),
    sendInvoice: (invoiceData) => ipcRenderer.invoke('whatsapp:send-invoice', invoiceData),
    onStatusChange: (callback) => {
      ipcRenderer.on('whatsapp:status-change', (event, status) => callback(status));
    },
    removeStatusChangeListener: () => {
      ipcRenderer.removeAllListeners('whatsapp:status-change');
    }
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});

// Also expose a simple API check
contextBridge.exposeInMainWorld('isElectron', true);
