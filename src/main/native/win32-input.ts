import koffi from 'koffi';

// Windows constants
export const KEYEVENTF_EXTENDEDKEY = 0x0001;
export const KEYEVENTF_KEYUP = 0x0002;
export const KEYEVENTF_SCANCODE = 0x0008;
export const KEYEVENTF_UNICODE = 0x0004;

export const INPUT_KEYBOARD = 1;

// Tag for simulated events to avoid infinite loops
export const SNAPKEY_MAGIC_DWEXTRAINFO = 0x534e4150; // 'SNAP' in hex

// Virtual key codes for common keys
export const VK_W = 0x57;
export const VK_A = 0x41;
export const VK_S = 0x53;
export const VK_D = 0x44;

// Key mapping
export const KEY_TO_VK: Record<string, number> = {
  W: VK_W,
  A: VK_A,
  S: VK_S,
  D: VK_D,
};

// INPUT structure for SendInput
export interface KeyboardInput {
  wVk: number;
  wScan: number;
  dwFlags: number;
  time: number;
  dwExtraInfo: number;
}

export interface InputEvent {
  type: number;
  ki: KeyboardInput;
}

let user32: unknown = null;
let sendInputFunc: unknown = null;

function initWin32(): void {
  if (process.platform !== 'win32') {
    console.log('[Win32Input] Not on Windows, skipping Win32 API initialization');
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user32 = koffi.load('user32.dll') as any;

    // Define KEYBDINPUT structure
    const KEYBDINPUT = koffi.struct('KEYBDINPUT', {
      wVk: 'ushort',
      wScan: 'ushort',
      dwFlags: 'uint',
      time: 'uint',
      dwExtraInfo: 'usize',
    });

    // Define INPUT union (simplified for keyboard-only)
    // @ts-expect-error: _INPUT_STRUCT is used by koffi for type information
    const _INPUT_STRUCT = koffi.struct('INPUT', {
      type: 'uint',
      ki: KEYBDINPUT,
    });

    // UINT SendInput(UINT cInputs, LPINPUT pInputs, int cbSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendInputFunc = (user32 as any).func(
      'uint SendInput(uint cInputs, _Inout_ INPUT *pInputs, int cbSize)'
    );

    console.log('[Win32Input] Win32 API initialized successfully');
  } catch (error) {
    console.error('[Win32Input] Failed to initialize Win32 API:', error);
    console.warn('[Win32Input] Continuing without Win32 API support');
  }
}

export function sendKeyEvent(vkCode: number, isKeyUp: boolean, tagged = true): boolean {
  if (process.platform !== 'win32') {
    console.log(
      `[Win32Input] Simulating key event (non-Windows): vkCode=${vkCode}, isKeyUp=${isKeyUp}`
    );
    return true;
  }

  if (!sendInputFunc) {
    initWin32();
  }

  if (!sendInputFunc) {
    console.error('[Win32Input] SendInput function not available');
    return false;
  }

  try {
    const input: InputEvent = {
      type: INPUT_KEYBOARD,
      ki: {
        wVk: vkCode,
        wScan: 0,
        dwFlags: isKeyUp ? KEYEVENTF_KEYUP : 0,
        time: 0,
        dwExtraInfo: tagged ? SNAPKEY_MAGIC_DWEXTRAINFO : 0,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (sendInputFunc as any)(1, [input], 48); // sizeof(INPUT) = 48 bytes on x64
    if (result !== 1) {
      console.error('[Win32Input] SendInput failed:', result);
      return false;
    }

    console.log(
      `[Win32Input] Sent key event: vkCode=${vkCode}, isKeyUp=${isKeyUp}, tagged=${tagged}`
    );
    return true;
  } catch (error) {
    console.error('[Win32Input] Error sending key event:', error);
    return false;
  }
}

export function sendKeyDown(vkCode: number, tagged = true): boolean {
  return sendKeyEvent(vkCode, false, tagged);
}

export function sendKeyUp(vkCode: number, tagged = true): boolean {
  return sendKeyEvent(vkCode, true, tagged);
}

export function getKeyName(vkCode: number): string {
  for (const [key, code] of Object.entries(KEY_TO_VK)) {
    if (code === vkCode) {
      return key;
    }
  }
  return `VK_${vkCode.toString(16).toUpperCase()}`;
}

// Initialize on module load
if (process.platform === 'win32') {
  try {
    initWin32();
  } catch (error) {
    console.error('[Win32Input] Failed to initialize Win32 on module load:', error);
  }
}
