// Mock modules before imports
jest.mock('uiohook-napi', () => ({
  uIOhook: {
    on: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  },
  UiohookKey: {
    W: 0x11,
    A: 0x1e,
    S: 0x1f,
    D: 0x20,
  },
}));

jest.mock('../../native/win32-input', () => ({
  sendKeyDown: jest.fn(() => true),
  sendKeyUp: jest.fn(() => true),
  KEY_TO_VK: {
    W: 0x57,
    A: 0x41,
    S: 0x53,
    D: 0x44,
  },
  SNAPKEY_MAGIC_DWEXTRAINFO: 0x534e4150,
  getKeyName: jest.fn((vkCode: number) => `VK_${vkCode.toString(16).toUpperCase()}`),
}));

import { KeyboardHookService, KeyboardHookConfig, KeyGroup } from '../keyboard-hook-service';
import { uIOhook } from 'uiohook-napi';
import * as win32Input from '../../native/win32-input';

const mockUIOhook = uIOhook as jest.Mocked<typeof uIOhook>;
const mockSendKeyDown = win32Input.sendKeyDown as jest.MockedFunction<typeof win32Input.sendKeyDown>;
const mockSendKeyUp = win32Input.sendKeyUp as jest.MockedFunction<typeof win32Input.sendKeyUp>;

