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
    insert(css, `${className}`); // eslint-disable-line no-undef
  }

  function terminate() {
    const elems = document.getElementsByClassName(`${className}`);
    Array.prototype.forEach.call(elems, elem => {
      elem.parentNode.removeChild(elem);
    });
  }

  if (insertStyle === 'iife') {
    return `
      export function init() {
        throw Error('css-module has no init method when opts.insertStyle === iife.');
      }
      export ${terminate.toString()}
    `;
  }

  if (insertStyle === 'init') {
    return `
      var css = '${cssModuleReplaceString}';
      var className = '${className}';
      ${insert.toString()}
      export ${init.toString()}
      export ${terminate.toString()}
    `;
  }

  return '';
}
