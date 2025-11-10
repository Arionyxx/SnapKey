# IPC Framework Test Checklist

## Pre-flight Checks

### ✅ Build & Compilation
- [x] TypeScript main process compiles without errors
- [x] TypeScript preload script compiles without errors
- [x] TypeScript renderer compiles without errors
- [x] ESLint passes with no errors
- [x] Prettier formatting is correct
- [x] Vite builds successfully
- [x] All modules properly bundled

### ✅ Code Quality
- [x] No unused variables or parameters
- [x] All imports resolve correctly
- [x] Path aliases (@shared, @main, etc.) work
- [x] Proper error handling in place
- [x] Comprehensive logging added

## Runtime Verification (to be tested in actual environment)

### Main Process
- [ ] Single-instance lock works (second instance focuses first)
- [ ] Settings file created in userData directory
- [ ] Settings persist across app restarts
- [ ] Hook manager initializes correctly
- [ ] IPC handlers register successfully
- [ ] Cleanup runs on app quit
- [ ] No uncaught exceptions

### IPC Communication
- [ ] `window.api` is available in renderer
- [ ] `window.api.settings.get()` returns default settings
- [ ] `window.api.settings.set()` updates settings
- [ ] `window.api.settings.reset()` resets to defaults
- [ ] `window.api.hook.getStatus()` returns hook status
- [ ] `window.api.hook.toggle()` toggles hook state
- [ ] Settings changes propagate to renderer
- [ ] Hook status changes propagate to renderer

### Validation
- [ ] Invalid channel names are rejected
- [ ] Invalid settings data is rejected
- [ ] Malformed payloads are caught
- [ ] Error messages are clear and helpful
- [ ] Zod schemas validate correctly

### UI/UX
- [ ] Settings display correctly on load
- [ ] Hook status displays correctly
- [ ] Toggle buttons work
- [ ] Loading state shows during initialization
- [ ] Error state shows on failures
- [ ] Subscriptions update UI in real-time

### Developer Tools
- [ ] No IPC warnings in console
- [ ] Main process logs visible in terminal
- [ ] Renderer logs visible in DevTools
- [ ] No security warnings
- [ ] Performance is acceptable

## Test Scenarios

### Scenario 1: Fresh Start
1. Start app for first time
2. Verify default settings loaded
3. Verify settings.json created
4. Verify UI shows defaults

**Expected Results:**
- Settings file at `%APPDATA%/snapkey/settings.json` (Windows) or equivalent
- UI shows: W,A,S,D enabled, system theme, notifications on
- Hook status: Disabled
- No errors in console

### Scenario 2: Settings Modification
1. Click "Toggle Theme" button
2. Verify UI updates immediately
3. Restart app
4. Verify theme persisted

**Expected Results:**
- Theme changes dark ↔ light
- Change visible immediately
- Change persists across restart
- Main log shows: `[Settings] Updated settings`
- Renderer log shows: `[Renderer] Settings updated`

### Scenario 3: Hook Toggle
1. Click "Enable Hook" button
2. Verify button text changes to "Disable Hook"
3. Verify status shows "Enabled"
4. Click again
5. Verify status shows "Disabled"

**Expected Results:**
- Hook status updates immediately
- UI reflects status change
- Main log shows: `[Hook] Enabling keyboard hook...`
- No errors (placeholder implementation)

### Scenario 4: Settings Reset
1. Modify theme to dark
2. Click "Reset Settings"
3. Verify theme returns to system default
4. Verify all settings reset

**Expected Results:**
- All settings return to defaults
- UI updates immediately
- Main log shows: `[Settings] Reset to defaults`

### Scenario 5: Invalid Data
1. Open DevTools console
2. Try: `await window.api.settings.set({ theme: 'invalid' })`
3. Verify error thrown

**Expected Results:**
- Promise rejected with validation error
- UI doesn't break
- Error message mentions invalid theme value

### Scenario 6: Subscription Cleanup
1. Settings page loads
2. Subscriptions created
3. Navigate away or close window
4. Verify subscriptions cleaned up

**Expected Results:**
- No memory leaks
- Event listeners removed
- No errors on unmount

### Scenario 7: Multiple Windows (if applicable)
1. Open multiple windows
2. Change settings in one window
3. Verify other windows receive update

**Expected Results:**
- Broadcast works to all windows
- All windows show updated settings
- No race conditions

## Console Output Examples

### Expected Main Process Logs
```
[Main] SnapKey starting...
[Main] Electron version: 39.x.x
[Main] Platform: win32
[Main] Single instance lock acquired
[Main] App is ready
[Main] Initializing managers...
[Settings] Loaded settings from disk
[IPC] Registering IPC handlers...
[IPC] All IPC handlers registered successfully
[Main] All managers initialized successfully
[Main] Creating main window...
[Main] Main window created successfully
[Main] SnapKey started successfully
```

### Expected Renderer Logs
```
[Preload] API exposed to renderer process
[Renderer] App mounted, initializing...
[Renderer] Fetching initial settings...
[Renderer] Received settings: {...}
[Renderer] Fetching hook status...
[Renderer] Received hook status: {...}
[Renderer] Subscribing to settings updates...
[Renderer] Subscribing to hook status updates...
```

### Expected IPC Logs
```
[IPC] Handling SETTINGS_GET
[IPC] Handling HOOK_STATUS_GET
[IPC] Handling HOOK_TOGGLE
[Hook] Enabling keyboard hook...
[Hook] Keyboard hook enabled
[IPC] Hook status changed, broadcasting to all windows
```

## Known Limitations

- Hook implementation is placeholder (actual keyboard hook not yet implemented)
- Process listing not yet implemented
- Tray functionality not yet implemented
- No actual key blocking yet (planned for future tickets)

## Performance Benchmarks

Expected response times:
- `settings.get()`: < 10ms
- `settings.set()`: < 50ms (includes disk write)
- `hook.toggle()`: < 5ms (placeholder)
- Settings update propagation: < 10ms

## Security Checklist

- [x] Context isolation enabled
- [x] Node integration disabled in renderer
- [x] Channel whitelist enforced
- [x] No arbitrary code execution possible
- [x] Input validation on all IPC calls
- [x] No sensitive data exposed to renderer
- [x] Proper error messages (no stack traces to renderer)

## Documentation

- [x] IPC_FRAMEWORK.md created
- [x] IPC_IMPLEMENTATION_SUMMARY.md created
- [x] Inline code comments added
- [x] TypeScript types provide API documentation
- [x] Example usage in App.tsx

## Success Criteria

All items must pass:

1. ✅ Build compiles without errors
2. ✅ TypeScript validation passes
3. ✅ Linting passes
4. ✅ Formatting is correct
5. ✅ IPC channels bundled in build
6. ✅ Validation logic bundled in build
7. ✅ Settings manager bundled in build
8. ⏳ App starts without errors (requires GUI environment)
9. ⏳ `window.api` is accessible (requires GUI environment)
10. ⏳ IPC calls work correctly (requires GUI environment)

**Status**: 7/10 criteria met. Items 8-10 require actual GUI environment to test.

## Developer Notes

To test manually when GUI is available:

```bash
npm run start
```

Then in DevTools console:

```javascript
// Test settings API
const settings = await window.api.settings.get();
console.log(settings);

await window.api.settings.set({ theme: 'dark' });

// Test hook API
const status = await window.api.hook.toggle();
console.log('Hook enabled:', status.enabled);

// Test subscriptions
const unsub = window.api.settings.onUpdated(s => console.log('Updated:', s));
// Later: unsub();
```
