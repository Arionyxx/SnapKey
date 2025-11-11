import koffi from 'koffi';

// Windows constants
const MAX_PATH = 260;
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
const GW_OWNER = 4;

// Window styles
const WS_VISIBLE = 0x10000000;
const GWL_STYLE = -16;

// Monitor constants
const MONITOR_DEFAULTTONEAREST = 0x00000002;

export interface WindowInfo {
  hwnd: number;
  title: string;
  processId: number;
  processName: string;
  processPath: string;
}

export interface WindowBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface MonitorInfo {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

let user32: koffi.IKoffiLib | null = null;
let kernel32: koffi.IKoffiLib | null = null;
let enumWindowsFunc: koffi.KoffiFunction | null = null;
let getForegroundWindowFunc: koffi.KoffiFunction | null = null;
let getWindowThreadProcessIdFunc: koffi.KoffiFunction | null = null;
let getWindowTextWFunc: koffi.KoffiFunction | null = null;
let getWindowRectFunc: koffi.KoffiFunction | null = null;
let isWindowVisibleFunc: koffi.KoffiFunction | null = null;
let getWindowLongPtrWFunc: koffi.KoffiFunction | null = null;
let getWindowFunc: koffi.KoffiFunction | null = null;
let openProcessFunc: koffi.KoffiFunction | null = null;
let closeHandleFunc: koffi.KoffiFunction | null = null;
let queryFullProcessImageNameWFunc: koffi.KoffiFunction | null = null;
let monitorFromWindowFunc: koffi.KoffiFunction | null = null;
let getMonitorInfoWFunc: koffi.KoffiFunction | null = null;

function initWin32Window(): void {
  if (process.platform !== 'win32') {
    console.log('[Win32Window] Not on Windows, skipping Win32 API initialization');
    return;
  }

  try {
    user32 = koffi.load('user32.dll');
    kernel32 = koffi.load('kernel32.dll');

    // Define RECT structure
    const RECT = koffi.struct('RECT', {
      left: 'long',
      top: 'long',
      right: 'long',
      bottom: 'long',
    });

    // Define MONITORINFO structure
    // @ts-expect-error - Used by koffi for type information
    const _MONITORINFO = koffi.struct('MONITORINFO', {
      cbSize: 'uint',
      rcMonitor: RECT,
      rcWork: RECT,
      dwFlags: 'uint',
    });

    // Define callback type for EnumWindows
    // @ts-expect-error - Used by koffi for type information
    const _EnumWindowsProc = koffi.proto('bool EnumWindowsProc(void *hwnd, long_ptr lParam)');

    // Load functions
    enumWindowsFunc = user32.func('bool EnumWindows(EnumWindowsProc lpEnumFunc, long_ptr lParam)');
    getForegroundWindowFunc = user32.func('void *GetForegroundWindow()');
    getWindowThreadProcessIdFunc = user32.func(
      'uint GetWindowThreadProcessId(void *hWnd, _Out_ uint *lpdwProcessId)'
    );
    getWindowTextWFunc = user32.func(
      'int GetWindowTextW(void *hWnd, _Out_ str16 lpString, int nMaxCount)'
    );
    getWindowRectFunc = user32.func('bool GetWindowRect(void *hWnd, _Out_ RECT *lpRect)');
    isWindowVisibleFunc = user32.func('bool IsWindowVisible(void *hWnd)');
    getWindowLongPtrWFunc = user32.func('long_ptr GetWindowLongPtrW(void *hWnd, int nIndex)');
    getWindowFunc = user32.func('void *GetWindow(void *hWnd, uint uCmd)');
    monitorFromWindowFunc = user32.func('void *MonitorFromWindow(void *hwnd, uint dwFlags)');
    getMonitorInfoWFunc = user32.func(
      'bool GetMonitorInfoW(void *hMonitor, _Out_ MONITORINFO *lpmi)'
    );

    openProcessFunc = kernel32.func(
      'void *OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId)'
    );
    closeHandleFunc = kernel32.func('bool CloseHandle(void *hObject)');
    queryFullProcessImageNameWFunc = kernel32.func(
      'bool QueryFullProcessImageNameW(void *hProcess, uint dwFlags, _Out_ str16 lpExeName, _Inout_ uint *lpdwSize)'
    );

    console.log('[Win32Window] Win32 window API initialized successfully');
  } catch (error) {
    console.error('[Win32Window] Failed to initialize Win32 window API:', error);
    throw error;
  }
}

export function getForegroundWindow(): number | null {
  if (process.platform !== 'win32') {
    return null;
  }

  if (!getForegroundWindowFunc) {
    initWin32Window();
  }

  if (!getForegroundWindowFunc) {
    return null;
  }

  try {
    const hwnd = getForegroundWindowFunc();
    return hwnd ? Number(hwnd) : null;
  } catch (error) {
    console.error('[Win32Window] Error getting foreground window:', error);
    return null;
  }
}

export function getWindowInfo(hwnd: number): WindowInfo | null {
  if (process.platform !== 'win32') {
    return null;
  }

  if (!getWindowThreadProcessIdFunc || !getWindowTextWFunc) {
    initWin32Window();
  }

  if (!getWindowThreadProcessIdFunc || !getWindowTextWFunc) {
    return null;
  }

  try {
    // Get process ID
    const pidArray = [0];
    getWindowThreadProcessIdFunc(hwnd, pidArray);
    const processId = pidArray[0];

    if (processId === 0) {
      return null;
    }

    // Get window title
    const titleBuffer = global.Buffer.alloc(512);
    const titleLength = getWindowTextWFunc(hwnd, titleBuffer, 256);
    const title = titleLength > 0 ? titleBuffer.toString('utf16le', 0, titleLength * 2) : '';

    // Get process name and path
    const { processName, processPath } = getProcessInfo(processId);

    return {
      hwnd,
      title,
      processId,
      processName,
      processPath,
    };
  } catch (error) {
    console.error('[Win32Window] Error getting window info:', error);
    return null;
  }
}

function getProcessInfo(processId: number): { processName: string; processPath: string } {
  if (!openProcessFunc || !queryFullProcessImageNameWFunc || !closeHandleFunc) {
    return { processName: '', processPath: '' };
  }

  try {
    const hProcess = openProcessFunc(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);
    if (!hProcess) {
      return { processName: '', processPath: '' };
    }

    const pathBuffer = global.Buffer.alloc(MAX_PATH * 2);
    const sizeArray = [MAX_PATH];
    const success = queryFullProcessImageNameWFunc(hProcess, 0, pathBuffer, sizeArray);

    closeHandleFunc(hProcess);

    if (success) {
      const pathLength = sizeArray[0];
      const processPath = pathBuffer.toString('utf16le', 0, pathLength * 2);
      const processName = processPath.split('\\').pop() || '';
      return { processName, processPath };
    }

    return { processName: '', processPath: '' };
  } catch (error) {
    console.error('[Win32Window] Error getting process info:', error);
    return { processName: '', processPath: '' };
  }
}

export function isWindowVisible(hwnd: number): boolean {
  if (process.platform !== 'win32') {
    return false;
  }

  if (!isWindowVisibleFunc) {
    initWin32Window();
  }

  if (!isWindowVisibleFunc) {
    return false;
  }

  try {
    return isWindowVisibleFunc(hwnd);
  } catch (error) {
    console.error('[Win32Window] Error checking window visibility:', error);
    return false;
  }
}

export function getWindowBounds(hwnd: number): WindowBounds | null {
  if (process.platform !== 'win32') {
    return null;
  }

  if (!getWindowRectFunc) {
    initWin32Window();
  }

  if (!getWindowRectFunc) {
    return null;
  }

  try {
    const rect = { left: 0, top: 0, right: 0, bottom: 0 };
    const success = getWindowRectFunc(hwnd, [rect]);

    if (!success) {
      return null;
    }

    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    };
  } catch (error) {
    console.error('[Win32Window] Error getting window bounds:', error);
    return null;
  }
}

