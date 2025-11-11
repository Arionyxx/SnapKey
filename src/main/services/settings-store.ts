import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import {
  Settings,
  KeybindProfile,
  KeybindCombo,
  settingsSchema,
  keybindProfileSchema,
  keybindComboSchema,
  DEFAULT_SETTINGS,
  DEFAULT_WASD_PROFILE,
} from '../../shared/ipc';

interface StoreSchema {
  settings: Settings;
  schemaVersion: number;
}

const CURRENT_SCHEMA_VERSION = 1;

export class SettingsStore {
  private store: Store<StoreSchema>;

  constructor() {
    // Configure electron-store to use %APPDATA%/SnapKey
    const appDataPath = app.getPath('appData');
    const snapKeyPath = path.join(appDataPath, 'SnapKey');

    this.store = new Store<StoreSchema>({
      name: 'settings',
      cwd: snapKeyPath,
      defaults: {
        settings: DEFAULT_SETTINGS,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      migrations: {
        '1': store => {
          console.log('[SettingsStore] Running migration to schema version 1');
          const settings = store.get('settings') as Record<string, unknown>;

          // Migrate from old enabledKeys format to new profiles format
          if (settings.enabledKeys && !settings.profiles) {
            console.log('[SettingsStore] Migrating enabledKeys to profiles');
            settings.profiles = [DEFAULT_WASD_PROFILE];
            settings.activeProfileId = 'default-wasd';
            settings.fullscreenOnly = settings.fullscreenOnly ?? false;
            settings.targetProcess = settings.targetProcess ?? null;
            delete settings.enabledKeys;
          }

          // Ensure all required fields exist
          settings.fullscreenOnly = settings.fullscreenOnly ?? false;
          settings.targetProcess = settings.targetProcess ?? null;
          settings.profiles = settings.profiles ?? [DEFAULT_WASD_PROFILE];
          settings.activeProfileId = settings.activeProfileId ?? 'default-wasd';

          store.set('settings', settings);
          store.set('schemaVersion', 1);
        },
      },
    });

    console.log('[SettingsStore] Initialized at:', snapKeyPath);
    this.validateAndMigrate();
  }

  private validateAndMigrate(): void {
    const currentVersion = this.store.get('schemaVersion', 0);
    console.log('[SettingsStore] Current schema version:', currentVersion);

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      console.log('[SettingsStore] Schema migration needed');
      // Migrations are handled automatically by electron-store
    }

    // Validate settings
    try {
      const settings = this.store.get('settings');
      settingsSchema.parse(settings);
      console.log('[SettingsStore] Settings validated successfully');
    } catch (error) {
      console.error('[SettingsStore] Settings validation failed:', error);
      console.log('[SettingsStore] Resetting to defaults');
      this.store.set('settings', DEFAULT_SETTINGS);
    }
  }

  // ===========================
  // Settings Operations
  // ===========================

  getSettings(): Settings {
    return this.store.get('settings');
  }

