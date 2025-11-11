import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@main': resolve(__dirname, './src/main'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  build: {
    lib: {
      entry: 'src/main/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['koffi', 'uiohook-napi'],
      output: {
        format: 'es',
        entryFileNames: '[name].js',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
