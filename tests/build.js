import rollup from 'rollup';
import babel from 'rollup-plugin-babel';
import css, { generateDependableShortName } from '../src/index.js';

const babelOpts = {
  babelrc: false,
  presets: ['es2015-rollup'],
  exclude: ['**/*.css'],
};

export function buildDefault(insertStyle = 'iife') {
  return rollup.rollup({
    entry: './tests/stubs/default.js',
    plugins: [
      css({
        insertStyle,
        generateScopedName: generateDependableShortName,
        ignore: ['ignoreThisClass'],
        before: [
          require('postcss-nested'),
        ],
        after: [
          require('cssnano'),
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
  })
};

function scopify(scope, ignore) {
  return function(root) {
    root.walkRules(function (rule) {
      if (rule.selector.indexOf('.') === 0 && rule.selector.indexOf(ignore) === -1) {
        rule.selector = scope + ' ' + rule.selector;
      }
      return rule;
    });
  };
}
