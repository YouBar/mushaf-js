import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts(),
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MushafVue',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      // Keep Vue and the core library external — the consumer provides them.
      external: ['vue', 'mushaf.js'],
      output: {
        globals: {
          vue: 'Vue',
          'mushaf.js': 'Mushaf',
        },
      },
    },
  },
});
