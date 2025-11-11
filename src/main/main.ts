import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AutoLaunch from 'auto-launch';
import { SettingsManager } from './settings';
import { HookManager } from './hook';
import { IpcHandlers } from './ipc-handlers';
import { WindowManager } from './services/window-manager';
import { TrayManager } from './services/tray-manager';

// ESM compatibility shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let settingsManager: SettingsManager;
let hookManager: HookManager;
let windowManager: WindowManager;
let ipcHandlers: IpcHandlers;
let trayManager: TrayManager;
let isQuitting = false;

// Auto-launch configuration
const autoLauncher = new AutoLaunch({
  name: 'SnapKey',
  path: app.getPath('exe'),
});

function createWindow() {
  console.log('[Main] Creating main window...');

  // Use resources path in production, legacy folder in dev
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../../legacy/icon.ico');

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
    icon: iconPath,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open DevTools only in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));

    // Disable DevTools in production for security
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  // Handle close event for minimize to tray
  mainWindow.on('close', event => {
    if (!isQuitting && settingsManager) {
      const settings = settingsManager.getSettings();
      if (settings.minimizeToTray) {
        console.log('[Main] Minimizing to tray instead of closing');
        event.preventDefault();
        mainWindow?.hide();
      }
    }
  });

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
  trayManager = new TrayManager();

  // Initialize hook manager with current settings
  hookManager.setSettings(settingsManager.getSettings());

  // Connect window manager to hook manager
  hookManager.setWindowManager(windowManager);

  // Listen to settings changes and update hook manager
  settingsManager.onChange(settings => {
    hookManager.setSettings(settings);
    // Update tray menu when settings change (profiles might have changed)
    if (mainWindow && trayManager) {
      trayManager.updateHookStatus(hookManager.getStatus());
    }
    // Handle auto-launch setting
    handleAutoLaunchSetting(settings.startOnBoot);
  });

  // Listen to hook status changes and update tray icon
  hookManager.onChange(status => {
    if (trayManager) {
      trayManager.updateHookStatus(status);
    }
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
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
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
    } else if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  app.on('window-all-closed', () => {
    console.log('[Main] All windows closed');
    // On macOS, keep app running in dock
    // On Windows/Linux, check minimizeToTray setting
    if (process.platform !== 'darwin') {
      const settings = settingsManager?.getSettings();
      if (!settings?.minimizeToTray) {
        app.quit();
      }
    }
  });

  app.on('before-quit', () => {
    console.log('[Main] App is quitting. Cleaning up...');
    isQuitting = true;
    cleanup();
  });

  app.on('will-quit', () => {
    console.log('[Main] App will quit');
  });
}

function cleanup() {
  try {
    if (trayManager) {
      trayManager.cleanup();
    }
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

async function handleAutoLaunchSetting(enabled: boolean) {
  try {
    const isEnabled = await autoLauncher.isEnabled();

    if (enabled && !isEnabled) {
      await autoLauncher.enable();
      console.log('[Main] Auto-launch enabled');
    } else if (!enabled && isEnabled) {
      await autoLauncher.disable();
      console.log('[Main] Auto-launch disabled');
    }
  } catch (error) {
    console.error('[Main] Error handling auto-launch setting:', error);
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

  // Initialize tray after window is created
  if (mainWindow) {
    trayManager.initialize(mainWindow, settingsManager, hookManager);
    trayManager.updateHookStatus(hookManager.getStatus());
  }

  // Initialize auto-launch setting
  const settings = settingsManager.getSettings();
  await handleAutoLaunchSetting(settings.startOnBoot);

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
