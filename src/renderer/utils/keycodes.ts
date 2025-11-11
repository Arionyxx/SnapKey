// Virtual Key Code to display name mapping
// See: https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes

export const VK_CODE_TO_NAME: Record<number, string> = {
  // Mouse buttons
  0x01: 'LMB',
  0x02: 'RMB',
  0x04: 'MMB',
  0x05: 'X1',
  0x06: 'X2',

  // Control keys
  0x08: 'Backspace',
  0x09: 'Tab',
  0x0d: 'Enter',
  0x10: 'Shift',
  0x11: 'Ctrl',
  0x12: 'Alt',
  0x13: 'Pause',
  0x14: 'Caps Lock',
  0x1b: 'Esc',
  0x20: 'Space',

  // Navigation
  0x21: 'Page Up',
  0x22: 'Page Down',
  0x23: 'End',
  0x24: 'Home',
  0x25: '←',
  0x26: '↑',
  0x27: '→',
  0x28: '↓',
  0x2c: 'Print Screen',
  0x2d: 'Insert',
  0x2e: 'Delete',

  // Numbers (0-9)
  0x30: '0',
  0x31: '1',
  0x32: '2',
  0x33: '3',
  0x34: '4',
  0x35: '5',
  0x36: '6',
  0x37: '7',
  0x38: '8',
  0x39: '9',

  // Letters (A-Z)
  0x41: 'A',
  0x42: 'B',
  0x43: 'C',
  0x44: 'D',
  0x45: 'E',
  0x46: 'F',
  0x47: 'G',
  0x48: 'H',
  0x49: 'I',
  0x4a: 'J',
  0x4b: 'K',
  0x4c: 'L',
  0x4d: 'M',
  0x4e: 'N',
  0x4f: 'O',
  0x50: 'P',
  0x51: 'Q',
  0x52: 'R',
  0x53: 'S',
  0x54: 'T',
  0x55: 'U',
  0x56: 'V',
  0x57: 'W',
  0x58: 'X',
  0x59: 'Y',
  0x5a: 'Z',

  // Windows keys
  0x5b: 'Win',
  0x5c: 'Win',
  0x5d: 'Menu',

  // Numpad
  0x60: 'Num 0',
  0x61: 'Num 1',
  0x62: 'Num 2',
  0x63: 'Num 3',
  0x64: 'Num 4',
  0x65: 'Num 5',
  0x66: 'Num 6',
  0x67: 'Num 7',
  0x68: 'Num 8',
  0x69: 'Num 9',
  0x6a: 'Num *',
  0x6b: 'Num +',
  0x6d: 'Num -',
  0x6e: 'Num .',
  0x6f: 'Num /',

  // Function keys
  0x70: 'F1',
  0x71: 'F2',
  0x72: 'F3',
  0x73: 'F4',
  0x74: 'F5',
  0x75: 'F6',
  0x76: 'F7',
  0x77: 'F8',
  0x78: 'F9',
  0x79: 'F10',
  0x7a: 'F11',
  0x7b: 'F12',
  0x7c: 'F13',
  0x7d: 'F14',
  0x7e: 'F15',
  0x7f: 'F16',
  0x80: 'F17',
  0x81: 'F18',
  0x82: 'F19',
  0x83: 'F20',
  0x84: 'F21',
  0x85: 'F22',
  0x86: 'F23',
  0x87: 'F24',

  // Lock keys
  0x90: 'Num Lock',
  0x91: 'Scroll Lock',

  // Shift keys
  0xa0: 'Left Shift',
  0xa1: 'Right Shift',
  0xa2: 'Left Ctrl',
  0xa3: 'Right Ctrl',
  0xa4: 'Left Alt',
  0xa5: 'Right Alt',

  // Browser keys
  0xa6: 'Browser Back',
  0xa7: 'Browser Forward',
  0xa8: 'Browser Refresh',
  0xa9: 'Browser Stop',
  0xaa: 'Browser Search',
  0xab: 'Browser Favorites',
  0xac: 'Browser Home',

  // Volume keys
  0xad: 'Mute',
  0xae: 'Volume Down',
  0xaf: 'Volume Up',

  // Media keys
  0xb0: 'Next Track',
  0xb1: 'Previous Track',
  0xb2: 'Stop',
  0xb3: 'Play/Pause',
  0xb4: 'Mail',
  0xb5: 'Media Select',
  0xb6: 'App 1',
  0xb7: 'App 2',

  // OEM keys
  0xba: ';',
  0xbb: '=',
  0xbc: ',',
  0xbd: '-',
  0xbe: '.',
  0xbf: '/',
  0xc0: '`',
  0xdb: '[',
  0xdc: '\\',
  0xdd: ']',
  0xde: "'",
};

export const NAME_TO_VK_CODE: Record<string, number> = Object.fromEntries(
  Object.entries(VK_CODE_TO_NAME).map(([code, name]) => [name.toLowerCase(), parseInt(code)])
);

export function vkCodeToName(code: number): string {
  return VK_CODE_TO_NAME[code] || `VK ${code}`;
}

export function nameToVkCode(name: string): number | undefined {
  return NAME_TO_VK_CODE[name.toLowerCase()];
}

export function vkCodesToNames(codes: number[]): string[] {
  return codes.map(vkCodeToName);
}

export function formatKeyCombination(codes: number[]): string {
  return vkCodesToNames(codes).join(' + ');
}
