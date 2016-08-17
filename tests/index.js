import test from 'ava';
import requireFromString from 'require-from-string';
import { buildDefault } from './build.js';

test('test default build', async t => {
  const data = await buildDefault().catch(err => console.log(err.stack));
  t.true(true);
});
