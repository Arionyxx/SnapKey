import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@preload': resolve(__dirname, './src/preload'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  build: {
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: '[name].js',
      },
    },
  },
});
