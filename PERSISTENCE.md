# SnapKey Settings Persistence

This document describes the settings persistence implementation using `electron-store`.

## Overview

SnapKey now uses `electron-store` to persist all settings, profiles, and keybind configurations to disk. Settings are stored in `%APPDATA%/SnapKey/settings.json` on Windows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Renderer                            │
│  (React UI - Settings, Profiles, Keybinds Management)      │
└─────────────────┬───────────────────────────────────────────┘
                  │ IPC Calls
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      IPC Handlers                           │
│     (Validates requests, routes to SettingsManager)        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SettingsManager                          │
│  (Business logic, notifications, delegates to store)       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SettingsStore                            │
│  (CRUD operations, validation, migrations, electron-store)  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     electron-store                          │
│              (%APPDATA%/SnapKey/settings.json)              │
└─────────────────────────────────────────────────────────────┘
```

## Data Schema

### Settings

```typescript
interface Settings {
  // Core settings
  fullscreenOnly: boolean;        // Only active when game is fullscreen
  targetProcess: string | null;   // Target process name (e.g., "game.exe")
  startOnBoot: boolean;           // Start SnapKey on system boot
  minimizeToTray: boolean;        // Minimize to system tray
  showNotifications: boolean;     // Show system notifications
  hotkey: string;                 // Global hotkey (e.g., "Ctrl+Shift+K")
  theme: 'light' | 'dark' | 'system';
  
  // Profile management
  profiles: KeybindProfile[];     // Array of keybind profiles
  activeProfileId: string;        // ID of currently active profile
}
```

### Profile

```typescript
interface KeybindProfile {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description?: string;           // Optional description
  keybinds: KeybindCombo[];       // Array of keybind combos
  createdAt: number;              // Creation timestamp
  updatedAt: number;              // Last update timestamp
}
```

### Keybind Combo

```typescript
interface KeybindCombo {
  id: string;                     // Unique identifier
  keys: number[];                 // Array of VK codes
  groupId: string;                // Group identifier for conflict resolution
  allowSimultaneous: boolean;     // Allow simultaneous presses in this group
}
```

## Default Profile

The default WASD profile is created automatically:

```typescript
{
  id: 'default-wasd',
  name: 'WASD Movement',
  description: 'Default profile for WASD movement keys with anti-recoil',
  keybinds: [
    {
      id: 'wasd-vertical',
      keys: [0x57, 0x53],         // W (0x57) and S (0x53)
      groupId: 'vertical',
      allowSimultaneous: false,   // W and S cannot be pressed together
    },
    {
      id: 'wasd-horizontal',
      keys: [0x41, 0x44],         // A (0x41) and D (0x44)
      groupId: 'horizontal',
      allowSimultaneous: false,   // A and D cannot be pressed together
    },
  ],
  createdAt: <timestamp>,
  updatedAt: <timestamp>,
}
```

## IPC API

### Settings Operations

```typescript
// Get all settings
const settings = await window.api.settings.get();

// Update settings
const updated = await window.api.settings.set({
  fullscreenOnly: true,
  targetProcess: 'game.exe',
});

// Reset to defaults
const reset = await window.api.settings.reset();

// Subscribe to changes
window.api.settings.onUpdated((settings) => {
  console.log('Settings updated:', settings);
});
```

### Profile Operations

```typescript
// List all profiles
const profiles = await window.api.request('profile:list');

// Get specific profile
const profile = await window.api.request('profile:get', 'profile-id');

// Create profile
const newProfile = await window.api.request('profile:create', {
  name: 'Arrow Keys',
  description: 'Arrow key profile',
  keybinds: [
    {
      keys: [0x26, 0x28],       // VK_UP, VK_DOWN
      groupId: 'vertical',
      allowSimultaneous: false,
    },
  ],
});

// Update profile
const updated = await window.api.request('profile:update', {
  profileId: 'profile-id',
  updates: {
    name: 'Updated Name',
    description: 'New description',
  },
});

// Delete profile
await window.api.request('profile:delete', 'profile-id');

