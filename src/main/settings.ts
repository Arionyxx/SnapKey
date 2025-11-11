import {
  Settings,
  PartialSettings,
  KeybindProfile,
  KeybindCombo,
  PartialKeybindProfile,
  PartialKeybindCombo,
} from '../shared/ipc';
import { SettingsStore } from './services/settings-store';

export class SettingsManager {
  private store: SettingsStore;
  private listeners: Array<(settings: Settings) => void> = [];

  constructor() {
    this.store = new SettingsStore();
    console.log('[Settings] Initialized with store at:', this.store.getStorePath());
  }

  // ===========================
  // Settings Operations
  // ===========================

  getSettings(): Settings {
    return this.store.getSettings();
  }

  updateSettings(updates: PartialSettings): Settings {
    try {
      const updated = this.store.updateSettings(updates);
      this.notifyListeners();
      console.log('[Settings] Updated settings');
      return updated;
    } catch (error) {
      console.error('[Settings] Error updating settings:', error);
      throw error;
    }
  }

  resetSettings(): Settings {
    const reset = this.store.resetSettings();
    this.notifyListeners();
    console.log('[Settings] Reset to defaults');
    return reset;
  }

  // ===========================
  // Profile Operations
  // ===========================

  listProfiles(): KeybindProfile[] {
    return this.store.listProfiles();
  }

  getProfile(profileId: string): KeybindProfile | null {
    return this.store.getProfile(profileId);
  }

  createProfile(profile: Omit<KeybindProfile, 'id' | 'createdAt' | 'updatedAt'>): KeybindProfile {
    try {
      const created = this.store.createProfile(profile);
      this.notifyListeners();
      return created;
    } catch (error) {
      console.error('[Settings] Error creating profile:', error);
      throw error;
    }
  }

  updateProfile(profileId: string, updates: PartialKeybindProfile): KeybindProfile {
    try {
      const updated = this.store.updateProfile(profileId, updates);
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.error('[Settings] Error updating profile:', error);
      throw error;
    }
  }

  deleteProfile(profileId: string): void {
    try {
      this.store.deleteProfile(profileId);
      this.notifyListeners();
    } catch (error) {
      console.error('[Settings] Error deleting profile:', error);
      throw error;
    }
  }

  setActiveProfile(profileId: string): Settings {
    try {
      const updated = this.store.setActiveProfile(profileId);
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.error('[Settings] Error setting active profile:', error);
      throw error;
    }
  }

  getActiveProfile(): KeybindProfile | null {
    return this.store.getActiveProfile();
  }

  // ===========================
  // Keybind Operations
  // ===========================

  createKeybind(
    profileId: string,
    keybind: Omit<KeybindCombo, 'id'>
  ): { profile: KeybindProfile; keybind: KeybindCombo } {
    try {
      const result = this.store.createKeybind(profileId, keybind);
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error('[Settings] Error creating keybind:', error);
      throw error;
    }
  }

  updateKeybind(
    profileId: string,
    keybindId: string,
    updates: PartialKeybindCombo
  ): { profile: KeybindProfile; keybind: KeybindCombo } {
    try {
      const result = this.store.updateKeybind(profileId, keybindId, updates);
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error('[Settings] Error updating keybind:', error);
      throw error;
    }
  }

  deleteKeybind(profileId: string, keybindId: string): KeybindProfile {
    try {
      const profile = this.store.deleteKeybind(profileId, keybindId);
      this.notifyListeners();
      return profile;
    } catch (error) {
      console.error('[Settings] Error deleting keybind:', error);
      throw error;
    }
  }

  // ===========================
  // Listener Management
  // ===========================

  onChange(listener: (settings: Settings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const settings = this.getSettings();
    this.listeners.forEach(listener => listener(settings));
  }
}
