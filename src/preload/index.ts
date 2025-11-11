import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  IPC_CHANNELS,
  validateChannel,
  IpcResponse,
  Settings,
  PartialSettings,
  HookStatus,
  ActiveProcess,
  ProcessList,
  WindowState,
  TrayStatus,
  KeybindProfile,
  PartialKeybindProfile,
  KeybindCombo,
  PartialKeybindCombo,
  HookDiagnostics,
} from '../shared/ipc';

// Helper function to invoke IPC and handle response
async function invoke<T>(channel: string, data?: unknown): Promise<T> {
  validateChannel(channel);
  const response: IpcResponse<T> = await ipcRenderer.invoke(channel, data);

  if (!response.success) {
    throw new Error(response.error || 'Unknown IPC error');
  }

  return response.data as T;
}

// Helper function to subscribe to IPC events
function subscribe<T>(channel: string, callback: (data: T) => void): () => void {
  validateChannel(channel);

  const listener = (_event: IpcRendererEvent, data: T) => {
    callback(data);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

// Expose the API to the renderer process
const api = {
  // Settings API
  settings: {
    get: () => invoke<Settings>(IPC_CHANNELS.SETTINGS_GET),
    set: (updates: PartialSettings) => invoke<Settings>(IPC_CHANNELS.SETTINGS_SET, updates),
    reset: () => invoke<Settings>(IPC_CHANNELS.SETTINGS_RESET),
    onUpdated: (callback: (settings: Settings) => void) =>
      subscribe<Settings>(IPC_CHANNELS.SETTINGS_UPDATED, callback),
  },

  // Hook API
  hook: {
    getStatus: () => invoke<HookStatus>(IPC_CHANNELS.HOOK_STATUS_GET),
    toggle: () => invoke<HookStatus>(IPC_CHANNELS.HOOK_TOGGLE),
    getDiagnostics: () => invoke<HookDiagnostics>(IPC_CHANNELS.HOOK_DIAGNOSTICS_GET),
    onStatusUpdated: (callback: (status: HookStatus) => void) =>
      subscribe<HookStatus>(IPC_CHANNELS.HOOK_STATUS_UPDATED, callback),
  },

  // Profile API
  profile: {
    list: () => invoke<KeybindProfile[]>(IPC_CHANNELS.PROFILE_LIST),
    get: (id: string) => invoke<KeybindProfile>(IPC_CHANNELS.PROFILE_GET, { id }),
    create: (profile: Omit<KeybindProfile, 'id' | 'createdAt' | 'updatedAt'>) =>
      invoke<KeybindProfile>(IPC_CHANNELS.PROFILE_CREATE, profile),
    update: (id: string, updates: PartialKeybindProfile) =>
      invoke<KeybindProfile>(IPC_CHANNELS.PROFILE_UPDATE, { id, updates }),
    delete: (id: string) => invoke<boolean>(IPC_CHANNELS.PROFILE_DELETE, { id }),
    setActive: (id: string) => invoke<Settings>(IPC_CHANNELS.PROFILE_SET_ACTIVE, { id }),
  },

  // Keybind API
  keybind: {
    create: (profileId: string, keybind: Omit<KeybindCombo, 'id'>) =>
      invoke<KeybindProfile>(IPC_CHANNELS.KEYBIND_CREATE, { profileId, keybind }),
    update: (profileId: string, keybindId: string, updates: PartialKeybindCombo) =>
      invoke<KeybindProfile>(IPC_CHANNELS.KEYBIND_UPDATE, { profileId, keybindId, updates }),
    delete: (profileId: string, keybindId: string) =>
      invoke<KeybindProfile>(IPC_CHANNELS.KEYBIND_DELETE, { profileId, keybindId }),
  },

  // Process API
  process: {
    list: () => invoke<ProcessList>(IPC_CHANNELS.PROCESS_LIST),
    getActive: () => invoke<ActiveProcess | null>(IPC_CHANNELS.PROCESS_ACTIVE),
    getFullscreenState: () => invoke<WindowState>(IPC_CHANNELS.PROCESS_FULLSCREEN_STATE),
  },

  // Window state API
  windowState: {
    onUpdated: (callback: (state: WindowState) => void) =>
      subscribe<WindowState>(IPC_CHANNELS.WINDOW_STATE_UPDATED, callback),
  },

  // Tray API
  tray: {
    toggle: () => invoke<TrayStatus>(IPC_CHANNELS.TRAY_TOGGLE),
    show: () => invoke<TrayStatus>(IPC_CHANNELS.TRAY_SHOW),
    hide: () => invoke<TrayStatus>(IPC_CHANNELS.TRAY_HIDE),
  },

  // Window API
  window: {
    minimize: () => invoke<boolean>(IPC_CHANNELS.WINDOW_MINIMIZE),
    close: () => invoke<boolean>(IPC_CHANNELS.WINDOW_CLOSE),
  },

  // Platform info (for backwards compatibility)
  platform: process.platform,
  version: process.versions.electron,
};

// Expose the API to the window object
contextBridge.exposeInMainWorld('api', api);

console.log('[Preload] API exposed to renderer process');
