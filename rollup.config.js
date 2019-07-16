import babel from 'rollup-plugin-babel'

const config = {
  input: 'index.js',
  external: ['react'],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
  output: {
    format: 'umd',
    name: 'statickit-react',
    globals: {
      react: 'React'
    }
  }
};

export default config;
