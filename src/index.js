/* eslint-disable no-use-before-define */
/* eslint-disable max-len */

import fs from 'fs';
import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Core from 'css-modules-loader-core';
import stringHash from 'string-hash';
import insertCss from './insert-css.js';

function compile(css) {
  const stringifiedCss = JSON.stringify(css);
  return `(${insertCss.toString()})(${stringifiedCss});`;
}

function getContentsOfFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

export function generateDependableShortName(name, filename) {
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^\.\/\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '');
  const hash = stringHash(`${sanitisedPath}${name}`).toString(36).substr(0, 5);
  console.log(`_${hash}`);
  return `_${hash}`;
}

export function generateShortName(name, filename, css) {
  const i = css.indexOf(`.${name}`);
  const numLines = css.substr(0, i).split(/[\r\n]/).length;
  const hash = stringHash(css).toString(36).substr(0, 5);
  return `_${name}_${hash}_${numLines}`;
}

export function generateLongName(name, filename) {
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
  const before = options.before || [];
  const after = options.after || [];
  let globals = options.globals || [];

  if (globals.length > 0) {
    globals = globals.map((global) => path.join(process.cwd(), global));
  }

  // css accumulators
  const globalCss = {};
  const importedCss = {};
  const localCss = {};

  // setup core
  Core.scope.generateScopedName = options.generateScopedName || generateLongName;
  const defaultPlugins = [Core.values, Core.localByDefault, Core.extractImports, Core.scope];
  const pluginsBefore = before.concat(defaultPlugins);
  const plugins = pluginsBefore.concat(after);
  const coreInstance = new Core(plugins);

  function loadCss(code, id) {
    return coreInstance.load(code, id, null, importResolver);
  }

  function importResolver(file) {
    const relativeFilePath = file.split('"').join('');
    const absoluteFilePath = path.join(process.cwd(), relativeFilePath);
    return getContentsOfFile(relativeFilePath)
      .then((contents) => loadCss(contents, absoluteFilePath))
      .then(result => {
        importedCss[absoluteFilePath] = result.injectableSource;
        return result.exportTokens;
      });
  }

  // rollup plugin exports
  function intro() {
    const globalReduced = Object.keys(globalCss).reduce((acc, key) => acc + globalCss[key], '');
    const importedReduced = Object.keys(importedCss).reduce((acc, key) => acc + importedCss[key], '');
    const localReduced = Object.keys(localCss).reduce((acc, key) => acc + localCss[key], '');
    const concatenated = globalReduced + importedReduced + localReduced;
    return compile(concatenated);
  }

  function transform(code, id) {
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return loadCss(code, id)
      .then(result => {
        if (globals.indexOf(id) > -1) {
          globalCss[id] = result.injectableSource;
        } else {
          localCss[id] = result.injectableSource;
        }
        return {
          code: `export default ${JSON.stringify(result.exportTokens)};`,
        };
      });
  }

  return {
    name: 'rollup-plugin-css-module',
    intro,
    transform,
  };
}
