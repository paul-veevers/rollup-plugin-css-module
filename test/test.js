import test from 'ava'
import build from './helpers/build.js'

// test('test default build', async t => {
//   await build()
//   t.true(true)
// })

test('test build with init insertStyle', async t => {
  const start = Date.now()
  await build('init')
  console.log('Build took:', Date.now() - start, 'ms')
  t.true(true)
})
