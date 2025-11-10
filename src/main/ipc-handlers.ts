import { ipcMain, BrowserWindow } from 'electron';
import { SettingsManager } from './settings';
import { HookManager } from './hook';
import {
  IPC_CHANNELS,
  IpcResponse,
  validateChannel,
  partialSettingsSchema,
  Settings,
  HookStatus,
  ActiveProcess,
  ProcessList,
  TrayStatus,
} from '../shared/ipc';

export class IpcHandlers {
  private settingsManager: SettingsManager;
  private hookManager: HookManager;

  constructor(settingsManager: SettingsManager, hookManager: HookManager) {
    this.settingsManager = settingsManager;
    this.hookManager = hookManager;
    this.registerHandlers();
    this.registerListeners();
  }

  private registerHandlers(): void {
    console.log('[IPC] Registering IPC handlers...');

    // Settings handlers
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling SETTINGS_GET');
        return this.settingsManager.getSettings();
      });
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, updates: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling SETTINGS_SET with:', updates);
        const validated = partialSettingsSchema.parse(updates);
        const newSettings = this.settingsManager.updateSettings(validated);
        return newSettings;
      });
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling SETTINGS_RESET');
        return this.settingsManager.resetSettings();
      });
    });

    // Hook handlers
    ipcMain.handle(IPC_CHANNELS.HOOK_STATUS_GET, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling HOOK_STATUS_GET');
        return this.hookManager.getStatus();
      });
    });

    ipcMain.handle(IPC_CHANNELS.HOOK_TOGGLE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling HOOK_TOGGLE');
        return this.hookManager.toggle();
      });
    });

    // Process handlers
    ipcMain.handle(IPC_CHANNELS.PROCESS_LIST, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROCESS_LIST');
        // TODO: Implement actual process listing
        const processes: ProcessList = [];
        return processes;
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_ACTIVE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROCESS_ACTIVE');
        // TODO: Implement actual active process detection
        const activeProcess: ActiveProcess | null = null;
        return activeProcess;
      });
    });

    // Tray handlers
    ipcMain.handle(IPC_CHANNELS.TRAY_TOGGLE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling TRAY_TOGGLE');
        // TODO: Implement tray toggle
        const status: TrayStatus = { visible: false };
        return status;
      });
    });

    ipcMain.handle(IPC_CHANNELS.TRAY_SHOW, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling TRAY_SHOW');
        // TODO: Implement tray show
        const status: TrayStatus = { visible: true };
        return status;
      });
    });

    ipcMain.handle(IPC_CHANNELS.TRAY_HIDE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling TRAY_HIDE');
        // TODO: Implement tray hide
        const status: TrayStatus = { visible: false };
        return status;
      });
    });

    // Window handlers
    ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling WINDOW_MINIMIZE');
        const window = BrowserWindow.getFocusedWindow();
        if (window) {
          window.minimize();
        }
        return true;
      });
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling WINDOW_CLOSE');
        const window = BrowserWindow.getFocusedWindow();
        if (window) {
          window.close();
        }
        return true;
      });
    });

    console.log('[IPC] All IPC handlers registered successfully');
  }

  private registerListeners(): void {
    // Listen to settings changes and broadcast to all windows
    this.settingsManager.onChange((settings: Settings) => {
      console.log('[IPC] Settings changed, broadcasting to all windows');
      this.broadcastToAll(IPC_CHANNELS.SETTINGS_UPDATED, settings);
    });

    // Listen to hook status changes and broadcast to all windows
    this.hookManager.onChange((status: HookStatus) => {
      console.log('[IPC] Hook status changed, broadcasting to all windows');
      this.broadcastToAll(IPC_CHANNELS.HOOK_STATUS_UPDATED, status);
    });
  }

  private handleRequest<T>(handler: () => T): IpcResponse<T> {
    try {
      const data = handler();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IPC] Request handler error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private broadcastToAll(channel: string, data: unknown): void {
    try {
      validateChannel(channel);
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send(channel, data);
        }
      });
    } catch (error) {
      console.error('[IPC] Broadcast error:', error);
    }
  }

  cleanup(): void {
    console.log('[IPC] Cleaning up IPC handlers...');
    ipcMain.removeAllListeners();
  }
}
