import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Settings, PartialSettings, settingsSchema, DEFAULT_SETTINGS } from '../shared/ipc';

export class SettingsManager {
  private settings: Settings;
  private settingsPath: string;
  private listeners: Array<(settings: Settings) => void> = [];

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const parsed = JSON.parse(data);
        const validated = settingsSchema.parse(parsed);
        console.log('[Settings] Loaded settings from disk:', validated);
        return validated;
      }
    } catch (error) {
      console.error('[Settings] Error loading settings:', error);
    }

    console.log('[Settings] Using default settings');
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      console.log('[Settings] Saved settings to disk');
    } catch (error) {
      console.error('[Settings] Error saving settings:', error);
      throw error;
    }
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(updates: PartialSettings): Settings {
    this.settings = { ...this.settings, ...updates };

    try {
      const validated = settingsSchema.parse(this.settings);
      this.settings = validated;
      this.saveSettings();
      this.notifyListeners();
      console.log('[Settings] Updated settings:', this.settings);
      return this.getSettings();
    } catch (error) {
      console.error('[Settings] Validation error:', error);
      throw new Error('Invalid settings data');
    }
  }

  resetSettings(): Settings {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.notifyListeners();
    console.log('[Settings] Reset to defaults');
    return this.getSettings();
  }

  onChange(listener: (settings: Settings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getSettings()));
  }
}
