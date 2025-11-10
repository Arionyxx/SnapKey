import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, callback: (data: unknown) => void) => {
    const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
});
