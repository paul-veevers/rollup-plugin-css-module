import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Core from 'css-modules-loader-core';
import insertCss from './insert-css.js';

function generateLongName(name, filename) {
  const sanitisedPath = filename.replace(process.cwd(), '')
    .replace(/\.[^\.\/\\]+$/, '')
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
  let globals = options.globals || [];

  if (globals.length > 0) {
    globals = globals.map((global) => path.join(process.cwd(), global));
  }

  // css accumulators
  let globalCss = '';
  let localCss = '';

  // setup core
  Core.scope.generateScopedName = options.generateScopedName || generateLongName;
  const defaultPlugins = [Core.values, Core.localByDefault, Core.scope];
  const pluginsBefore = defaultPlugins.concat(before);
  const plugins = pluginsBefore.concat(after);
  const coreInstance = new Core(plugins);

  // rollup plugin exports
  function intro() {
    const compiled = compile(globalCss + localCss);
    globalCss = '';
    localCss = '';
    return compiled;
  }

  function transform(code, id) {
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return coreInstance.load(code, id)
      .then(result => {
        if (globals.indexOf(id) > -1) {
          globalCss = `${globalCss} ${result.injectableSource}`;
        } else {
          localCss = `${localCss} ${result.injectableSource}`;
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
