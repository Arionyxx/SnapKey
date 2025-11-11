import { uIOhook, UiohookKey } from 'uiohook-napi';
import { sendKeyDown, sendKeyUp, KEY_TO_VK } from '../native/win32-input';

export interface KeyGroup {
  keys: string[];
  allowSimultaneous: boolean;
}

export interface KeyboardHookConfig {
  enabled: boolean;
  keyGroups: KeyGroup[];
  enabledKeys: string[];
}

export interface KeyState {
  physicallyPressed: boolean;
  logicallyPressed: boolean;
  lastEventTime: number;
}

export interface HookDiagnostics {
  totalEventsProcessed: number;
  keyDownEvents: number;
  keyUpEvents: number;
  simulatedEvents: number;
  conflictsResolved: number;
  lastError: string | null;
}

export interface HookServiceStatus {
  running: boolean;
  activeKeys: string[];
  diagnostics: HookDiagnostics;
}

// Simple keyboard event interface
interface KeyboardEvent {
  keycode: number;
}

// Map uIOhook key codes to our key names
const UIOHOOK_KEY_MAP: Record<number, string> = {
  [UiohookKey.W]: 'W',
  [UiohookKey.A]: 'A',
  [UiohookKey.S]: 'S',
  [UiohookKey.D]: 'D',
};

export class KeyboardHookService {
  private config: KeyboardHookConfig;
  private keyStates: Map<string, KeyState> = new Map();
  private diagnostics: HookDiagnostics;
  private running = false;
  private statusListeners: Array<(status: HookServiceStatus) => void> = [];

  constructor(config: KeyboardHookConfig) {
    this.config = config;
    this.diagnostics = this.resetDiagnostics();
    this.initializeKeyStates();
  }

  private resetDiagnostics(): HookDiagnostics {
    return {
      totalEventsProcessed: 0,
      keyDownEvents: 0,
      keyUpEvents: 0,
      simulatedEvents: 0,
      conflictsResolved: 0,
      lastError: null,
    };
  }

  private initializeKeyStates(): void {
    this.keyStates.clear();
    for (const key of this.config.enabledKeys) {
      this.keyStates.set(key, {
        physicallyPressed: false,
        logicallyPressed: false,
        lastEventTime: 0,
      });
    }
  }

  start(): void {
    if (this.running) {
      console.log('[KeyboardHookService] Already running');
      return;
    }

    console.log('[KeyboardHookService] Starting keyboard hook...');
    try {
      // Register key down handler
      uIOhook.on('keydown', event => {
        this.handleKeyDown(event);
      });

      // Register key up handler
      uIOhook.on('keyup', event => {
        this.handleKeyUp(event);
      });

      // Start the hook
      uIOhook.start();
      this.running = true;
      console.log('[KeyboardHookService] Keyboard hook started successfully');
      this.notifyStatusChange();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[KeyboardHookService] Failed to start keyboard hook:', errorMessage);
      this.diagnostics.lastError = errorMessage;
      throw error;
    }
  }

