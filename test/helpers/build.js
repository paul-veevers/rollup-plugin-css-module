import { rollup } from 'rollup'
import babel from 'rollup-plugin-babel'
import postcssNested from 'postcss-nested'
import cssnano from 'cssnano'
import css, {
  generateDependableShortName,
  generateShortName,
  generateLongName
} from '../../src/index.js'

const scopeTypes = [generateLongName, generateShortName, generateDependableShortName]
const babelOpts = {
  babelrc: false,
  presets: ['es2015-rollup'],
  exclude: ['**/*.css']
}

export default function build (insertMethod = 'iife', entry = './test/stubs/default.js', scopeName = 0, logging = false, treeshake = true) {
  return rollup({
    entry,
    plugins: [
      css({
        insertMethod,
        fileName: './test/tmp/fileName.css',
        generateScopedName: scopeTypes[scopeName],
        ignore: ['doNotMangleMe'],
        before: [
          postcssNested
        ],
        after: [
          cssnano
        ],
        afterForced: [],
        globals: [
          './test/stubs/global.css'
        ],
        treeshake: {
          warning: logging,
          error: logging,
          remove: treeshake
        },
        suppressNamingWarning: !logging
      }),
      babel(babelOpts)
    ]
  }).then(bundle => {
    return bundle.generate({
      format: 'iife'
    }).code
  })
}
