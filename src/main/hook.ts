import { HookStatus, DEFAULT_HOOK_STATUS, Settings } from '../shared/ipc';
import {
  KeyboardHookService,
  KeyboardHookConfig,
  KeyGroup,
} from './services/keyboard-hook-service';
import { WindowManager } from './services/window-manager';

export class HookManager {
  private status: HookStatus;
  private listeners: Array<(status: HookStatus) => void> = [];
  private hookService: KeyboardHookService | null = null;
  private currentSettings: Settings | null = null;
  private windowManager: WindowManager | null = null;
  private userEnabled = false; // Track if user wants hook enabled

  constructor() {
    this.status = { ...DEFAULT_HOOK_STATUS };
  }

  setWindowManager(windowManager: WindowManager): void {
    this.windowManager = windowManager;

    // Listen to window state changes
    this.windowManager.onChange(() => {
      this.updateHookState();
    });
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

    // Update hook state based on new settings
    this.updateHookState();
  }

  private buildConfig(settings: Settings, enabled: boolean): KeyboardHookConfig {
    // Get active profile
    const activeProfile = settings.profiles.find(p => p.id === settings.activeProfileId);
    if (!activeProfile) {
      console.warn('[Hook] Active profile not found, using defaults');
      return {
        enabled,
        keyGroups: [],
        enabledKeys: [],
      };
    }

    // Convert profile keybinds to KeyGroups
    const keyGroups: KeyGroup[] = this.buildKeyGroupsFromProfile(activeProfile);

    // Extract all enabled keys (unique VK codes)
    const enabledKeys = this.extractEnabledKeysFromProfile(activeProfile);

    return {
      enabled,
      keyGroups,
      enabledKeys,
    };
  }

  private buildKeyGroupsFromProfile(profile: {
    keybinds: Array<{ groupId: string; keys: number[]; allowSimultaneous: boolean }>;
  }): KeyGroup[] {
    const groups: KeyGroup[] = [];

    // Group keybinds by groupId
    const groupMap = new Map<string, { keys: number[]; allowSimultaneous: boolean }>();

    for (const keybind of profile.keybinds) {
      if (!groupMap.has(keybind.groupId)) {
        groupMap.set(keybind.groupId, {
          keys: [],
          allowSimultaneous: keybind.allowSimultaneous,
        });
      }

      const group = groupMap.get(keybind.groupId)!;
      group.keys.push(...keybind.keys);
    }

    // Convert to KeyGroup format
    for (const [_groupId, groupData] of groupMap) {
      // Convert VK codes to key names for backwards compatibility with KeyboardHookService
      const keyNames = groupData.keys.map(vk => this.vkToKeyName(vk));
      if (keyNames.length > 0) {
        groups.push({
          keys: keyNames,
          allowSimultaneous: groupData.allowSimultaneous,
        });
      }
    }

    return groups;
  }

  private extractEnabledKeysFromProfile(profile: {
    keybinds: Array<{ keys: number[] }>;
  }): string[] {
    const vkCodes = new Set<number>();

    for (const keybind of profile.keybinds) {
      for (const vk of keybind.keys) {
        vkCodes.add(vk);
      }
    }

    // Convert VK codes to key names
    return Array.from(vkCodes).map(vk => this.vkToKeyName(vk));
  }

  private vkToKeyName(vk: number): string {
    // Map VK codes to key names
    const vkMap: Record<number, string> = {
      0x57: 'W',
      0x41: 'A',
      0x53: 'S',
      0x44: 'D',
    };
    return vkMap[vk] || `VK_${vk.toString(16).toUpperCase()}`;
  }

  private shouldEnableHook(): boolean {
    if (!this.userEnabled) {
      return false;
    }

    if (!this.currentSettings) {
      return false;
    }

    // Check window conditions if window manager is available
    if (this.windowManager) {
      const conditionsMet = this.windowManager.checkConditions({
        targetProcess: this.currentSettings.targetProcess,
        fullscreenOnly: this.currentSettings.fullscreenOnly,
      });

      if (!conditionsMet) {
        console.log('[Hook] Window conditions not met, hook should be disabled');
        return false;
      }
    }

    return true;
  }

  private updateHookState(): void {
    const shouldEnable = this.shouldEnableHook();
    const isEnabled = this.status.enabled;

    if (shouldEnable && !isEnabled) {
      console.log('[Hook] Conditions met, enabling hook automatically');
      this.enableHookService();
    } else if (!shouldEnable && isEnabled) {
      console.log('[Hook] Conditions not met, disabling hook automatically');
      this.disableHookService();
    }
  }

  enable(): HookStatus {
    console.log('[Hook] User enabling keyboard hook...');
    this.userEnabled = true;

    if (!this.shouldEnableHook()) {
      console.log('[Hook] Conditions not met, hook will enable when conditions are satisfied');
      this.status = {
        enabled: false,
        activeKeys: [],
        lastError: 'Waiting for window conditions to be met',
      };
      this.notifyListeners();
      return this.getStatus();
    }

    return this.enableHookService();
  }

  private enableHookService(): HookStatus {
    console.log('[Hook] Enabling keyboard hook service...');
    try {
      if (!this.currentSettings) {
        throw new Error('Settings not initialized');
      }

      if (!this.hookService) {
        const config = this.buildConfig(this.currentSettings, true);
        this.hookService = new KeyboardHookService(config);

        // Listen to hook service status changes
        this.hookService.onStatusChange(serviceStatus => {
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
    console.log('[Hook] User disabling keyboard hook...');
    this.userEnabled = false;
    return this.disableHookService();
  }

  private disableHookService(): HookStatus {
    console.log('[Hook] Disabling keyboard hook service...');
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
