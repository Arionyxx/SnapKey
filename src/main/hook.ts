import { HookStatus, DEFAULT_HOOK_STATUS } from '../shared/ipc';

export class HookManager {
  private status: HookStatus;
  private listeners: Array<(status: HookStatus) => void> = [];

  constructor() {
    this.status = { ...DEFAULT_HOOK_STATUS };
  }

  getStatus(): HookStatus {
    return { ...this.status };
  }

  enable(): HookStatus {
    console.log('[Hook] Enabling keyboard hook...');
    try {
      // TODO: Implement actual keyboard hook registration
      // This is a placeholder that will be implemented in future tickets
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
      // TODO: Implement actual keyboard hook unregistration
      // This is a placeholder that will be implemented in future tickets
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

  cleanup(): void {
    if (this.status.enabled) {
      this.disable();
    }
  }
}
