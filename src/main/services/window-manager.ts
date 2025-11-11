import {
  enumerateWindows,
  getForegroundWindowInfo,
  isWindowFullscreen,
} from '../native/win32-window';

export interface ProcessWithWindow {
  pid: number;
  name: string;
  path: string;
  title: string;
}

export interface ActiveWindowState {
  process: ProcessWithWindow | null;
  isFullscreen: boolean;
  hwnd: number | null;
}

export interface WindowConditions {
  targetProcess: string | null;
  fullscreenOnly: boolean;
}

export class WindowManager {
  private currentState: ActiveWindowState;
  private listeners: Array<(state: ActiveWindowState) => void> = [];
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastPollTime = 0;
  private readonly POLL_INTERVAL_MS = 500; // Poll every 500ms
  private readonly MIN_POLL_INTERVAL_MS = 100; // Throttle to prevent excessive polling

  constructor() {
    this.currentState = {
      process: null,
      isFullscreen: false,
      hwnd: null,
    };
  }

  start(): void {
    if (this.pollingInterval) {
      console.log('[WindowManager] Already started');
      return;
    }

    console.log('[WindowManager] Starting window monitoring...');
    this.pollingInterval = setInterval(() => {
      this.poll();
    }, this.POLL_INTERVAL_MS);

    // Do initial poll
    this.poll();
  }

  stop(): void {
    if (!this.pollingInterval) {
      console.log('[WindowManager] Not started');
      return;
    }

    console.log('[WindowManager] Stopping window monitoring...');
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  private poll(): void {
    const now = Date.now();
    if (now - this.lastPollTime < this.MIN_POLL_INTERVAL_MS) {
      return; // Throttle
    }
    this.lastPollTime = now;

    try {
      const newState = this.detectCurrentState();
      const stateChanged = this.hasStateChanged(this.currentState, newState);

      if (stateChanged) {
        console.log('[WindowManager] State changed:', newState);
        this.currentState = newState;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[WindowManager] Error polling window state:', error);
    }
  }

  private detectCurrentState(): ActiveWindowState {
    if (process.platform !== 'win32') {
      return {
        process: null,
        isFullscreen: false,
        hwnd: null,
      };
    }

    const windowInfo = getForegroundWindowInfo();
    if (!windowInfo) {
      return {
        process: null,
        isFullscreen: false,
        hwnd: null,
      };
    }

    const processInfo: ProcessWithWindow = {
      pid: windowInfo.processId,
      name: windowInfo.processName,
      path: windowInfo.processPath,
      title: windowInfo.title,
    };

    const fullscreen = isWindowFullscreen(windowInfo.hwnd);

    return {
      process: processInfo,
      isFullscreen: fullscreen,
      hwnd: windowInfo.hwnd,
    };
  }

  private hasStateChanged(oldState: ActiveWindowState, newState: ActiveWindowState): boolean {
    // Check if process changed
    if (oldState.process?.pid !== newState.process?.pid) {
      return true;
    }

    // Check if title changed (same process but different window)
    if (oldState.process?.title !== newState.process?.title) {
      return true;
    }

    // Check if fullscreen status changed
    if (oldState.isFullscreen !== newState.isFullscreen) {
      return true;
    }

    return false;
  }

  getCurrentState(): ActiveWindowState {
    return { ...this.currentState };
  }

  getActiveProcess(): ProcessWithWindow | null {
    return this.currentState.process ? { ...this.currentState.process } : null;
  }

  isFullscreen(): boolean {
    return this.currentState.isFullscreen;
  }

  checkConditions(conditions: WindowConditions): boolean {
    const state = this.currentState;

    // If no process is active, conditions not met
    if (!state.process) {
      return false;
    }

    // Check target process condition
    if (conditions.targetProcess) {
      const targetLower = conditions.targetProcess.toLowerCase();
      const processNameLower = state.process.name.toLowerCase();
      const processPathLower = state.process.path.toLowerCase();

      // Match by process name or full path
      const matchesName = processNameLower === targetLower;
      const matchesPath = processPathLower === targetLower;
      const matchesPathEndsWith = processPathLower.endsWith('\\' + targetLower);

      if (!matchesName && !matchesPath && !matchesPathEndsWith) {
        return false;
      }
    }

    // Check fullscreen condition
    if (conditions.fullscreenOnly && !state.isFullscreen) {
      return false;
    }

    return true;
  }

  listProcessesWithWindows(): ProcessWithWindow[] {
    if (process.platform !== 'win32') {
      return [];
    }

    try {
      const windows = enumerateWindows();

      // Deduplicate by process path and collect unique processes
      const processMap = new Map<string, ProcessWithWindow>();

      for (const window of windows) {
        const key = window.processPath || window.processName;
        if (!processMap.has(key)) {
          processMap.set(key, {
            pid: window.processId,
            name: window.processName,
            path: window.processPath,
            title: window.title,
          });
        }
      }

      return Array.from(processMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('[WindowManager] Error listing processes:', error);
      return [];
    }
  }

  onChange(listener: (state: ActiveWindowState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getCurrentState());
      } catch (error) {
        console.error('[WindowManager] Error in listener:', error);
      }
    });
  }

  cleanup(): void {
    this.stop();
    this.listeners = [];
  }
}
