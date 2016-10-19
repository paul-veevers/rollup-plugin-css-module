// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified
function insert(css, className) {
  const styleElement = document.createElement('style');
  styleElement.className = className;
  styleElement.setAttribute('type', 'text/css');
  document.querySelector('head').appendChild(styleElement);
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    styleElement.textContent = css;
  }
}

export function iife(css, className) {
  return `
    (${insert.toString()})(${css}, '${className}');
  `;
}

export function cssModule(cssModuleReplaceString, className, insertStyle) {
  function init() {
    return `
      var css = '${cssModuleReplaceString}';

      ${insert.toString()}

      export function init() {
        insert(css, '${className}');
      }
    `;
  }

  if (insertStyle === 'iife') {
    return `
      export function init() {
        throw Error('css-module has no init method when opts.insertStyle === iife.');
      }
    `;
  }

  if (insertStyle === 'init') {
    return `
      ${init()}
    `;
  }

  return '';
}
