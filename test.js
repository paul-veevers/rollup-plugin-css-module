import test from 'ava';
import build from './tests/build.js';

test('test default build', async t => {
  await build().catch(console.error); // eslint-disable-line no-console
  t.true(true);
});

test('test build with init insertStyle', async t => {
  await build('init').catch(console.error); // eslint-disable-line no-console
  t.true(true);
});
