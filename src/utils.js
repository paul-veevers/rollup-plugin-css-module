import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import colors from 'colors'
import * as genCode from './gen-code.js'
import * as config from './config.js'

export function absPath (relativePath) {
  return path.join(process.cwd(), relativePath)
}

export function getContentsOfFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}

export function compileIife (css, className) {
  return genCode.iife(css, className)
}

export function postcssForceAfter (css, plugins) {
  if (plugins.length === 0) return css
  return postcss(plugins).process(css).css
}

export function makeLegitExportTokens (result, shouldNotWarn) {
  return Object.keys(result.exportTokens).reduce((acc, key) => {
    let str = key
    if (config.jsReservedNames.indexOf(str) > -1) str = `reserved_${str}`
    str = str
      .replace(/-(.{1})/gi, (a, b) => (b.toUpperCase) ? b.toUpperCase() : b) // camelCase dashes (-)
      .replace('\'', '') // replace quotes, postcss adds to vars with a -
    if (!shouldNotWarn && str !== key) {
      console.log(colors.yellow(`${colors.white(config.pluginName)} NamingWarning: export name ${colors.red(str)} has been changed to ${colors.red(str)}. Either because it's a Javascript reserved word or it has a '-' in it. To turn off this warning set suppressNamingWarning: true`))
    }
    acc.exportTokens[str] = result.exportTokens[key]
    return acc
  }, {
    injectableSource: result.injectableSource,
    exportTokens: {}
  })
}

export function processCssModule (instance, code, id, accumulators, suppressNamingWarning) {
  function importResolver (file) {
    const relativePath = file.split('"').join('')
    const absolutePath = absPath(relativePath)
    return getContentsOfFile(relativePath)
      .then(contents => processCssModule(instance, contents, absolutePath, accumulators))
      .then(result => {
        result = makeLegitExportTokens(result, suppressNamingWarning)
        accumulators.imported[absolutePath] = result
        return result.exportTokens
      })
  }
  return instance.load(code, id, null, importResolver)
}

export function concatCss (accumulators) {
  const g = Object.keys(accumulators.global).reduce((acc, key) => acc + accumulators.global[key].injectableSource, '')
  const i = Object.keys(accumulators.imported).reduce((acc, key) => acc + accumulators.imported[key].injectableSource, '')
  const l = Object.keys(accumulators.local).reduce((acc, key) => acc + accumulators.local[key].injectableSource, '')
  return g + i + l
}

export function getUnusedCss (source, accumulators) {
  const all = Object.assign({}, accumulators.global, accumulators.imported, accumulators.local)
  const unused = []
  Object.keys(all).forEach(key => {
    Object.keys(all[key].exportTokens).forEach(key1 => {
      if (!source.includes(all[key].exportTokens[key1])) {
        unused.push({
          file: key,
          export: key1,
          scopedName: all[key].exportTokens[key1]
        })
      }
    })
  })
  return unused
}

export function logUnused (unused, opts) {
  if (opts.error === true || opts.warning === true) {
    unused.map(e => console.log(colors.yellow(`${colors.white(config.pluginName)} export name ${colors.red(e.export)} is not used (${e.file})`)))
    if (opts.error === true) {
      const msg = `${colors.white(config.pluginName)} Stopping build due to unused css exports. If you would like to continue build in future set treeshake.error: false`
      console.log(msg)
      throw Error(msg)
    }
  }
}
