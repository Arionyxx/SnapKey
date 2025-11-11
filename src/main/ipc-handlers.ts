import { ipcMain, BrowserWindow } from 'electron';
import { SettingsManager } from './settings';
import { HookManager } from './hook';
import { WindowManager } from './services/window-manager';
import {
  IPC_CHANNELS,
  IpcResponse,
  validateChannel,
  partialSettingsSchema,
  keybindProfileSchema,
  partialKeybindProfileSchema,
  keybindComboSchema,
  partialKeybindComboSchema,
  Settings,
  HookStatus,
  ProcessList,
  WindowState,
  TrayStatus,
} from '../shared/ipc';

export class IpcHandlers {
  private settingsManager: SettingsManager;
  private hookManager: HookManager;
  private windowManager: WindowManager;

  constructor(settingsManager: SettingsManager, hookManager: HookManager, windowManager: WindowManager) {
    this.settingsManager = settingsManager;
    this.hookManager = hookManager;
    this.windowManager = windowManager;
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

    // Profile handlers
    ipcMain.handle(IPC_CHANNELS.PROFILE_LIST, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_LIST');
        return this.settingsManager.listProfiles();
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_GET, (_event, profileId: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_GET:', profileId);
        if (typeof profileId !== 'string') {
          throw new Error('Invalid profile ID');
        }
        const profile = this.settingsManager.getProfile(profileId);
        if (!profile) {
          throw new Error(`Profile not found: ${profileId}`);
        }
        return profile;
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_CREATE, (_event, profileData: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_CREATE with:', profileData);
        const validated = keybindProfileSchema
          .omit({ id: true, createdAt: true, updatedAt: true })
          .parse(profileData);
        return this.settingsManager.createProfile(validated);
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE, (_event, data: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_UPDATE with:', data);
        const { profileId, updates } = data as { profileId: string; updates: unknown };
        if (typeof profileId !== 'string') {
          throw new Error('Invalid profile ID');
        }
        const validated = partialKeybindProfileSchema.parse(updates);
        return this.settingsManager.updateProfile(profileId, validated);
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_DELETE, (_event, profileId: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_DELETE:', profileId);
        if (typeof profileId !== 'string') {
          throw new Error('Invalid profile ID');
        }
        this.settingsManager.deleteProfile(profileId);
        return true;
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_SET_ACTIVE, (_event, profileId: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROFILE_SET_ACTIVE:', profileId);
        if (typeof profileId !== 'string') {
          throw new Error('Invalid profile ID');
        }
        return this.settingsManager.setActiveProfile(profileId);
      });
    });

    // Keybind handlers
    ipcMain.handle(IPC_CHANNELS.KEYBIND_CREATE, (_event, data: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling KEYBIND_CREATE with:', data);
        const { profileId, keybind } = data as { profileId: string; keybind: unknown };
        if (typeof profileId !== 'string') {
          throw new Error('Invalid profile ID');
        }
        const validated = keybindComboSchema.omit({ id: true }).parse(keybind);
        return this.settingsManager.createKeybind(profileId, validated);
      });
    });

    ipcMain.handle(IPC_CHANNELS.KEYBIND_UPDATE, (_event, data: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling KEYBIND_UPDATE with:', data);
        const { profileId, keybindId, updates } = data as {
          profileId: string;
          keybindId: string;
          updates: unknown;
        };
        if (typeof profileId !== 'string' || typeof keybindId !== 'string') {
          throw new Error('Invalid profile ID or keybind ID');
        }
        const validated = partialKeybindComboSchema.parse(updates);
        return this.settingsManager.updateKeybind(profileId, keybindId, validated);
      });
    });

    ipcMain.handle(IPC_CHANNELS.KEYBIND_DELETE, (_event, data: unknown) => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling KEYBIND_DELETE with:', data);
        const { profileId, keybindId } = data as { profileId: string; keybindId: string };
        if (typeof profileId !== 'string' || typeof keybindId !== 'string') {
          throw new Error('Invalid profile ID or keybind ID');
        }
        return this.settingsManager.deleteKeybind(profileId, keybindId);
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

    ipcMain.handle(IPC_CHANNELS.HOOK_DIAGNOSTICS_GET, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling HOOK_DIAGNOSTICS_GET');
        return this.hookManager.getDiagnostics();
      });
    });

    // Process handlers
    ipcMain.handle(IPC_CHANNELS.PROCESS_LIST, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROCESS_LIST');
        const processes = this.windowManager.listProcessesWithWindows();
        const processList: ProcessList = processes.map(p => ({
          pid: p.pid,
          name: p.name,
          path: p.path,
          title: p.title,
        }));
        return processList;
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_ACTIVE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROCESS_ACTIVE');
        const activeProcess = this.windowManager.getActiveProcess();
        return activeProcess;
      });
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_FULLSCREEN_STATE, () => {
      return this.handleRequest(() => {
        console.log('[IPC] Handling PROCESS_FULLSCREEN_STATE');
        const state = this.windowManager.getCurrentState();
        const settings = this.settingsManager.getSettings();
        const conditionsMet = this.windowManager.checkConditions({
          targetProcess: settings.targetProcess,
          fullscreenOnly: settings.fullscreenOnly,
        });
        
        const windowState: WindowState = {
          process: state.process,
          isFullscreen: state.isFullscreen,
          conditionsMet,
        };
        return windowState;
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

    // Listen to window state changes and broadcast to all windows
    this.windowManager.onChange((state) => {
      const settings = this.settingsManager.getSettings();
      const conditionsMet = this.windowManager.checkConditions({
        targetProcess: settings.targetProcess,
        fullscreenOnly: settings.fullscreenOnly,
      });

      const windowState: WindowState = {
        process: state.process,
        isFullscreen: state.isFullscreen,
        conditionsMet,
      };

      console.log('[IPC] Window state changed, broadcasting to all windows');
      this.broadcastToAll(IPC_CHANNELS.WINDOW_STATE_UPDATED, windowState);
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
