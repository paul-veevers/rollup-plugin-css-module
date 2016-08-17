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
    entry: './stubs/default.js',
    plugins: [
      css({
        before: [
          require('postcss-nested'),
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
