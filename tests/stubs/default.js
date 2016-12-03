import * as css from 'css-module'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved, max-len
import styles from './default.css';

function a() {
  const button = document.createElement('button');
  button.className = styles.button;
  document.body.appendChild(button);

  const div = document.createElement('div');
  div.className = styles.margin;
  document.body.appendChild(div);
}

// prevent tree shaking
css.init();
css.terminate();
a();
