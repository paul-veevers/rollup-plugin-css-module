// config
export const pluginName = 'rollup-plugin-css-module'
export const defaultTreeshakeOpts = {
  error: false, // prevent build from continuing
  warn: true, // display a warning
  remove: true // remove from compiled css
}
export const jsReservedNames = ['break', 'do', 'instanceof', 'typeof', 'case', 'else', 'new', 'var', 'catch', 'finally', 'return', 'void', 'continue', 'for', 'switch', 'while', 'debugger', 'function', 'this', 'with', 'default', 'if', 'throw', 'delete', 'in', 'try', 'class', 'enum', 'extends', 'super', 'const', 'export', 'import']
