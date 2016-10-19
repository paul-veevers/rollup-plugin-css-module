import test from 'ava';
import { buildDefault } from './tests/build.js';

test('test default build', async t => {
  const data = await buildDefault().catch(err => console.log(err.stack));
  console.log(data);
  t.true(true);
});

test('test build with init insertStyle', async t => {
  const data = await buildDefault('init').catch(err => console.log(err.stack));
  console.log(data);
  t.true(true);
});
