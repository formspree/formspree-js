import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    clean: true,
  },
  {
    entry: ['src/global.ts'],
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    minify: true,
    platform: 'browser',
    noExternal: [/.*/],
  },
]);
