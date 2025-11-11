import { SettingsStore } from '../settings-store';
import { DEFAULT_SETTINGS } from '../../../shared/ipc';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/appdata'),
  },
}));

// Mock electron-store with a factory that creates isolated stores per test
let mockStoreData: Map<string, any>;

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation((config: any) => {
    // Each test gets a fresh store
    if (!mockStoreData) {
      mockStoreData = new Map<string, any>();
    }

    // Initialize with defaults
    if (config.defaults) {
      Object.entries(config.defaults).forEach(([key, value]) => {
        if (!mockStoreData.has(key)) {
          mockStoreData.set(key, JSON.parse(JSON.stringify(value)));
        }
      });
    }

    return {
      get: jest.fn((key: string, defaultValue?: any) => {
        return mockStoreData.has(key)
          ? JSON.parse(JSON.stringify(mockStoreData.get(key)))
          : defaultValue;
      }),
      set: jest.fn((key: string, value: any) => {
        mockStoreData.set(key, JSON.parse(JSON.stringify(value)));
      }),
      clear: jest.fn(() => {
        mockStoreData.clear();
      }),
      path: '/mock/appdata/SnapKey/settings.json',
    };
  });
});

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreData = new Map<string, any>();
    store = new SettingsStore();
  });

  describe('Settings Operations', () => {
    it('should return default settings initially', () => {
      const settings = store.getSettings();
      expect(settings).toMatchObject({
        fullscreenOnly: false,
        targetProcess: null,
        startOnBoot: false,
        minimizeToTray: true,
        showNotifications: true,
        hotkey: 'Ctrl+Shift+K',
        theme: 'system',
        activeProfileId: 'default-wasd',
      });
      expect(settings.profiles).toHaveLength(1);
      expect(settings.profiles[0].id).toBe('default-wasd');
    });

    it('should update settings', () => {
      const updated = store.updateSettings({
        fullscreenOnly: true,
        targetProcess: 'game.exe',
      });

      expect(updated.fullscreenOnly).toBe(true);
      expect(updated.targetProcess).toBe('game.exe');
    });

    it('should reset settings to defaults', () => {
      store.updateSettings({ fullscreenOnly: true });
      const reset = store.resetSettings();

      expect(reset).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('Profile CRUD Operations', () => {
    it('should list profiles', () => {
      const profiles = store.listProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('default-wasd');
    });

    it('should get a specific profile', () => {
      const profile = store.getProfile('default-wasd');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('WASD Movement');
    });

    it('should return null for non-existent profile', () => {
      const profile = store.getProfile('non-existent');
      expect(profile).toBeNull();
    });

    it('should create a new profile', () => {
      const newProfile = store.createProfile({
        name: 'Arrow Keys',
        description: 'Arrow key profile',
        keybinds: [
          {
            id: 'arrow-vertical',
            keys: [0x26, 0x28], // VK_UP, VK_DOWN
            groupId: 'vertical',
            allowSimultaneous: false,
          },
        ],
      });

      expect(newProfile.id).toBeDefined();
      expect(newProfile.name).toBe('Arrow Keys');
      expect(newProfile.createdAt).toBeDefined();
      expect(newProfile.updatedAt).toBeDefined();

      const profiles = store.listProfiles();
      expect(profiles).toHaveLength(2);
    });

    it('should throw error when creating profile with duplicate name', () => {
      expect(() => {
        store.createProfile({
          name: 'WASD Movement',
          keybinds: [],
        });
      }).toThrow('already exists');
    });

    it('should update a profile', () => {
      const updated = store.updateProfile('default-wasd', {
        name: 'Updated WASD',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated WASD');
      expect(updated.description).toBe('Updated description');
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    it('should throw error when updating non-existent profile', () => {
      expect(() => {
        store.updateProfile('non-existent', { name: 'Test' });
      }).toThrow('Profile not found');
    });

    it('should delete a profile', () => {
      // Create a second profile first
      store.createProfile({
        name: 'Test Profile',
        keybinds: [],
      });

      const profilesBefore = store.listProfiles();
      expect(profilesBefore).toHaveLength(2);

      store.deleteProfile(profilesBefore[1].id);

      const profilesAfter = store.listProfiles();
      expect(profilesAfter).toHaveLength(1);
    });

    it('should throw error when deleting last profile', () => {
      expect(() => {
        store.deleteProfile('default-wasd');
      }).toThrow('Cannot delete the last profile');
    });

    it('should set active profile', () => {
      const newProfile = store.createProfile({
        name: 'Test Profile',
        keybinds: [],
      });

      const updated = store.setActiveProfile(newProfile.id);
      expect(updated.activeProfileId).toBe(newProfile.id);
    });

    it('should throw error when setting non-existent profile as active', () => {
      expect(() => {
        store.setActiveProfile('non-existent');
      }).toThrow('Profile not found');
    });

    it('should get active profile', () => {
      const activeProfile = store.getActiveProfile();
      expect(activeProfile).not.toBeNull();
      expect(activeProfile?.id).toBe('default-wasd');
    });
  });

  describe('Keybind CRUD Operations', () => {
    it('should create a keybind', () => {
      const result = store.createKeybind('default-wasd', {
        keys: [0x51], // VK_Q
        groupId: 'special',
        allowSimultaneous: true,
      });

      expect(result.keybind.id).toBeDefined();
      expect(result.keybind.keys).toEqual([0x51]);
      expect(result.profile.keybinds).toHaveLength(3);
    });

    it('should throw error when creating keybind for non-existent profile', () => {
      expect(() => {
        store.createKeybind('non-existent', {
          keys: [0x51],
          groupId: 'test',
          allowSimultaneous: true,
        });
      }).toThrow('Profile not found');
    });

    it('should update a keybind', () => {
      const profile = store.getProfile('default-wasd')!;
      const keybindId = profile.keybinds[0].id;

      const result = store.updateKeybind('default-wasd', keybindId, {
        allowSimultaneous: true,
      });

      expect(result.keybind.allowSimultaneous).toBe(true);
    });

    it('should throw error when updating non-existent keybind', () => {
      expect(() => {
        store.updateKeybind('default-wasd', 'non-existent', {
          allowSimultaneous: true,
        });
      }).toThrow('Keybind not found');
    });

    it('should delete a keybind', () => {
      const profile = store.getProfile('default-wasd')!;
      const keybindId = profile.keybinds[0].id;
      const initialCount = profile.keybinds.length;

      const updatedProfile = store.deleteKeybind('default-wasd', keybindId);

      expect(updatedProfile.keybinds).toHaveLength(initialCount - 1);
    });

    it('should throw error when deleting non-existent keybind', () => {
      expect(() => {
        store.deleteKeybind('default-wasd', 'non-existent');
      }).toThrow('Keybind not found');
    });
  });

  describe('Validation', () => {
    it('should throw error for duplicate keys in same group', () => {
      expect(() => {
        store.createProfile({
          name: 'Invalid Profile',
          keybinds: [
            {
              id: 'kb1',
              keys: [0x57], // W
              groupId: 'test',
              allowSimultaneous: false,
            },
            {
              id: 'kb2',
              keys: [0x57], // W again - duplicate!
              groupId: 'test',
              allowSimultaneous: false,
            },
          ],
        });
      }).toThrow('Duplicate key');
    });

    it('should allow same key in different groups', () => {
      const profile = store.createProfile({
        name: 'Multi-Group Profile',
        keybinds: [
          {
            id: 'kb1',
            keys: [0x57], // W
            groupId: 'group1',
            allowSimultaneous: false,
          },
          {
            id: 'kb2',
            keys: [0x57], // W in different group - OK
            groupId: 'group2',
            allowSimultaneous: false,
          },
        ],
      });

      expect(profile.keybinds).toHaveLength(2);
    });

    it('should throw error for keybind with no keys', () => {
      expect(() => {
        store.createProfile({
          name: 'Invalid Profile',
          keybinds: [
            {
              id: 'kb1',
              keys: [],
              groupId: 'test',
              allowSimultaneous: false,
            },
          ],
        });
      }).toThrow('at least one key');
    });

    it('should throw error for keybind with no groupId', () => {
      expect(() => {
        store.createProfile({
          name: 'Invalid Profile',
          keybinds: [
            {
              id: 'kb1',
              keys: [0x57],
              groupId: '',
              allowSimultaneous: false,
            },
          ],
        });
      }).toThrow('must have a groupId');
    });
  });

  describe('Utility Methods', () => {
    it('should return store path', () => {
      const path = store.getStorePath();
      expect(path).toContain('SnapKey');
    });

    it('should clear store', () => {
      store.updateSettings({ fullscreenOnly: true });
      store.clear();

      const settings = store.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });
});
