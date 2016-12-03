import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const external = Object.keys(pkg.dependencies);

export default {
  entry: 'src/index.js',
  targets: [
    {
      dest: 'dist/rollup-plugin-css-module.cjs.js',
      format: 'cjs',
    },
    {
      dest: 'dist/rollup-plugin-css-module.es6.js',
      format: 'es6',
    },
  ],
  external,
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup'],
      babelrc: false,
    }),
  ],
};
