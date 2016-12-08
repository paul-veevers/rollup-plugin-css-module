import fs from 'fs'
import path from 'path'
import { createFilter } from 'rollup-pluginutils'
import Core from 'css-modules-loader-core'
import postcssRemoveClasses from 'postcss-remove-classes'
import stringHash from 'string-hash'
import * as config from './config.js'
import * as utils from './utils.js'
import * as genCode from './gen-code.js'

export function generateDependableShortName (ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^./\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '')
  const hash = stringHash(`${sanitisedPath}${name}`).toString(36).substr(0, 5)
  return `_${hash}`
}

export function generateShortName (ignore, name, filename, css) {
  if (ignore.indexOf(name) > -1) return name
  const i = css.indexOf(`.${name}`)
  const numLines = css.substr(0, i).split(';').length
  const hash = stringHash(`${name}${stringHash(css)}${numLines}`).toString(36).substr(0, 5)
  return `_${hash}`
}

export function generateLongName (ignore, name, filename, css) {
  if (ignore.indexOf(name) > -1) return name
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^./\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '')
  const i = css.indexOf(`.${name}`)
  return `_${sanitisedPath}__${i}__${name}`
}

export default function cssModule (options = {}) {
  // options
  const filter = createFilter(options.include, options.exclude)
  const extensions = options.extensions || ['.css']
  const insertMethod = options.insertMethod || 'iife' // one of: iife, css-module
  const fileName = options.fileName || null // only if insertMethod === 'file'
  const insertedClassName = options.insertedClassName || config.pluginName
  const before = options.before || []
  const after = options.after || []
  const afterForced = options.afterForced || []
  const ignore = options.ignore || []
  const treeshake = options.treeshake || config.defaultTreeshakeOpts
  const suppressNamingWarning = options.suppressNamingWarning || false
  const globals = (options.globals) ? options.globals.map(utils.absPath) : []

  // private
  // css accumulators
  const accumulators = {
    global: {},
    imported: {},
    local: {}
  }

  // setup core
  Core.scope.generateScopedName = options.generateScopedName.bind(null, ignore) || generateShortName.bind(null, ignore)
  const plugins = before.concat([Core.values, Core.localByDefault, Core.extractImports, Core.scope]).concat(after)
  const coreInstance = new Core(plugins)

  // rollup plugin exports
  function intro () {
    if (insertMethod === 'iife') return config.REPLACE_WITH_CSS
    return null
  }

  function transform (code, id) {
    if (!filter(id)) return null
    if (extensions.indexOf(path.extname(id)) === -1) return null
    return utils.processCssModule(coreInstance, code, id, suppressNamingWarning)
      .then(result => {
        accumulators.imported = Object.assign({}, accumulators.imported, result.imported)
        if (globals.indexOf(id) > -1) {
          accumulators.global[id] = result.local
        } else {
          accumulators.local[id] = result.local
        }
        return {
          code: Object.keys(result.local.exportTokens).reduce((acc, key) => {
            acc += `export var ${key} = '${result.local.exportTokens[key]}';`
            return acc
          }, '')
        }
      })
  }

  function transformBundle (source) {
    if (treeshake.remove || treeshake.error || treeshake.warn) {
      const unusedArr = utils.getUnusedCss(source, accumulators)
      if (treeshake.error || treeshake.warn) {
        utils.logUnused(unusedArr, treeshake)
      }
      if (treeshake.remove) {
        afterForced.push(postcssRemoveClasses(unusedArr))
      }
    }
    const finalCss = utils.postcssForceAfter(utils.concatCss(accumulators), afterForced)

    if (insertMethod === 'iife') {
      const iife = genCode.iife(utils.stringify(finalCss), insertedClassName)
      source = source.replace(config.REPLACE_WITH_CSS, iife)
    }
    if (insertMethod === 'file') {
      fs.writeFileSync(utils.absPath(fileName), finalCss)
    }
    if (insertMethod === 'css-module') {
      source = source.replace(config.cssModuleClassName, insertedClassName)
      source = source.replace(config.REPLACE_WITH_CSS, utils.stringify(finalCss))
    }

    return source
  }

  return {
    name: config.pluginName,
    intro,
    transform,
    transformBundle
  }
}
