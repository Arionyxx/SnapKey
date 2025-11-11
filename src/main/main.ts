import { app, BrowserWindow } from 'electron';
import path from 'path';
import { SettingsManager } from './settings';
import { HookManager } from './hook';
import { IpcHandlers } from './ipc-handlers';
import { WindowManager } from './services/window-manager';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let settingsManager: SettingsManager;
let hookManager: HookManager;
let windowManager: WindowManager;
let ipcHandlers: IpcHandlers;

function createWindow() {
  console.log('[Main] Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'SnapKey',
    icon: path.join(__dirname, '../../legacy/icon.ico'),
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('closed', () => {
    console.log('[Main] Main window closed');
    mainWindow = null;
  });

  console.log('[Main] Main window created successfully');
}

function initializeManagers() {
  console.log('[Main] Initializing managers...');
  settingsManager = new SettingsManager();
  hookManager = new HookManager();
  windowManager = new WindowManager();

  // Initialize hook manager with current settings
  hookManager.setSettings(settingsManager.getSettings());

  // Connect window manager to hook manager
  hookManager.setWindowManager(windowManager);

  // Listen to settings changes and update hook manager
  settingsManager.onChange(settings => {
    hookManager.setSettings(settings);
  });

  // Start window monitoring
  windowManager.start();

  ipcHandlers = new IpcHandlers(settingsManager, hookManager, windowManager);
  console.log('[Main] All managers initialized successfully');
}

function handleSingleInstanceLock() {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    console.log('[Main] Another instance is already running. Quitting...');
    app.quit();
    return false;
  }

  app.on('second-instance', () => {
    console.log('[Main] Second instance detected. Focusing main window...');
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  console.log('[Main] Single instance lock acquired');
  return true;
}

function setupAppHandlers() {
  app.on('activate', () => {
    console.log('[Main] App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    console.log('[Main] All windows closed');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    console.log('[Main] App is quitting. Cleaning up...');
    cleanup();
  });

  app.on('will-quit', () => {
    console.log('[Main] App will quit');
  });
}

function cleanup() {
  try {
    if (windowManager) {
      windowManager.cleanup();
    }
    if (hookManager) {
      hookManager.cleanup();
    }
    if (ipcHandlers) {
      ipcHandlers.cleanup();
    }
    console.log('[Main] Cleanup completed');
  } catch (error) {
    console.error('[Main] Error during cleanup:', error);
  }
}

// Main entry point
async function main() {
  console.log('[Main] SnapKey starting...');
  console.log('[Main] Electron version:', process.versions.electron);
  console.log('[Main] Node version:', process.versions.node);
  console.log('[Main] Platform:', process.platform);

  // Enforce single instance
  if (!handleSingleInstanceLock()) {
    return;
  }

  // Setup app handlers
  setupAppHandlers();

  // Wait for app to be ready
  await app.whenReady();
  console.log('[Main] App is ready');

  // Initialize managers
  initializeManagers();

  // Create main window
  createWindow();

  console.log('[Main] SnapKey started successfully');
}

// Error handling
process.on('uncaughtException', error => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', reason => {
  console.error('[Main] Unhandled rejection:', reason);
});

// Start the application
main().catch(error => {
  console.error('[Main] Fatal error during startup:', error);
  app.quit();
});
