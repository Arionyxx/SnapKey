import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { HookStatus } from '../../shared/ipc';
import type { SettingsManager } from '../settings';
import type { HookManager } from '../hook';

// ESM compatibility shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TrayManager {
  private tray: Tray | null = null;
  private iconPath: string;
  private iconOffPath: string;
  private mainWindow: BrowserWindow | null = null;
  private settingsManager: SettingsManager | null = null;
  private hookManager: HookManager | null = null;
  private currentHookStatus: HookStatus = { enabled: false, activeKeys: [], lastError: null };

  constructor() {
    // Icon paths - use resources path in production, legacy folder in dev
    const basePath = app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../legacy');

    this.iconPath = path.join(basePath, 'icon.ico');
    this.iconOffPath = path.join(basePath, 'icon_off.ico');
    console.log('[TrayManager] Icon paths configured:', {
      iconPath: this.iconPath,
      iconOffPath: this.iconOffPath,
    });
  }

  initialize(
    mainWindow: BrowserWindow,
    settingsManager: SettingsManager,
    hookManager: HookManager
  ): void {
    this.mainWindow = mainWindow;
    this.settingsManager = settingsManager;
    this.hookManager = hookManager;
    this.createTray();
    console.log('[TrayManager] Initialized');
  }

  private createTray(): void {
    try {
      // Create tray icon with disabled state initially
      const icon = nativeImage.createFromPath(this.iconOffPath);
      this.tray = new Tray(icon);
      this.tray.setToolTip('SnapKey');

      // Set up context menu
      this.updateContextMenu();

      // Handle double-click to show window
      this.tray.on('double-click', () => {
        console.log('[TrayManager] Tray icon double-clicked');
        this.showWindow();
      });

      console.log('[TrayManager] Tray created successfully');
    } catch (error) {
      console.error('[TrayManager] Failed to create tray:', error);
    }
  }

  updateHookStatus(status: HookStatus): void {
    this.currentHookStatus = status;
    this.updateTrayIcon(status.enabled);
    this.updateContextMenu();
  }

  private updateTrayIcon(enabled: boolean): void {
    if (!this.tray) {
      return;
    }

    try {
      const iconPath = enabled ? this.iconPath : this.iconOffPath;
      const icon = nativeImage.createFromPath(iconPath);
      this.tray.setImage(icon);
      this.tray.setToolTip(enabled ? 'SnapKey - Enabled' : 'SnapKey - Disabled');
      console.log(`[TrayManager] Tray icon updated: ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[TrayManager] Failed to update tray icon:', error);
    }
  }

  private updateContextMenu(): void {
    if (!this.tray || !this.settingsManager) {
      return;
    }

    const settings = this.settingsManager.getSettings();
    const profiles = settings.profiles;
    const activeProfileId = settings.activeProfileId;

    // Build profile submenu
    const profileMenuItems = profiles.map(profile => ({
      label: profile.name,
      type: 'radio' as const,
      checked: profile.id === activeProfileId,
      click: () => {
        console.log(`[TrayManager] Switching to profile: ${profile.name}`);
        this.settingsManager?.setActiveProfile(profile.id);
      },
    }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: this.currentHookStatus.enabled ? 'Disable Hook' : 'Enable Hook',
        type: 'checkbox',
        checked: this.currentHookStatus.enabled,
        click: () => {
          console.log('[TrayManager] Toggle hook from tray');
          if (this.hookManager) {
            this.hookManager.toggle();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Profiles',
        type: 'submenu',
        submenu: profileMenuItems,
      },
      { type: 'separator' },
      {
        label: 'Show Window',
        click: () => {
          console.log('[TrayManager] Show window from tray');
          this.showWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          console.log('[TrayManager] Exit from tray');
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private showWindow(): void {
    if (this.mainWindow) {
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
      console.log('[TrayManager] Window shown and focused');
    }
  }

  cleanup(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      console.log('[TrayManager] Tray cleaned up');
    }
  }
}
