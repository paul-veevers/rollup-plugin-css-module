import styles from './default.css';
import * as css from 'css-module';

const a = function () {
  const button = document.createElement('button');
  button.className = styles.button;
  document.body.appendChild(button);

  const div = document.createElement('div');
  div.className = styles.margin;
  document.body.appendChild(div);
};

css.init();
css.terminate();
a();
