import {
  Settings,
  PartialSettings,
  HookStatus,
  ActiveProcess,
  ProcessList,
  TrayStatus,
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
        onStatusUpdated: (callback: (status: HookStatus) => void) => () => void;
      };

      // Process API
      process: {
        list: () => Promise<ProcessList>;
        getActive: () => Promise<ActiveProcess | null>;
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
