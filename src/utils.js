import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import colors from 'colors'
import * as config from './config.js'

export function log (id, ctx = {}) {
  const c = Object.keys(ctx).reduce((acc, key) => acc.replace(`{{${key}}}`, colors.red(ctx[key])), config.logErrs[id])
  const msg = colors.yellow(`${colors.white(config.pluginName)} ${c}`)
  console.log(msg)
  return msg
}

export function absPath (relPath) {
  return path.join(process.cwd(), relPath)
}

export function getContentsOfFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}

export function stringify (css) {
  const a = JSON.stringify(css)
  return a.substr(1, a.length - 2)
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
    if (!shouldNotWarn && str !== key) log('namingWarn', { oldName: key, newName: str })
    acc.exportTokens[str] = result.exportTokens[key]
    return acc
  }, {
    injectableSource: result.injectableSource,
    exportTokens: {}
  })
}

export function processCssModule (instance, code, id, shouldNotWarn, imported = {}) {
  return instance.load(code, id, null, file => {
    const rPath = file.split('"').join('')
    const aPath = absPath(rPath)
    return getContentsOfFile(rPath)
      .then(c => processCssModule(instance, c, aPath, shouldNotWarn, imported))
      .then(r => {
        imported[aPath] = r.local
        return r.local.exportTokens
      })
  })
    .then(r => ({
      local: makeLegitExportTokens(r, shouldNotWarn),
      imported
    }))
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
    unused.map(e => log('unusedWarn', e))
    if (opts.error === true) throw Error(log('unusedErr'))
  }
}
