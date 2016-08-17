import styles from './default.css';

const a = function () {
  const button = document.createElement('button');
  button.innerHTML = `class: ${styles.button}`;
  button.className = styles.button;
  document.body.appendChild(button);
};

a();