export function getMonitorInfo(hwnd: number): MonitorInfo | null {
  if (process.platform !== 'win32') {
    return null;
  }

  if (!monitorFromWindowFunc || !getMonitorInfoWFunc) {
    initWin32Window();
  }

  if (!monitorFromWindowFunc || !getMonitorInfoWFunc) {
    return null;
  }

  try {
    const hMonitor = monitorFromWindowFunc(hwnd, MONITOR_DEFAULTTONEAREST);
    if (!hMonitor) {
      return null;
    }

    const monitorInfo = {
      cbSize: 40, // sizeof(MONITORINFO)
      rcMonitor: { left: 0, top: 0, right: 0, bottom: 0 },
      rcWork: { left: 0, top: 0, right: 0, bottom: 0 },
      dwFlags: 0,
    };

    const success = getMonitorInfoWFunc(hMonitor, [monitorInfo]);

    if (!success) {
      return null;
    }

    const rect = monitorInfo.rcMonitor;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    };
  } catch (error) {
    console.error('[Win32Window] Error getting monitor info:', error);
    return null;
  }
}

export function isWindowFullscreen(hwnd: number): boolean {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    const windowBounds = getWindowBounds(hwnd);
    const monitorInfo = getMonitorInfo(hwnd);

    if (!windowBounds || !monitorInfo) {
      return false;
    }

    // Check if window bounds match monitor bounds (with small tolerance for rounding)
    const tolerance = 2;
    const matchesWidth = Math.abs(windowBounds.width - monitorInfo.width) <= tolerance;
    const matchesHeight = Math.abs(windowBounds.height - monitorInfo.height) <= tolerance;
    const matchesLeft = Math.abs(windowBounds.left - monitorInfo.left) <= tolerance;
    const matchesTop = Math.abs(windowBounds.top - monitorInfo.top) <= tolerance;

    return matchesWidth && matchesHeight && matchesLeft && matchesTop;
  } catch (error) {
    console.error('[Win32Window] Error checking fullscreen status:', error);
    return false;
  }
}

