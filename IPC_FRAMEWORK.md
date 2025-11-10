# IPC Framework Documentation

## Overview

The SnapKey IPC (Inter-Process Communication) framework provides a type-safe, validated communication layer between the Electron main process and renderer process. It uses Zod for runtime validation and TypeScript for compile-time type safety.

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Renderer      │         │   Preload    │         │   Main Process  │
│   (React UI)    │◄───────►│   (Bridge)   │◄───────►│   (Node.js)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
      window.api              contextBridge              IPC Handlers
```

## Key Components

### 1. Shared IPC Contract (`src/shared/ipc.ts`)

Defines the complete contract between main and renderer processes:

- **Channel Constants**: Predefined IPC channel names
- **Zod Schemas**: Runtime validation schemas
- **TypeScript Types**: Compile-time type definitions
- **Validation Functions**: Channel validation helpers
- **Default Values**: Default settings and states

### 2. Main Process (`src/main/`)

#### `main.ts`
- Creates BrowserWindow with proper security settings
- Enforces single-instance lock
- Handles graceful shutdown and cleanup
- Comprehensive logging

#### `settings.ts` (SettingsManager)
- Persists settings to disk using `app.getPath('userData')`
- Validates all updates using Zod schemas
- Notifies listeners of changes
- Provides CRUD operations

#### `hook.ts` (HookManager)
- Manages keyboard hook lifecycle
- Tracks hook status and active keys
- Notifies listeners of status changes
- Placeholder for actual hook implementation

#### `ipc-handlers.ts` (IpcHandlers)
- Registers all IPC channel handlers
- Wraps handlers with error handling
- Broadcasts updates to all windows
- Validates payloads using Zod

### 3. Preload Script (`src/preload/index.ts`)

- Exposes type-safe `window.api` to renderer
- Validates all channels before IPC calls
- Provides `invoke()` helper for request/response
- Provides `subscribe()` helper for event listening
- Handles IPC response unwrapping

### 4. Renderer Type Definitions (`src/renderer/electron.d.ts`)

- Declares `window.api` interface
- Provides full TypeScript IntelliSense
- Ensures type safety in renderer code

## API Reference

### Settings API

```typescript
// Get current settings
const settings = await window.api.settings.get();

// Update settings (partial updates supported)
const updated = await window.api.settings.set({ theme: 'dark' });

// Reset to defaults
const defaults = await window.api.settings.reset();

// Subscribe to settings changes
const unsubscribe = window.api.settings.onUpdated((newSettings) => {
  console.log('Settings changed:', newSettings);
});
```

### Hook API

```typescript
// Get hook status
const status = await window.api.hook.getStatus();

// Toggle hook on/off
const newStatus = await window.api.hook.toggle();

// Subscribe to hook status changes
const unsubscribe = window.api.hook.onStatusUpdated((status) => {
  console.log('Hook status:', status);
});
```

### Process API

```typescript
// Get list of running processes
const processes = await window.api.process.list();

// Get currently active process
const activeProcess = await window.api.process.getActive();
```

### Tray API

```typescript
// Toggle tray visibility
const status = await window.api.tray.toggle();

// Show tray
await window.api.tray.show();

// Hide tray
await window.api.tray.hide();
```

### Window API

```typescript
// Minimize window
await window.api.window.minimize();

// Close window
await window.api.window.close();
```

## Data Types

### Settings

```typescript
interface Settings {
  enabledKeys: Array<'W' | 'A' | 'S' | 'D'>;
  startOnBoot: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  hotkey: string;
  theme: 'light' | 'dark' | 'system';
}
```

### HookStatus

```typescript
interface HookStatus {
  enabled: boolean;
  activeKeys: string[];
  lastError: string | null;
}
```

### ProcessInfo

```typescript
interface ProcessInfo {
  pid: number;
  name: string;
  path: string;
  cpu?: number;
  memory?: number;
}
```

## Validation

All data crossing process boundaries is validated using Zod:

1. **Channel Validation**: Ensures only whitelisted channels are used
2. **Payload Validation**: Validates data structure and types
3. **Error Handling**: Returns structured error responses

Example:
```typescript
// Invalid data will be rejected
try {
  await window.api.settings.set({ theme: 'invalid' });
} catch (error) {
  console.error(error.message); // Validation error
}
```

## Lifecycle

### Initialization Flow

1. Main process starts and initializes managers
2. Managers register IPC handlers
3. Window is created with preload script
4. Preload exposes API to window object
5. Renderer can immediately use `window.api`

### Update Propagation

```
Renderer calls → Preload validates → Main handler executes
                                    ↓
Main broadcasts ← Preload listener ← Manager notifies
```

### Cleanup Flow

1. `before-quit` event triggers cleanup
2. Hooks are disabled
3. IPC handlers are removed
4. Settings are saved
5. App exits cleanly

## Security

- **Context Isolation**: Enabled to prevent prototype pollution
- **Node Integration**: Disabled in renderer for security
- **Channel Validation**: Prevents malicious channel access
- **Type Safety**: Prevents invalid data structures
- **Sandbox**: Can be enabled if needed (currently disabled for hook access)

## Logging

All IPC operations are logged with prefixes:

- `[Main]` - Main process events
- `[IPC]` - IPC handler events
- `[Settings]` - Settings manager events
- `[Hook]` - Hook manager events
- `[Preload]` - Preload script events
- `[Renderer]` - Renderer events

Check developer tools console and terminal for logs.

## Testing

The framework has been tested for:

✅ Type safety (TypeScript compilation)
✅ Validation (Zod schema tests)
✅ Channel security (whitelist enforcement)
✅ Default values
✅ Error handling
✅ Lifecycle management

## Example Usage

See `src/renderer/App.tsx` for a complete example demonstrating:

- Getting initial settings and hook status
- Subscribing to updates
- Toggling hook on/off
- Updating settings
- Resetting to defaults
- Error handling

## Future Enhancements

- [ ] Implement actual keyboard hook (currently placeholder)
- [ ] Implement process listing and active process detection
- [ ] Implement tray functionality
- [ ] Add setting validation constraints (e.g., valid hotkey format)
- [ ] Add request timeout handling
- [ ] Add request cancellation support
- [ ] Add request queuing/throttling
