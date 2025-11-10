import { HookStatus, DEFAULT_HOOK_STATUS, Settings } from '../shared/ipc';
import {
  KeyboardHookService,
  KeyboardHookConfig,
  KeyGroup,
} from './services/keyboard-hook-service';

export class HookManager {
  private status: HookStatus;
  private listeners: Array<(status: HookStatus) => void> = [];
  private hookService: KeyboardHookService | null = null;
  private currentSettings: Settings | null = null;

  constructor() {
    this.status = { ...DEFAULT_HOOK_STATUS };
  }

  getStatus(): HookStatus {
    return { ...this.status };
  }

  setSettings(settings: Settings): void {
    console.log('[Hook] Updating settings:', settings);
    this.currentSettings = settings;

    if (this.hookService) {
      const config = this.buildConfig(settings, this.status.enabled);
      this.hookService.updateConfig(config);
    }
  }

  private buildConfig(settings: Settings, enabled: boolean): KeyboardHookConfig {
    const keyGroups: KeyGroup[] = this.buildKeyGroups(settings.enabledKeys);

    return {
      enabled,
      keyGroups,
      enabledKeys: settings.enabledKeys,
    };
  }

  private buildKeyGroups(enabledKeys: string[]): KeyGroup[] {
    const groups: KeyGroup[] = [];

    // Create opposing key groups (W-S and A-D)
    const verticalKeys = enabledKeys.filter((k) => k === 'W' || k === 'S');
    const horizontalKeys = enabledKeys.filter((k) => k === 'A' || k === 'D');

    if (verticalKeys.length > 1) {
      groups.push({
        keys: verticalKeys,
        allowSimultaneous: false,
      });
    }

    if (horizontalKeys.length > 1) {
      groups.push({
        keys: horizontalKeys,
        allowSimultaneous: false,
      });
    }

    return groups;
  }

  enable(): HookStatus {
    console.log('[Hook] Enabling keyboard hook...');
    try {
      if (!this.currentSettings) {
        throw new Error('Settings not initialized');
      }

      if (!this.hookService) {
        const config = this.buildConfig(this.currentSettings, true);
        this.hookService = new KeyboardHookService(config);

        // Listen to hook service status changes
        this.hookService.onStatusChange((serviceStatus) => {
          this.status.activeKeys = serviceStatus.activeKeys;
          this.notifyListeners();
        });
      }

      this.hookService.start();

      this.status = {
        enabled: true,
        activeKeys: [],
        lastError: null,
      };
      this.notifyListeners();
      console.log('[Hook] Keyboard hook enabled');
      return this.getStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Hook] Failed to enable keyboard hook:', errorMessage);
      this.status = {
        enabled: false,
        activeKeys: [],
        lastError: errorMessage,
      };
      this.notifyListeners();
      throw error;
    }
  }

  disable(): HookStatus {
    console.log('[Hook] Disabling keyboard hook...');
    try {
      if (this.hookService) {
        this.hookService.stop();
      }

      this.status = {
        enabled: false,
        activeKeys: [],
        lastError: null,
      };
      this.notifyListeners();
      console.log('[Hook] Keyboard hook disabled');
      return this.getStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Hook] Failed to disable keyboard hook:', errorMessage);
      this.status.lastError = errorMessage;
      this.notifyListeners();
      throw error;
    }
  }

  toggle(): HookStatus {
    if (this.status.enabled) {
      return this.disable();
    } else {
      return this.enable();
    }
  }

  updateActiveKeys(keys: string[]): void {
    this.status.activeKeys = [...keys];
    this.notifyListeners();
  }

  setError(error: string | null): void {
    this.status.lastError = error;
    this.notifyListeners();
  }

  onChange(listener: (status: HookStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getStatus()));
  }

  getDiagnostics() {
    if (this.hookService) {
      return this.hookService.getDiagnostics();
    }
    return null;
  }

  cleanup(): void {
    if (this.status.enabled) {
      this.disable();
    }
    if (this.hookService) {
      this.hookService.cleanup();
      this.hookService = null;
    }
  }
}
