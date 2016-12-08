/* istanbul ignore next */

// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified
function insert (css, className) {
  const styleElement = document.createElement('style')
  styleElement.className = className
  styleElement.setAttribute('type', 'text/css')
  document.querySelector('head').appendChild(styleElement)
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    styleElement.textContent = css
  }
}

export function iife (css, className) {
  return `
    (${insert.toString()})('${css}', '${className}');
  `
}
