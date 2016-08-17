import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Core from 'css-modules-loader-core';
import insertCss from './insert-css.js';

function generateLongName(name, filename) {
  const sanitisedPath = filename.replace(/\.[^\.\/\\]+$/, '')
    .replace(/[\W_]+/g, '_')
    .replace(/^_|_$/g, '');
  return `_${sanitisedPath}__${name}`;
}

function compile(css) {
  const stringifiedCss = JSON.stringify(css);
  return `(${insertCss.toString()})(${stringifiedCss});`;
}

export default function cssModule(options = {}) {
  // options
  const filter = createFilter(options.include, options.exclude);
  const extensions = options.extensions || ['.css'];
  const before = options.before || [];
  const after = options.after || [];

  // css accumulator
  let allCss = '';

  // setup core
  Core.scope.generateScopedName = options.generateScopedName || generateLongName;
  const defaultPlugins = [Core.values, Core.localByDefault, Core.scope];
  const pluginsBefore = defaultPlugins.concat(before);
  const plugins = pluginsBefore.concat(after);
  const coreInstance = new Core(plugins);

  // rollup plugin exports
  function intro() {
    const compiled = compile(allCss);
    allCss = '';
    return compiled;
  }

  function transform(code, id) {
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return coreInstance.load(code, id)
      .then(result => {
        allCss = `${allCss} ${result.injectableSource}`;
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
