/* istanbul ignore next */

// config
var CLASS_NAME = '{{ROLLUP_PLUGIN_CSS_MODULE_CLASS_NAME}}'
var CSS = '{{ROLLUP_PLUGIN_CSS_MODULE_CSS}}'

function forEach (arr, cb) {
  var i = 0
  var length = arr.length
  for (; i < length; i++) {
    cb(arr[i])
  }
}

function reduce (arr, cb, initValue) {
  var len = arr.length
  var acc = initValue
  if (!arr.length) return initValue
  for (var i = 0; i < len; i++) {
    acc = cb(acc, arr[i], i, arr)
  }
  return acc
}

// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified
function init () {
  var styleElement = document.createElement('style')
  styleElement.className = CLASS_NAME
  styleElement.setAttribute('type', 'text/css')
  document.querySelector('head').appendChild(styleElement)
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = CSS
  } else {
    styleElement.textContent = CSS
  }
}

function terminate () {
  var elems = document.getElementsByClassName(CLASS_NAME)
  forEach(elems, function (elem) {
    elem.parentNode.removeChild(elem)
  })
}

function getCSS (selector) {
  var elem = document.getElementsByClassName(CLASS_NAME)
  if (!elem || !elem[0] || !elem[0].sheet) return null
  var selectors = elem[0].sheet.rules || elem[0].sheet.cssRules
  return reduce(selectors, function (acc, item) {
    if ((item.selectorText && item.selectorText.indexOf(selector) > -1) ||
      (item.cssText && item.cssText.indexOf(selector) > -1)) {
      if (item.cssText) return acc + item.cssText
      return acc + item.style.cssText
    }
    return acc
  }, '')
}

module.exports = {
  init: init,
  terminate: terminate,
  getCSS: getCSS
}