// Set active profile
const settings = await window.api.request('profile:set-active', 'profile-id');
```

### Keybind Operations

```typescript
// Create keybind
const result = await window.api.request('keybind:create', {
  profileId: 'profile-id',
  keybind: {
    keys: [0x51],               // Q key
    groupId: 'special',
    allowSimultaneous: true,
  },
});

// Update keybind
const result = await window.api.request('keybind:update', {
  profileId: 'profile-id',
  keybindId: 'keybind-id',
  updates: {
    allowSimultaneous: false,
  },
});

// Delete keybind
const profile = await window.api.request('keybind:delete', {
  profileId: 'profile-id',
  keybindId: 'keybind-id',
});
```

## Validation Rules

The SettingsStore enforces the following validation rules:

1. **No Duplicate Keys per Group**: A key (VK code) can only appear once within the same group
2. **Required Fields**: All required fields must be present (name, keys, groupId)
3. **At Least One Key**: Each keybind must have at least one key
4. **Valid VK Codes**: Keys must be valid Virtual-Key codes
5. **Active Profile Must Exist**: The active profile ID must reference an existing profile
6. **Cannot Delete Last Profile**: At least one profile must always exist
7. **Unique Profile Names**: Profile names must be unique within the settings

## Migrations

The store supports schema migrations for future updates:

```typescript
migrations: {
  '1': (store) => {
    // Migrate from old enabledKeys format to new profiles format
    const settings = store.get('settings');
    if (settings.enabledKeys && !settings.profiles) {
      settings.profiles = [DEFAULT_WASD_PROFILE];
      settings.activeProfileId = 'default-wasd';
      delete settings.enabledKeys;
    }
    store.set('settings', settings);
  },
}
```

Current schema version: **1**

## Storage Location

Settings are stored at:
- **Windows**: `C:\Users\<username>\AppData\Roaming\SnapKey\settings.json`
- **macOS**: `~/Library/Application Support/SnapKey/settings.json`
- **Linux**: `~/.config/SnapKey/settings.json`

## Testing

Run the test suite to verify persistence:

```bash
npm test -- settings-store.test.ts
```

The test suite covers:
- ✅ Settings CRUD operations
- ✅ Profile CRUD operations
- ✅ Keybind CRUD operations
- ✅ Validation rules
- ✅ Migration logic
- ✅ Persistence across restarts

## Example Usage

### Creating a Custom Profile

```typescript
// Create a custom profile for arrow keys
const arrowProfile = await window.api.request('profile:create', {
  name: 'Arrow Keys',
  description: 'Profile for arrow key movement',
  keybinds: [
    {
      keys: [0x26, 0x28],       // UP, DOWN
      groupId: 'vertical',
      allowSimultaneous: false,
    },
    {
      keys: [0x25, 0x27],       // LEFT, RIGHT
      groupId: 'horizontal',
      allowSimultaneous: false,
    },
  ],
});

// Set as active profile
await window.api.request('profile:set-active', arrowProfile.id);
```

### Modifying Existing Profile

```typescript
// Get the current active profile
const settings = await window.api.settings.get();
const activeProfile = settings.profiles.find(
  p => p.id === settings.activeProfileId
);

// Add a new keybind
await window.api.request('keybind:create', {
  profileId: activeProfile.id,
  keybind: {
    keys: [0x51],               // Q key
    groupId: 'special',
    allowSimultaneous: true,
  },
});
```

## Troubleshooting

### Settings not persisting

1. Check file permissions in `%APPDATA%/SnapKey`
2. Verify electron-store is properly installed: `npm list electron-store`
3. Check console for validation errors
4. Ensure settings are updated through the API, not directly mutating state

### Migration issues

1. Backup your settings file before updating
2. Check schema version in settings.json
3. Clear store if corrupted: `store.clear()`
4. Settings will reset to defaults after clearing

### Profile errors

1. Ensure active profile exists in profiles array
2. Check for duplicate key codes within the same group
3. Verify all required fields are present
4. Check keybind validation rules

## Future Enhancements

- [ ] Import/Export profiles
- [ ] Profile templates
- [ ] Cloud sync
- [ ] Profile sharing
- [ ] Backup/Restore functionality
- [ ] Profile hotswapping via hotkey
