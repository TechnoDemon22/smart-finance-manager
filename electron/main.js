const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, exec } = require('child_process');

let mainWindow = null;
let backendProcess = null;
let backendPort = 5500;
let isQuitting = false;

// Single instance lock to prevent duplicate backend port conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/**
 * Determine executable path for backend
 */
function getBackendExecutable() {
  if (app.isPackaged) {
    // Packaged via electron-builder: extraResources placed in process.resourcesPath/backend/
    const exePath = path.join(process.resourcesPath, 'backend', 'SmartFinanceBackend.exe');
    if (fs.existsSync(exePath)) {
      return { type: 'exe', command: exePath, args: [] };
    }
  }

  // Development: Check if compiled exe exists in backend/dist/
  const devExePath = path.join(__dirname, '..', 'backend', 'dist', 'SmartFinanceBackend.exe');
  if (fs.existsSync(devExePath)) {
    return { type: 'exe', command: devExePath, args: [] };
  }

  // Fallback to python script in backend/
  const scriptPath = path.join(__dirname, '..', 'backend', 'app.py');
  return {
    type: 'script',
    command: 'python',
    args: [scriptPath, '--port=5500']
  };
}

/**
 * Determine path to frontend index.html
 */
function getFrontendPath() {
  if (app.isPackaged) {
    const packagedDist = path.join(process.resourcesPath, 'frontend', 'index.html');
    if (fs.existsSync(packagedDist)) {
      return packagedDist;
    }
  }

  const localDist = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (fs.existsSync(localDist)) {
    return localDist;
  }

  return null;
}

/**
 * Poll the backend health endpoint until response is 200 OK
 */
function checkBackendHealth(port, maxAttempts = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let resolved = false;

    const tryConnect = () => {
      if (resolved) return;
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          if (!resolved) {
            resolved = true;
            console.log(`[Electron] Backend verified healthy on port ${port} after ${attempts} attempts`);
            resolve(true);
          }
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (resolved) return;
      if (attempts >= maxAttempts) {
        resolved = true;
        reject(new Error(`Backend failed to respond on port ${port} within timeout.`));
      } else {
        setTimeout(tryConnect, interval);
      }
    };

    tryConnect();
  });
}

/**
 * Spawn the backend server as a child process
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendConfig = getBackendExecutable();
    console.log('[Electron] Starting backend:', backendConfig.command, backendConfig.args);

    const cwd = path.join(__dirname, '..', 'backend');

    try {
      backendProcess = spawn(backendConfig.command, backendConfig.args, {
        cwd: fs.existsSync(cwd) ? cwd : process.resourcesPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1'
        }
      });

      let portDetected = false;

      // Listen for handshake on stdout: SMART_FINANCE_PORT=5500
      backendProcess.stdout.on('data', (data) => {
        const text = data.toString();
        console.log(`[Backend stdout]: ${text.trim()}`);

        const match = text.match(/SMART_FINANCE_PORT=(\d+)/);
        if (match && !portDetected) {
          backendPort = parseInt(match[1], 10);
          portDetected = true;
          console.log(`[Electron] Detected backend port: ${backendPort}`);
        }
      });

      backendProcess.stderr.on('data', (data) => {
        console.warn(`[Backend stderr]: ${data.toString().trim()}`);
      });

      backendProcess.on('error', (err) => {
        console.error('[Electron] Failed to start backend process:', err);
        if (!isQuitting) {
          dialog.showErrorBox(
            'Backend Initialization Failed',
            `Could not start the backend process: ${err.message}\nPlease verify that the application has permissions to run.`
          );
        }
        reject(err);
      });

      backendProcess.on('exit', (code, signal) => {
        console.log(`[Electron] Backend process exited with code ${code} and signal ${signal}`);
        if (!isQuitting) {
          dialog.showErrorBox(
            'Backend Service Stopped',
            `The Smart Finance backend service exited unexpectedly (Code: ${code}).\nThe application will now close.`
          );
          app.quit();
        }
      });

      // Poll health endpoint
      // Allow slight delay for process to spin up
      setTimeout(async () => {
        try {
          await checkBackendHealth(backendPort);
          resolve(backendPort);
        } catch (err) {
          // If 5500 failed, retry with detected port if different
          if (portDetected && backendPort !== 5500) {
            try {
              await checkBackendHealth(backendPort, 20);
              return resolve(backendPort);
            } catch (e) {
              return reject(e);
            }
          }
          reject(err);
        }
      }, 500);

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Cleanly terminate backend process on Windows
 */
function killBackend() {
  if (backendProcess && backendProcess.pid) {
    console.log(`[Electron] Terminating backend process (PID: ${backendProcess.pid})...`);
    if (process.platform === 'win32') {
      try {
        exec(`taskkill /pid ${backendProcess.pid} /T /F`, (error) => {
          if (error) {
            try { backendProcess.kill('SIGKILL'); } catch (e) {}
          }
        });
      } catch (e) {
        try { backendProcess.kill('SIGKILL'); } catch (err) {}
      }
    } else {
      try { backendProcess.kill('SIGTERM'); } catch (e) {}
    }
    backendProcess = null;
  }
}

/**
 * Create the main desktop window
 */
function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1200,
    minHeight: 800,
    title: 'Smart Finance Manager',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      additionalArguments: [`--backend-port=${backendPort}`]
    },
    show: false // Show when ready to prevent flicker
  });

  // Hide default menu bar for clean native aesthetic
  Menu.setApplicationMenu(null);

  const frontendPath = getFrontendPath();

  if (frontendPath && fs.existsSync(frontendPath)) {
    console.log(`[Electron] Loading frontend from: ${frontendPath}`);
    mainWindow.loadFile(frontendPath);
  } else if (!app.isPackaged) {
    // If frontend hasn't been built yet in dev mode, try localhost:3000
    console.log('[Electron] Frontend dist not found. Connecting to Vite dev server on http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      dialog.showErrorBox(
        'Frontend Missing',
        'Could not find frontend/dist/index.html or Vite dev server. Please run "npm run build" in the frontend directory.'
      );
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Application Lifecycle
app.whenReady().then(async () => {
  try {
    console.log('[Electron] Initializing application...');
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('[Electron] Startup failed:', err);
    dialog.showErrorBox(
      'Startup Error',
      `Smart Finance Manager could not establish connection to the local database server.\n\nDetails: ${err.message}`
    );
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Graceful exit handlers
app.on('before-quit', () => {
  isQuitting = true;
  killBackend();
});

app.on('will-quit', (event) => {
  isQuitting = true;
  killBackend();
});

app.on('window-all-closed', () => {
  isQuitting = true;
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
