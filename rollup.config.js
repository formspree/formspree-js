import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

const plugins = [
  nodeResolve(),
  commonjs({
    include: 'node_modules/**'
  }),
  babel({
    exclude: 'node_modules/**'
  })
];

export default [
  {
    external: ['react', '@statickit/core'],
    input: 'src/index.js',
    plugins: plugins,
    output: {
      format: 'cjs',
      file: __dirname + '/dist/statickit-react.cjs.js',
      name: 'StaticKitReact'
    }
  },
  {
    external: ['react', '@statickit/core'],
    input: 'src/index.js',
    plugins: plugins,
    output: {
      format: 'esm',
      file: __dirname + '/dist/statickit-react.esm.js',
      name: 'StaticKitReact'
    }
  }
];
