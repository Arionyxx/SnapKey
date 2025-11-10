export {};

declare global {
  interface Window {
    electron: {
      platform: string;
      version: string;
      send: (channel: string, data: unknown) => void;
      on: (channel: string, callback: (data: unknown) => void) => () => void;
    };
  }
}
