import test from 'ava'
import build from './helpers/build.js'

test('test default build', async t => {
  await build('iife', './stubs/default.js', 0)
  t.pass()
})

test('test default build scope type 1', async t => {
  await build('iife', './stubs/default.js', 1)
  t.pass()
})

test('test default build scope type 2', async t => {
  await build('iife', './stubs/default.js', 2)
  t.pass()
})

test('test build with file insertMethod', async t => {
  await build('file', './stubs/insertmethod-file.js', 0)
  t.pass()
})

test('test build with css-module insertMethod', async t => {
  await build('css-module', './stubs/insertmethod-cssmodule.js', 0)
  t.pass()
})

test.failing('test build with logging and errors', async t => {
  await build('iife', './stubs/default.js', 0, true, false)
  t.pass()
})
