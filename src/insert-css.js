// Credit: https://github.com/substack/insert-css/blob/master/index.js
// Heavily modified

export default function insertCss(css) {
  const styleElement = document.createElement('style');
  styleElement.setAttribute('type', 'text/css');
  document.querySelector('head').appendChild(styleElement);
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    styleElement.textContent = css;
  }
}
