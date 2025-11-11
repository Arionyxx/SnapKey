import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerWix } from '@electron-forge/maker-wix';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'SnapKey',
    executableName: 'snapkey',
    asar: true,
    icon: './legacy/icon',
    extraResource: [
      './legacy/icon.ico',
      './legacy/icon_off.ico',
    ],
    // Code signing configuration (will use cert if available in environment)
    ...(process.env.WINDOWS_CERTIFICATE_FILE && {
      win32metadata: {
        CompanyName: 'SnapKey',
        FileDescription: 'A lightweight tool that prevents simultaneous movement key conflicts',
        OriginalFilename: 'snapkey.exe',
        ProductName: 'SnapKey',
        InternalName: 'SnapKey',
      },
    }),
  },
  rebuildConfig: {
    // Ensure native modules are rebuilt for Electron
    force: true,
  },
  makers: [
    // Squirrel.Windows - Creates auto-updating installer (recommended)
    new MakerSquirrel({
      name: 'SnapKey',
      setupIcon: './legacy/icon.ico',
      loadingGif: './legacy/icon.ico',
      // Code signing for Squirrel installer
      ...(process.env.WINDOWS_CERTIFICATE_FILE && process.env.WINDOWS_CERTIFICATE_PASSWORD && {
        certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      }),
    }),
    // WiX - Creates MSI installer (enterprise-friendly)
    new MakerWix({
      name: 'SnapKey',
      description: 'A lightweight, open-source tool that prevents simultaneous movement key conflicts',
      manufacturer: 'SnapKey',
      appIconPath: path.join(__dirname, 'legacy', 'icon.ico'),
      ui: {
        enabled: true,
        chooseDirectory: true,
      },
      shortcutFolderName: 'SnapKey',
      exe: 'snapkey',
      // Code signing for MSI installer
      ...(process.env.WINDOWS_CERTIFICATE_FILE && process.env.WINDOWS_CERTIFICATE_PASSWORD && {
        certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      }),
    }),
    // ZIP - Portable version (no installer)
    new MakerZIP({}, ['darwin', 'win32']),
    // Linux packages
    new MakerRpm({
      options: {
        name: 'snapkey',
        productName: 'SnapKey',
        genericName: 'Keyboard Input Manager',
        description: 'A lightweight, open-source tool that prevents simultaneous movement key conflicts',
        categories: ['Utility'],
        icon: './legacy/icon.ico',
      },
    }),
    new MakerDeb({
      options: {
        name: 'snapkey',
        productName: 'SnapKey',
        genericName: 'Keyboard Input Manager',
        description: 'A lightweight, open-source tool that prevents simultaneous movement key conflicts',
        categories: ['Utility'],
        icon: './legacy/icon.ico',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
