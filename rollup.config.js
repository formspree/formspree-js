import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

const plugins = [
  nodeResolve(),
  commonjs({
    include: 'node_modules/**'
  }),
  babel({
    exclude: 'node_modules/**'
  }),
  json()
];

export default [
  {
    external: ['react', '@statickit/core'],
    input: 'src/index.js',
    plugins: plugins,
    output: {
      format: 'cjs',
      file: __dirname + '/dist/statickit-react.cjs.js'
    }
  },
  {
    external: ['react', '@statickit/core'],
    input: 'src/index.js',
    plugins: plugins,
    output: {
      format: 'esm',
      file: __dirname + '/dist/statickit-react.esm.js'
    }
  },
  {
    external: ['react'],
    input: 'src/index.js',
    plugins: plugins,
    output: {
      format: 'iife',
      file: __dirname + '/dist/statickit-react.iife.js',
      name: 'StaticKitReact',
      globals: {
        react: 'React'
      }
    }
  }
];
