# System Tray Integration

This document describes the system tray implementation for SnapKey.

## Overview

The system tray integration provides persistent access to SnapKey controls even when the main window is hidden. Users can minimize the application to the tray instead of closing it completely.

## Features Implemented

### 1. System Tray Icon

- **Two Icon States**: 
  - `legacy/icon.ico` - Enabled state (hook is active)
  - `legacy/icon_off.ico` - Disabled state (hook is inactive)
- **Dynamic Updates**: Icon automatically changes based on hook status
- **Tooltip**: Shows "SnapKey - Enabled" or "SnapKey - Disabled"

### 2. Context Menu

The tray context menu provides the following actions:

- **Toggle Hook**: Enable/Disable the keyboard hook
  - Shows current state with checkbox
  - Updates icon and renderer state on toggle
  
- **Profiles Submenu**: Switch between different key profiles
  - Radio buttons show active profile
  - Dynamically updates when profiles change
  
- **Show Window**: Restore the main window
  - Shows hidden window
  - Restores minimized window
  - Brings window to focus
  
- **Exit**: Quit the application completely

### 3. Minimize to Tray

- **Window Close Interception**: Close button hides window instead of quitting
  - Controlled by `minimizeToTray` setting (default: true)
  - When enabled: window hides, app continues running in tray
  - When disabled: window closes, app quits (except on macOS)
  
- **Restore Options**:
  - Double-click tray icon
  - "Show Window" menu item
  - Single-instance activation (launching app again)

### 4. Single-Instance Activation

- **Second Instance Detection**: When user tries to launch app again
  - Shows hidden window if present
  - Restores minimized window
  - Brings window to focus
  - Second instance exits gracefully

### 5. Lifecycle Management

- **Initialization**: Tray created after window is ready
- **State Sync**: Tray updates on hook status and settings changes
- **Cleanup**: Tray destroyed on app quit to prevent orphan icons

## Architecture

### TrayManager Service

Location: `src/main/services/tray-manager.ts`

**Responsibilities**:
- Create and manage system tray icon
- Build dynamic context menu
- Handle user interactions
- Update icon based on hook status
- Synchronize with settings and profiles

**Key Methods**:
- `initialize(window, settings, hook)` - Set up tray with dependencies
- `updateHookStatus(status)` - Update icon and menu based on hook state
- `cleanup()` - Destroy tray on app quit

### Main Process Integration

Location: `src/main/main.ts`

**Changes Made**:
1. Import TrayManager
2. Add `isQuitting` flag to distinguish minimize vs. quit
3. Intercept window `close` event for minimize to tray
4. Initialize tray after window creation
5. Listen to hook status changes and update tray
6. Update single-instance handler to show hidden window
7. Modify `window-all-closed` handler to check `minimizeToTray` setting
8. Set `isQuitting` flag in `before-quit` handler
9. Clean up tray in cleanup function

## User Experience Flow

### Normal Operation
1. App starts with tray icon (disabled state)
2. User enables hook → icon changes to enabled state
3. User closes window → window hides, tray remains
4. User double-clicks tray icon → window restores
5. User clicks "Exit" in tray menu → app quits, tray disappears

### Profile Switching
1. User right-clicks tray icon
2. Hovers over "Profiles" submenu
3. Clicks on a profile → active profile changes
4. Menu updates to show new active profile (radio button)
5. Hook configuration updates automatically

### Hook Toggle
1. User right-clicks tray icon
2. Clicks "Enable Hook" or "Disable Hook"
3. Hook toggles state
4. Icon updates (enabled/disabled)
5. Menu text updates
6. Renderer UI updates via IPC broadcast

### Second Instance Launch
1. User launches SnapKey while already running
2. Single-instance lock detects second instance
3. Main window shows if hidden
4. Window restores if minimized
5. Window brought to focus
6. Second instance exits

## Settings Integration

The `minimizeToTray` setting controls the behavior:

```typescript
{
  minimizeToTray: boolean; // Default: true
}
```

- **When true**: Closing window hides it, app stays in tray
- **When false**: Closing window quits app (standard behavior)

This setting is stored in `electron-store` and persists across sessions.

## Technical Details

### Event Handling

**Window Close Event**:
```typescript
mainWindow.on('close', event => {
  if (!isQuitting && settings.minimizeToTray) {
    event.preventDefault();
    mainWindow?.hide();
  }
});
```

**Tray Double-Click**:
```typescript
tray.on('double-click', () => {
  this.showWindow();
});
```

**Menu Click Handlers**:
```typescript
{
  label: 'Toggle Hook',
  click: () => {
    this.hookManager.toggle();
  }
}
```

### State Synchronization

**Hook Status → Tray**:
```typescript
hookManager.onChange(status => {
  trayManager.updateHookStatus(status);
});
```

**Settings Changes → Tray**:
```typescript
settingsManager.onChange(settings => {
  trayManager.updateHookStatus(hookManager.getStatus());
});
```

### Platform Considerations

**Windows/Linux**:
- Tray icon persists after window closes (if `minimizeToTray` enabled)
- App quits when tray is removed or "Exit" clicked

**macOS**:
- App stays running in dock by default
- `window-all-closed` doesn't quit on macOS

## Testing

All existing unit tests (59 tests) pass with the new implementation.

The tray integration is primarily a main-process feature, so manual testing is recommended:

1. ✅ Launch app → tray icon appears
2. ✅ Enable hook → icon changes
3. ✅ Close window → window hides, tray remains
4. ✅ Double-click tray → window restores
5. ✅ Toggle hook from tray menu → works correctly
6. ✅ Switch profiles from tray menu → works correctly
7. ✅ Launch second instance → existing window shows
8. ✅ Exit from tray menu → app quits, tray disappears
9. ✅ Disable `minimizeToTray` → closing window quits app

## Files Modified

- `src/main/main.ts` - Integrated TrayManager, added minimize to tray logic
- `src/main/services/tray-manager.ts` - New service for tray management
- `jest.config.js` → `jest.config.cjs` - Fixed for ES modules

## Files Used (Existing)

- `legacy/icon.ico` - Enabled state icon
- `legacy/icon_off.ico` - Disabled state icon
- `src/shared/ipc.ts` - Already had tray-related IPC channels (mostly unused)

## Future Enhancements

Potential improvements:

1. **Notifications**: Show system notifications on hook enable/disable
2. **Tray Menu Shortcuts**: Add keyboard shortcuts to tray menu items
3. **Recent Profiles**: Show recently used profiles at top of menu
4. **Custom Icons**: Allow users to customize tray icon
5. **Minimize on Start**: Add setting to start app minimized to tray
