/* eslint-disable no-use-before-define */
/* eslint-disable max-len */

import fs from 'fs';
import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Core from 'css-modules-loader-core';
import postcss from 'postcss';
import stringHash from 'string-hash';
// import stringEscape from 'js-string-escape';
// import cssEscape from 'css.escape';
import * as genCode from './gen-code.js';

function compileIife(css, className) {
  return genCode.iife(css, className);
}

function getContentsOfFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

function postcssForceAfter(css, plugins) {
  if (plugins.length === 0) return css;
  return postcss(plugins)
    .process(css)
    .then((result) => result.css);
}

export function generateDependableShortName(ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name;
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^\.\/\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '');
  const hash = stringHash(`${sanitisedPath}${name}`).toString(36).substr(0, 5);
  return `_${hash}`;
}

export function generateShortName(ignore, name, filename, css) {
  if (ignore.indexOf(name) > -1) return name;
  const i = css.indexOf(`.${name}`);
  const numLines = css.substr(0, i).split(/[\r\n]/).length;
  const hash = stringHash(css).toString(36).substr(0, 5);
  return `_${name}_${hash}_${numLines}`;
}

export function generateLongName(ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name;
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^\.\/\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '');
  return `_${sanitisedPath}__${name}`;
}

export default function cssModule(options = {}) {
  // options
  const filter = createFilter(options.include, options.exclude);
  const extensions = options.extensions || ['.css'];
  const moduleId = options.moduleId || 'css-module';
  const insertStyle = options.insertStyle || 'iife'; // on of: iife, init
  const insertedClassName = options.insertedClassName || 'css-module';
  const before = options.before || [];
  const after = options.after || [];
  const afterForced = options.afterForced || [];
  const ignore = options.ignore || [];
  let globals = options.globals || [];

  // private
  // hopefully unique to everyone's js files
  const cssModuleReplaceString = `{{css-module-${Date.now()}}}`;

  if (globals.length > 0) {
    globals = globals.map((global) => path.join(process.cwd(), global));
  }

  // css accumulators
  const globalCss = {};
  const importedCss = {};
  const localCss = {};

  // setup core
  Core.scope.generateScopedName = options.generateScopedName.bind(null, ignore) || generateLongName.bind(null, ignore);
  const defaultPlugins = [Core.values, Core.localByDefault, Core.extractImports, Core.scope];
  const pluginsBefore = before.concat(defaultPlugins);
  const plugins = pluginsBefore.concat(after);
  const coreInstance = new Core(plugins);

  function loadCss(code, id) {
    return coreInstance.load(code, id, null, importResolver);
  }

  function importResolver(file) {
    let exportTokens;
    const relativeFilePath = file.split('"').join('');
    const absoluteFilePath = path.join(process.cwd(), relativeFilePath);
    return getContentsOfFile(relativeFilePath)
      .then((contents) => loadCss(contents, absoluteFilePath))
      .then((result) => {
        exportTokens = result.exportTokens;
        return postcssForceAfter(result.injectableSource, afterForced);
      })
      .then((result) => {
        importedCss[absoluteFilePath] = result;
        return exportTokens;
      });
  }

  function generateCss() {
    const globalReduced = Object.keys(globalCss).reduce((acc, key) => acc + globalCss[key], '');
    const importedReduced = Object.keys(importedCss).reduce((acc, key) => acc + importedCss[key], '');
    const localReduced = Object.keys(localCss).reduce((acc, key) => acc + localCss[key], '');
    return JSON.stringify(globalReduced + importedReduced + localReduced);
  }

  // rollup plugin exports
  function load(id) {
    if (id === moduleId) return genCode.cssModule(cssModuleReplaceString, insertedClassName, insertStyle);
    return null;
  }

  function resolveId(imported) {
    // so that no other plugin resolves it for us
    if (imported === moduleId) return moduleId;
    return null;
  }

  function intro() {
    if (insertStyle === 'iife') return compileIife(generateCss(), insertedClassName);
    return null;
  }

  function transform(code, id) {
    let exportTokens;
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return loadCss(code, id)
      .then(result => {
        exportTokens = result.exportTokens;
        return postcssForceAfter(result.injectableSource, afterForced);
      })
      .then(result => {
        if (globals.indexOf(id) > -1) {
          globalCss[id] = result;
        } else {
          localCss[id] = result;
        }
        return {
          code: `export default ${JSON.stringify(exportTokens)};`,
        };
      });
  }

  function transformBundle(source) {
    return source.replace(`'${cssModuleReplaceString}'`, generateCss());
  }

  return {
    name: 'rollup-plugin-css-module',
    load,
    resolveId,
    intro,
    transform,
    transformBundle,
  };
}
