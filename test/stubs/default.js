import * as css from 'css-module' // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved, max-len
import * as bootstrap from '../../node_modules/bootstrap/dist/css/bootstrap.css'
import * as globalStyles from './global.css'
import * as localStyles from './local.css'

function a () {
  const button = document.createElement('button')
  button.className = `${bootstrap.clearfix} ${localStyles.button} ${globalStyles.globalClass}`
  document.body.appendChild(button)

  const div = document.createElement('div')
  div.className = localStyles.margin
  document.body.appendChild(div)

  const h1 = document.createElement('h1')
  h1.className = localStyles.redHeading
  document.body.appendChild(h1)

  const unMangledClass = document.createElement('div')
  unMangledClass.className = localStyles.doNotMangleMe
  document.body.appendChild(unMangledClass)
}

// prevent tree shaking
css.init()
css.terminate()
a()
