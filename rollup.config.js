import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  targets: [
    {
      dest: 'dist/rollup-plugin-css-module.cjs.js',
      format: 'cjs'
    },
    {
      dest: 'dist/rollup-plugin-css-module.es6.js',
      format: 'es'
    }
  ],
  exports: 'named',
  external: [
    'fs',
    'path'
  ].concat(Object.keys(require('./package.json').dependencies)),
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup'],
      babelrc: false
    })
  ]
}
