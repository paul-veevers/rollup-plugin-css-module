'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var rollupPluginutils = require('rollup-pluginutils');
var Core = _interopDefault(require('css-modules-loader-core'));

// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified

function insertCss(css) {
  var styleElement = document.createElement('style');
  styleElement.setAttribute('type', 'text/css');
  document.querySelector('head').appendChild(styleElement);
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    styleElement.textContent = css;
  }
  return styleElement;
}

function generateLongName(name, filename) {
  var sanitisedPath = filename.replace(process.cwd(), '').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
  return '_' + sanitisedPath + '__' + name;
}

function compile(css) {
  var stringifiedCss = JSON.stringify(css);
  return '(' + insertCss.toString() + ')(' + stringifiedCss + ');';
}

function cssModule() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  // options
  var filter = rollupPluginutils.createFilter(options.include, options.exclude);
  var extensions = options.extensions || ['.css'];
  var before = options.before || [];
  var after = options.after || [];
  var globals = options.globals || [];

  if (globals.length > 0) {
    globals = globals.map(function (global) {
      return path.join(process.cwd(), global);
    });
  }

  // css accumulators
  var globalCss = '';
  var localCss = '';

  // setup core
  Core.scope.generateScopedName = options.generateScopedName || generateLongName;
  var defaultPlugins = [Core.values, Core.localByDefault, Core.scope];
  var pluginsBefore = defaultPlugins.concat(before);
  var plugins = pluginsBefore.concat(after);
  var coreInstance = new Core(plugins);

  // rollup plugin exports
  function intro() {
    var compiled = compile(globalCss + localCss);
    globalCss = '';
    localCss = '';
    return compiled;
  }

  function transform(code, id) {
    if (!filter(id)) return null;
    if (extensions.indexOf(path.extname(id)) === -1) return null;
    return coreInstance.load(code, id).then(function (result) {
      if (globals.indexOf(id) > -1) {
        globalCss = globalCss + ' ' + result.injectableSource;
      } else {
        localCss = localCss + ' ' + result.injectableSource;
      }
      return {
        code: 'export default ' + JSON.stringify(result.exportTokens) + ';'
      };
    });
  }

  return {
    name: 'rollup-plugin-css-module',
    intro: intro,
    transform: transform
  };
}

module.exports = cssModule;