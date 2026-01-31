import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './public',
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@formspree/ajax': resolve(__dirname, '../../packages/formspree-ajax/src/index.ts'),
      '@formspree/core': resolve(__dirname, '../../packages/formspree-core/src/index.ts')
    }
  }
});
