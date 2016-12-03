import { rollup } from 'rollup'
import babel from 'rollup-plugin-babel'
import postcssNested from 'postcss-nested'
import cssnano from 'cssnano'
import css, { generateDependableShortName } from '../../src/index.js'

const babelOpts = {
  babelrc: false,
  presets: ['es2015-rollup'],
  exclude: ['**/*.css']
}

export default function build (insertStyle = 'iife') {
  return rollup({
    entry: './stubs/default.js',
    plugins: [
      css({
        insertStyle,
        generateScopedName: generateDependableShortName,
        ignore: ['doNotMangleMe'],
        before: [
          postcssNested
        ],
        after: [
          cssnano
        ],
        afterForced: [],
        globals: [
          './stubs/global.css'
        ],
        treeshake: {
          warning: false,
          error: false,
          remove: true
        },
        suppressNamingWarning: true
      }),
      babel(babelOpts)
    ]
  }).then(bundle => {
    return bundle.generate({
      format: 'umd'
    }).code
  })
}
