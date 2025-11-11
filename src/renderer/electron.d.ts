import {
  Settings,
  PartialSettings,
  HookStatus,
  HookDiagnostics,
  ActiveProcess,
  ProcessList,
  WindowState,
  TrayStatus,
  KeybindProfile,
  PartialKeybindProfile,
  KeybindCombo,
  PartialKeybindCombo,
} from '../shared/ipc';

export {};

declare global {
  interface Window {
    api: {
      // Settings API
      settings: {
        get: () => Promise<Settings>;
        set: (updates: PartialSettings) => Promise<Settings>;
        reset: () => Promise<Settings>;
        onUpdated: (callback: (settings: Settings) => void) => () => void;
      };

      // Hook API
      hook: {
        getStatus: () => Promise<HookStatus>;
        toggle: () => Promise<HookStatus>;
        getDiagnostics: () => Promise<HookDiagnostics>;
        onStatusUpdated: (callback: (status: HookStatus) => void) => () => void;
      };

      // Profile API
      profile: {
        list: () => Promise<KeybindProfile[]>;
        get: (id: string) => Promise<KeybindProfile>;
        create: (
          profile: Omit<KeybindProfile, 'id' | 'createdAt' | 'updatedAt'>
        ) => Promise<KeybindProfile>;
        update: (id: string, updates: PartialKeybindProfile) => Promise<KeybindProfile>;
        delete: (id: string) => Promise<boolean>;
        setActive: (id: string) => Promise<Settings>;
      };

      // Keybind API
      keybind: {
        create: (profileId: string, keybind: Omit<KeybindCombo, 'id'>) => Promise<KeybindProfile>;
        update: (
          profileId: string,
          keybindId: string,
          updates: PartialKeybindCombo
        ) => Promise<KeybindProfile>;
        delete: (profileId: string, keybindId: string) => Promise<KeybindProfile>;
      };

      // Process API
      process: {
        list: () => Promise<ProcessList>;
        getActive: () => Promise<ActiveProcess | null>;
        getFullscreenState: () => Promise<WindowState>;
      };

      // Window state API
      windowState: {
        onUpdated: (callback: (state: WindowState) => void) => () => void;
      };

      // Tray API
      tray: {
        toggle: () => Promise<TrayStatus>;
        show: () => Promise<TrayStatus>;
        hide: () => Promise<TrayStatus>;
      };

      // Window API
      window: {
        minimize: () => Promise<boolean>;
        close: () => Promise<boolean>;
      };

      // Platform info
      platform: string;
      version: string;
    };
  }
}