  stop(): void {
    if (!this.running) {
      console.log('[KeyboardHookService] Not running');
      return;
    }

    console.log('[KeyboardHookService] Stopping keyboard hook...');
    try {
      uIOhook.stop();
      this.running = false;

      // Release all pressed keys
      this.releaseAllKeys();

      console.log('[KeyboardHookService] Keyboard hook stopped successfully');
      this.notifyStatusChange();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[KeyboardHookService] Failed to stop keyboard hook:', errorMessage);
      this.diagnostics.lastError = errorMessage;
      throw error;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Check if this is a tagged event (our own simulation)
    if (this.isTaggedEvent(event)) {
      console.log('[KeyboardHookService] Ignoring tagged key down event');
      return;
    }

    const keyName = UIOHOOK_KEY_MAP[event.keycode];
    if (!keyName || !this.config.enabledKeys.includes(keyName)) {
      return;
    }

    this.diagnostics.totalEventsProcessed++;
    this.diagnostics.keyDownEvents++;

    const keyState = this.keyStates.get(keyName);
    if (!keyState) {
      return;
    }

    console.log(`[KeyboardHookService] Physical key down: ${keyName}`);

    // Update physical state
    keyState.physicallyPressed = true;
    keyState.lastEventTime = Date.now();

    // Find which group this key belongs to
    const keyGroup = this.findKeyGroup(keyName);
    if (!keyGroup) {
      // No group, just track the logical state
      if (!keyState.logicallyPressed) {
        keyState.logicallyPressed = true;
      }
      return;
    }

    // Check for conflicts within the group
    if (!keyGroup.allowSimultaneous) {
      const conflictingKeys = this.findConflictingKeys(keyName, keyGroup);
      if (conflictingKeys.length > 0) {
        console.log(
          `[KeyboardHookService] Conflict detected: ${keyName} conflicts with ${conflictingKeys.join(', ')}`
        );
        this.diagnostics.conflictsResolved++;

        // Release conflicting keys
        for (const conflictKey of conflictingKeys) {
          this.releaseKey(conflictKey);
        }
      }
    }

    // Activate this key logically if not already pressed
    if (!keyState.logicallyPressed) {
      this.activateKey(keyName);
    }

    this.notifyStatusChange();
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Check if this is a tagged event (our own simulation)
    if (this.isTaggedEvent(event)) {
      console.log('[KeyboardHookService] Ignoring tagged key up event');
      return;
    }

    const keyName = UIOHOOK_KEY_MAP[event.keycode];
    if (!keyName || !this.config.enabledKeys.includes(keyName)) {
      return;
    }

    this.diagnostics.totalEventsProcessed++;
    this.diagnostics.keyUpEvents++;

    const keyState = this.keyStates.get(keyName);
    if (!keyState) {
      return;
    }

    console.log(`[KeyboardHookService] Physical key up: ${keyName}`);

    // Update physical state
    keyState.physicallyPressed = false;
    keyState.lastEventTime = Date.now();

    // Deactivate key logically
    if (keyState.logicallyPressed) {
      this.deactivateKey(keyName);
    }

    this.notifyStatusChange();
  }

  private isTaggedEvent(_event: KeyboardEvent): boolean {
    // Check if the event has our magic tag
    // Note: uIOhook may not provide dwExtraInfo, so we'll need to track our own simulated events
    // For now, we'll use a simple timestamp-based approach
    return false; // TODO: Implement proper tagging mechanism
  }

  private findKeyGroup(keyName: string): KeyGroup | null {
    for (const group of this.config.keyGroups) {
      if (group.keys.includes(keyName)) {
        return group;
      }
    }
    return null;
  }

  private findConflictingKeys(keyName: string, keyGroup: KeyGroup): string[] {
    const conflicts: string[] = [];
    for (const groupKey of keyGroup.keys) {
      if (groupKey === keyName) {
        continue;
      }
      const state = this.keyStates.get(groupKey);
      if (state && state.logicallyPressed) {
        conflicts.push(groupKey);
      }
    }
    return conflicts;
  }

  private activateKey(keyName: string): void {
    const keyState = this.keyStates.get(keyName);
    if (!keyState) {
      return;
    }

    const vkCode = KEY_TO_VK[keyName];
    if (!vkCode) {
      console.error(`[KeyboardHookService] No VK code for key: ${keyName}`);
      return;
    }

    console.log(`[KeyboardHookService] Activating key: ${keyName} (VK=${vkCode})`);
    keyState.logicallyPressed = true;

    // Send simulated key down
    if (sendKeyDown(vkCode, true)) {
      this.diagnostics.simulatedEvents++;
    }
  }

  private deactivateKey(keyName: string): void {
    const keyState = this.keyStates.get(keyName);
    if (!keyState) {
      return;
    }

    const vkCode = KEY_TO_VK[keyName];
    if (!vkCode) {
      console.error(`[KeyboardHookService] No VK code for key: ${keyName}`);
      return;
    }

    console.log(`[KeyboardHookService] Deactivating key: ${keyName} (VK=${vkCode})`);
    keyState.logicallyPressed = false;

    // Send simulated key up
    if (sendKeyUp(vkCode, true)) {
      this.diagnostics.simulatedEvents++;
    }
  }

  private releaseKey(keyName: string): void {
    const keyState = this.keyStates.get(keyName);
    if (!keyState || !keyState.logicallyPressed) {
      return;
    }

    console.log(`[KeyboardHookService] Releasing key due to conflict: ${keyName}`);
    this.deactivateKey(keyName);
  }

  private releaseAllKeys(): void {
    console.log('[KeyboardHookService] Releasing all pressed keys');
    for (const [keyName, keyState] of this.keyStates.entries()) {
      if (keyState.logicallyPressed) {
        this.deactivateKey(keyName);
      }
      keyState.physicallyPressed = false;
      keyState.logicallyPressed = false;
    }
  }

  updateConfig(config: Partial<KeyboardHookConfig>): void {
    console.log('[KeyboardHookService] Updating configuration:', config);
    this.config = { ...this.config, ...config };

    // Reinitialize key states if enabled keys changed
    if (config.enabledKeys) {
      this.initializeKeyStates();
    }

    // Restart hook if it was running
    if (this.running && config.enabled === false) {
      this.stop();
    } else if (!this.running && config.enabled === true) {
      this.start();
    }
  }

  getActiveKeys(): string[] {
    const activeKeys: string[] = [];
    for (const [keyName, keyState] of this.keyStates.entries()) {
      if (keyState.logicallyPressed) {
        activeKeys.push(keyName);
      }
    }
    return activeKeys;
  }

  getDiagnostics(): HookDiagnostics {
    return { ...this.diagnostics };
  }

  getKeyStates(): Map<string, KeyState> {
    return new Map(this.keyStates);
  }

  isRunning(): boolean {
    return this.running;
  }

  onStatusChange(listener: (status: HookServiceStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyStatusChange(): void {
    const status = {
      running: this.running,
      activeKeys: this.getActiveKeys(),
      diagnostics: this.getDiagnostics(),
    };
    this.statusListeners.forEach(listener => listener(status));
  }

  cleanup(): void {
    if (this.running) {
      this.stop();
    }
    this.statusListeners = [];
  }
}
