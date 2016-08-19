import styles from './default.css';

const a = function () {
  const button = document.createElement('button');
  button.className = styles.button;
  document.body.appendChild(button);

  const div = document.createElement('div');
  div.className = styles.margin;
  document.body.appendChild(div);
};

a();