function hasOwner(hwnd: number): boolean {
  if (!getWindowFunc) {
    return false;
  }

  try {
    const owner = getWindowFunc(hwnd, GW_OWNER);
    return !!owner;
  } catch {
    return false;
  }
}

function isMainWindow(hwnd: number): boolean {
  if (!isWindowVisibleFunc || !getWindowLongPtrWFunc) {
    return false;
  }

  try {
    // Must be visible
    if (!isWindowVisibleFunc(hwnd)) {
      return false;
    }

    // Must not have an owner
    if (hasOwner(hwnd)) {
      return false;
    }

    // Check if it has WS_VISIBLE style
    const style = getWindowLongPtrWFunc(hwnd, GWL_STYLE);
    if (!(style & WS_VISIBLE)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function enumerateWindows(): WindowInfo[] {
  if (process.platform !== 'win32') {
    return [];
  }

  if (!enumWindowsFunc) {
    initWin32Window();
  }

  if (!enumWindowsFunc) {
    return [];
  }

  const windows: WindowInfo[] = [];

  try {
    const callback = koffi.register((hwnd: number) => {
      try {
        // Only enumerate main windows
        if (!isMainWindow(hwnd)) {
          return true; // Continue enumeration
        }

        const info = getWindowInfo(hwnd);
        if (info && info.title) {
          windows.push(info);
        }
      } catch {
        // Ignore errors in individual windows
      }
      return true; // Continue enumeration
    }, koffi.proto('bool EnumWindowsProc(void *hwnd, long_ptr lParam)'));

    enumWindowsFunc(callback, 0);
    koffi.unregister(callback);
  } catch {
    // Ignore enumeration errors, return empty list
  }

  return windows;
}

export function getForegroundWindowInfo(): WindowInfo | null {
  const hwnd = getForegroundWindow();
  if (!hwnd) {
    return null;
  }
  return getWindowInfo(hwnd);
}

// Initialize on module load for Windows
if (process.platform === 'win32') {
  try {
    initWin32Window();
  } catch (error) {
    console.error('[Win32Window] Failed to initialize Win32 window on module load:', error);
  }
}
