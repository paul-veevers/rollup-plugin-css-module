import fs from 'fs';
import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Core from 'css-modules-loader-core';
import postcss from 'postcss';
import stringHash from 'string-hash';

// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified
function insert(css, className) {
  var styleElement = document.createElement('style');
  styleElement.className = className;
  styleElement.setAttribute('type', 'text/css');
  document.querySelector('head').appendChild(styleElement);
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    styleElement.textContent = css;
  }
}

function iife(css, className) {
  return '\n    (' + insert.toString() + ')(' + css + ', \'' + className + '\');\n  ';
}

function cssModule$1(cssModuleReplaceString, className, insertStyle) {
  function init() {
    return '\n      var css = ' + cssModuleReplaceString + ';\n\n      ' + insert.toString() + '\n\n      export function init() {\n        insert(css, \'' + className + '\');\n      }\n    ';
  }

  if (insertStyle === 'iife') {
    return '\n      export function init() {\n        throw Error(\'css-module has no init method when opts.insertStyle === iife.\');\n      }\n    ';
  }

  if (insertStyle === 'init') {
    return '\n      ' + init() + '\n    ';
  }

  return '';
}

function compileIife(css, className) {
  var stringifiedCss = JSON.stringify(css);
  return iife(stringifiedCss, className);
}

function getContentsOfFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, function (err, data) {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

function postcssForceAfter(css, plugins) {
  if (plugins.length === 0) return css;
  return postcss(plugins).process(css).then(function (result) {
    return result.css;
  });
}

function generateDependableShortName(ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name;
  var sanitisedPath = filename.replace(process.cwd(), '').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
  var hash = stringHash('' + sanitisedPath + name).toString(36).substr(0, 5);
  return '_' + hash;
}

function generateShortName(ignore, name, filename, css) {
  if (ignore.indexOf(name) > -1) return name;
  var i = css.indexOf('.' + name);
  var numLines = css.substr(0, i).split(/[\r\n]/).length;
  var hash = stringHash(css).toString(36).substr(0, 5);
  return '_' + name + '_' + hash + '_' + numLines;
}

function generateLongName(ignore, name, filename) {
  if (ignore.indexOf(name) > -1) return name;
  var sanitisedPath = filename.replace(process.cwd(), '').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
  return '_' + sanitisedPath + '__' + name;
}

function cssModule() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  // options
  var filter = createFilter(options.include, options.exclude);
  var extensions = options.extensions || ['.css'];
  var moduleId = options.moduleId || 'css-module';
  var insertStyle = options.insertStyle || 'iife'; // on of: iife, init
  var insertedClassName = options.insertedClassName || 'css-module';
  var before = options.before || [];
  var after = options.after || [];
  var afterForced = options.afterForced || [];
  var ignore = options.ignore || [];
  var globals = options.globals || [];

  // private
  var cssModuleReplaceString = '\'{{css-module-' + Date.now() + '}}\'';

  if (globals.length > 0) {
    globals = globals.map(function (global) {
      return path.join(process.cwd(), global);
    });
  }

  // css accumulators
  var globalCss = {};
  var importedCss = {};
  var localCss = {};

  // setup core
  Core.scope.generateScopedName = options.generateScopedName.bind(null, ignore) || generateLongName.bind(null, ignore);
  var defaultPlugins = [Core.values, Core.localByDefault, Core.extractImports, Core.scope];
  var pluginsBefore = before.concat(defaultPlugins);
  var plugins = pluginsBefore.concat(after);
  var coreInstance = new Core(plugins);

  function loadCss(code, id) {
    return coreInstance.load(code, id, null, importResolver);
  }

  function importResolver(file) {
    var exportTokens = void 0;
    var relativeFilePath = file.split('"').join('');
    var absoluteFilePath = path.join(process.cwd(), relativeFilePath);
    return getContentsOfFile(relativeFilePath).then(function (contents) {
      return loadCss(contents, absoluteFilePath);
    }).then(function (result) {
      exportTokens = result.exportTokens;
      return postcssForceAfter(result.injectableSource, afterForced);
    }).then(function (result) {
      importedCss[absoluteFilePath] = result;
      return exportTokens;
    });
  }

  function generateCss() {
    var globalReduced = Object.keys(globalCss).reduce(function (acc, key) {
      return acc + globalCss[key];
    }, '');
    var importedReduced = Object.keys(importedCss).reduce(function (acc, key) {
      return acc + importedCss[key];
    }, '');
    var localReduced = Object.keys(localCss).reduce(function (acc, key) {
      return acc + localCss[key];
    }, '');
    return globalReduced + importedReduced + localReduced;
  }

  // rollup plugin exports
  function load(id) {
    if (id === moduleId) return cssModule$1(cssModuleReplaceString, insertedClassName, insertStyle);
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
    var exportTokens = void 0;
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return loadCss(code, id).then(function (result) {
      exportTokens = result.exportTokens;
      return postcssForceAfter(result.injectableSource, afterForced);
    }).then(function (result) {
      if (globals.indexOf(id) > -1) {
        globalCss[id] = result;
      } else {
        localCss[id] = result;
      }
      return {
        code: 'export default ' + JSON.stringify(exportTokens) + ';'
      };
    });
  }

  function transformBundle(source) {
    return source.replace(cssModuleReplaceString, '\'' + generateCss() + '\'');
  }

  return {
    name: 'rollup-plugin-css-module',
    load: load,
    resolveId: resolveId,
    intro: intro,
    transform: transform,
    transformBundle: transformBundle
  };
}

export { generateDependableShortName, generateShortName, generateLongName };export default cssModule;