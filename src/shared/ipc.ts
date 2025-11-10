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

  // Hook Status
  HOOK_STATUS_GET: 'hook:status:get',
  HOOK_STATUS_UPDATED: 'hook:status:updated',
  HOOK_TOGGLE: 'hook:toggle',

  // Process Queries
  PROCESS_LIST: 'process:list',
  PROCESS_ACTIVE: 'process:active',

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

// Settings Schema
export const settingsSchema = z.object({
  enabledKeys: z.array(z.enum(['W', 'A', 'S', 'D'])).default(['W', 'A', 'S', 'D']),
  startOnBoot: z.boolean().default(false),
  minimizeToTray: z.boolean().default(true),
  showNotifications: z.boolean().default(true),
  hotkey: z.string().default('Ctrl+Shift+K'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export const partialSettingsSchema = settingsSchema.partial();

// Hook Status Schema
export const hookStatusSchema = z.object({
  enabled: z.boolean(),
  activeKeys: z.array(z.string()),
  lastError: z.string().nullable(),
});

// Process Info Schema
export const processInfoSchema = z.object({
  pid: z.number(),
  name: z.string(),
  path: z.string(),
  cpu: z.number().optional(),
  memory: z.number().optional(),
});

export const processListSchema = z.array(processInfoSchema);

// Active Process Schema
export const activeProcessSchema = z.object({
  pid: z.number(),
  name: z.string(),
  title: z.string(),
});

// Tray Status Schema
export const trayStatusSchema = z.object({
  visible: z.boolean(),
});

// ===========================
// TypeScript Types
// ===========================

export type Settings = z.infer<typeof settingsSchema>;
export type PartialSettings = z.infer<typeof partialSettingsSchema>;
export type HookStatus = z.infer<typeof hookStatusSchema>;
export type ProcessInfo = z.infer<typeof processInfoSchema>;
export type ProcessList = z.infer<typeof processListSchema>;
export type ActiveProcess = z.infer<typeof activeProcessSchema>;
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

export const DEFAULT_SETTINGS: Settings = {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system',
};

export const DEFAULT_HOOK_STATUS: HookStatus = {
  enabled: false,
  activeKeys: [],
  lastError: null,
};
