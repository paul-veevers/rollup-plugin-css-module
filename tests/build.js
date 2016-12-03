import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import postcssNested from 'postcss-nested';
import cssnano from 'cssnano';
import css, { generateDependableShortName } from '../src/index.js';

const babelOpts = {
  babelrc: false,
  presets: ['es2015-rollup'],
  exclude: ['**/*.css'],
};

function scopify(scope, ignore) {
  return function s(root) {
    root.walkRules(rule => {
      if (rule.selector.indexOf('.') === 0 && rule.selector.indexOf(ignore) === -1) {
        rule.selector = `${scope} ${rule.selector}`; // eslint-disable-line no-param-reassign
      }
      return rule;
    });
  };
}

export default function build(insertStyle = 'iife') {
  return rollup({
    entry: './tests/stubs/default.js',
    plugins: [
      css({
        insertStyle,
        generateScopedName: generateDependableShortName,
        ignore: ['ignoreThisClass'],
        before: [
          postcssNested,
        ],
        after: [
          cssnano,
        ],
        afterForced: [
          scopify('#scopeMe', 'ignoreThisClass'),
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
  });
}