describe('KeyboardHookService', () => {
  let service: KeyboardHookService;
  let config: KeyboardHookConfig;
  let keyDownHandler: any;
  let keyUpHandler: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockSendKeyDown.mockReturnValue(true);
    mockSendKeyUp.mockReturnValue(true);

    // Reset handlers
    keyDownHandler = null;
    keyUpHandler = null;

    // Capture event handlers
    (mockUIOhook.on as any).mockImplementation((event: string, handler: any) => {
      if (event === 'keydown') {
        keyDownHandler = handler;
      } else if (event === 'keyup') {
        keyUpHandler = handler;
      }
      return mockUIOhook;
    });

    // Default config with opposing key groups
    const keyGroups: KeyGroup[] = [
      { keys: ['W', 'S'], allowSimultaneous: false },
      { keys: ['A', 'D'], allowSimultaneous: false },
    ];

    config = {
      enabled: true,
      keyGroups,
      enabledKeys: ['W', 'A', 'S', 'D'],
    };

    service = new KeyboardHookService(config);
  });

  afterEach(() => {
    if (service) {
      service.cleanup();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct config', () => {
      expect(service).toBeDefined();
      expect(service.isRunning()).toBe(false);
      expect(service.getActiveKeys()).toEqual([]);
    });

    it('should initialize key states for all enabled keys', () => {
      const keyStates = service.getKeyStates();
      expect(keyStates.size).toBe(4);
      expect(keyStates.has('W')).toBe(true);
      expect(keyStates.has('A')).toBe(true);
      expect(keyStates.has('S')).toBe(true);
      expect(keyStates.has('D')).toBe(true);
    });
  });

  describe('Start/Stop', () => {
    it('should start the hook successfully', () => {
      service.start();
      expect(mockUIOhook.start).toHaveBeenCalledTimes(1);
      expect(service.isRunning()).toBe(true);
    });

    it('should stop the hook successfully', () => {
      service.start();
      service.stop();
      expect(mockUIOhook.stop).toHaveBeenCalledTimes(1);
      expect(service.isRunning()).toBe(false);
    });

    it('should not start twice', () => {
      service.start();
      service.start();
      expect(mockUIOhook.start).toHaveBeenCalledTimes(1);
    });

    it('should register event handlers when starting', () => {
      service.start();
      expect(mockUIOhook.on).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockUIOhook.on).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should release all keys when stopping', () => {
      service.start();

      // Simulate key press
      keyDownHandler({ keycode: 0x11 }); // W key

      mockSendKeyDown.mockClear();
      mockSendKeyUp.mockClear();

      service.stop();

      // Should send key up for pressed key
      expect(mockSendKeyUp).toHaveBeenCalled();
    });
  });

  describe('Key State Tracking', () => {
    beforeEach(() => {
      service.start();
    });

    it('should track key down events', () => {
      keyDownHandler({ keycode: 0x11 }); // W key

      const keyStates = service.getKeyStates();
      const wState = keyStates.get('W');
      expect(wState?.physicallyPressed).toBe(true);
      expect(wState?.logicallyPressed).toBe(true);
    });

    it('should track key up events', () => {
      keyDownHandler({ keycode: 0x11 }); // W key
      keyUpHandler({ keycode: 0x11 }); // W key

      const keyStates = service.getKeyStates();
      const wState = keyStates.get('W');
      expect(wState?.physicallyPressed).toBe(false);
      expect(wState?.logicallyPressed).toBe(false);
    });

    it('should send simulated key down on physical key down', () => {
      keyDownHandler({ keycode: 0x11 }); // W key
      expect(mockSendKeyDown).toHaveBeenCalledWith(0x57, true); // VK_W with tag
    });

    it('should send simulated key up on physical key up', () => {
      keyDownHandler({ keycode: 0x11 }); // W key
      mockSendKeyUp.mockClear();

      keyUpHandler({ keycode: 0x11 }); // W key
      expect(mockSendKeyUp).toHaveBeenCalledWith(0x57, true); // VK_W with tag
    });
  });

  describe('Conflict Resolution', () => {
    beforeEach(() => {
      service.start();
    });

    it('should resolve W-S conflict', () => {
      // Press W
      keyDownHandler({ keycode: 0x11 }); // W key
      expect(service.getActiveKeys()).toEqual(['W']);

      mockSendKeyUp.mockClear();

      // Press S (should release W)
      keyDownHandler({ keycode: 0x1f }); // S key

      // W should be released
      expect(mockSendKeyUp).toHaveBeenCalledWith(0x57, true); // VK_W
      expect(service.getActiveKeys()).toEqual(['S']);
    });

    it('should resolve A-D conflict', () => {
      // Press A
      keyDownHandler({ keycode: 0x1e }); // A key
      expect(service.getActiveKeys()).toEqual(['A']);

      mockSendKeyUp.mockClear();

      // Press D (should release A)
      keyDownHandler({ keycode: 0x20 }); // D key

      // A should be released
      expect(mockSendKeyUp).toHaveBeenCalledWith(0x41, true); // VK_A
      expect(service.getActiveKeys()).toEqual(['D']);
    });

    it('should allow W and A simultaneously (no conflict)', () => {
      // Press W
      keyDownHandler({ keycode: 0x11 }); // W key
      // Press A
      keyDownHandler({ keycode: 0x1e }); // A key

      expect(service.getActiveKeys()).toContain('W');
      expect(service.getActiveKeys()).toContain('A');
      expect(service.getActiveKeys().length).toBe(2);
    });

    it('should track conflicts resolved in diagnostics', () => {
      // Press W
      keyDownHandler({ keycode: 0x11 }); // W key
      // Press S (conflict)
      keyDownHandler({ keycode: 0x1f }); // S key

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.conflictsResolved).toBeGreaterThan(0);
    });
  });

  describe('Multi-Key Combo Handling', () => {
    beforeEach(() => {
      service.start();
    });

    it('should handle W+A combo', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1e }); // A

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).toContain('W');
      expect(activeKeys).toContain('A');
    });

    it('should handle W+D combo', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x20 }); // D

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).toContain('W');
      expect(activeKeys).toContain('D');
    });

    it('should handle S+A combo', () => {
      keyDownHandler({ keycode: 0x1f }); // S
      keyDownHandler({ keycode: 0x1e }); // A

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).toContain('S');
      expect(activeKeys).toContain('A');
    });

    it('should prevent W+S combo', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1f }); // S

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).not.toContain('W');
      expect(activeKeys).toContain('S');
      expect(activeKeys.length).toBe(1);
    });

    it('should prevent A+D combo', () => {
      keyDownHandler({ keycode: 0x1e }); // A
      keyDownHandler({ keycode: 0x20 }); // D

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).not.toContain('A');
      expect(activeKeys).toContain('D');
      expect(activeKeys.length).toBe(1);
    });
  });

  describe('Diagnostics', () => {
    beforeEach(() => {
      service.start();
    });

    it('should track total events processed', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyUpHandler({ keycode: 0x11 }); // W

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.totalEventsProcessed).toBe(2);
    });

    it('should track key down events', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1e }); // A

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.keyDownEvents).toBe(2);
    });

    it('should track key up events', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyUpHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1e }); // A
      keyUpHandler({ keycode: 0x1e }); // A

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.keyUpEvents).toBe(2);
    });

    it('should track simulated events', () => {
      keyDownHandler({ keycode: 0x11 }); // W (down + up simulation)
      keyUpHandler({ keycode: 0x11 }); // W

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.simulatedEvents).toBeGreaterThan(0);
    });
  });

  describe('Config Updates', () => {
    beforeEach(() => {
      service.start();
    });

    it('should update enabled keys', () => {
      service.updateConfig({ enabledKeys: ['W', 'S'] });

      const keyStates = service.getKeyStates();
      expect(keyStates.size).toBe(2);
      expect(keyStates.has('W')).toBe(true);
      expect(keyStates.has('S')).toBe(true);
    });

    it('should stop hook when disabled', () => {
      service.updateConfig({ enabled: false });
      expect(mockUIOhook.stop).toHaveBeenCalled();
    });

    it('should start hook when enabled', () => {
      service.stop();
      mockUIOhook.start.mockClear();

      service.updateConfig({ enabled: true });
      expect(mockUIOhook.start).toHaveBeenCalled();
    });
  });

  describe('Simultaneous Keys Configuration', () => {
    it('should allow simultaneous keys when configured', () => {
      const simultaneousConfig: KeyboardHookConfig = {
        enabled: true,
        keyGroups: [
          { keys: ['W', 'S'], allowSimultaneous: true }, // Allow W+S
          { keys: ['A', 'D'], allowSimultaneous: false }, // Prevent A+D
        ],
        enabledKeys: ['W', 'A', 'S', 'D'],
      };

      service = new KeyboardHookService(simultaneousConfig);
      service.start();

      // Press W
      keyDownHandler({ keycode: 0x11 }); // W
      // Press S (should be allowed now)
      keyDownHandler({ keycode: 0x1f }); // S

      const activeKeys = service.getActiveKeys();
      expect(activeKeys).toContain('W');
      expect(activeKeys).toContain('S');
      expect(activeKeys.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service.start();
    });

    it('should ignore unknown key codes', () => {
      const initialDiagnostics = service.getDiagnostics();

      keyDownHandler({ keycode: 0x99 }); // Unknown key

      const diagnostics = service.getDiagnostics();
      expect(diagnostics.totalEventsProcessed).toBe(initialDiagnostics.totalEventsProcessed);
    });

    it('should handle rapid key presses', () => {
      // Rapid W-S alternation
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1f }); // S
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x1f }); // S

      expect(service.getActiveKeys()).toEqual(['S']);
    });

    it('should handle key up without key down', () => {
      // Try to release a key that wasn't pressed
      expect(() => {
        keyUpHandler({ keycode: 0x11 }); // W
      }).not.toThrow();
    });

    it('should handle duplicate key down events', () => {
      keyDownHandler({ keycode: 0x11 }); // W
      keyDownHandler({ keycode: 0x11 }); // W again

      expect(service.getActiveKeys()).toEqual(['W']);
    });
  });
});