  updateSettings(updates: Partial<Settings>): Settings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };

    // Validate before saving
    const validated = settingsSchema.parse(updated);
    this.store.set('settings', validated);
    console.log('[SettingsStore] Settings updated');
    return validated;
  }

  resetSettings(): Settings {
    this.store.set('settings', DEFAULT_SETTINGS);
    console.log('[SettingsStore] Settings reset to defaults');
    return DEFAULT_SETTINGS;
  }

  // ===========================
  // Profile CRUD Operations
  // ===========================

  listProfiles(): KeybindProfile[] {
    const settings = this.getSettings();
    return settings.profiles;
  }

  getProfile(profileId: string): KeybindProfile | null {
    const settings = this.getSettings();
    return settings.profiles.find(p => p.id === profileId) || null;
  }

  createProfile(profile: Omit<KeybindProfile, 'id' | 'createdAt' | 'updatedAt'>): KeybindProfile {
    const settings = this.getSettings();

    // Generate ID
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newProfile: KeybindProfile = {
      ...profile,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validate profile
    keybindProfileSchema.parse(newProfile);

    // Check for duplicate name
    if (settings.profiles.some(p => p.name === newProfile.name)) {
      throw new Error(`Profile with name "${newProfile.name}" already exists`);
    }

    // Validate keybinds
    this.validateKeybinds(newProfile.keybinds);

    settings.profiles.push(newProfile);
    this.store.set('settings', settings);
    console.log('[SettingsStore] Profile created:', id);

    return newProfile;
  }

  updateProfile(
    profileId: string,
    updates: Partial<Omit<KeybindProfile, 'id' | 'createdAt'>>
  ): KeybindProfile {
    const settings = this.getSettings();
    const profileIndex = settings.profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const updatedProfile: KeybindProfile = {
      ...settings.profiles[profileIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    // Validate profile
    keybindProfileSchema.parse(updatedProfile);

    // Check for duplicate name (excluding current profile)
    if (
      updates.name &&
      settings.profiles.some(p => p.id !== profileId && p.name === updates.name)
    ) {
      throw new Error(`Profile with name "${updates.name}" already exists`);
    }

    // Validate keybinds if they were updated
    if (updates.keybinds) {
      this.validateKeybinds(updatedProfile.keybinds);
    }

    settings.profiles[profileIndex] = updatedProfile;
    this.store.set('settings', settings);
    console.log('[SettingsStore] Profile updated:', profileId);

    return updatedProfile;
  }

  deleteProfile(profileId: string): void {
    const settings = this.getSettings();

    // Cannot delete the last profile
    if (settings.profiles.length <= 1) {
      throw new Error('Cannot delete the last profile');
    }

    const profileIndex = settings.profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    settings.profiles.splice(profileIndex, 1);

    // If active profile was deleted, switch to first profile
    if (settings.activeProfileId === profileId) {
      settings.activeProfileId = settings.profiles[0].id;
      console.log('[SettingsStore] Active profile switched to:', settings.activeProfileId);
    }

    this.store.set('settings', settings);
    console.log('[SettingsStore] Profile deleted:', profileId);
  }

  setActiveProfile(profileId: string): Settings {
    const settings = this.getSettings();

    const profile = settings.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    settings.activeProfileId = profileId;
    this.store.set('settings', settings);
    console.log('[SettingsStore] Active profile set to:', profileId);

    return settings;
  }

  getActiveProfile(): KeybindProfile | null {
    const settings = this.getSettings();
    return settings.profiles.find(p => p.id === settings.activeProfileId) || null;
  }

  // ===========================
  // Keybind CRUD Operations
  // ===========================

  createKeybind(
    profileId: string,
    keybind: Omit<KeybindCombo, 'id'>
  ): { profile: KeybindProfile; keybind: KeybindCombo } {
    const settings = this.getSettings();
    const profileIndex = settings.profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Generate ID
    const id = `keybind-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newKeybind: KeybindCombo = {
      ...keybind,
      id,
    };

    // Validate keybind
    keybindComboSchema.parse(newKeybind);

    const profile = settings.profiles[profileIndex];
    profile.keybinds.push(newKeybind);
    profile.updatedAt = Date.now();

    // Validate all keybinds
    this.validateKeybinds(profile.keybinds);

    this.store.set('settings', settings);
    console.log('[SettingsStore] Keybind created:', id);

    return { profile, keybind: newKeybind };
  }

  updateKeybind(
    profileId: string,
    keybindId: string,
    updates: Partial<Omit<KeybindCombo, 'id'>>
  ): { profile: KeybindProfile; keybind: KeybindCombo } {
    const settings = this.getSettings();
    const profileIndex = settings.profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const profile = settings.profiles[profileIndex];
    const keybindIndex = profile.keybinds.findIndex(k => k.id === keybindId);

    if (keybindIndex === -1) {
      throw new Error(`Keybind not found: ${keybindId}`);
    }

    const updatedKeybind: KeybindCombo = {
      ...profile.keybinds[keybindIndex],
      ...updates,
    };

    // Validate keybind
    keybindComboSchema.parse(updatedKeybind);

    profile.keybinds[keybindIndex] = updatedKeybind;
    profile.updatedAt = Date.now();

    // Validate all keybinds
    this.validateKeybinds(profile.keybinds);

    this.store.set('settings', settings);
    console.log('[SettingsStore] Keybind updated:', keybindId);

    return { profile, keybind: updatedKeybind };
  }

  deleteKeybind(profileId: string, keybindId: string): KeybindProfile {
    const settings = this.getSettings();
    const profileIndex = settings.profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const profile = settings.profiles[profileIndex];
    const keybindIndex = profile.keybinds.findIndex(k => k.id === keybindId);

    if (keybindIndex === -1) {
      throw new Error(`Keybind not found: ${keybindId}`);
    }

    profile.keybinds.splice(keybindIndex, 1);
    profile.updatedAt = Date.now();

    this.store.set('settings', settings);
    console.log('[SettingsStore] Keybind deleted:', keybindId);

    return profile;
  }

  // ===========================
  // Validation Helpers
  // ===========================

  private validateKeybinds(keybinds: KeybindCombo[]): void {
    // Validate no duplicate keys per group
    const groupKeysMap = new Map<string, Set<number>>();

    for (const keybind of keybinds) {
      if (!groupKeysMap.has(keybind.groupId)) {
        groupKeysMap.set(keybind.groupId, new Set());
      }

      const groupKeys = groupKeysMap.get(keybind.groupId)!;

      for (const key of keybind.keys) {
        if (groupKeys.has(key)) {
          throw new Error(
            `Duplicate key ${key} in group "${keybind.groupId}". Each key can only appear once per group.`
          );
        }
        groupKeys.add(key);
      }

      // Validate required fields
      if (keybind.keys.length === 0) {
        throw new Error('Keybind must have at least one key');
      }

      if (!keybind.groupId) {
        throw new Error('Keybind must have a groupId');
      }
    }
  }

  // ===========================
  // Utility Methods
  // ===========================

  getStorePath(): string {
    return this.store.path;
  }

  clear(): void {
    this.store.clear();
    this.store.set('settings', DEFAULT_SETTINGS);
    this.store.set('schemaVersion', CURRENT_SCHEMA_VERSION);
    console.log('[SettingsStore] Store cleared and reset to defaults');
  }
}
