import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@preload': resolve(__dirname, './src/preload'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
});
