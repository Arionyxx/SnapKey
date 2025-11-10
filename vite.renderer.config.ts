import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, './src/renderer'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main_window: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
});
