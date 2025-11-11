import { z } from 'zod';

// ===========================
// IPC Channel Constants
// ===========================

export const IPC_CHANNELS = {
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_UPDATED: 'settings:updated',

  // Profile Management
  PROFILE_LIST: 'profile:list',
  PROFILE_GET: 'profile:get',
  PROFILE_CREATE: 'profile:create',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_DELETE: 'profile:delete',
  PROFILE_SET_ACTIVE: 'profile:set-active',

  // Keybind Management
  KEYBIND_CREATE: 'keybind:create',
  KEYBIND_UPDATE: 'keybind:update',
  KEYBIND_DELETE: 'keybind:delete',

  // Hook Status
  HOOK_STATUS_GET: 'hook:status:get',
  HOOK_STATUS_UPDATED: 'hook:status:updated',
  HOOK_TOGGLE: 'hook:toggle',
  HOOK_DIAGNOSTICS_GET: 'hook:diagnostics:get',

  // Process Queries
  PROCESS_LIST: 'process:list',
  PROCESS_ACTIVE: 'process:active',
  PROCESS_FULLSCREEN_STATE: 'process:fullscreen-state',
  WINDOW_STATE_UPDATED: 'window:state:updated',

  // Tray
  TRAY_TOGGLE: 'tray:toggle',
  TRAY_SHOW: 'tray:show',
  TRAY_HIDE: 'tray:hide',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
} as const;

// ===========================
// Zod Schemas
// ===========================

// Keybind Combo Schema
export const keybindComboSchema = z.object({
  id: z.string(),
  keys: z.array(z.number()), // VK codes
  groupId: z.string(),
  allowSimultaneous: z.boolean(),
});

// Keybind Profile Schema
export const keybindProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  keybinds: z.array(keybindComboSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Settings Schema
export const settingsSchema = z.object({
  // Core settings
  fullscreenOnly: z.boolean().default(false),
  targetProcess: z.string().nullable().default(null),
  startOnBoot: z.boolean().default(false),
  minimizeToTray: z.boolean().default(true),
  showNotifications: z.boolean().default(true),
  hotkey: z.string().default('Ctrl+Shift+K'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),

  // Profile management
  profiles: z.array(keybindProfileSchema).default([]),
  activeProfileId: z.string().default('default-wasd'),

  // Legacy support (deprecated, will be removed in future)
  enabledKeys: z.array(z.enum(['W', 'A', 'S', 'D'])).optional(),
});

export const partialSettingsSchema = settingsSchema.partial();
export const partialKeybindProfileSchema = keybindProfileSchema.partial();
export const partialKeybindComboSchema = keybindComboSchema.partial();

// Hook Status Schema
export const hookStatusSchema = z.object({
  enabled: z.boolean(),
  activeKeys: z.array(z.string()),
  lastError: z.string().nullable(),
});

// Hook Diagnostics Schema
export const hookDiagnosticsSchema = z.object({
  totalEventsProcessed: z.number(),
  keyDownEvents: z.number(),
  keyUpEvents: z.number(),
  simulatedEvents: z.number(),
  conflictsResolved: z.number(),
  lastError: z.string().nullable(),
});

// Process Info Schema
export const processInfoSchema = z.object({
  pid: z.number(),
  name: z.string(),
  path: z.string(),
  title: z.string(),
});

export const processListSchema = z.array(processInfoSchema);

// Active Process Schema
export const activeProcessSchema = z
  .object({
    pid: z.number(),
    name: z.string(),
    path: z.string(),
    title: z.string(),
  })
  .nullable();

// Window State Schema
export const windowStateSchema = z.object({
  process: activeProcessSchema,
  isFullscreen: z.boolean(),
  conditionsMet: z.boolean(),
});

// Tray Status Schema
export const trayStatusSchema = z.object({
  visible: z.boolean(),
});

// ===========================
// TypeScript Types
// ===========================

export type KeybindCombo = z.infer<typeof keybindComboSchema>;
export type PartialKeybindCombo = z.infer<typeof partialKeybindComboSchema>;
export type KeybindProfile = z.infer<typeof keybindProfileSchema>;
export type PartialKeybindProfile = z.infer<typeof partialKeybindProfileSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type PartialSettings = z.infer<typeof partialSettingsSchema>;
export type HookStatus = z.infer<typeof hookStatusSchema>;
export type HookDiagnostics = z.infer<typeof hookDiagnosticsSchema>;
export type ProcessInfo = z.infer<typeof processInfoSchema>;
export type ProcessList = z.infer<typeof processListSchema>;
export type ActiveProcess = z.infer<typeof activeProcessSchema>;
export type WindowState = z.infer<typeof windowStateSchema>;
export type TrayStatus = z.infer<typeof trayStatusSchema>;

// ===========================
// IPC Message Types
// ===========================

// Request/Response types for type-safe IPC
export interface IpcRequest<T = unknown> {
  channel: string;
  data?: T;
}

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===========================
// Channel Validation
// ===========================

const VALID_CHANNELS = Object.values(IPC_CHANNELS);

export function isValidChannel(channel: string): boolean {
  return VALID_CHANNELS.includes(channel as (typeof VALID_CHANNELS)[number]);
}

export function validateChannel(channel: string): void {
  if (!isValidChannel(channel)) {
    throw new Error(`Invalid IPC channel: ${channel}`);
  }
}

// ===========================
// Default Values
// ===========================

// VK codes for default WASD keys
export const VK_W = 0x57;
export const VK_A = 0x41;
export const VK_S = 0x53;
export const VK_D = 0x44;

// Default WASD profile
export const DEFAULT_WASD_PROFILE: KeybindProfile = {
  id: 'default-wasd',
  name: 'WASD Movement',
  description: 'Default profile for WASD movement keys with anti-recoil',
  keybinds: [
    {
      id: 'wasd-vertical',
      keys: [VK_W, VK_S],
      groupId: 'vertical',
      allowSimultaneous: false,
    },
    {
      id: 'wasd-horizontal',
      keys: [VK_A, VK_D],
      groupId: 'horizontal',
      allowSimultaneous: false,
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_SETTINGS: Settings = {
  fullscreenOnly: false,
  targetProcess: null,
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system',
  profiles: [DEFAULT_WASD_PROFILE],
  activeProfileId: 'default-wasd',
};

export const DEFAULT_HOOK_STATUS: HookStatus = {
  enabled: false,
  activeKeys: [],
  lastError: null,
};
