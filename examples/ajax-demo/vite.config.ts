import { defineConfig } from 'vite';
import { resolve } from 'path';

const ajaxPkg = resolve(__dirname, '../../packages/formspree-ajax');

export default defineConfig({
  root: './public',
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        packages: resolve(__dirname, 'public/index-packages.html'),
        cdn: resolve(__dirname, 'public/index-cdn.html')
      }
    }
  },
  resolve: {
    alias: {
      '@formspree/ajax/global': resolve(ajaxPkg, 'src/global.ts'),
      '@formspree/ajax': resolve(ajaxPkg, 'src/index.ts'),
      '@formspree/core': resolve(__dirname, '../../packages/formspree-core/src/index.ts')
    }
  }
});
