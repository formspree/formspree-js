import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import pkg from './package.json';

const extensions = ['.js', '.ts', '.tsx', '.d.ts'];

const plugins = [
  nodeResolve({
    extensions,
    browser: true
  }),
  commonjs(),
  babel({
    extensions,
    include: ['src/**/*'],
    babelHelpers: 'runtime'
  }),
  json()
];

export default [
  {
    external: [
      'react',
      '@formspree/core',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      /@babel\/runtime/
    ],
    input: './src/index.ts',
    plugins: plugins,
    output: [
      {
        format: 'cjs',
        file: pkg.main
      },
      {
        format: 'esm',
        file: pkg.module
      }
    ]
  },
  {
    external: ['react', '@stripe/stripe-js', '@stripe/react-stripe-js'],
    input: './src/index.ts',
    plugins: plugins,
    output: {
      format: 'iife',
      file: __dirname + '/dist/formspree-react.iife.js',
      name: 'FormspreeReact',
      globals: {
        react: 'React'
      }
    }
  }
];
