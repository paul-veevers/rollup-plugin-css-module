import rollup from 'rollup';
import babel from 'rollup-plugin-babel';
import css from '../src/index.js';

const babelOpts = {
  babelrc: false,
  presets: ['es2015-rollup'],
  exclude: ['**/*.css'],
};

export function buildDefault() {
  return rollup.rollup({
    entry: './tests/stubs/default.js',
    plugins: [
      css({
        before: [
          require('postcss-nested'),
        ],
        globals: [
          './tests/stubs/default.css',
        ],
      }),
      babel(babelOpts),
    ],
  }).then(bundle => {
    const result = bundle.generate({
      format: 'umd',
    });
    return result.code;
  })
};
