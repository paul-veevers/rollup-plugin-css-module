import path from 'path'
import { createFilter } from 'rollup-pluginutils'
import Core from 'css-modules-loader-core'
import postcssRemoveClasses from 'postcss-remove-classes'
import stringHash from 'string-hash'
import * as genCode from './gen-code.js'
import * as config from './config.js'
import * as utils from './utils.js'

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
  const numLines = css.substr(0, i).split(/[\r\n]/).length
  const hash = stringHash(css).toString(36).substr(0, 5)
  return `_${name}_${hash}_${numLines}`
}

export function generateLongName (ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^./\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '')
  return `_${sanitisedPath}__${name}`
}

export default function cssModule (options = {}) {
  // options
  const filter = createFilter(options.include, options.exclude)
  const extensions = options.extensions || ['.css']
  const moduleId = options.moduleId || 'css-module'
  const insertStyle = options.insertStyle || 'iife' // one of: iife, init
  const insertedClassName = options.insertedClassName || 'css-module'
  const before = options.before || []
  const after = options.after || []
  const afterForced = options.afterForced || []
  const ignore = options.ignore || []
  const treeshake = options.treeshake || config.defaultTreeshakeOpts
  const suppressNamingWarning = options.suppressNamingWarning || false
  const globals = (options.globals) ? options.globals.map(utils.absPath) : []

  // private
  // hopefully unique to everyone's js files
  const cssModuleReplaceString = `{{${config.pluginName}-${Math.random() * Date.now()}}}`
  // css accumulators
  const accumulators = {
    global: {},
    imported: {},
    local: {}
  }
  // setup core
  Core.scope.generateScopedName = options.generateScopedName.bind(null, ignore) || generateLongName.bind(null, ignore)
  const plugins = before.concat([Core.values, Core.localByDefault, Core.extractImports, Core.scope]).concat(after)
  const coreInstance = new Core(plugins)

  // rollup plugin exports
  function load (id) {
    if (id === moduleId) return genCode.cssModule(cssModuleReplaceString, insertedClassName, insertStyle)
    return null
  }

  function resolveId (imported) {
    // so that no other plugin tries to resolve it for us
    if (imported === moduleId) return moduleId
    return null
  }

  function intro () {
    if (insertStyle === 'iife') return utils.compileIife(utils.concatCss(accumulators), insertedClassName)
    return null
  }

  function transform (code, id) {
    if (!filter(id)) return null
    if (extensions.indexOf(path.extname(id)) === -1) return null
    return utils.processCssModule(coreInstance, code, id, accumulators, suppressNamingWarning)
      .then(result => {
        result = utils.makeLegitExportTokens(result, suppressNamingWarning)
        if (globals.indexOf(id) > -1) {
          accumulators.global[id] = result
        } else {
          accumulators.local[id] = result
        }
        return {
          code: Object.keys(result.exportTokens).reduce((acc, key) => {
            acc += `export var ${key} = '${result.exportTokens[key]}';`
            return acc
          }, '')
        }
      })
  }

  function transformBundle (source) {
    if (treeshake.remove || treeshake.error || treeshake.warn) {
      const unusedArr = utils.getUnusedCss(source, accumulators)
      if (unusedArr.length > 0) {
        utils.logUnused(unusedArr, treeshake)
        afterForced.push(postcssRemoveClasses(unusedArr))
      }
    }
    const p = utils.postcssForceAfter(utils.concatCss(accumulators), afterForced)
    return source.replace(`'${cssModuleReplaceString}'`, JSON.stringify(p))
  }

  return {
    name: config.pluginName,
    load,
    resolveId,
    intro,
    transform,
    transformBundle
  }
}
