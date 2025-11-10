# Keyboard Hook Implementation

This document describes the keyboard hooking functionality implemented in SnapKey.

## Architecture Overview

The keyboard hook implementation consists of three main components:

### 1. Native Input Layer (`src/main/native/win32-input.ts`)

Provides Windows-specific FFI bindings using `koffi` to call the Win32 `SendInput` API:

- **sendKeyDown(vkCode, tagged)**: Sends a simulated key down event
- **sendKeyUp(vkCode, tagged)**: Sends a simulated key up event
- **SNAPKEY_MAGIC_DWEXTRAINFO**: Magic value used to tag simulated events

On non-Windows platforms, these functions log the simulated events but don't actually send them (for testing/development).

### 2. Keyboard Hook Service (`src/main/services/keyboard-hook-service.ts`)

Core service that manages the global keyboard hook and implements anti-recoil logic:

- Uses `uiohook-napi` for cross-platform global keyboard event listening
- Tracks physical and logical key states for each enabled key
- Implements conflict resolution between opposing keys (W-S, A-D)
- Supports configurable key groups with simultaneous key settings
- Tags simulated events to avoid infinite loops
- Provides diagnostics for debugging

**Key Features:**

- **State Tracking**: Maintains separate physical (actual) and logical (simulated) key states
- **Conflict Resolution**: When opposing keys in a group are pressed, releases the first key
- **Multi-Key Combos**: Allows simultaneous keys in different groups (e.g., W+A, W+D)
- **Diagnostics**: Tracks events processed, conflicts resolved, and simulated events

### 3. Hook Manager (`src/main/hook.ts`)

High-level manager that integrates the keyboard hook service with the application:

- Bridges settings changes to hook configuration updates
- Exposes IPC-friendly status and diagnostics
- Manages hook lifecycle (start/stop/cleanup)
- Automatically creates opposing key groups from enabled keys

## Configuration

The hook service is configured via `KeyboardHookConfig`:

```typescript
interface KeyboardHookConfig {
  enabled: boolean;
  keyGroups: KeyGroup[];
  enabledKeys: string[];
}

interface KeyGroup {
  keys: string[];
  allowSimultaneous: boolean;
}
```

### Default Behavior

By default, SnapKey creates two key groups:

1. **Vertical Movement**: W-S (mutually exclusive)
2. **Horizontal Movement**: A-D (mutually exclusive)

This allows combinations like W+A, W+D, S+A, S+D but prevents W+S and A+D.

### Customization

To allow simultaneous opposing keys, set `allowSimultaneous: true` in the key group configuration.

## IPC Integration

The following IPC channels are available:

- `hook:status:get` - Get current hook status (enabled, active keys, errors)
- `hook:toggle` - Enable/disable the keyboard hook
- `hook:diagnostics:get` - Get detailed diagnostics (events processed, conflicts resolved, etc.)
- `hook:status:updated` - Event broadcast when hook status changes

## Event Flow

1. **Physical Key Down** (from user)
   - `uiohook-napi` captures the event
   - Service checks if event is tagged (skip if our own simulation)
   - Service checks for conflicts with opposing keys
   - If conflict exists, releases conflicting key (sends simulated key up)
   - Activates the new key (sends simulated key down with tag)

2. **Physical Key Up** (from user)
   - `uiohook-napi` captures the event
   - Service checks if event is tagged (skip if our own simulation)
   - Deactivates the key (sends simulated key up with tag)

3. **Tagged Events** (from our simulation)
   - Currently ignored by checking `isTaggedEvent()` (placeholder for future implementation)
   - Note: `uiohook-napi` may not provide `dwExtraInfo`, so tagging is tracked separately

## Testing

Comprehensive unit tests are provided in `src/main/services/__tests__/keyboard-hook-service.test.ts`:

- **32 test cases** covering:
  - Initialization and lifecycle
  - Key state tracking
  - Conflict resolution (W-S, A-D)
  - Multi-key combo handling
  - Diagnostics tracking
  - Configuration updates
  - Edge cases (rapid presses, unknown keys, etc.)

Run tests with:
```bash
npm test
```

## Dependencies

- **uiohook-napi**: Global keyboard event listening (requires rebuild for Electron)
- **koffi**: FFI library for calling Win32 SendInput API
- **@electron/rebuild**: Rebuilds native modules for Electron

Native modules are automatically rebuilt via the `postinstall` script:
```bash
npm run postinstall
```

## Debugging

Enable detailed logging by checking console output with the following prefixes:

- `[KeyboardHookService]` - Hook service operations
- `[Win32Input]` - Native input operations
- `[Hook]` - Hook manager operations

Example debug log:
```
[KeyboardHookService] Physical key down: W
[KeyboardHookService] Activating key: W (VK=87)
[Win32Input] Sent key event: vkCode=87, isKeyUp=false, tagged=true
[KeyboardHookService] Conflict detected: S conflicts with W
[KeyboardHookService] Releasing key due to conflict: W
[Win32Input] Sent key event: vkCode=87, isKeyUp=true, tagged=true
```

## Platform Support

- **Windows**: Full support with Win32 SendInput API
- **Linux/macOS**: Hook listening works, but simulated events are logged only (no actual key synthesis)

## Known Limitations

1. **Tagged Event Detection**: Currently, `isTaggedEvent()` always returns false. Future implementation should track simulated events to avoid processing them.

2. **Cross-Platform Input Synthesis**: Only Windows has full support for sending simulated key events via SendInput. Other platforms need platform-specific implementations.

3. **Key Timing**: No delay is introduced between key release and new key press during conflict resolution. Games with strict timing requirements may need adjustment.

## Future Enhancements

- Implement proper tagged event detection using timestamps or event IDs
- Add Linux support using XTest or evdev
- Add macOS support using CGEvent
- Support for custom key mappings beyond WASD
- Configurable conflict resolution strategies (instant vs. delayed)
- Per-application profile switching
