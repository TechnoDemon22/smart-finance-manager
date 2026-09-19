const { contextBridge, ipcRenderer } = require('electron');

// Parse port from command line arguments or IPC
let backendPort = 5500;
const portArg = process.argv.find((arg) => arg.startsWith('--backend-port='));
if (portArg) {
  backendPort = parseInt(portArg.split('=')[1], 10) || 5500;
}

// Expose protected methods and configuration to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendPort: () => backendPort,
  platform: process.platform,
  isElectron: true,
  getVersion: () => '1.0.0'
});

// Also expose direct property for immediate sync access in frontend
try {
  window.__SMART_FINANCE_PORT__ = backendPort;
} catch (e) {
  // contextIsolation may prevent direct assignment; covered by electronAPI
}
