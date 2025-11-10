# Expected Console Logs

This document shows the expected console output when running the application with the IPC framework.

## Main Process (Terminal Output)

When you run `npm run start`, you should see these logs in the terminal:

```
[Main] SnapKey starting...
[Main] Electron version: 39.1.1
[Main] Node version: 20.19.5
[Main] Platform: win32
[Main] Single instance lock acquired
[Main] App is ready
[Main] Initializing managers...
[Settings] Using default settings
[IPC] Registering IPC handlers...
[IPC] All IPC handlers registered successfully
[Main] All managers initialized successfully
[Main] Creating main window...
[Main] Main window created successfully
[Main] SnapKey started successfully
[Preload] API exposed to renderer process
```

### When Settings Are Loaded for the First Time

```
[IPC] Handling SETTINGS_GET
[Settings] Using default settings
```

### When Settings File Exists

```
[IPC] Handling SETTINGS_GET
[Settings] Loaded settings from disk: {
  enabledKeys: [ 'W', 'A', 'S', 'D' ],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
```

### When Hook Status Is Queried

```
[IPC] Handling HOOK_STATUS_GET
```

### When Settings Are Updated

```
[IPC] Handling SETTINGS_SET with: { theme: 'dark' }
[Settings] Updated settings: {
  enabledKeys: [ 'W', 'A', 'S', 'D' ],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'dark'
}
[Settings] Saved settings to disk
[IPC] Settings changed, broadcasting to all windows
```

### When Hook Is Toggled

```
[IPC] Handling HOOK_TOGGLE
[Hook] Enabling keyboard hook...
[Hook] Keyboard hook enabled
[IPC] Hook status changed, broadcasting to all windows
```

### When Settings Are Reset

```
[IPC] Handling SETTINGS_RESET
[Settings] Reset to defaults
[Settings] Saved settings to disk
[IPC] Settings changed, broadcasting to all windows
```

### When App Exits

```
[Main] All windows closed
[Main] App is quitting. Cleaning up...
[Hook] Disabling keyboard hook...
[Hook] Keyboard hook disabled
[Main] Cleanup completed
[Main] App will quit
```

## Renderer Process (DevTools Console)

Open DevTools (Ctrl+Shift+I or Cmd+Option+I) to see renderer logs:

### On App Load

```
[Preload] API exposed to renderer process
[Renderer] App mounted, initializing...
[Renderer] Fetching initial settings...
[Renderer] Received settings: {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
[Renderer] Fetching hook status...
[Renderer] Received hook status: {
  enabled: false,
  activeKeys: [],
  lastError: null
}
[Renderer] Subscribing to settings updates...
[Renderer] Subscribing to hook status updates...
```

### When Toggle Hook Button Is Clicked

```
[Renderer] Toggling hook...
[Renderer] Hook toggled: {
  enabled: true,
  activeKeys: [],
  lastError: null
}
[Renderer] Hook status updated: {
  enabled: true,
  activeKeys: [],
  lastError: null
}
```

### When Toggle Theme Button Is Clicked

```
[Renderer] Toggling theme...
[Renderer] Theme updated: {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'dark'
}
[Renderer] Settings updated: {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'dark'
}
```

### When Reset Settings Button Is Clicked

```
[Renderer] Resetting settings...
[Renderer] Settings reset: {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
[Renderer] Settings updated: {
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
```

### When App Unmounts

```
[Renderer] App unmounting, cleaning up subscriptions...
```

## Testing IPC Directly in DevTools Console

You can also test the IPC framework directly in the DevTools console:

### Get Settings

```javascript
const settings = await window.api.settings.get();
console.log(settings);
```

Expected output:
```javascript
{
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
```

### Update Settings

```javascript
const updated = await window.api.settings.set({ theme: 'dark', startOnBoot: true });
console.log(updated);
```

Expected output:
```javascript
{
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: true,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'dark'
}
```

### Reset Settings

```javascript
const reset = await window.api.settings.reset();
console.log(reset);
```

Expected output:
```javascript
{
  enabledKeys: ['W', 'A', 'S', 'D'],
  startOnBoot: false,
  minimizeToTray: true,
  showNotifications: true,
  hotkey: 'Ctrl+Shift+K',
  theme: 'system'
}
```

### Get Hook Status

```javascript
const status = await window.api.hook.getStatus();
console.log(status);
```

Expected output:
```javascript
{
  enabled: false,
  activeKeys: [],
  lastError: null
}
```

### Toggle Hook

```javascript
const toggled = await window.api.hook.toggle();
console.log(toggled);
```

Expected output:
```javascript
{
  enabled: true,
  activeKeys: [],
  lastError: null
}
```

### Subscribe to Settings Updates

```javascript
const unsubscribe = window.api.settings.onUpdated((newSettings) => {
  console.log('Settings changed:', newSettings);
});

// Later, to unsubscribe:
unsubscribe();
```

When settings change (from any window), you'll see:
```
Settings changed: { enabledKeys: [...], ... }
```

### Subscribe to Hook Status Updates

```javascript
const unsubscribe = window.api.hook.onStatusUpdated((status) => {
  console.log('Hook status changed:', status);
});

// Later, to unsubscribe:
unsubscribe();
```

When hook status changes, you'll see:
```
Hook status changed: { enabled: true, activeKeys: [], lastError: null }
```

### Check Platform Info

```javascript
console.log('Platform:', window.api.platform);
console.log('Electron version:', window.api.version);
```

Expected output:
```
Platform: win32
Electron version: 39.1.1
```

## Error Cases

### Invalid Settings Value

```javascript
try {
  await window.api.settings.set({ theme: 'invalid' });
} catch (error) {
  console.error(error.message);
}
```

Expected output:
```
Invalid settings data
```

### Invalid Key

```javascript
try {
  await window.api.settings.set({ enabledKeys: ['W', 'X', 'Y', 'Z'] });
} catch (error) {
  console.error(error.message);
}
```

Expected output:
```
Invalid settings data
```

## Verification Checklist

When testing, verify:

- ✅ No "Uncaught" errors in console
- ✅ No IPC warnings
- ✅ All API methods return promises
- ✅ All API methods resolve with correct data
- ✅ Settings persist across app restarts
- ✅ Subscriptions receive updates
- ✅ Invalid data is rejected
- ✅ Logs appear in both terminal and DevTools
- ✅ Main process logs are prefixed with [Main], [IPC], [Settings], [Hook]
- ✅ Renderer logs are prefixed with [Renderer]

## Settings File Location

The settings file will be created at:

- **Windows**: `%APPDATA%\snapkey\settings.json`
- **macOS**: `~/Library/Application Support/snapkey/settings.json`
- **Linux**: `~/.config/snapkey/settings.json`

You can verify the settings file by checking:

```javascript
// In main process (or DevTools if you expose it):
const { app } = require('electron');
console.log('Settings path:', app.getPath('userData'));
```

The file will look like:
```json
{
  "enabledKeys": ["W", "A", "S", "D"],
  "startOnBoot": false,
  "minimizeToTray": true,
  "showNotifications": true,
  "hotkey": "Ctrl+Shift+K",
  "theme": "system"
}
```

## No Errors Expected

There should be **NO** errors in the console during normal operation. Any errors should be caught and logged gracefully.

If you see errors, check:
1. Are all dependencies installed? (`npm install`)
2. Is the app running on the correct branch?
3. Are there any file permission issues?
4. Check the main process logs in terminal for more details
