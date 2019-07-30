import babel from 'rollup-plugin-babel';

const plugins = [
  babel({
    exclude: 'node_modules/**'
  })
];

export default [
  {
    input: 'src/index.js',
    external: ['react'],
    plugins: plugins,
    output: {
      format: 'umd',
      file: __dirname + '/dist/statickit-react.umd.js',
      name: 'StaticKitReact',
      globals: {
        react: 'React'
      }
    }
  },
  {
    input: 'src/index.js',
    external: ['react'],
    plugins: plugins,
    output: {
      format: 'esm',
      file: __dirname + '/dist/statickit-react.esm.js',
      name: 'StaticKitReact',
      globals: {
        react: 'React'
      }
    }
  }
];
